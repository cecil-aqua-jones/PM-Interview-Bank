"use client";

import { useRef, useCallback, useEffect } from "react";

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

/**
 * Hook for aggressively preloading TTS audio for instant interview starts.
 * Features:
 * - Preloads selected question immediately
 * - Preloads adjacent questions (prev/next)
 * - Supports batch preloading
 * - LRU-style cache eviction
 * - Concurrent request limiting
 */
export function useTTSPreloader() {
  const cacheRef = useRef<Map<string, PreloadedAudio>>(new Map());
  const loadingRef = useRef<Map<string, AbortController>>(new Map());
  const queueRef = useRef<{ id: string; text: string; priority: number }[]>([]);
  const isProcessingRef = useRef(false);

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
      if (cached?.audioUrl) {
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
        if (cached?.audioUrl) {
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
      loadSingleAudio(item.id, item.text);
    }

    isProcessingRef.current = false;
  }, []);

  // Load a single audio file
  const loadSingleAudio = async (questionId: string, questionText: string) => {
    if (cacheRef.current.has(questionId) || loadingRef.current.has(questionId)) {
      return;
    }

    const abortController = new AbortController();
    loadingRef.current.set(questionId, abortController);

    try {
      const response = await fetch("/api/interview/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to preload TTS");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      evictOldestIfNeeded();

      cacheRef.current.set(questionId, {
        questionId,
        audioBlob,
        audioUrl,
        status: "ready",
        timestamp: Date.now(),
      });

      console.log(`[TTS] ✓ Cached: ${questionId.slice(0, 8)}...`);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("[TTS] Preload error:", err);
    } finally {
      loadingRef.current.delete(questionId);
      // Process more from queue
      processQueue();
    }
  };

  // Main preload function - adds to queue with priority
  const preload = useCallback((questionId: string, questionText: string, priority: number = 5) => {
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

    // Add to queue
    queueRef.current.push({ id: questionId, text: questionText, priority });
    processQueue();
  }, [processQueue]);

  // Preload immediately (bypasses queue for high-priority items)
  const preloadImmediate = useCallback(async (questionId: string, questionText: string) => {
    if (cacheRef.current.has(questionId)) {
      return;
    }
    if (loadingRef.current.has(questionId)) {
      return;
    }
    
    await loadSingleAudio(questionId, questionText);
  }, []);

  // Batch preload multiple questions
  const preloadBatch = useCallback((questions: { id: string; text: string }[], basePriority: number = 3) => {
    questions.forEach((q, index) => {
      // Higher priority for earlier items in the batch
      const priority = basePriority - Math.floor(index / 2);
      preload(q.id, q.text, Math.max(1, priority));
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
        preload(q.id, `${q.title}. ${q.prompt}`, 8 - i);
      }
    }
    
    // Preload previous question with medium priority
    if (currentIndex > 0) {
      const prevQ = questions[currentIndex - 1];
      preload(prevQ.id, `${prevQ.title}. ${prevQ.prompt}`, 5);
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
    const cached = cacheRef.current.get(questionId);
    return cached?.status === "ready";
  }, []);

  const isLoading = useCallback((questionId: string): boolean => {
    return loadingRef.current.has(questionId);
  }, []);

  const clearCache = useCallback((questionId?: string) => {
    if (questionId) {
      const cached = cacheRef.current.get(questionId);
      if (cached?.audioUrl) {
        URL.revokeObjectURL(cached.audioUrl);
      }
      cacheRef.current.delete(questionId);
      loadingRef.current.get(questionId)?.abort();
      loadingRef.current.delete(questionId);
    } else {
      // Clear all
      cacheRef.current.forEach((audio) => {
        if (audio.audioUrl) URL.revokeObjectURL(audio.audioUrl);
      });
      cacheRef.current.clear();
      loadingRef.current.forEach((controller) => controller.abort());
      loadingRef.current.clear();
      queueRef.current = [];
    }
  }, []);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(cleanupExpiredCache, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [cleanupExpiredCache]);

  return {
    preload,
    preloadImmediate,
    preloadBatch,
    preloadAdjacent,
    getPreloadedAudio,
    isPreloaded,
    isLoading,
    clearCache,
  };
}
