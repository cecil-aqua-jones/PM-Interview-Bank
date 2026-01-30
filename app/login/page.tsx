"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { track, getEmailDomain } from "@/lib/posthog";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  // Track page view on mount
  useEffect(() => {
    track({ name: "login_page_viewed" });
  }, []);

  // Check for error in URL params
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setStatus("error");
      setMessage(error);
      track({ name: "login_error", properties: { error } });
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkAuth();
  }, [router]);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const trimmedEmail = email.trim();
    track({
      name: "login_magic_link_requested",
      properties: { email_domain: getEmailDomain(trimmedEmail) },
    });

    try {
      // Use custom magic link API with beautiful Resend emails
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send magic link");
      }

      track({ name: "login_magic_link_sent" });
      setStatus("sent");
      setMessage("Check your email for the magic link.");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      track({ name: "login_error", properties: { error: errorMessage } });
      setStatus("error");
      setMessage(errorMessage);
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#faf9f7",
      padding: "24px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        backgroundColor: "#ffffff",
        borderRadius: "4px",
        border: "1px solid rgba(0,0,0,0.06)",
        padding: "64px 48px",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{
            fontSize: "28px",
            fontWeight: 400,
            color: "#1a1a1a",
            fontFamily: "Playfair Display, Georgia, serif",
            marginBottom: "16px",
          }}>
            Welcome
          </h1>
          <p style={{
            fontSize: "14px",
            color: "#6b7280",
            lineHeight: 1.6,
          }}>
            Sign in to access your interview preparation
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn}>
          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "11px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#9ca3af",
                marginBottom: "12px",
              }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "15px",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                backgroundColor: "#faf9f7",
                color: "#1a1a1a",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => e.target.style.borderColor = "#1a1a1a"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              width: "100%",
              padding: "16px 24px",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              backgroundColor: status === "loading" ? "#6b7280" : "#1a1a1a",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              cursor: status === "loading" ? "wait" : "pointer",
              transition: "background-color 0.3s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (status !== "loading") {
                e.currentTarget.style.backgroundColor = "#333333";
              }
            }}
            onMouseLeave={(e) => {
              if (status !== "loading") {
                e.currentTarget.style.backgroundColor = "#1a1a1a";
              }
            }}
          >
            {status === "loading" ? "Sending…" : "Send Magic Link"}
          </button>
        </form>

        {/* Status Message */}
        {message && (
          <div style={{
            marginTop: "24px",
            padding: "16px",
            borderRadius: "4px",
            backgroundColor: status === "error" ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${status === "error" ? "#fecaca" : "#bbf7d0"}`,
          }}>
            <p style={{
              fontSize: "13px",
              color: status === "error" ? "#991b1b" : "#166534",
              textAlign: "center",
              margin: 0,
            }}>
              {message}
            </p>
          </div>
        )}

        {/* Footer */}
        <p style={{
          marginTop: "48px",
          fontSize: "12px",
          color: "#9ca3af",
          textAlign: "center",
          lineHeight: 1.6,
        }}>
          We&apos;ll send you a secure link to sign in.
          <br />
          No password required.
        </p>
      </div>
    </main>
  );
}
