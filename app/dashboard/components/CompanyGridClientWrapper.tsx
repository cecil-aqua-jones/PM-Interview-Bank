"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Company } from "@/lib/types";
import CompanyGridClient from "./CompanyGridClient";

type CompanyGridClientWrapperProps = {
  companies: Company[];
};

export default function CompanyGridClientWrapper({ companies }: CompanyGridClientWrapperProps) {
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
