"use client";

import { useRef, useCallback, useState, useEffect } from "react";

/**
 * Configuration for Cartesia Live STT (ink-whisper)
 * 
 * Uses WebSocket connection for real-time transcription with ~200ms latency.
 * This is significantly faster than batch transcription APIs.
 */
const SAMPLE_RATE = 16000; // Required by Cartesia ink-whisper
const RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_ATTEMPTS = 3;

/**
 * Cartesia configuration response from our API
 */
interface CartesiaConfig {
  stt: {
    url: string;
    apiKey: string;
    config: {
      model: string;
      language: string;
      sample_rate: number;
      encoding: string;
      min_volume: number;
      max_silence_duration_secs: number;
    };
  };
  session: {
    id: string;
    createdAt: string;
    expiresAt: string;
  };
}

/**
 * Transcript result from Cartesia ink-whisper
 */
interface CartesiaTranscriptResult {
  type: "transcript" | "flush_done" | "done" | "error";
  text?: string;
  is_final?: boolean;
  duration?: number;
  language?: string;
  request_id?: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
  error?: string;
}

/**
 * Hook for real-time progressive transcription using Cartesia WebSocket
 * 
 * Provides live transcription as the user speaks with ~200ms latency.
 * 
 * Features:
 * - Real-time interim results (updates as user speaks)
 * - Final transcripts on speech boundaries
 * - Automatic reconnection on disconnect
 * - Efficient audio format conversion
 */
