import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { WelcomeEmail, getWelcomeSubject } from "@/emails";
import { getPromoExpiryDate, formatExpiryDate, PROMO_CODE } from "@/lib/emailTemplates";
import { isValidEmail } from "@/lib/security";
import { SITE_URL } from "@/lib/constants";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Apex Interviewer <hello@apexinterviewer.com>";

export async function POST(req: NextRequest) {
  if (!resend) {
    console.error("[Subscribe] RESEND_API_KEY not configured");
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email, firstName } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const expiryDate = getPromoExpiryDate();
    const formattedExpiry = formatExpiryDate(expiryDate);

    // 1. Add to Resend Audience (if audience ID is configured)
    if (AUDIENCE_ID) {
      try {
        await resend.contacts.create({
          email: normalizedEmail,
          firstName: firstName || undefined,
          audienceId: AUDIENCE_ID,
        });
        console.log(`[Subscribe] Added ${normalizedEmail} to audience`);
      } catch (audienceError) {
        // Contact might already exist, continue with email
        console.log(`[Subscribe] Audience add note:`, audienceError);
      }
    }

    // 2. Send the welcome/conversion email using React Email
    const checkoutUrl = `${SITE_URL}/dashboard`;
    const emailProps = {
      firstName,
      promoCode: PROMO_CODE,
      expiryDate: formattedExpiry,
      checkoutUrl,
    };
    
    const html = await render(WelcomeEmail(emailProps));
    const text = await render(WelcomeEmail(emailProps), { plainText: true });
    const subject = getWelcomeSubject(firstName, formattedExpiry);

    const { data, error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject,
      html,
      text,
      tags: [
        { name: "campaign", value: "welcome_discount" },
        { name: "promo_code", value: PROMO_CODE },
      ],
    });

    if (emailError) {
      console.error("[Subscribe] Email send error:", emailError);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    console.log(`[Subscribe] Welcome email sent to ${normalizedEmail}`, data);

    // Don't leak promo code in response - it's sent via email only
    return NextResponse.json({
      success: true,
      message: "Check your email for your exclusive discount code!",
    });
  } catch (error) {
    console.error("[Subscribe] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
