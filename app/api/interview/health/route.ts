import { NextResponse } from "next/server";
import { isCartesiaConfigured, CARTESIA_REST_URLS, CARTESIA_VERSION, getCartesiaApiKey } from "@/lib/cartesia";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Health check timeout (5 seconds)
const HEALTH_CHECK_TIMEOUT_MS = 5000;

/**
 * API access status categories
 */
type ApiStatus = 
  | "ok"                    // API is working normally
  | "rate_limited"          // HTTP 429 - Too many requests
  | "unauthorized"          // HTTP 401 - Invalid API key
  | "forbidden"             // HTTP 403 - API key lacks permissions
  | "server_error"          // HTTP 5xx - Server-side issue
  | "network_error"         // Connection failed (ETIMEDOUT, etc.)
  | "timeout"               // Request timed out
  | "unknown";              // Unexpected error

interface HealthStatus {
  healthy: boolean;
  services: {
    cartesia: ServiceStatus;
    openai: ServiceStatus;
  };
  timestamp: string;
}

interface ServiceStatus {
  configured: boolean;
  reachable: boolean | null;
  status?: ApiStatus;
  httpStatus?: number;
  latencyMs?: number;
  error?: string;
  rateLimitInfo?: {
    retryAfter?: number;    // Seconds until rate limit resets
    remaining?: number;     // Remaining requests
    limit?: number;         // Total limit
  };
}

/**
 * Categorize HTTP status code into ApiStatus
 */
function getApiStatusFromHttp(status: number): ApiStatus {
  if (status >= 200 && status < 300) return "ok";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  return "ok"; // 4xx errors (except auth) still mean the service is reachable
}

/**
 * Extract rate limit info from response headers
 */
function extractRateLimitInfo(response: Response): ServiceStatus["rateLimitInfo"] | undefined {
  const retryAfter = response.headers.get("Retry-After");
  const remaining = response.headers.get("X-RateLimit-Remaining") || 
                    response.headers.get("RateLimit-Remaining");
  const limit = response.headers.get("X-RateLimit-Limit") || 
                response.headers.get("RateLimit-Limit");

  if (!retryAfter && !remaining && !limit) return undefined;

  return {
    ...(retryAfter && { retryAfter: parseInt(retryAfter, 10) }),
    ...(remaining && { remaining: parseInt(remaining, 10) }),
    ...(limit && { limit: parseInt(limit, 10) }),
  };
}

/**
 * Check if Cartesia API is reachable and accessible
 * Detects: rate limiting, auth issues, network problems
 */
