import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Create admin Supabase client
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  
  if (!supabaseAdmin) {
    console.error("[Verify] Supabase admin not configured");
    return redirectToLogin("Configuration error");
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return redirectToLogin("Invalid link");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  try {
    // Look up token in database
    const { data: tokenRecord, error: lookupError } = await supabaseAdmin
      .from("magic_link_tokens")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("token_hash", tokenHash)
      .eq("used", false)
      .single();

    if (lookupError || !tokenRecord) {
      console.error("[Verify] Token lookup failed:", lookupError);
      return redirectToLogin("Invalid or expired link");
    }

    // Check if token is expired
    const expiresAt = new Date(tokenRecord.expires_at);
    if (expiresAt < new Date()) {
      console.error("[Verify] Token expired for:", normalizedEmail);
      return redirectToLogin("Link has expired");
    }

    // Mark token as used
    await supabaseAdmin
      .from("magic_link_tokens")
      .update({ used: true })
      .eq("email", normalizedEmail)
      .eq("token_hash", tokenHash);

    // Generate a Supabase magic link for the user (this creates/signs in the user)
    const { data, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://apexinterviewer.com"}/dashboard`,
      },
    });

    if (signInError || !data?.properties?.hashed_token) {
      console.error("[Verify] Supabase sign-in error:", signInError);
      return redirectToLogin("Sign-in failed");
    }

    // Redirect to Supabase's verify endpoint which will set the session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hashedToken = data.properties.hashed_token;
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${hashedToken}&type=magiclink&redirect_to=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL || "https://apexinterviewer.com")}/auth/callback`;

    console.log(`[Verify] Redirecting ${normalizedEmail} to complete sign-in`);

    return NextResponse.redirect(verifyUrl);
  } catch (error) {
    console.error("[Verify] Error:", error);
    return redirectToLogin("Something went wrong");
  }
}

function redirectToLogin(error: string) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apexinterviewer.com";
  return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent(error)}`);
}
