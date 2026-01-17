"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "../app.module.css";

type PaywallModalProps = {
  onClose: () => void;
  companyName?: string;
};

export default function PaywallModal({ onClose, companyName }: PaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  useEffect(() => {
    const getEmail = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? undefined);
    };
    getEmail();
  }, []);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const { url, error } = await response.json();

      if (error) {
        console.error("[Checkout] Error:", error);
        alert("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

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
    <div className={styles.paywallOverlay} onClick={onClose}>
      <div className={styles.paywallModal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.paywallClose} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles.paywallContent}>
          <div className={styles.paywallIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 className={styles.paywallTitle}>
            Unlock {companyName ? `${companyName} Questions` : "All Questions"}
          </h2>

          <p className={styles.paywallDescription}>
            Get full access to all PM interview questions and AI mock interviews 
            with instant feedback.
          </p>

          <div className={styles.paywallFeatures}>
            <div className={styles.paywallFeature}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>500+ real interview questions</span>
            </div>
            <div className={styles.paywallFeature}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>AI mock interviews with feedback</span>
            </div>
            <div className={styles.paywallFeature}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>1 year of unlimited access</span>
            </div>
            <div className={styles.paywallFeature}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Monthly question updates</span>
            </div>
          </div>

          <div className={styles.paywallPricing}>
            <span className={styles.paywallPrice}>$250</span>
            <span className={styles.paywallPriceNote}>one-time payment</span>
          </div>

          <button
            className={styles.paywallButton}
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? "Loading..." : "Get Full Access"}
          </button>

          <p className={styles.paywallSecure}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
