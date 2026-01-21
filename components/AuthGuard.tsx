"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Set to true to bypass auth during development (MUST be false in production)
const BYPASS_AUTH = true;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">(
    BYPASS_AUTH ? "authenticated" : "loading"
  );

  useEffect(() => {
    if (BYPASS_AUTH || !supabase) {
      // Bypass auth or no supabase config - allow access
      setStatus("authenticated");
      return;
    }

    // At this point, supabase is guaranteed to be non-null
    const client = supabase;

    const checkSession = async () => {
      const { data: { session } } = await client.auth.getSession();

      if (session) {
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
        router.push("/login");
      }
    };

    // Listen for auth state changes (handles magic link callback)
    const { data: { subscription } } = client.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          setStatus("authenticated");
        } else if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
          setStatus("unauthenticated");
          router.push("/login");
        }
      }
    );

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
