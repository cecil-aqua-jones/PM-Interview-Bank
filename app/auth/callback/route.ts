import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      // Create response to set cookies on
      const response = NextResponse.redirect(`${origin}/dashboard`);
      
      // Create server client that can set cookies on the response
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      });
      
      // Exchange the code for a session - this will set the auth cookies
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("[Auth Callback] Error exchanging code:", error);
        return NextResponse.redirect(`${origin}/login?error=auth_failed`);
      }
      
      // Return the response with cookies set
      return response;
    }
  }

  // Redirect to dashboard after successful auth
  return NextResponse.redirect(`${origin}/dashboard`);
}
