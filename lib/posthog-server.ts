/**
 * PostHog Server-Side Analytics
 * ==============================
 * Server-side tracking for events that occur outside the browser,
 * such as Stripe webhooks, cron jobs, and API routes.
 *
 * Usage:
 *   import { captureServerEvent, identifyServerUser, flushPostHog } from "@/lib/posthog-server";
 *
 *   // Track an event
 *   captureServerEvent(userEmail, "purchase", { revenue: 500, plan: "annual" });
 *
 *   // Identify/update user properties
 *   identifyServerUser(userEmail, { has_paid: true, plan_type: "annual" });
 *
 *   // Always flush before returning from serverless functions
 *   await flushPostHog();
 */

import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

/**
 * Get or create the PostHog server client.
 * Returns null if PostHog is not configured.
 */
export function getPostHogServer(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      // Flush automatically every 30 seconds or 20 events
      flushAt: 20,
      flushInterval: 30000,
    });
  }

  return posthogClient;
}

/**
 * Capture a server-side event.
 * @param distinctId - User identifier (email or user ID)
 * @param event - Event name
 * @param properties - Optional event properties
 */
export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): void {
  const client = getPostHogServer();
  if (!client) {
    console.warn("[PostHog Server] Client not configured, skipping event:", event);
    return;
  }

  client.capture({
    distinctId,
    event,
    properties,
  });
}

/**
 * Options for identifying a user
 */
export interface IdentifyOptions {
  /** Properties to set (overwrites existing values) */
  properties?: Record<string, unknown>;
  /** Properties to set only if not already set */
  propertiesSetOnce?: Record<string, unknown>;
}

/**
 * Identify a user and set their properties server-side.
 * @param distinctId - User identifier (email or user ID)
 * @param options - Properties to set or set once
 * 
 * Note: For cumulative values like total_revenue, use events with the
 * `revenue` property instead. PostHog's revenue analytics automatically
 * aggregates these from events, not user properties.
 * 
 * Uses PostHog's $set and $set_once special properties for proper handling.
 */
export function identifyServerUser(
  distinctId: string,
  options: IdentifyOptions | Record<string, unknown>
): void {
  const client = getPostHogServer();
  if (!client) {
    console.warn("[PostHog Server] Client not configured, skipping identify");
    return;
  }

  // Support both old API (plain properties) and new API (with setOnce)
  const isNewApi = options && ("properties" in options || "propertiesSetOnce" in options);
  
  if (isNewApi) {
    const opts = options as IdentifyOptions;
    // Merge $set and $set_once into properties object
    // PostHog Node client uses these special keys for property operations
    const mergedProperties: Record<string, unknown> = {};
    
    if (opts.properties) {
      mergedProperties.$set = opts.properties;
    }
    if (opts.propertiesSetOnce) {
      mergedProperties.$set_once = opts.propertiesSetOnce;
    }
    
    client.identify({
      distinctId,
      properties: mergedProperties,
    });
  } else {
    // Legacy: treat entire object as properties
    client.identify({
      distinctId,
      properties: options as Record<string, unknown>,
    });
  }
}

/**
 * Flush all pending events and shut down the client.
 * IMPORTANT: Call this before returning from serverless functions
 * to ensure all events are sent.
 */
export async function flushPostHog(): Promise<void> {
  const client = getPostHogServer();
  if (!client) return;

  try {
    await client.shutdown();
    // Reset the client so it can be recreated on next invocation
    posthogClient = null;
  } catch (err) {
    console.error("[PostHog Server] Error flushing events:", err);
  }
}
