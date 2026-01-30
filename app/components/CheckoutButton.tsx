"use client";

import { useState } from "react";
import { track } from "@/lib/posthog";

type CheckoutButtonProps = {
  className?: string;
  children: React.ReactNode;
  plan?: "monthly" | "annual";
  location?: string;
};

export default function CheckoutButton({
  className = "",
  children,
  plan = "annual",
  location = "landing",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    // Track checkout initiation
    track({
      name: "checkout_initiated",
      properties: { plan, location },
    });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const { url, error } = await response.json();

      if (error) {
        console.error("[Checkout] Error:", error);
        track({
          name: "checkout_failed",
          properties: { error, plan },
        });
        alert("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("[Checkout] Error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      track({
        name: "checkout_failed",
        properties: { error: errorMessage, plan },
      });
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={className}
      style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
