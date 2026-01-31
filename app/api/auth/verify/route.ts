import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { SITE_URL } from "@/lib/constants";

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
    // ATOMIC: Mark token as used and return it in a single operation
    // This prevents race conditions where the same token could be used twice
    // by concurrent requests (TOCTOU vulnerability)
    const { data: tokenRecord, error: updateError } = await supabaseAdmin
      .from("magic_link_tokens")
      .update({ 
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq("email", normalizedEmail)
      .eq("token_hash", tokenHash)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .select()
      .single();

    if (updateError || !tokenRecord) {
      console.error("[Verify] Token verification failed:", updateError?.message || "Token not found or already used");
      return redirectToLogin("Invalid or expired link");
    }

    // Generate a Supabase magic link for the user (this creates/signs in the user)
    const { data, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
      options: {
        redirectTo: `${SITE_URL}/dashboard`,
      },
    });

    if (signInError || !data?.properties?.hashed_token) {
      console.error("[Verify] Supabase sign-in error:", signInError);
      return redirectToLogin("Sign-in failed");
    }

    // Redirect to Supabase's verify endpoint which will set the session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hashedToken = data.properties.hashed_token;
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${hashedToken}&type=magiclink&redirect_to=${encodeURIComponent(`${SITE_URL}/auth/callback`)}`;

    console.log(`[Verify] Redirecting ${normalizedEmail} to complete sign-in`);

    return NextResponse.redirect(verifyUrl);
  } catch (error) {
    console.error("[Verify] Error:", error);
    return redirectToLogin("Something went wrong");
  }
}

function redirectToLogin(error: string) {
  return NextResponse.redirect(`${SITE_URL}/login?error=${encodeURIComponent(error)}`);
}
