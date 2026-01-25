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
const MAX_CONCURRENT_PRELOADS = 3;
// Maximum cache size (will evict oldest entries)
const MAX_CACHE_SIZE = 20;
// Cache expiry time (30 minutes)
const CACHE_EXPIRY_MS = 30 * 60 * 1000;
// Estimated TTS generation time in ms (for progress simulation)
const ESTIMATED_TTS_TIME_MS = 3000;

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
 */
export function useTTSPreloader() {
  const cacheRef = useRef<Map<string, PreloadedAudio>>(new Map());
  const loadingRef = useRef<Map<string, AbortController>>(new Map());
  const queueRef = useRef<{ id: string; title: string; content: string; priority: number }[]>([]);
  const isProcessingRef = useRef(false);
  const progressIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Reactive state to trigger re-renders when preload status changes
  const [preloadedIds, setPreloadedIds] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  // Track loading progress (0-100) for each question
  const [loadingProgress, setLoadingProgress] = useState<Map<string, number>>(new Map());

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

    isProcessingRef.current = true;

    // Sort by priority (higher = more important)
    queueRef.current.sort((a, b) => b.priority - a.priority);

    while (
      queueRef.current.length > 0 &&
      loadingRef.current.size < MAX_CONCURRENT_PRELOADS
    ) {
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
  }, []);

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

    const abortController = new AbortController();
    loadingRef.current.set(questionId, abortController);
    
    // Update loading state (triggers re-render)
    setLoadingIds(prev => new Set(prev).add(questionId));
    
    // Start progress simulation
    startProgressSimulation(questionId);

    try {
      const response = await fetch("/api/interview/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send title and content separately for proper introduction formatting
        body: JSON.stringify({ questionTitle, questionContent }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to preload TTS");
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

      console.log(`[TTS] ✓ Cached: ${questionId.slice(0, 8)}...`);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("[TTS] Preload error:", err);
      // Clear progress on error
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
    
    await loadSingleAudio(questionId, title, content);
  }, []);

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
  };
}
