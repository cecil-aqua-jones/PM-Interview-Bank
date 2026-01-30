/**
 * PostHog Analytics Integration
 * =============================
 * Centralized analytics tracking with type-safe event definitions.
 *
 * ANALYTICS EXTENSION GUIDE
 * --------------------------
 * When adding new features, extend tracking by:
 * 1. Add new event type to AnalyticsEvent union below
 * 2. Call track() at the relevant interaction point
 * 3. Include meaningful properties (IDs, types, durations)
 *
 * Event naming convention: {noun}_{verb} (e.g., interview_started)
 *
 * Categories:
 * - Auth: login_, logout_, session_
 * - Payment: checkout_, payment_, paywall_, promo_
 * - Interview: interview_, code_, response_
 * - Marketing: popup_, cta_, landing_
 * - Navigation: nav_, page_
 * - Engagement: company_, question_, search_
 */

import posthog from "posthog-js";

// ============================================================================
// Event Type Definitions
// ============================================================================

export type AnalyticsEvent =
  // ---------------------------------------------------------------------------
  // Authentication Events
  // ---------------------------------------------------------------------------
  | { name: "login_page_viewed" }
  | { name: "login_magic_link_requested"; properties: { email_domain: string } }
  | { name: "login_magic_link_sent" }
  | { name: "login_error"; properties: { error: string } }
  | { name: "logout_initiated" }
  | { name: "logout_completed" }
  | { name: "session_started"; properties: { user_id: string; has_paid: boolean } }

  // ---------------------------------------------------------------------------
  // Payment Events
  // ---------------------------------------------------------------------------
  | {
      name: "checkout_initiated";
      properties: { plan: string; location: string; promo_code?: string };
    }
  | {
      name: "checkout_completed";
      properties: { plan: string; amount: number; promo_code?: string };
    }
  | { name: "checkout_failed"; properties: { error: string; plan: string } }
  | { name: "promo_code_applied"; properties: { code: string; plan: string } }
  | { name: "paywall_shown"; properties: { company: string; trigger: string } }
  | { name: "paywall_checkout_clicked"; properties: { company: string } }
  | { name: "paywall_closed"; properties: { company: string } }

  // ---------------------------------------------------------------------------
  // Interview Events
  // ---------------------------------------------------------------------------
  | {
      name: "interview_started";
      properties: {
        type: "coding" | "behavioral" | "system_design";
        company: string;
        question_id: string;
        question_title: string;
      };
    }
  | {
      name: "interview_completed";
      properties: {
        type: "coding" | "behavioral" | "system_design";
        company: string;
        question_id: string;
        score: number;
        duration_seconds: number;
      };
    }
  | {
      name: "interview_closed";
      properties: {
        type: "coding" | "behavioral" | "system_design";
        company: string;
        question_id: string;
        completed: boolean;
      };
    }
  | {
      name: "code_submitted";
      properties: {
        company: string;
        question_id: string;
        language: string;
        code_length: number;
      };
    }
  | {
      name: "response_submitted";
      properties: {
        type: "behavioral" | "system_design";
        company: string;
        question_id: string;
        response_length: number;
      };
    }
  | {
      name: "interview_language_changed";
      properties: { from: string; to: string; question_id: string };
    }

  // ---------------------------------------------------------------------------
  // Marketing Events
  // ---------------------------------------------------------------------------
  | { name: "exit_popup_triggered" }
  | { name: "exit_popup_shown" }
  | { name: "exit_popup_closed"; properties: { had_interaction: boolean } }
  | {
      name: "exit_popup_subscribed";
      properties: { has_first_name: boolean };
    }
  | { name: "exit_popup_subscription_failed"; properties: { error: string } }
  | { name: "landing_cta_clicked"; properties: { location: string; plan?: string } }
  | { name: "landing_section_viewed"; properties: { section: string } }
  | { name: "pricing_plan_toggled"; properties: { selected: "monthly" | "annual" } }

  // ---------------------------------------------------------------------------
  // Navigation & Engagement Events
  // ---------------------------------------------------------------------------
  | { name: "company_selected"; properties: { company: string; question_count: number } }
  | {
      name: "question_selected";
      properties: {
        company: string;
        question_id: string;
        question_type: string;
      };
    }
  | {
      name: "search_performed";
      properties: { query_length: number; results_count: number; context: string };
    }
  | { name: "filter_changed"; properties: { filter_type: string; value: string } }
  | { name: "progress_page_viewed" }
  | { name: "dashboard_viewed" };

// ============================================================================
// Core Tracking Functions
// ============================================================================

/**
 * Track an analytics event with type-safe properties.
 * Automatically handles SSR safety.
 */
export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  const properties = "properties" in event ? event.properties : {};
  posthog.capture(event.name, properties);
}

/**
 * Identify a user for analytics tracking.
 * Call this when user signs in.
 */
export function identify(
  userId: string,
  traits?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  posthog.identify(userId, traits);
}

/**
 * Reset user identification.
 * Call this when user signs out.
 */
export function reset(): void {
  if (typeof window === "undefined") return;
  posthog.reset();
}

/**
 * Set user properties without identifying.
 * Useful for updating user traits after identification.
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  posthog.people.set(properties);
}

/**
 * Track a page view manually.
 * Usually not needed as PostHog auto-captures pageviews.
 */
export function trackPageView(path?: string): void {
  if (typeof window === "undefined") return;
  posthog.capture("$pageview", path ? { $current_url: path } : undefined);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract domain from email for anonymized tracking.
 */
export function getEmailDomain(email: string): string {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1] : "unknown";
}

/**
 * Simple synchronous hash for client-side privacy.
 * Uses djb2 algorithm - not cryptographically secure but good for anonymization.
 * For true security, use server-side hashing with proper algorithms.
 */
export function hashForPrivacy(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  // Convert to hex and take first 16 chars
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Check if PostHog is initialized and ready.
 */
export function isPostHogReady(): boolean {
  if (typeof window === "undefined") return false;
  return posthog.__loaded ?? false;
}
