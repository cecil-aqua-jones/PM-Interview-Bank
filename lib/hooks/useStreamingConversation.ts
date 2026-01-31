"use client";

import { useState, useCallback, useRef } from "react";

type StreamEvent = 
  | { type: "token"; content: string }
  | { type: "audio"; index: number; sentence: string; audio: string }
  | { type: "skip"; index: number }
  | { type: "done"; fullText: string }
  | { error: string };

type ConversationMessage = {
  role: "interviewer" | "candidate";
  content: string;
  timestamp?: number;
};

type StreamingState = {
  isStreaming: boolean;
  currentText: string;
  error: string | null;
};

type AudioQueueItem = {
  index: number;
  sentence: string;
  audioBase64: string;
};

/**
 * Hook for streaming conversation with sentence-based TTS
 * 
 * Benefits:
 * - Text appears in real-time as the LLM generates
 * - First sentence audio starts playing while LLM is still generating
 * - Subsequent audio is queued and plays in order
 * - Reduces perceived latency by 50-70%
 */
export function useStreamingConversation() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    currentText: "",
    error: null,
  });
  
  // Track playing state with both ref (for internal logic) and state (for re-renders)
  const [isPlayingState, setIsPlayingState] = useState(false);

  const audioQueueRef = useRef<AudioQueueItem[]>([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const nextExpectedIndexRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const totalAudioCountRef = useRef(0);
  const playedAudioCountRef = useRef(0);

  // Timeout ref for skipping missing audio chunks
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track indices that server explicitly told us to skip (TTS failed)
  const skippedIndicesRef = useRef<Set<number>>(new Set());

  /**
   * Play next audio in queue (in order)
   * If the expected index isn't available but higher indices are, schedule a skip after timeout
   */
  const playNextInQueue = useCallback(() => {
    // Clear any pending skip timeout
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = null;
    }

    if (isPlayingRef.current) {
      console.log("[StreamConvo] playNextInQueue: already playing, skipping");
      return;
    }
    
    // Skip past any indices that server told us to skip
    while (skippedIndicesRef.current.has(nextExpectedIndexRef.current)) {
      console.log(`[StreamConvo] Skipping server-marked index ${nextExpectedIndexRef.current}`);
      skippedIndicesRef.current.delete(nextExpectedIndexRef.current);
      nextExpectedIndexRef.current++;
    }
    
    if (audioQueueRef.current.length === 0) {
      console.log("[StreamConvo] playNextInQueue: queue empty");
      return;
    }

    // Sort queue by index to ensure correct order
    audioQueueRef.current.sort((a, b) => a.index - b.index);

    // Check if next expected audio is ready
    const nextItem = audioQueueRef.current[0];
    if (nextItem.index !== nextExpectedIndexRef.current) {
      console.log(`[StreamConvo] playNextInQueue: waiting for index ${nextExpectedIndexRef.current}, have ${nextItem.index}`);
      
      // If we have a later index but not the expected one, set a timeout to skip
      // This handles cases where TTS fails for a sentence on the server
      if (nextItem.index > nextExpectedIndexRef.current) {
        skipTimeoutRef.current = setTimeout(() => {
          console.log(`[StreamConvo] Timeout - skipping missing index ${nextExpectedIndexRef.current}`);
          nextExpectedIndexRef.current = nextItem.index;
          playNextInQueue();
        }, 2000); // 2 second timeout to skip missing chunks
      }
      return;
    }

    // Remove from queue and play
    audioQueueRef.current.shift();
    isPlayingRef.current = true;
    setIsPlayingState(true);
    nextExpectedIndexRef.current++;

    console.log(`[StreamConvo] Playing audio ${nextItem.index}: "${nextItem.sentence.slice(0, 30)}..."`);
    const audioUrl = `data:audio/wav;base64,${nextItem.audioBase64}`;
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;

    audio.addEventListener("ended", () => {
      console.log(`[StreamConvo] Audio ${nextItem.index} ended, played ${playedAudioCountRef.current + 1}/${totalAudioCountRef.current}`);
      playedAudioCountRef.current++;
      isPlayingRef.current = false;
      setIsPlayingState(false);
      currentAudioRef.current = null;
      // Small delay before playing next to ensure clean transition
      setTimeout(() => playNextInQueue(), 50);
    });

    audio.addEventListener("error", (e) => {
      console.error(`[StreamConvo] Audio ${nextItem.index} error:`, e);
      playedAudioCountRef.current++;
      isPlayingRef.current = false;
      setIsPlayingState(false);
      currentAudioRef.current = null;
      playNextInQueue();
    });

    // Wait for audio to be ready before playing
    audio.addEventListener("canplaythrough", () => {
      console.log(`[StreamConvo] Audio ${nextItem.index} ready to play`);
      audio.play().catch((err) => {
        console.error(`[StreamConvo] Audio ${nextItem.index} play failed:`, err);
        isPlayingRef.current = false;
        setIsPlayingState(false);
        currentAudioRef.current = null;
        playNextInQueue();
      });
    }, { once: true });

    // Fallback: if canplaythrough doesn't fire in 3s, try playing anyway
    setTimeout(() => {
      if (currentAudioRef.current === audio && audio.paused) {
        console.log(`[StreamConvo] Audio ${nextItem.index} fallback play attempt`);
        audio.play().catch((err) => {
          console.error(`[StreamConvo] Audio ${nextItem.index} fallback play failed:`, err);
          isPlayingRef.current = false;
          setIsPlayingState(false);
          currentAudioRef.current = null;
          playNextInQueue();
        });
      }
    }, 3000);

    // Start loading
    audio.load();
  }, []);

  /**
   * Stop all audio and clear queue
   */
  const stopAudio = useCallback(() => {
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsPlayingState(false);
    nextExpectedIndexRef.current = 0;
    totalAudioCountRef.current = 0;
    playedAudioCountRef.current = 0;
    skippedIndicesRef.current.clear();
  }, []);

  /**
   * Abort current stream
   */
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopAudio();
    setState(prev => ({ ...prev, isStreaming: false }));
  }, [stopAudio]);

  /**
   * Wait for all audio to finish playing.
   * 
   * This method polls the internal refs directly (not stale state) to accurately
   * detect when all audio has finished. Use this instead of checking isPlaying
   * which can be stale due to React's ref behavior.
   * 
   * @param timeoutMs - Maximum time to wait (default 60s)
   * @returns Promise that resolves when all audio is done, or rejects on timeout
   */
  const waitForCompletion = useCallback((timeoutMs: number = 60000): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        // Check timeout
        if (Date.now() - startTime > timeoutMs) {
          console.warn("[StreamConvo] waitForCompletion timed out");
          reject(new Error("Audio playback timeout"));
          return;
        }
        
        // Read refs directly for current values (not stale state)
        const queueEmpty = audioQueueRef.current.length === 0;
        const notPlaying = !isPlayingRef.current;
        const totalExpected = totalAudioCountRef.current;
        const totalPlayed = playedAudioCountRef.current;
        const skippedCount = skippedIndicesRef.current.size;
        
        // All audio is complete when:
        // 1. Queue is empty (no pending audio)
        // 2. Not currently playing
        // 3. All expected audio has been played (accounting for skipped)
        const allProcessed = totalExpected === 0 || 
          (totalPlayed + skippedCount >= totalExpected);
        
        console.log(`[StreamConvo] waitForCompletion check: queue=${audioQueueRef.current.length}, playing=${isPlayingRef.current}, played=${totalPlayed}/${totalExpected}, skipped=${skippedCount}`);
        
        if (queueEmpty && notPlaying && allProcessed) {
          console.log("[StreamConvo] waitForCompletion: all audio finished");
          resolve();
        } else {
          // Check again in 100ms
          setTimeout(check, 100);
        }
      };
      
      // Start checking after a brief delay to allow state to settle
      setTimeout(check, 100);
    });
  }, []);

  /**
   * Send a message and stream the response
   */
  const sendMessage = useCallback(async (params: {
    questionTitle: string;
    questionContent: string;
    userMessage: string;
    conversationHistory: ConversationMessage[];
    code?: string;
    language?: string;
    evaluation?: unknown;
    interviewState?: string;
  }): Promise<{ fullText: string } | null> => {
    // Reset state
    stopAudio();
    nextExpectedIndexRef.current = 0;
    totalAudioCountRef.current = 0;
    playedAudioCountRef.current = 0;
    setState({ isStreaming: true, currentText: "", error: null });

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/interview/converse-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Stream request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = ""; // Buffer for incomplete SSE lines

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append new data to buffer and split by newlines
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (!data || data === "[DONE]") continue;

            try {
              const event: StreamEvent = JSON.parse(data);

              if ("error" in event) {
                setState(prev => ({ ...prev, error: event.error }));
                continue;
              }

              switch (event.type) {
                case "token":
                  fullText += event.content;
                  setState(prev => ({ 
                    ...prev, 
                    currentText: prev.currentText + event.content 
                  }));
                  break;

                case "audio":
                  // Add to queue and try to play
                  console.log(`[StreamConvo] Audio ${event.index} received: "${event.sentence.slice(0, 30)}..." (queue: ${audioQueueRef.current.length}, expected: ${nextExpectedIndexRef.current})`);
                  audioQueueRef.current.push({
                    index: event.index,
                    sentence: event.sentence,
                    audioBase64: event.audio,
                  });
                  totalAudioCountRef.current = Math.max(totalAudioCountRef.current, event.index + 1);
                  playNextInQueue();
                  break;

                case "skip":
                  // Server couldn't generate TTS for this sentence, mark it for skipping
                  console.log(`[StreamConvo] Skip event received for index ${event.index} (expected: ${nextExpectedIndexRef.current})`);
                  skippedIndicesRef.current.add(event.index);
                  totalAudioCountRef.current = Math.max(totalAudioCountRef.current, event.index + 1);
                  // Try to play - this will skip past any marked indices
                  playNextInQueue();
                  break;

                case "done":
                  console.log(`[StreamConvo] Done event received. Total audio: ${totalAudioCountRef.current}, skipped: ${skippedIndicesRef.current.size}`);
                  fullText = event.fullText;
                  setState(prev => ({ 
                    ...prev, 
                    isStreaming: false,
                    currentText: event.fullText 
                  }));
                  return { fullText: event.fullText };
              }
            } catch (e) {
              // Skip invalid JSON
              console.warn("[StreamConvo] Failed to parse SSE event:", data.slice(0, 100));
            }
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim() && buffer.startsWith("data: ")) {
        const data = buffer.slice(6);
        if (data && data !== "[DONE]") {
          try {
            const event: StreamEvent = JSON.parse(data);
            if (!("error" in event) && event.type === "audio") {
              console.log(`[StreamConvo] Final buffer audio ${event.index} received`);
              audioQueueRef.current.push({
                index: event.index,
                sentence: event.sentence,
                audioBase64: event.audio,
              });
              totalAudioCountRef.current = Math.max(totalAudioCountRef.current, event.index + 1);
              playNextInQueue();
            }
          } catch (e) {
            console.warn("[StreamConvo] Failed to parse final buffer:", buffer.slice(0, 100));
          }
        }
      }

      setState(prev => ({ ...prev, isStreaming: false }));
      return { fullText };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return null;
      }
      console.error("[StreamingConversation] Error:", error);
      setState(prev => ({ 
        ...prev, 
        isStreaming: false, 
        error: "Failed to get response" 
      }));
      return null;
    }
  }, [playNextInQueue, stopAudio]);

  return {
    sendMessage,
    abort,
    stopAudio,
    waitForCompletion,
    isStreaming: state.isStreaming,
    currentText: state.currentText,
    error: state.error,
    isPlaying: isPlayingState,  // Use state for re-renders, not stale ref
  };
}
