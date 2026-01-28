"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";

type StreamEvent = {
  type: "info" | "audio" | "skip" | "done" | "error";
  totalSentences?: number;
  fullText?: string;
  index?: number;
  sentence?: string;
  audio?: string;
  error?: string;
};

type StreamingSpeechOptions = {
  onSentenceStart?: (index: number, sentence: string) => void;
  onSentenceEnd?: (index: number) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
};

/**
 * Hook for streaming TTS playback
 * 
 * Receives sentence-by-sentence audio from the speak-stream API
 * and plays them sequentially for seamless speech.
 */
export function useStreamingSpeech(options: StreamingSpeechOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentence, setCurrentSentence] = useState<number>(-1);
  const [totalSentences, setTotalSentences] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  
  const audioQueueRef = useRef<Array<{ index: number; audio: string; sentence: string }>>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const nextToPlayRef = useRef<number>(0);
  const receivedCountRef = useRef<number>(0);
  
  // Track indices that server explicitly told us to skip (TTS failed)
  const skippedIndicesRef = useRef<Set<number>>(new Set());
  
  // Timeout ref for skipping missing audio chunks
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store options in a ref to avoid dependency changes
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  /**
   * Play the next audio segment in the queue
   * Handles server-marked skip indices and timeout-based skipping
   */
  const playNextInQueue = useCallback(async () => {
    // Clear any pending skip timeout
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = null;
    }
    
    // Skip past any indices that server told us to skip
    while (skippedIndicesRef.current.has(nextToPlayRef.current)) {
      console.log(`[StreamingSpeech] Skipping server-marked index ${nextToPlayRef.current}`);
      skippedIndicesRef.current.delete(nextToPlayRef.current);
      nextToPlayRef.current++;
    }
    
    // Find the next expected segment
    const nextIndex = nextToPlayRef.current;
    const nextItem = audioQueueRef.current.find(item => item.index === nextIndex);
    
    if (!nextItem) {
      // Segment not ready yet - check if we have higher indices
      const hasLaterSegments = audioQueueRef.current.some(item => item.index > nextIndex);
      if (hasLaterSegments) {
        // Set timeout to skip this index if it doesn't arrive
        console.log(`[StreamingSpeech] Waiting for index ${nextIndex}, have later segments`);
        skipTimeoutRef.current = setTimeout(() => {
          console.log(`[StreamingSpeech] Timeout - skipping missing index ${nextIndex}`);
          nextToPlayRef.current = nextIndex + 1;
          playNextInQueue();
        }, 2000);
      }
      return;
    }
    
    // Remove from queue
    audioQueueRef.current = audioQueueRef.current.filter(item => item.index !== nextIndex);
    nextToPlayRef.current = nextIndex + 1;
    
    setCurrentSentence(nextItem.index);
    optionsRef.current.onSentenceStart?.(nextItem.index, nextItem.sentence);
    
    try {
      // Create audio from base64 (WAV format from Cartesia Sonic-3 TTS)
      const audioBlob = new Blob(
        [Uint8Array.from(atob(nextItem.audio), c => c.charCodeAt(0))],
        { type: "audio/wav" }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      console.log(`[StreamingSpeech] Playing audio ${nextItem.index}: "${nextItem.sentence.slice(0, 30)}..."`);
      
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          optionsRef.current.onSentenceEnd?.(nextItem.index);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          reject(new Error("Audio playback failed"));
        };
        audio.play().catch(reject);
      });
      
      // Update progress
      const total = totalSentences || receivedCountRef.current;
      if (total > 0) {
        setProgress(((nextItem.index + 1) / total) * 100);
      }
      
      // Play next segment
      if (isPlayingRef.current) {
        playNextInQueue();
      }
    } catch (err) {
      console.error("[StreamingSpeech] Playback error:", err);
      // Try to continue with next segment
      if (isPlayingRef.current) {
        playNextInQueue();
      }
    }
  }, [totalSentences]);

  /**
   * Start streaming speech for a question
   */
  const speak = useCallback(async (
    questionTitle: string,
    questionContent: string,
    category?: string
  ) => {
    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear any pending skip timeout
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = null;
    }
    
    // Reset state
    audioQueueRef.current = [];
    nextToPlayRef.current = 0;
    receivedCountRef.current = 0;
    skippedIndicesRef.current.clear();
    setIsPlaying(true);
    setCurrentSentence(-1);
    setTotalSentences(0);
    setProgress(0);
    isPlayingRef.current = true;
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch("/api/interview/speak-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionTitle, questionContent, category }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok || !response.body) {
        throw new Error("Failed to start speech stream");
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      
      while (isPlayingRef.current) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));
              
              switch (event.type) {
                case "info":
                  if (event.totalSentences) {
                    setTotalSentences(event.totalSentences);
                  }
                  break;
                  
                case "audio":
                  if (event.audio && event.sentence !== undefined && event.index !== undefined) {
                    console.log(`[StreamingSpeech] Audio ${event.index} received: "${event.sentence.slice(0, 30)}..."`);
                    receivedCountRef.current++;
                    audioQueueRef.current.push({
                      index: event.index,
                      audio: event.audio,
                      sentence: event.sentence,
                    });
                    
                    // If this is the first or next expected segment, start playing
                    if (event.index === nextToPlayRef.current && !currentAudioRef.current?.played.length) {
                      playNextInQueue();
                    } else if (!currentAudioRef.current || currentAudioRef.current.ended) {
                      // Audio finished, check if we can play next
                      playNextInQueue();
                    }
                  }
                  break;
                
                case "skip":
                  // Server couldn't generate TTS for this sentence, mark for skipping
                  if (event.index !== undefined) {
                    console.log(`[StreamingSpeech] Skip event for index ${event.index}`);
                    skippedIndicesRef.current.add(event.index);
                    receivedCountRef.current++; // Count skipped as "received" for progress
                    // Try to play - this will skip past marked indices
                    playNextInQueue();
                  }
                  break;
                  
                case "done":
                  console.log(`[StreamingSpeech] Done event received. Total: ${totalSentences}, skipped: ${skippedIndicesRef.current.size}`);
                  // Stream complete, let remaining audio play out
                  break;
                  
                case "error":
                  throw new Error(event.error || "Stream error");
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      
      // Wait for all audio to finish playing
      while (isPlayingRef.current && (audioQueueRef.current.length > 0 || currentAudioRef.current?.paused === false)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (isPlayingRef.current) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setProgress(100);
        optionsRef.current.onComplete?.();
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("[StreamingSpeech] Aborted");
      } else {
        console.error("[StreamingSpeech] Error:", err);
        optionsRef.current.onError?.(err instanceof Error ? err.message : "Speech failed");
      }
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, [playNextInQueue]);

  /**
   * Stop playback and abort stream
   */
  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    
    // Clear any pending skip timeout
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    audioQueueRef.current = [];
    skippedIndicesRef.current.clear();
  }, []);

  // Memoize return object to prevent unnecessary re-renders in consumers
  return useMemo(() => ({
    speak,
    stop,
    isPlaying,
    currentSentence,
    totalSentences,
    progress,
  }), [speak, stop, isPlaying, currentSentence, totalSentences, progress]);
}
