/**
 * Application Constants
 * =====================
 * Centralized constants to avoid hardcoded values scattered across the codebase.
 */

/**
 * Primary site URL with consistent fallback.
 * Always use this instead of hardcoding URLs in API routes.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.apexinterviewer.com";

/**
 * Email sender configuration
 */
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Apex Interviewer <hi@apexinterviewer.com>";

/**
 * Product name for consistent branding
 */
export const PRODUCT_NAME = "Apex Interviewer";

/**
 * API rate limits (requests per minute)
 */
export const RATE_LIMITS = {
  TRANSCRIBE: 10,
  EVALUATE: 10,
  SPEAK: 20,
  AUTH: 5,
  CHECKOUT: 10,
  DEFAULT: 30,
} as const;
