import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";
import { render } from "@react-email/render";
import { MagicLinkEmail, magicLinkSubject } from "@/emails";
import { isValidEmail } from "@/lib/security";
import { SITE_URL } from "@/lib/constants";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Apex Interviewer <hello@apexinterviewer.com>";
const TOKEN_EXPIRY_MINUTES = 15;

// Create admin Supabase client for token storage
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function POST(req: NextRequest) {
  // Check if Resend is configured
  if (!resend) {
    console.error("[MagicLink] RESEND_API_KEY not configured");
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 500 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    console.error("[MagicLink] Supabase admin not configured");
    return NextResponse.json(
      { error: "Authentication service not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // Store token hash in database (we store hash, not raw token for security)
    const { error: dbError } = await supabaseAdmin
      .from("magic_link_tokens")
      .upsert({
        email: normalizedEmail,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        used: false,
      }, {
        onConflict: "email",
      });

    if (dbError) {
      console.error("[MagicLink] Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to create sign-in link" },
        { status: 500 }
      );
    }

    // Create magic link URL
    const magicLink = `${SITE_URL}/api/auth/verify?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send beautiful email via Resend using React Email
    const expiresIn = `${TOKEN_EXPIRY_MINUTES} minutes`;
    const html = await render(MagicLinkEmail({ magicLink, expiresIn }));
    const text = await render(MagicLinkEmail({ magicLink, expiresIn }), { plainText: true });

    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: magicLinkSubject,
      html,
      text,
      tags: [
        { name: "type", value: "magic_link" },
      ],
    });

    if (emailError) {
      console.error("[MagicLink] Email send error:", emailError);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    console.log(`[MagicLink] Sent magic link to ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      message: "Magic link sent",
    });
  } catch (error) {
    console.error("[MagicLink] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
