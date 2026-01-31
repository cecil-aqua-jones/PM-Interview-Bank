"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function TokenPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleTokens = async () => {
      try {
        // Parse hash fragments: #access_token=xxx&refresh_token=xxx&...
        const hash = window.location.hash.substring(1);
        
        if (!hash) {
          console.error("[Token] No hash fragment found");
          setError("Invalid authentication link");
          setLoading(false);
          return;
        }

        const hashParams = new URLSearchParams(hash);
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");

        if (!access_token || !refresh_token) {
          console.error("[Token] Missing tokens in hash");
          setError("Invalid authentication link");
          setLoading(false);
          return;
        }

        if (!supabase) {
          console.error("[Token] Supabase client not configured");
          setError("Authentication service unavailable");
          setLoading(false);
          return;
        }

        // Set the session with the tokens from the hash
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          console.error("[Token] Error setting session:", sessionError);
          setError("Failed to establish session");
          setLoading(false);
          return;
        }

        console.log("[Token] Session established successfully");
        
        // Clear the hash from URL for security
        window.history.replaceState(null, "", window.location.pathname);
        
        // Redirect to dashboard
        router.push("/dashboard");
      } catch (err) {
        console.error("[Token] Unexpected error:", err);
        setError("Something went wrong");
        setLoading(false);
      }
    };

    handleTokens();
  }, [router]);

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-loading">
            <div className="spinner" />
            <p>Completing sign in...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-error">
            <p>{error}</p>
            <button 
              onClick={() => router.push("/login")}
              className="btn btn-primary"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
