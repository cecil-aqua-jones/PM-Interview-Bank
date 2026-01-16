/**
 * Security utilities for input sanitization and validation
 */

// Characters that could be used for injection attacks
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi,
];

// Patterns that could indicate prompt injection
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/gi,
  /disregard\s+(previous|above|all)/gi,
  /forget\s+(everything|all|previous)/gi,
  /new\s+instructions?:/gi,
  /system\s*:\s*/gi,
  /assistant\s*:\s*/gi,
  /\[INST\]/gi,
  /<<SYS>>/gi,
];

/**
 * Sanitize text input to prevent XSS
 */
export function sanitizeText(input: string): string {
  if (typeof input !== "string") return "";

  let sanitized = input;

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

  return sanitized.trim();
}

/**
 * Sanitize input for LLM prompts to prevent prompt injection
 */
export function sanitizeForLLM(input: string): string {
  if (typeof input !== "string") return "";

  let sanitized = input;

  // Remove potential prompt injection attempts
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[FILTERED]");
  }

  // Limit length to prevent token exhaustion attacks
  const MAX_LENGTH = 5000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized.trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate audio file
 */
export function isValidAudioFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
  ];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File too large. Maximum size is 10MB." };
  }

  // Check MIME type (note: can be spoofed, but provides basic validation)
  const mimeType = file.type.split(";")[0];
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return { valid: false, error: "Invalid audio format." };
  }

  return { valid: true };
}

/**
 * Validate string length
 */
export function validateLength(
  input: string,
  min: number,
  max: number
): { valid: boolean; error?: string } {
  if (input.length < min) {
    return { valid: false, error: `Input must be at least ${min} characters.` };
  }
  if (input.length > max) {
    return { valid: false, error: `Input must not exceed ${max} characters.` };
  }
  return { valid: true };
}

/**
 * Generate a secure random ID
 */
export function generateSecureId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Hash sensitive data (for logging/tracking without exposing raw data)
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Check if request is from allowed origin
 */
export function isAllowedOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  return allowedOrigins.some((allowed) => {
    if (allowed === "*") return true;
    if (allowed.startsWith("*.")) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain) || origin === `https://${domain}`;
    }
    return origin === allowed;
  });
}
