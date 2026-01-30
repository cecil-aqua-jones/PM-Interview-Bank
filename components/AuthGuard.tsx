"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { identify, reset, track, getEmailDomain, hashForPrivacy } from "@/lib/posthog";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    if (!supabase) {
      console.error("[AuthGuard] Supabase client not configured");
      setStatus("unauthenticated");
      router.push("/login");
      return;
    }

    // At this point, supabase is guaranteed to be non-null
    const client = supabase;

    const checkSession = async () => {
      const {
        data: { session },
      } = await client.auth.getSession();

      if (session) {
        // Identify user in PostHog (privacy-safe: no raw email)
        const email = session.user.email || "";
        identify(session.user.id, {
          email_domain: getEmailDomain(email),
          email_hash: hashForPrivacy(email),
          has_paid: session.user.user_metadata?.has_paid ?? false,
          created_at: session.user.created_at,
        });
        track({
          name: "session_started",
          properties: {
            user_id: session.user.id,
            has_paid: session.user.user_metadata?.has_paid ?? false,
          },
        });
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
        router.push("/login");
      }
    };

    // Listen for auth state changes (handles magic link callback)
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Identify user in PostHog on sign in (privacy-safe: no raw email)
        const email = session.user.email || "";
        identify(session.user.id, {
          email_domain: getEmailDomain(email),
          email_hash: hashForPrivacy(email),
          has_paid: session.user.user_metadata?.has_paid ?? false,
          created_at: session.user.created_at,
        });
        track({
          name: "session_started",
          properties: {
            user_id: session.user.id,
            has_paid: session.user.user_metadata?.has_paid ?? false,
          },
        });
        setStatus("authenticated");
      } else if (
        event === "SIGNED_OUT" ||
        (event === "TOKEN_REFRESHED" && !session)
      ) {
        // Reset PostHog identity on sign out
        track({ name: "logout_completed" });
        reset();
        setStatus("unauthenticated");
        router.push("/login");
      }
    });

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (status === "loading") {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#1a1a1a",
        color: "#fff",
        fontFamily: "system-ui, sans-serif"
      }}>
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
