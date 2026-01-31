"use client";

import { useRef, useCallback, useEffect, useState } from "react";

type PreloadedAudio = {
  questionId: string;
  audioBlob: Blob;
  audioUrl: string;
  status: "loading" | "ready" | "error";
  timestamp: number;
};

// Maximum concurrent preloads to avoid overwhelming the API
// NOTE: Cartesia has a concurrency limit of 2 - keep this at 1 to leave room for active TTS
const MAX_CONCURRENT_PRELOADS = 1;
// Maximum cache size (will evict oldest entries)
const MAX_CACHE_SIZE = 20;
// Cache expiry time (30 minutes)
const CACHE_EXPIRY_MS = 30 * 60 * 1000;
// Estimated TTS generation time in ms (for progress simulation)
const ESTIMATED_TTS_TIME_MS = 3000;

// Circuit breaker configuration
const CIRCUIT_BREAKER_THRESHOLD = 3; // Number of consecutive failures to open circuit
const CIRCUIT_BREAKER_COOLDOWN_MS = 30000; // 30 seconds before allowing retry
const CIRCUIT_BREAKER_HALF_OPEN_MAX_ATTEMPTS = 1; // Max attempts in half-open state

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  lastError: string | null;
}

/**
 * Hook for aggressively preloading TTS audio for instant interview starts.
 * Features:
 * - Preloads selected question immediately
 * - Preloads adjacent questions (prev/next)
 * - Supports batch preloading
 * - LRU-style cache eviction
 * - Concurrent request limiting
 * - Reactive state updates when preloads complete
 * - Progress tracking for loading items
 * - Circuit breaker pattern to prevent hammering unavailable services
 */
