import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  getWelcomeEmail,
  getPromoExpiryDate,
  formatExpiryDate,
  PROMO_CODE,
} from "@/lib/emailTemplates";

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
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apexinterviewer.com";
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

    // 2. Send the welcome/conversion email
    const emailContent = getWelcomeEmail({
      firstName,
      promoCode: PROMO_CODE,
      expiryDate: formattedExpiry,
      checkoutUrl: `${siteUrl}/dashboard`,
    });

    const { data, error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
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

    return NextResponse.json({
      success: true,
      message: "Subscribed successfully",
      promoCode: PROMO_CODE,
      expiryDate: expiryDate.toISOString(),
    });
  } catch (error) {
    console.error("[Subscribe] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
