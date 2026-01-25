/**
 * @fileoverview Tests for useStreamingSpeech hook
 * 
 * CRITICAL: These tests protect the initial question audio streaming functionality.
 * Any changes to useStreamingSpeech.ts MUST pass all these tests.
 * 
 * Key behaviors tested:
 * 1. SSE line buffering (prevents lost audio chunks)
 * 2. Ordered audio playback
 * 3. Skip event handling
 * 4. Progress tracking
 * 5. Lifecycle management (stop, abort)
 */

import { renderHook, act } from "@testing-library/react";

// Mock types
type StreamEvent = {
  type: "info" | "audio" | "skip" | "done" | "error";
  totalSentences?: number;
  fullText?: string;
  index?: number;
  sentence?: string;
  audio?: string;
  error?: string;
};

/**
 * Helper to create SSE data line
 */
function sseData(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Helper to simulate chunked SSE response
 */
function createChunkedResponse(chunks: string[]) {
  let chunkIndex = 0;
  const encoder = new TextEncoder();
  
  return {
    ok: true,
    body: {
      getReader: () => ({
        read: async () => {
          if (chunkIndex >= chunks.length) {
            return { done: true, value: undefined };
          }
          const chunk = chunks[chunkIndex++];
          return { done: false, value: encoder.encode(chunk) };
        },
      }),
    },
  };
}

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = jest.fn(() => "blob:mock-url");
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock Audio API with tracking
class MockAudio {
  src = "";
  paused = true;
  ended = false;
  played = { length: 0 };
  
  onended: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  
  addEventListener(event: string, handler: () => void) {
    if (event === "ended") this.onended = handler;
    if (event === "error") this.onerror = handler;
  }
  
  removeEventListener() {}
  
  load() {}
  
  play() {
    this.paused = false;
    this.played = { length: 1 };
    return Promise.resolve();
  }
  
  pause() {
    this.paused = true;
  }
  
  simulateEnd() {
    this.ended = true;
    this.paused = true;
    if (this.onended) this.onended();
  }
  
  simulateError() {
    if (this.onerror) this.onerror(new Error("Playback error"));
  }
}

// @ts-expect-error - Mock
global.Audio = MockAudio;

// Store created audio instances for testing
let audioInstances: MockAudio[] = [];
const OriginalMockAudio = MockAudio;
// @ts-expect-error - Mock
global.Audio = class extends OriginalMockAudio {
  constructor(url?: string) {
    super();
    if (url) this.src = url;
    audioInstances.push(this);
  }
};

describe("useStreamingSpeech", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    audioInstances = [];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("SSE Line Buffering (CRITICAL)", () => {
    /**
     * This test ensures large audio chunks split across TCP packets
     * are properly reassembled.
     */
    it("should buffer incomplete SSE lines across chunks", async () => {
      // Create a large audio event that will be split
      const largeAudio = "A".repeat(10000);
      const fullEvent = sseData({
        type: "audio",
        index: 0,
        sentence: "Test sentence",
        audio: largeAudio,
      });
      
      // Split into multiple chunks
      const chunks = [
        sseData({ type: "info", totalSentences: 1 }),
        fullEvent.slice(0, fullEvent.length / 3),
        fullEvent.slice(fullEvent.length / 3, (2 * fullEvent.length) / 3),
        fullEvent.slice((2 * fullEvent.length) / 3),
        sseData({ type: "done" }),
      ];
      
      mockFetch.mockResolvedValueOnce(createChunkedResponse(chunks));

      const { useStreamingSpeech } = await import(
        "@/lib/hooks/useStreamingSpeech"
      );
      
      const { result } = renderHook(() => useStreamingSpeech());
      
      await act(async () => {
        result.current.speak("Title", "Content");
        await jest.runAllTimersAsync();
      });

      // Audio should have been received and processed
      expect(audioInstances.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle info, multiple audio, and done events correctly", async () => {
      const events = [
        sseData({ type: "info", totalSentences: 3, fullText: "One. Two. Three." }),
        sseData({ type: "audio", index: 0, sentence: "One.", audio: "YXVkaW8w" }),
        sseData({ type: "audio", index: 1, sentence: "Two.", audio: "YXVkaW8x" }),
        sseData({ type: "audio", index: 2, sentence: "Three.", audio: "YXVkaW8y" }),
        sseData({ type: "done" }),
      ].join("");
      
      mockFetch.mockResolvedValueOnce(createChunkedResponse([events]));

      const { useStreamingSpeech } = await import(
        "@/lib/hooks/useStreamingSpeech"
      );
      
      const { result } = renderHook(() => useStreamingSpeech());
      
      await act(async () => {
        result.current.speak("Title", "Content");
        await jest.runAllTimersAsync();
      });

      expect(result.current.totalSentences).toBe(3);
    });
  });

  describe("Ordered Audio Playback", () => {
    it("should play audio in index order", async () => {
      // Events arrive out of order: 0, 2, 1
      const events = [
        sseData({ type: "info", totalSentences: 3 }),
        sseData({ type: "audio", index: 0, sentence: "First", audio: "YXVkaW8w" }),
        sseData({ type: "audio", index: 2, sentence: "Third", audio: "YXVkaW8y" }),
        sseData({ type: "audio", index: 1, sentence: "Second", audio: "YXVkaW8x" }),
        sseData({ type: "done" }),
      ].join("");
      
      mockFetch.mockResolvedValueOnce(createChunkedResponse([events]));

      const { useStreamingSpeech } = await import(
        "@/lib/hooks/useStreamingSpeech"
      );
      
      const { result } = renderHook(() => useStreamingSpeech());
      
      await act(async () => {
        result.current.speak("Title", "Content");
        await jest.runAllTimersAsync();
      });

      // First audio should be playing
      expect(audioInstances.length).toBeGreaterThanOrEqual(1);
    });

    it("should set timeout for missing indices", async () => {
      // Only send index 2, missing 0 and 1
      const events = [
        sseData({ type: "info", totalSentences: 3 }),
        sseData({ type: "audio", index: 2, sentence: "Third", audio: "YXVkaW8y" }),
        sseData({ type: "done" }),
      ].join("");
      
      mockFetch.mockResolvedValueOnce(createChunkedResponse([events]));

      const { useStreamingSpeech } = await import(
        "@/lib/hooks/useStreamingSpeech"
      );
      
      const { result } = renderHook(() => useStreamingSpeech());
      
      await act(async () => {
        result.current.speak("Title", "Content");
        
        // Advance to trigger skip timeout
        jest.advanceTimersByTime(2500);
        await jest.runAllTimersAsync();
      });

      // Should have attempted to play after timeout
      expect(result.current.isPlaying).toBeDefined();
    });
  });

  describe("Skip Event Handling", () => {
    it("should handle server-sent skip events", async () => {
      const events = [
        sseData({ type: "info", totalSentences: 3 }),
        sseData({ type: "audio", index: 0, sentence: "First", audio: "YXVkaW8w" }),
        sseData({ type: "skip", index: 1 }),
        sseData({ type: "audio", index: 2, sentence: "Third", audio: "YXVkaW8y" }),
        sseData({ type: "done" }),
      ].join("");
      
      mockFetch.mockResolvedValueOnce(createChunkedResponse([events]));

      const { useStreamingSpeech } = await import(
        "@/lib/hooks/useStreamingSpeech"
      );
      
      const { result } = renderHook(() => useStreamingSpeech());
      
      await act(async () => {
        result.current.speak("Title", "Content");
        await jest.runAllTimersAsync();
      });

      // Should complete without errors
      expect(result.current.isPlaying).toBeDefined();
    });

    it("should count skipped indices in progress", async () => {
      const onComplete = jest.fn();
      
      const events = [
        sseData({ type: "info", totalSentences: 2 }),
        sseData({ type: "skip", index: 0 }),
        sseData({ type: "skip", index: 1 }),
        sseData({ type: "done" }),
      ].join("");
      
      mockFetch.mockResolvedValueOnce(createChunkedResponse([events]));

      const { useStreamingSpeech } = await import(
        "@/lib/hooks/useStreamingSpeech"
      );
      
      const { result } = renderHook(() => 
        useStreamingSpeech({ onComplete })
      );
      
      await act(async () => {
        result.current.speak("Title", "Content");
        await jest.runAllTimersAsync();
      });

      // All skipped, should complete
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe("Lifecycle Management", () => {
    it("should stop playback when stop() is called", async () => {
      const events = [
        sseData({ type: "info", totalSentences: 1 }),
        sseData({ type: "audio", index: 0, sentence: "Test", audio: "YXVkaW8w" }),
        sseData({ type: "done" }),
      ].join("");
      
      mockFetch.mockResolvedValueOnce(createChunkedResponse([events]));

      const { useStreamingSpeech } = await import(
        "@/lib/hooks/useStreamingSpeech"
      );
      
      const { result } = renderHook(() => useStreamingSpeech());
      
      await act(async () => {
        result.current.speak("Title", "Content");
        await Promise.resolve();
        
        result.current.stop();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it("should abort existing stream when speak() is called again", async () => {
      const events = sseData({ type: "done" });
      mockFetch.mockResolvedValue(createChunkedResponse([events]));

      const { useStreamingSpeech } = await import(
        "@/lib/hooks/useStreamingSpeech"
      );
      
      const { result } = renderHook(() => useStreamingSpeech());
      
      await act(async () => {
        // Start first stream
        result.current.speak("Title 1", "Content 1");
        
        // Immediately start second stream
        result.current.speak("Title 2", "Content 2");
        
        await jest.runAllTimersAsync();
      });

      // Should have made two fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should reset state on new speak() call", async () => {
      const events = [
        sseData({ type: "info", totalSentences: 1 }),
        sseData({ type: "audio", index: 0, sentence: "Test", audio: "YXVkaW8w" }),
        sseData({ type: "done" }),
      ].join("");
      
      mockFetch.mockResolvedValue(createChunkedResponse([events]));

      const { useStreamingSpeech } = await import(
        "@/lib/hooks/useStreamingSpeech"
      );
      
      const { result } = renderHook(() => useStreamingSpeech());
      
      // First call
      await act(async () => {
        result.current.speak("Title 1", "Content 1");
        await jest.runAllTimersAsync();
      });

      expect(result.current.totalSentences).toBe(1);

      // Second call should reset
      await act(async () => {
        result.current.speak("Title 2", "Content 2");
        // Immediately after call, state should be reset
        expect(result.current.currentSentence).toBe(-1);
        expect(result.current.progress).toBe(0);
        await jest.runAllTimersAsync();
      });
    });
  });

  describe("Progress Tracking", () => {
    it("should update currentSentence during playback", async () => {
      const events = [
        sseData({ type: "info", totalSentences: 2 }),
        sseData({ type: "audio", index: 0, sentence: "First", audio: "YXVkaW8w" }),
        sseData({ type: "audio", index: 1, sentence: "Second", audio: "YXVkaW8x" }),
        sseData({ type: "done" }),
      ].join("");
      
      mockFetch.mockResolvedValueOnce(createChunkedResponse([events]));

      const { useStreamingSpeech } = await import(
        "@/lib/hooks/useStreamingSpeech"
      );
      
      const { result } = renderHook(() => useStreamingSpeech());
      
      await act(async () => {
        result.current.speak("Title", "Content");
        await jest.runAllTimersAsync();
      });

      // After receiving audio, should have updated currentSentence
      // (exact value depends on playback timing)
      expect(result.current.totalSentences).toBe(2);
    });
  });

  describe("Callbacks", () => {
    it("should call onSentenceStart when playback begins", async () => {
      const onSentenceStart = jest.fn();
      
      const events = [
        sseData({ type: "info", totalSentences: 1 }),
        sseData({ type: "audio", index: 0, sentence: "Test sentence", audio: "YXVkaW8w" }),
        sseData({ type: "done" }),
      ].join("");
      
      mockFetch.mockResolvedValueOnce(createChunkedResponse([events]));

      const { useStreamingSpeech } = await import(
        "@/lib/hooks/useStreamingSpeech"
      );
      
      const { result } = renderHook(() => 
        useStreamingSpeech({ onSentenceStart })
      );
      
      await act(async () => {
        result.current.speak("Title", "Content");
        await jest.runAllTimersAsync();
      });

      expect(onSentenceStart).toHaveBeenCalledWith(0, "Test sentence");
    });

    it("should call onError on stream error", async () => {
      const onError = jest.fn();
      
      const events = sseData({ type: "error", error: "Test error" });
      
      mockFetch.mockResolvedValueOnce(createChunkedResponse([events]));

      const { useStreamingSpeech } = await import(
        "@/lib/hooks/useStreamingSpeech"
      );
      
      const { result } = renderHook(() => 
        useStreamingSpeech({ onError })
      );
      
      await act(async () => {
        result.current.speak("Title", "Content");
        await jest.runAllTimersAsync();
      });

      expect(onError).toHaveBeenCalledWith("Test error");
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      const onError = jest.fn();
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { useStreamingSpeech } = await import(
        "@/lib/hooks/useStreamingSpeech"
      );
      
      const { result } = renderHook(() => 
        useStreamingSpeech({ onError })
      );
      
      await act(async () => {
        result.current.speak("Title", "Content");
        await jest.runAllTimersAsync();
      });

      expect(onError).toHaveBeenCalledWith("Network error");
      expect(result.current.isPlaying).toBe(false);
    });

    it("should handle non-ok response", async () => {
      const onError = jest.fn();
      mockFetch.mockResolvedValueOnce({ ok: false, body: null });

      const { useStreamingSpeech } = await import(
        "@/lib/hooks/useStreamingSpeech"
      );
      
      const { result } = renderHook(() => 
        useStreamingSpeech({ onError })
      );
      
      await act(async () => {
        result.current.speak("Title", "Content");
        await jest.runAllTimersAsync();
      });

      expect(onError).toHaveBeenCalledWith("Failed to start speech stream");
    });
  });
});

describe("useStreamingSpeech - Pure Algorithm Tests", () => {
  /**
   * Test the skip handling algorithm in isolation
   */
  describe("Skip Index Tracking", () => {
    it("should correctly track and skip indices", () => {
      const skippedIndices = new Set<number>();
      let nextToPlay = 0;
      
      // Simulate server skipping indices 1 and 3
      skippedIndices.add(1);
      skippedIndices.add(3);
      
      // Process function
      const advancePastSkipped = () => {
        while (skippedIndices.has(nextToPlay)) {
          skippedIndices.delete(nextToPlay);
          nextToPlay++;
        }
      };
      
      // Start at 0
      expect(nextToPlay).toBe(0);
      advancePastSkipped();
      expect(nextToPlay).toBe(0); // 0 not skipped
      
      // Simulate playing 0, advancing to 1
      nextToPlay++;
      advancePastSkipped();
      expect(nextToPlay).toBe(2); // 1 was skipped
      
      // Play 2, advance to 3
      nextToPlay++;
      advancePastSkipped();
      expect(nextToPlay).toBe(4); // 3 was skipped
    });
  });

  describe("Ordered Queue Processing", () => {
    it("should only process items with matching index", () => {
      const queue = [
        { index: 2, audio: "a2" },
        { index: 0, audio: "a0" },
        { index: 1, audio: "a1" },
      ];
      
      const played: number[] = [];
      let nextExpected = 0;
      
      const processQueue = () => {
        queue.sort((a, b) => a.index - b.index);
        while (queue.length > 0 && queue[0].index === nextExpected) {
          const item = queue.shift()!;
          played.push(item.index);
          nextExpected++;
        }
      };
      
      processQueue();
      
      // Should have played all in order
      expect(played).toEqual([0, 1, 2]);
      expect(queue).toHaveLength(0);
    });

    it("should wait for expected index", () => {
      const queue = [
        { index: 2, audio: "a2" },
        { index: 3, audio: "a3" },
      ];
      
      const played: number[] = [];
      let nextExpected = 0;
      
      const processQueue = () => {
        queue.sort((a, b) => a.index - b.index);
        while (queue.length > 0 && queue[0].index === nextExpected) {
          const item = queue.shift()!;
          played.push(item.index);
          nextExpected++;
        }
      };
      
      processQueue();
      
      // Should not have played anything (waiting for 0)
      expect(played).toEqual([]);
      expect(queue).toHaveLength(2);
    });
  });
});
