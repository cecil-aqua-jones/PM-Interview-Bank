"use client";

import { useState } from "react";

type CheckoutButtonProps = {
  className?: string;
  children: React.ReactNode;
};

export default function CheckoutButton({
  className = "",
  children,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const { url, error } = await response.json();

      if (error) {
        console.error("[Checkout] Error:", error);
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
