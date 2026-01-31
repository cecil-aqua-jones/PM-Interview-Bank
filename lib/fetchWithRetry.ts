/**
 * Shared fetch utility with retry logic and timeout handling
 * 
 * Handles transient network failures with exponential backoff.
 * Supports configurable timeouts using AbortController.
 */

// Default configuration
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY_MS = 1000;
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Configuration options for fetchWithRetry
 */
export interface FetchWithRetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelayMs?: number;
  /** Request timeout in ms (default: 30000). Set to 0 to disable. */
  timeoutMs?: number;
  /** Optional log prefix for debugging (e.g., "[Speak]") */
  logPrefix?: string;
  /** Whether to log retry attempts (default: true) */
  enableLogging?: boolean;
}

/**
 * Error types that are considered retryable (transient network issues)
 */
const RETRYABLE_ERROR_PATTERNS = [
  "fetch failed",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "socket hang up",
  "network error",
  "aborted",
  // WebSocket-related errors
  "websocket connection error",
  "websocket closed",
  "connection closed",
  "connection refused",
  "connection timed out",
];

/**
 * Check if an error is retryable (transient network issue)
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return RETRYABLE_ERROR_PATTERNS.some(pattern => 
    message.includes(pattern.toLowerCase())
  );
}

/**
 * Fetch with automatic retry for transient network failures
 * 
 * Features:
 * - Exponential backoff between retries
 * - Configurable timeout using AbortController
 * - Handles common network error types
 * - Preserves original AbortSignal if provided
 * 
 * @param url - The URL to fetch
 * @param options - Standard fetch options (RequestInit)
 * @param config - Retry and timeout configuration
 * @returns Promise<Response> - The fetch response
 * @throws Error - If all retries fail or non-retryable error occurs
 * 
 * @example
 * ```typescript
 * const response = await fetchWithRetry(
 *   "https://api.example.com/data",
 *   { method: "POST", body: JSON.stringify(data) },
 *   { maxRetries: 3, timeoutMs: 10000, logPrefix: "[API]" }
 * );
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: FetchWithRetryConfig = {}
): Promise<Response> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    logPrefix = "[Fetch]",
    enableLogging = true,
  } = config;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Create timeout controller if timeout is enabled
    let timeoutId: NodeJS.Timeout | undefined;
    let timeoutController: AbortController | undefined;
    
    try {
      // Set up timeout if configured
      let signal = options.signal;
      
      if (timeoutMs > 0) {
        timeoutController = new AbortController();
        timeoutId = setTimeout(() => {
          timeoutController?.abort();
        }, timeoutMs);
        
        // If the original options had a signal, we need to handle both
        if (options.signal) {
          // Create a combined abort handler
          const originalSignal = options.signal;
          originalSignal.addEventListener("abort", () => {
            timeoutController?.abort();
          });
        }
        
        signal = timeoutController.signal;
      }

      const response = await fetch(url, {
        ...options,
        signal,
      });

      // Clear timeout on success
      if (timeoutId) clearTimeout(timeoutId);
      
      return response;
    } catch (error) {
      // Clear timeout on error
      if (timeoutId) clearTimeout(timeoutId);
      
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if it's a retryable error
      const isAbortError = lastError.name === "AbortError";
      const isTimeout = isAbortError && timeoutController?.signal.aborted;
      const isRetryable = isRetryableError(lastError) || isTimeout;

      // Don't retry on non-retryable errors or last attempt
      if (!isRetryable || attempt === maxRetries - 1) {
        // Add context to timeout errors
        if (isTimeout) {
          throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
        }
        throw lastError;
      }

      // Exponential backoff
      const delay = initialDelayMs * Math.pow(2, attempt);
      
      if (enableLogging) {
        console.log(
          `${logPrefix} Retry ${attempt + 1}/${maxRetries} after ${delay}ms - ${lastError.message}`
        );
      }
      
      await sleep(delay);
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Helper to sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Result type for tryFetch - includes success/failure status
 */
export interface TryFetchResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  statusCode?: number;
}

/**
 * Non-throwing version of fetchWithRetry that returns a result object
 * Useful when you want to handle errors without try-catch
 * 
 * @example
 * ```typescript
 * const result = await tryFetch<MyData>(
 *   "https://api.example.com/data",
 *   { method: "GET" },
 *   { maxRetries: 2 }
 * );
 * 
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error("Failed:", result.error?.message);
 * }
 * ```
 */
export async function tryFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
  config: FetchWithRetryConfig = {}
): Promise<TryFetchResult<T>> {
  try {
    const response = await fetchWithRetry(url, options, config);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        success: false,
        error: new Error(`HTTP ${response.status}: ${errorText}`),
        statusCode: response.status,
      };
    }
    
    const data = await response.json() as T;
    return {
      success: true,
      data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