export function useProgressiveTranscription() {
  // State
  const [partialTranscript, setPartialTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const configRef = useRef<CartesiaConfig | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const transcriptPartsRef = useRef<string[]>([]);

  /**
   * Fetch Cartesia configuration from our API
   */
  const fetchConfig = useCallback(async (): Promise<CartesiaConfig> => {
    const response = await fetch("/api/interview/voice-agent");
    if (!response.ok) {
      throw new Error("Failed to get voice agent configuration");
    }
    return response.json();
  }, []);

  /**
   * Handle WebSocket messages from Cartesia
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: CartesiaTranscriptResult = JSON.parse(event.data);
      
      if (data.type === "transcript") {
        const transcript = data.text || "";
        const isFinal = data.is_final || false;

        if (transcript) {
          if (isFinal) {
            // Final transcript - add to accumulated transcript
            transcriptPartsRef.current.push(transcript);
            const combined = transcriptPartsRef.current.join(" ");
            setPartialTranscript(combined);
            setInterimTranscript("");
            
            console.log(`[Cartesia] Final: "${transcript}"`);
          } else {
            // Interim result - show in progress
            setInterimTranscript(transcript);
            console.log(`[Cartesia] Interim: "${transcript.slice(0, 30)}..."`);
          }
        }
      } else if (data.type === "flush_done") {
        console.log("[Cartesia] Flush done (finalize acknowledged)");
      } else if (data.type === "done") {
        console.log("[Cartesia] Stream done");
      } else if (data.type === "error") {
        console.error("[Cartesia] Error:", data.error);
        setError(new Error(data.error || "Cartesia error"));
      }
    } catch (err) {
      console.error("[Cartesia] Failed to parse message:", err);
    }
  }, []);

  /**
   * Connect to Cartesia WebSocket
   */
  const connectWebSocket = useCallback(async (): Promise<boolean> => {
    try {
      // Fetch configuration from our API
      const config = await fetchConfig();
      configRef.current = config;

      console.log("[Cartesia] Connecting to WebSocket...");

      // Create WebSocket connection to Cartesia
      // Auth is included in the URL query params
      const ws = new WebSocket(config.stt.url);
      wsRef.current = ws;

      return new Promise((resolve) => {
        ws.onopen = () => {
          console.log("[Cartesia] WebSocket connected");
          setIsConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
          resolve(true);
        };

        ws.onclose = (event) => {
          console.log("[Cartesia] WebSocket closed:", event.code, event.reason);
          setIsConnected(false);

          // Attempt reconnection for unexpected closes
          if (event.code !== 1000 && isProcessing && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            console.log(`[Cartesia] Reconnecting (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
            setTimeout(() => connectWebSocket(), RECONNECT_DELAY_MS);
          }
        };

        ws.onerror = (event) => {
          console.error("[Cartesia] WebSocket error:", event);
          setError(new Error("WebSocket connection error"));
          resolve(false);
        };

        ws.onmessage = handleMessage;
      });
    } catch (err) {
      console.error("[Cartesia] Connection error:", err);
      setError(err instanceof Error ? err : new Error("Connection failed"));
      return false;
    }
  }, [fetchConfig, handleMessage, isProcessing]);

  /**
   * Convert Float32Array audio to Int16Array for Cartesia
   */
  const floatTo16BitPCM = useCallback((input: Float32Array): Int16Array => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }, []);

  /**
   * Downsample audio to target sample rate
   */
  const downsample = useCallback((
    buffer: Float32Array,
    inputSampleRate: number,
    outputSampleRate: number
  ): Float32Array => {
    if (inputSampleRate === outputSampleRate) {
      return buffer;
    }
    
    const ratio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIndex = Math.floor(i * ratio);
      result[i] = buffer[srcIndex];
    }
    
    return result;
  }, []);

  /**
   * Start progressive transcription with a MediaStream
   * Call this when recording starts
   */
  const start = useCallback(async (
    stream: MediaStream
  ): Promise<boolean> => {
    // Reset state
    transcriptPartsRef.current = [];
    setPartialTranscript("");
    setInterimTranscript("");
    setError(null);
    setIsProcessing(true);

    // Store stream reference
    mediaStreamRef.current = stream;

    // Connect to Cartesia WebSocket
    const connected = await connectWebSocket();
    if (!connected) {
      setIsProcessing(false);
      return false;
    }

    // Set up audio processing
    try {
      // Create audio context
      const audioContext = new AudioContext({ sampleRate: 48000 });
      audioContextRef.current = audioContext;

      // Create source from media stream
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Create script processor for audio capture
      // Note: ScriptProcessorNode is deprecated but still works and is simpler
      // for this use case than AudioWorklet
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          return;
        }

        // Get audio data from input buffer
        const inputData = event.inputBuffer.getChannelData(0);
        
        // Downsample to Cartesia's expected rate (16kHz)
        const downsampled = downsample(inputData, audioContext.sampleRate, SAMPLE_RATE);
        
        // Convert to Int16
        const int16Data = floatTo16BitPCM(downsampled);
        
        // Send raw binary audio to Cartesia
        wsRef.current.send(int16Data.buffer);
      };

      // Connect audio nodes
      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log("[Cartesia] Audio processing started");
      return true;
    } catch (err) {
      console.error("[Cartesia] Audio setup error:", err);
      setError(err instanceof Error ? err : new Error("Audio setup failed"));
      setIsProcessing(false);
      return false;
    }
  }, [connectWebSocket, downsample, floatTo16BitPCM]);

  /**
   * Stop progressive transcription and finalize
   * Returns the complete transcript
   */
  const finalize = useCallback(async (): Promise<string> => {
    console.log("[Cartesia] Finalizing transcription...");

    // Disconnect audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Close WebSocket gracefully
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Send "finalize" text message to flush any pending transcription
      // Cartesia expects a simple text message "finalize" (not JSON)
      wsRef.current.send("finalize");
      
      // Wait a brief moment for final results
      await new Promise(resolve => setTimeout(resolve, 500));
      
      wsRef.current.close(1000, "Transcription complete");
    }
    wsRef.current = null;

    setIsProcessing(false);
    setIsConnected(false);

    // Combine final transcript with any remaining interim
    const finalText = [
      ...transcriptPartsRef.current,
      interimTranscript
    ].filter(Boolean).join(" ").trim();

    console.log(`[Cartesia] Final transcript: "${finalText.slice(0, 100)}..."`);
    
    return finalText;
  }, [interimTranscript]);

  /**
   * Reset the progressive transcription state
   */
  const reset = useCallback(() => {
    // Clean up audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, "Reset");
      wsRef.current = null;
    }

    // Reset state
    transcriptPartsRef.current = [];
    reconnectAttemptsRef.current = 0;
    setPartialTranscript("");
    setInterimTranscript("");
    setIsProcessing(false);
    setIsConnected(false);
    setError(null);
  }, []);

  /**
   * Legacy method for backward compatibility
   * Updates nothing since we don't use chunked uploads anymore
   */
  const updateChunks = useCallback((_chunks: Blob[]) => {
    // No-op for backward compatibility
    // Cartesia WebSocket doesn't use chunked uploads
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return {
    // Cartesia-based API
    start,
    finalize,
    reset,
    
    // State
    partialTranscript,
    interimTranscript,
    isProcessing,
    isConnected,
    error,
    
    // Combined display transcript (partial + interim)
    displayTranscript: partialTranscript + (interimTranscript ? " " + interimTranscript : ""),
    
    // Legacy API for backward compatibility
    updateChunks,
  };
}

export default useProgressiveTranscription;
