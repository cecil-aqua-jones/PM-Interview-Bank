"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Company } from "@/lib/types";
import CompanyGridClient from "./CompanyGridClient";

// Match the AuthGuard setting - when true, bypass payment check too (MUST be false in production)
const BYPASS_AUTH = true;

type CompanyGridClientWrapperProps = {
  companies: Company[];
};

export default function CompanyGridClientWrapper({ companies }: CompanyGridClientWrapperProps) {
  const [hasPaid, setHasPaid] = useState(BYPASS_AUTH); // Default to paid if bypassing
  const [loading, setLoading] = useState(!BYPASS_AUTH);

  useEffect(() => {
    // Skip payment check if auth is bypassed
    if (BYPASS_AUTH) {
      return;
    }

    const checkPaymentStatus = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user?.user_metadata?.has_paid) {
          setHasPaid(true);
        }
      } catch (err) {
        console.error("[PaymentCheck] Error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, []);

  // Show loading state briefly while checking payment
  if (loading) {
    return <CompanyGridClient companies={companies} hasPaid={false} />;
  }

  return <CompanyGridClient companies={companies} hasPaid={hasPaid} />;
}
