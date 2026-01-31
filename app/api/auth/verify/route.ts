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
    // First, check if token exists at all (without the used/expired filters)
    // This helps diagnose why verification fails
    const { data: existingToken } = await supabaseAdmin
      .from("magic_link_tokens")
      .select("used, expires_at")
      .eq("email", normalizedEmail)
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (!existingToken) {
      console.error("[Verify] Token not found - may have been replaced by newer request");
      return redirectToLogin("Invalid link - please request a new one");
    }

    if (existingToken.used) {
      console.error("[Verify] Token already used");
      return redirectToLogin("Link already used - please request a new one");
    }

    if (new Date(existingToken.expires_at) < new Date()) {
      console.error("[Verify] Token expired");
      return redirectToLogin("Link expired - please request a new one");
    }

    // ATOMIC: Mark token as used
    // This prevents race conditions where the same token could be used twice
    const { data: tokenRecord, error: updateError } = await supabaseAdmin
      .from("magic_link_tokens")
      .update({ 
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq("email", normalizedEmail)
      .eq("token_hash", tokenHash)
      .eq("used", false)
      .select()
      .maybeSingle();

    if (updateError || !tokenRecord) {
      console.error("[Verify] Token update failed:", updateError?.message || "Concurrent use detected");
      return redirectToLogin("Link already used - please request a new one");
    }

    // Generate a Supabase magic link for the user (this creates/signs in the user)
    const { data, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
      options: {
        redirectTo: `${SITE_URL}/auth/callback`,
      },
    });

    if (signInError || !data?.properties?.action_link) {
      console.error("[Verify] Supabase sign-in error:", signInError);
      return redirectToLogin("Sign-in failed");
    }

    // Use Supabase's generated action_link which handles the complete auth flow
    const actionLink = data.properties.action_link;

    console.log(`[Verify] Redirecting ${normalizedEmail} to complete sign-in`);

    return NextResponse.redirect(actionLink);
  } catch (error) {
    console.error("[Verify] Error:", error);
    return redirectToLogin("Something went wrong");
  }
}

function redirectToLogin(error: string) {
  return NextResponse.redirect(`${SITE_URL}/login?error=${encodeURIComponent(error)}`);
}
