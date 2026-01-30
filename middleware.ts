import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ═══════════════════════════════════════════════════════════════════════════
// DISTRIBUTED RATE LIMITING (Upstash Redis)
// ═══════════════════════════════════════════════════════════════════════════

// Rate limit configurations per endpoint (requests per minute)
const RATE_LIMITS: Record<string, number> = {
  "/api/interview/transcribe": 10,
  "/api/interview/evaluate": 10,
  "/api/interview/speak": 20,
  "/api/auth/magic-link": 5,  // Strict limit for auth - prevents brute force
  "/api/checkout": 10,
  "/api/subscribe": 10,
};

const DEFAULT_RATE_LIMIT = 30; // requests per minute for unlisted endpoints

// Cache of rate limiters by their limit value (lazy initialization)
const rateLimiters: Map<number, Ratelimit> = new Map();
let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!redisUrl || !redisToken) {
    // Rate limiting disabled if Upstash not configured
    console.warn("[Middleware] Upstash Redis not configured - rate limiting disabled");
    return null;
  }
  
  redisClient = new Redis({
    url: redisUrl,
    token: redisToken,
  });
  
  return redisClient;
}

/**
 * Get or create a rate limiter for a specific limit value.
 * This ensures each endpoint gets its configured rate limit,
 * not a single global limit.
 */
function getRateLimiterForLimit(limit: number): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;
  
  // Check cache first
  let limiter = rateLimiters.get(limit);
  if (limiter) return limiter;
  
  // Create new rate limiter for this limit value
  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, "60 s"),
    analytics: true,
    prefix: `apex-ratelimit-${limit}`,
  });
  
  rateLimiters.set(limit, limiter);
  return limiter;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIP || "unknown";
}

async function checkRateLimit(
  ip: string,
  path: string
): Promise<{ limited: boolean; remaining: number; reset: number }> {
  // Get the rate limit for this specific path
  const maxRequests = RATE_LIMITS[path] || DEFAULT_RATE_LIMIT;
  
  // Get the rate limiter configured for this limit value
  const limiter = getRateLimiterForLimit(maxRequests);
  
  if (!limiter) {
    // No rate limiting if not configured
    return { limited: false, remaining: 999, reset: 0 };
  }
  
  // Create a path-specific identifier
  const identifier = `${ip}:${path}`;
  
  const { success, remaining, reset } = await limiter.limit(identifier);
  
  return {
    limited: !success,
    remaining,
    reset,
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Security headers for all responses
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' blob: data:",
      "connect-src 'self' https://api.openai.com https://api.cartesia.ai wss://api.cartesia.ai https://*.supabase.co https://api.airtable.com https://cdn.brandfetch.io wss://*.supabase.co https://us.i.posthog.com https://www.google-analytics.com https://www.googletagmanager.com",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=(self)"
  );

  // Rate limiting for API routes (using Upstash Redis for distributed limiting)
  if (pathname.startsWith("/api/")) {
    const clientIP = getClientIP(request);

    try {
      const { limited, remaining, reset } = await checkRateLimit(clientIP, pathname);
      
      if (limited) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(retryAfter > 0 ? retryAfter : 60),
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }
      
      // Add rate limit headers to response
      response.headers.set("X-RateLimit-Remaining", String(remaining));
    } catch (err) {
      // If rate limiting fails, allow the request but log the error
      console.error("[Middleware] Rate limit check failed:", err);
    }

    // Validate content type for POST requests
    if (request.method === "POST") {
      const contentType = request.headers.get("content-type") || "";

      // Allow multipart for audio uploads, JSON for others
      if (
        !contentType.includes("application/json") &&
        !contentType.includes("multipart/form-data")
      ) {
        return NextResponse.json(
          { error: "Invalid content type" },
          { status: 415 }
        );
      }
    }

    // Check request size (limit to 15MB for audio)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 }
      );
    }
  }

  // Refresh Supabase auth session for all requests
  // This keeps the session alive and refreshes expired tokens
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update cookies on the response
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // This refreshes the session if needed and updates the cookies
    await supabase.auth.getUser();
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