export function useTTSPreloader() {
  const cacheRef = useRef<Map<string, PreloadedAudio>>(new Map());
  const loadingRef = useRef<Map<string, AbortController>>(new Map());
  const queueRef = useRef<{ id: string; title: string; content: string; priority: number }[]>([]);
  const isProcessingRef = useRef(false);
  const progressIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Circuit breaker state - tracks consecutive failures
  const circuitBreakerRef = useRef<CircuitBreakerState>({
    state: "closed",
    failureCount: 0,
    lastFailureTime: 0,
    lastError: null,
  });
  
  // Reactive state to trigger re-renders when preload status changes
  const [preloadedIds, setPreloadedIds] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  // Track loading progress (0-100) for each question
  const [loadingProgress, setLoadingProgress] = useState<Map<string, number>>(new Map());
  // Service availability status - exposed to consumers
  const [serviceStatus, setServiceStatus] = useState<{
    available: boolean;
    lastError: string | null;
    circuitState: CircuitState;
  }>({ available: true, lastError: null, circuitState: "closed" });

  // Update service status from circuit breaker state
  const updateServiceStatus = useCallback(() => {
    const cb = circuitBreakerRef.current;
    setServiceStatus({
      available: cb.state !== "open",
      lastError: cb.lastError,
      circuitState: cb.state,
    });
  }, []);

  // Check if circuit allows requests (returns true if allowed)
  const checkCircuit = useCallback((): boolean => {
    const cb = circuitBreakerRef.current;
    const now = Date.now();

    switch (cb.state) {
      case "closed":
        return true;
      
      case "open":
        // Check if cooldown period has passed
        if (now - cb.lastFailureTime >= CIRCUIT_BREAKER_COOLDOWN_MS) {
          // Transition to half-open state
          cb.state = "half-open";
          console.log("[TTS] Circuit breaker: transitioning to half-open state");
          updateServiceStatus();
          return true;
        }
        return false;
      
      case "half-open":
        // Allow limited requests to test if service is back
        return loadingRef.current.size < CIRCUIT_BREAKER_HALF_OPEN_MAX_ATTEMPTS;
      
      default:
        return true;
    }
  }, [updateServiceStatus]);

  // Record a successful request
  const recordSuccess = useCallback(() => {
    const cb = circuitBreakerRef.current;
    
    if (cb.state === "half-open") {
      // Service is back - close the circuit
      console.log("[TTS] Circuit breaker: service recovered, closing circuit");
      cb.state = "closed";
      cb.failureCount = 0;
      cb.lastError = null;
      updateServiceStatus();
    } else if (cb.state === "closed" && cb.failureCount > 0) {
      // Reset failure count on success
      cb.failureCount = 0;
      cb.lastError = null;
      updateServiceStatus();
    }
  }, [updateServiceStatus]);

  // Record a failed request
  const recordFailure = useCallback((error: string, isNetworkError: boolean) => {
    const cb = circuitBreakerRef.current;
    cb.lastError = error;
    cb.lastFailureTime = Date.now();
    
    // Only trigger circuit breaker for network/service errors, not validation errors
    if (!isNetworkError) {
      return;
    }
    
    if (cb.state === "half-open") {
      // Service still down - re-open the circuit
      console.log("[TTS] Circuit breaker: service still unavailable, re-opening circuit");
      cb.state = "open";
      updateServiceStatus();
    } else {
      cb.failureCount++;
      
      if (cb.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
        // Too many failures - open the circuit
        console.log(`[TTS] Circuit breaker: ${cb.failureCount} consecutive failures, opening circuit`);
        cb.state = "open";
        updateServiceStatus();
      }
    }
  }, [updateServiceStatus]);

  // Reset circuit breaker (e.g., user manually wants to retry)
  const resetCircuitBreaker = useCallback(() => {
    const cb = circuitBreakerRef.current;
    cb.state = "closed";
    cb.failureCount = 0;
    cb.lastError = null;
    cb.lastFailureTime = 0;
    console.log("[TTS] Circuit breaker: manually reset");
    updateServiceStatus();
  }, [updateServiceStatus]);

  // Cleanup expired cache entries
  const cleanupExpiredCache = useCallback(() => {
    const now = Date.now();
    const expired: string[] = [];
    
    cacheRef.current.forEach((audio, id) => {
      if (now - audio.timestamp > CACHE_EXPIRY_MS) {
        expired.push(id);
      }
    });

    expired.forEach(id => {
      const cached = cacheRef.current.get(id);
      // Only revoke blob URLs, not data URLs
      if (cached?.audioUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(cached.audioUrl);
      }
      cacheRef.current.delete(id);
    });
  }, []);

  // Evict oldest entries if cache is full
  const evictOldestIfNeeded = useCallback(() => {
    if (cacheRef.current.size >= MAX_CACHE_SIZE) {
      // Find oldest entry
      let oldestId: string | null = null;
      let oldestTimestamp = Infinity;
      
      cacheRef.current.forEach((audio, id) => {
        if (audio.timestamp < oldestTimestamp) {
          oldestId = id;
          oldestTimestamp = audio.timestamp;
        }
      });
      
      if (oldestId) {
        const cached = cacheRef.current.get(oldestId);
        // Only revoke blob URLs, not data URLs
        if (cached?.audioUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(cached.audioUrl);
        }
        cacheRef.current.delete(oldestId);
      }
    }
  }, []);

  // Process the preload queue
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    if (queueRef.current.length === 0) return;
    if (loadingRef.current.size >= MAX_CONCURRENT_PRELOADS) return;
    
    // Check circuit breaker before processing
    if (!checkCircuit()) {
      console.log("[TTS] Circuit breaker open, skipping preload queue");
      return;
    }

    isProcessingRef.current = true;

    // Sort by priority (higher = more important)
    queueRef.current.sort((a, b) => b.priority - a.priority);

    while (
      queueRef.current.length > 0 &&
      loadingRef.current.size < MAX_CONCURRENT_PRELOADS
    ) {
      // Re-check circuit breaker before each item
      if (!checkCircuit()) {
        break;
      }
      
      const item = queueRef.current.shift();
      if (!item) break;

      // Skip if already cached or loading
      if (cacheRef.current.has(item.id) || loadingRef.current.has(item.id)) {
        continue;
      }

      // Start loading (don't await - let it run in parallel)
      loadSingleAudio(item.id, item.title, item.content);
    }

    isProcessingRef.current = false;
  }, [checkCircuit]);

  // Start progress simulation for a question
  const startProgressSimulation = (questionId: string) => {
    // Clear any existing interval
    const existingInterval = progressIntervalsRef.current.get(questionId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Start at 0%
    setLoadingProgress(prev => new Map(prev).set(questionId, 0));

    // Simulate progress with easing (fast at start, slow near end)
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      // Use exponential easing - progress slows down as it approaches 90%
      // Never exceeds 90% - the final 10% happens when actually complete
      const progress = Math.min(90, (1 - Math.exp(-elapsed / (ESTIMATED_TTS_TIME_MS * 0.5))) * 90);
      
      setLoadingProgress(prev => new Map(prev).set(questionId, Math.round(progress)));
      
      // Stop updating at 90%
      if (progress >= 89) {
        clearInterval(interval);
        progressIntervalsRef.current.delete(questionId);
      }
    }, 100);

    progressIntervalsRef.current.set(questionId, interval);
  };

  // Complete progress for a question
  const completeProgress = (questionId: string) => {
    // Clear any running interval
    const interval = progressIntervalsRef.current.get(questionId);
    if (interval) {
      clearInterval(interval);
      progressIntervalsRef.current.delete(questionId);
    }
    
    // Set to 100%
    setLoadingProgress(prev => new Map(prev).set(questionId, 100));
    
    // Remove from progress tracking after animation completes
    setTimeout(() => {
      setLoadingProgress(prev => {
        const next = new Map(prev);
        next.delete(questionId);
        return next;
      });
    }, 300);
  };

  // Load a single audio file
  const loadSingleAudio = async (questionId: string, questionTitle: string, questionContent: string) => {
    if (cacheRef.current.has(questionId) || loadingRef.current.has(questionId)) {
      return;
    }
    
    // Check circuit breaker before attempting
    if (!checkCircuit()) {
      console.log(`[TTS] Circuit breaker open, skipping preload for ${questionId.slice(0, 8)}...`);
      return;
    }

    const abortController = new AbortController();
    loadingRef.current.set(questionId, abortController);
    
    // Update loading state (triggers re-render)
    setLoadingIds(prev => new Set(prev).add(questionId));
    
    // Start progress simulation
    startProgressSimulation(questionId);
    
    // Client-side timeout - abort if TTS takes too long (15 seconds)
    // This prevents the loading state from being stuck when Cartesia is unreachable
    const timeoutId = setTimeout(() => {
      console.log(`[TTS] Preload timeout for ${questionId.slice(0, 8)}...`);
      abortController.abort();
    }, 15000);

    try {
      const response = await fetch("/api/interview/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send title and content separately for proper introduction formatting
        body: JSON.stringify({ questionTitle, questionContent }),
        signal: abortController.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Check if it's a service unavailability error (503)
        const isServiceError = response.status === 503 || response.status >= 500;
        const errorMessage = `HTTP ${response.status}: Failed to preload TTS`;
        recordFailure(errorMessage, isServiceError);
        throw new Error(errorMessage);
      }

      const audioBlob = await response.blob();
      
      // Convert to data URL instead of blob URL for better stability
      // Data URLs don't have CSP issues and can't be revoked
      const audioUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      evictOldestIfNeeded();

      cacheRef.current.set(questionId, {
        questionId,
        audioBlob,
        audioUrl,
        status: "ready",
        timestamp: Date.now(),
      });

      // Complete progress animation
      completeProgress(questionId);

      // Update preloaded state (triggers re-render)
      setPreloadedIds(prev => new Set(prev).add(questionId));
      
      // Record success to circuit breaker
      recordSuccess();

      console.log(`[TTS] ✓ Cached: ${questionId.slice(0, 8)}...`);
    } catch (err) {
      clearTimeout(timeoutId);
      
      const isAbort = err instanceof Error && err.name === "AbortError";
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (!isAbort) {
        console.error("[TTS] Preload error:", err);
        // Record failure for network errors (not already recorded for HTTP errors)
        if (!errorMessage.startsWith("HTTP ")) {
          const isNetworkError = isAbort || 
            errorMessage.includes("fetch") || 
            errorMessage.includes("network") ||
            errorMessage.includes("timeout");
          recordFailure(errorMessage, isNetworkError);
        }
      } else {
        console.log(`[TTS] Preload aborted/timed out for ${questionId.slice(0, 8)}...`);
        // Timeouts are considered network errors for circuit breaker
        recordFailure("Request timed out", true);
      }
      
      // Clear progress interval on error or abort
      const interval = progressIntervalsRef.current.get(questionId);
      if (interval) {
        clearInterval(interval);
        progressIntervalsRef.current.delete(questionId);
      }
      
      // Clear progress state on error or abort
      setLoadingProgress(prev => {
        const next = new Map(prev);
        next.delete(questionId);
        return next;
      });
    } finally {
      loadingRef.current.delete(questionId);
      // Update loading state (triggers re-render)
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
      // Process more from queue
      processQueue();
    }
  };

  // Main preload function - adds to queue with priority
  const preload = useCallback((questionId: string, title: string, content: string, priority: number = 5) => {
    // Already cached
    if (cacheRef.current.has(questionId)) {
      return;
    }
    
    // Already in queue
    const existingIndex = queueRef.current.findIndex(item => item.id === questionId);
    if (existingIndex >= 0) {
      // Update priority if higher
      if (priority > queueRef.current[existingIndex].priority) {
        queueRef.current[existingIndex].priority = priority;
      }
      return;
    }

    // Add to queue with separate title and content
    queueRef.current.push({ id: questionId, title, content, priority });
    processQueue();
  }, [processQueue]);

  // Preload immediately (bypasses queue for high-priority items)
  const preloadImmediate = useCallback(async (questionId: string, title: string, content: string) => {
    if (cacheRef.current.has(questionId)) {
      return;
    }
    if (loadingRef.current.has(questionId)) {
      return;
    }
    
    // Check circuit breaker before immediate preload
    if (!checkCircuit()) {
      console.log(`[TTS] Circuit breaker open, skipping immediate preload for ${questionId.slice(0, 8)}...`);
      return;
    }
    
    await loadSingleAudio(questionId, title, content);
  }, [checkCircuit]);

  // Batch preload multiple questions
  const preloadBatch = useCallback((questions: { id: string; title: string; content: string }[], basePriority: number = 3) => {
    questions.forEach((q, index) => {
      // Higher priority for earlier items in the batch
      const priority = basePriority - Math.floor(index / 2);
      preload(q.id, q.title, q.content, Math.max(1, priority));
    });
  }, [preload]);

  // Preload adjacent questions (for navigation)
  const preloadAdjacent = useCallback((
    questions: { id: string; title: string; prompt: string }[],
    currentIndex: number
  ) => {
    // Preload next 2 questions with high priority
    for (let i = 1; i <= 2; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < questions.length) {
        const q = questions[nextIndex];
        preload(q.id, q.title, q.prompt, 8 - i);
      }
    }
    
    // Preload previous question with medium priority
    if (currentIndex > 0) {
      const prevQ = questions[currentIndex - 1];
      preload(prevQ.id, prevQ.title, prevQ.prompt, 5);
    }
  }, [preload]);

  const getPreloadedAudio = useCallback((questionId: string): PreloadedAudio | null => {
    const cached = cacheRef.current.get(questionId);
    if (cached) {
      // Update timestamp on access (LRU)
      cached.timestamp = Date.now();
    }
    return cached || null;
  }, []);

  const isPreloaded = useCallback((questionId: string): boolean => {
    // Use reactive state for re-renders, fall back to ref for immediate checks
    return preloadedIds.has(questionId) || cacheRef.current.get(questionId)?.status === "ready";
  }, [preloadedIds]);

  const isLoading = useCallback((questionId: string): boolean => {
    // Use reactive state for re-renders
    return loadingIds.has(questionId);
  }, [loadingIds]);

  // Get loading progress for a question (0-100)
  const getProgress = useCallback((questionId: string): number => {
    return loadingProgress.get(questionId) ?? 0;
  }, [loadingProgress]);

  const clearCache = useCallback((questionId?: string) => {
    if (questionId) {
      const cached = cacheRef.current.get(questionId);
      // Only revoke blob URLs, not data URLs
      if (cached?.audioUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(cached.audioUrl);
      }
      cacheRef.current.delete(questionId);
      loadingRef.current.get(questionId)?.abort();
      loadingRef.current.delete(questionId);
      // Clear progress interval
      const interval = progressIntervalsRef.current.get(questionId);
      if (interval) {
        clearInterval(interval);
        progressIntervalsRef.current.delete(questionId);
      }
      // Update reactive state
      setPreloadedIds(prev => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
      setLoadingProgress(prev => {
        const next = new Map(prev);
        next.delete(questionId);
        return next;
      });
    } else {
      // Clear all
      cacheRef.current.forEach((audio) => {
        // Only revoke blob URLs, not data URLs
        if (audio.audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audio.audioUrl);
      });
      cacheRef.current.clear();
      loadingRef.current.forEach((controller) => controller.abort());
      loadingRef.current.clear();
      queueRef.current = [];
      // Clear all progress intervals
      progressIntervalsRef.current.forEach((interval) => clearInterval(interval));
      progressIntervalsRef.current.clear();
      // Clear reactive state
      setPreloadedIds(new Set());
      setLoadingIds(new Set());
      setLoadingProgress(new Map());
    }
  }, []);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(cleanupExpiredCache, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [cleanupExpiredCache]);

  // Cleanup all intervals on unmount
  useEffect(() => {
    return () => {
      progressIntervalsRef.current.forEach((interval) => clearInterval(interval));
      progressIntervalsRef.current.clear();
    };
  }, []);

  return {
    preload,
    preloadImmediate,
    preloadBatch,
    preloadAdjacent,
    getPreloadedAudio,
    isPreloaded,
    isLoading,
    getProgress,
    clearCache,
    // Circuit breaker status and controls
    serviceStatus,
    resetCircuitBreaker,
  };
}
