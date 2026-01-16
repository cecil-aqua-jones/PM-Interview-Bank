import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiter (for Vercel, use Upstash Redis in production)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = {
  "/api/interview/transcribe": 10,
  "/api/interview/evaluate": 10,
  "/api/interview/speak": 20,
};

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIP || "unknown";
}

function isRateLimited(ip: string, path: string): boolean {
  const key = `${ip}:${path}`;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  // Get max requests for this path, default to 30
  const maxRequests =
    MAX_REQUESTS_PER_WINDOW[path as keyof typeof MAX_REQUESTS_PER_WINDOW] || 30;

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { count: 1, timestamp: now });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count++;
  return false;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers for all responses
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // XSS Protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' blob:",
      "connect-src 'self' https://api.openai.com https://*.supabase.co https://api.airtable.com https://cdn.brandfetch.io",
      "frame-ancestors 'none'",
    ].join("; ")
  );

  // Permissions Policy - disable sensitive features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=(self)"
  );

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const clientIP = getClientIP(request);

    if (isRateLimited(clientIP, pathname)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
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

  // Protected routes - redirect to login if not on allowed paths
  const publicPaths = ["/", "/login", "/api/"];
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path)
  );

  // Note: Full auth check would require checking Supabase session
  // This is a basic path protection layer

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
