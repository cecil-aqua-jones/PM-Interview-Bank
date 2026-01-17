"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Question } from "@/lib/types";
import CompanyQuestionsClient from "./CompanyQuestionsClient";
import PaywallModal from "./PaywallModal";
import styles from "../app.module.css";

type CompanyQuestionsWrapperProps = {
  companyName: string;
  companySlug: string;
  questions: Question[];
};

export default function CompanyQuestionsWrapper({
  companyName,
  companySlug,
  questions,
}: CompanyQuestionsWrapperProps) {
  const router = useRouter();
  const [hasPaid, setHasPaid] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!supabase) {
        // If no Supabase configured, allow access (development mode)
        setHasPaid(true);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.user_metadata?.has_paid) {
          setHasPaid(true);
        } else {
          setHasPaid(false);
          setShowPaywall(true);
        }
      } catch (err) {
        console.error("[PaymentCheck] Error:", err);
        // On error, show paywall to be safe
        setHasPaid(false);
        setShowPaywall(true);
      }
    };

    checkPaymentStatus();
  }, []);

  // Loading state
  if (hasPaid === null) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner} />
        <p>Loading...</p>
      </div>
    );
  }

  // User has paid - show full content
  if (hasPaid) {
    return (
      <CompanyQuestionsClient
        companyName={companyName}
        companySlug={companySlug}
        questions={questions}
      />
    );
  }

  // User hasn't paid - show paywall with redirect
  return (
    <>
      {/* Show blurred/limited preview */}
      <div className={styles.lockedContent}>
        <div className={styles.lockedContentOverlay}>
          <div className={styles.lockedContentMessage}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h2>Premium Content</h2>
            <p>Get access to {companyName} interview questions</p>
          </div>
        </div>
      </div>

      {showPaywall && (
        <PaywallModal
          companyName={companyName}
          onClose={() => {
            setShowPaywall(false);
            router.push("/dashboard");
          }}
        />
      )}
    </>
  );
}