async function checkCartesiaHealth(): Promise<ServiceStatus> {
  if (!isCartesiaConfigured()) {
    return { configured: false, reachable: null };
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

  try {
    // Use OPTIONS request to check connectivity without consuming API quota
    const response = await fetch(CARTESIA_REST_URLS.STT_BATCH, {
      method: "OPTIONS",
      headers: {
        "Authorization": `Bearer ${getCartesiaApiKey()}`,
        "Cartesia-Version": CARTESIA_VERSION,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const httpStatus = response.status;
    const apiStatus = getApiStatusFromHttp(httpStatus);

    // Extract rate limit info if present
    const rateLimitInfo = extractRateLimitInfo(response);

    // Log specific issues for debugging
    if (apiStatus === "rate_limited") {
      console.warn(`[Health] Cartesia rate limited. Retry after: ${rateLimitInfo?.retryAfter || "unknown"}s`);
    } else if (apiStatus === "unauthorized") {
      console.error("[Health] Cartesia API key is invalid or expired");
    } else if (apiStatus === "forbidden") {
      console.error("[Health] Cartesia API key lacks required permissions");
    }

    // Determine if service is usable
    // OPTIONS returning 405 is expected (method not allowed) but service is reachable
    const isReachable = httpStatus < 500 && apiStatus !== "rate_limited" && 
                        apiStatus !== "unauthorized" && apiStatus !== "forbidden";

    return {
      configured: true,
      reachable: isReachable,
      status: httpStatus === 405 ? "ok" : apiStatus, // 405 from OPTIONS is fine
      httpStatus,
      latencyMs,
      ...(rateLimitInfo && { rateLimitInfo }),
      ...(!isReachable && { 
        error: apiStatus === "rate_limited" ? "Rate limited by Cartesia" :
               apiStatus === "unauthorized" ? "Invalid API key" :
               apiStatus === "forbidden" ? "API key lacks permissions" :
               apiStatus === "server_error" ? `Server error (${httpStatus})` :
               `HTTP ${httpStatus}`
      }),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Categorize network errors
    let status: ApiStatus = "unknown";
    let friendlyError = errorMessage;
    
    if (errorMessage.includes("aborted")) {
      status = "timeout";
      friendlyError = `Connection timeout (${HEALTH_CHECK_TIMEOUT_MS}ms)`;
    } else if (
      errorMessage.includes("ETIMEDOUT") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("ECONNRESET") ||
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("fetch failed")
    ) {
      status = "network_error";
      friendlyError = "Network error - cannot reach Cartesia API";
    }

    console.error(`[Health] Cartesia check failed: ${friendlyError}`);

    return {
      configured: true,
      reachable: false,
      status,
      latencyMs,
      error: friendlyError,
    };
  }
}

/**
 * Check if OpenAI API is reachable
 * Uses a minimal models list request to verify connectivity
 */
async function checkOpenAIHealth(): Promise<ServiceStatus> {
  if (!OPENAI_API_KEY) {
    return { configured: false, reachable: null };
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

  try {
    // Use the models endpoint which is lightweight
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const httpStatus = response.status;
    const apiStatus = getApiStatusFromHttp(httpStatus);
    const rateLimitInfo = extractRateLimitInfo(response);

    // Log specific issues
    if (apiStatus === "rate_limited") {
      console.warn(`[Health] OpenAI rate limited. Retry after: ${rateLimitInfo?.retryAfter || "unknown"}s`);
    } else if (apiStatus === "unauthorized") {
      console.error("[Health] OpenAI API key is invalid");
    }

    const isReachable = response.ok || (httpStatus < 500 && apiStatus !== "rate_limited" && apiStatus !== "unauthorized");

    return {
      configured: true,
      reachable: isReachable,
      status: apiStatus,
      httpStatus,
      latencyMs,
      ...(rateLimitInfo && { rateLimitInfo }),
      ...(!isReachable && { 
        error: apiStatus === "rate_limited" ? "Rate limited by OpenAI" :
               apiStatus === "unauthorized" ? "Invalid API key" :
               `HTTP ${httpStatus}`
      }),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    let status: ApiStatus = "unknown";
    let friendlyError = errorMessage;
    
    if (errorMessage.includes("aborted")) {
      status = "timeout";
      friendlyError = `Connection timeout (${HEALTH_CHECK_TIMEOUT_MS}ms)`;
    } else if (
      errorMessage.includes("ETIMEDOUT") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("fetch failed")
    ) {
      status = "network_error";
      friendlyError = "Network error - cannot reach OpenAI API";
    }

    return {
      configured: true,
      reachable: false,
      status,
      latencyMs,
      error: friendlyError,
    };
  }
}

/**
 * Health check endpoint
 * 
 * GET /api/interview/health
 * 
 * Returns the health status of external services (Cartesia, OpenAI)
 * Used by clients to check service availability before making requests
 * 
 * Response:
 * - 200: All services healthy
 * - 503: One or more services unavailable
 */
export async function GET() {
  // Check services in parallel
  const [cartesiaStatus, openaiStatus] = await Promise.all([
    checkCartesiaHealth(),
    checkOpenAIHealth(),
  ]);

  const healthStatus: HealthStatus = {
    healthy: 
      (cartesiaStatus.reachable !== false) && 
      (openaiStatus.reachable !== false),
    services: {
      cartesia: cartesiaStatus,
      openai: openaiStatus,
    },
    timestamp: new Date().toISOString(),
  };

  // Return 503 if any configured service is unreachable
  const httpStatus = healthStatus.healthy ? 200 : 503;

  return NextResponse.json(healthStatus, { status: httpStatus });
}

/**
 * HEAD request for lightweight health check
 * Returns just the status code without body
 */
export async function HEAD() {
  const [cartesiaStatus, openaiStatus] = await Promise.all([
    checkCartesiaHealth(),
    checkOpenAIHealth(),
  ]);

  const healthy = 
    (cartesiaStatus.reachable !== false) && 
    (openaiStatus.reachable !== false);

  return new NextResponse(null, { status: healthy ? 200 : 503 });
}
