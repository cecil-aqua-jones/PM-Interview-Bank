"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (posthog.__loaded) return;

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!posthogKey) {
      console.warn("PostHog key not configured - analytics disabled");
      return;
    }

    posthog.init(posthogKey, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: {
        dom_event_allowlist: ["click", "submit"],
        element_allowlist: ["button", "a", "input", "form"],
      },
      // Respect user privacy preferences
      respect_dnt: true,
      // Session recording (disabled by default, enable in PostHog dashboard)
      disable_session_recording: true,
      // Performance optimization
      loaded: () => {
        if (process.env.NODE_ENV === "development") {
          console.log("PostHog initialized");
        }
      },
    });
  }, []);

  // On server, render children without PostHog provider to avoid hydration mismatch
  if (!isClient) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
