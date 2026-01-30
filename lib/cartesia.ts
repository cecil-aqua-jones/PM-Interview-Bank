/**
 * Cartesia Client Configuration
 * 
 * This module provides configuration and helpers for Cartesia's
 * Speech-to-Text (STT) and Text-to-Speech (TTS) services.
 * 
 * STT: Uses ink-whisper model via WebSocket or REST batch API
 * TTS: Uses sonic-3 model via WebSocket
 */

// Environment variable for Cartesia API key
const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;

// API version for Cartesia endpoints
export const CARTESIA_VERSION = "2025-04-16";

/**
 * Check if Cartesia is configured
 */
export function isCartesiaConfigured(): boolean {
  return !!CARTESIA_API_KEY;
}

/**
 * Get the Cartesia API key (for server-side use only)
 */
export function getCartesiaApiKey(): string {
  if (!CARTESIA_API_KEY) {
    throw new Error("CARTESIA_API_KEY environment variable is not set");
  }
  return CARTESIA_API_KEY;
}

/**
 * Cartesia Sonic-3 TTS Voice Options
 * Using emotive voices for natural, human-like speech
 * 
 * Browse all voices at: https://play.cartesia.ai/
 */
export const CARTESIA_VOICES = {
  // Stable voices (recommended for production voice agents)
  KATIE: "f786b574-daa5-4673-aa0c-cbe3e8534c02",     // Warm, professional female
  KIEFER: "228fca29-3a0a-435c-8728-5cb483251068",   // Professional male
  RONALD: "daf749c6-4c84-4458-ba4d-e5d1b3ed511b",   // Stable male
  JACQUELINE: "a3520a8f-226a-428d-9fcd-b0a4711a6829", // Stable female
  
  // Emotive voices (recommended for expressive, natural speech)
  TESSA: "6ccbfb76-1fc6-48f7-b71d-91ac6298247b",    // Emotive female - warm, expressive
  KYLE: "c961b81c-a935-4c17-bfb3-ba2239de8c2f",     // Emotive male
  LEO: "0834f3df-e650-4766-a20c-5a93a43aa6e3",      // Emotive male - best emotional response
  MAYA: "cbaf8084-f009-4838-a096-07ee2e6612b1",     // Emotive female
  
  // Default voice for interview context - Tessa for natural, warm expressiveness
  DEFAULT: "6ccbfb76-1fc6-48f7-b71d-91ac6298247b",  // Tessa - emotive, natural
} as const;

export type CartesiaVoice = typeof CARTESIA_VOICES[keyof typeof CARTESIA_VOICES];

/**
 * Supported emotions for Cartesia Sonic-3 TTS
 * Primary emotions have best results; others are available but experimental
 */
export const TTS_EMOTIONS = {
  // Primary emotions (best quality)
  NEUTRAL: "neutral",
  CONTENT: "content",       // Warm, approachable - good default
  ENTHUSIASTIC: "enthusiastic", // For greetings
  CURIOUS: "curious",       // For follow-up questions
  AFFECTIONATE: "affectionate", // For encouraging feedback
  
  // Secondary emotions (good for variety)
  CALM: "calm",
  FRIENDLY: "friendly",
  SYMPATHETIC: "sympathetic",
  CONFIDENT: "confident",
  
  // Contextual emotions
  EXCITED: "excited",       // When candidate does well
  CONTEMPLATIVE: "contemplative", // When thinking
} as const;

export type TTSEmotion = typeof TTS_EMOTIONS[keyof typeof TTS_EMOTIONS];

/**
 * Emotion mapping for different interview states
 * Maps interview phases to appropriate emotional tones
 */
export const INTERVIEW_STATE_EMOTIONS: Record<string, TTSEmotion> = {
  greeting: TTS_EMOTIONS.ENTHUSIASTIC,   // Warm welcome
  coding: TTS_EMOTIONS.CONTENT,          // Supportive, calm
  review: TTS_EMOTIONS.NEUTRAL,          // Professional feedback
  followup: TTS_EMOTIONS.CURIOUS,        // Engaged discussion
  feedback: TTS_EMOTIONS.AFFECTIONATE,   // Encouraging wrap-up
  default: TTS_EMOTIONS.CONTENT,         // Fallback
};

/**
 * Get the appropriate emotion for an interview state
 */
export function getEmotionForState(state: string): TTSEmotion {
  return INTERVIEW_STATE_EMOTIONS[state] || INTERVIEW_STATE_EMOTIONS.default;
}

/**
 * TTS Generation Config for natural speech
 * These parameters guide the model for more human-like output
 */
export interface TTSGenerationConfig {
  speed?: number;    // 0.6 to 1.5 (1.0 = normal)
  emotion?: TTSEmotion;
  volume?: number;   // 0.5 to 2.0 (1.0 = normal)
}

/**
 * Default generation config for natural interview speech
 */
export const DEFAULT_GENERATION_CONFIG: TTSGenerationConfig = {
  speed: 1.0,
  emotion: TTS_EMOTIONS.CONTENT,
  volume: 1.0,
};

/**
 * Cartesia TTS configuration for interview context
 * Using sonic-3 model with PCM output for low latency
 */
export const TTS_CONFIG = {
  model_id: "sonic-3",
  output_format: {
    container: "raw",
    encoding: "pcm_s16le",
    sample_rate: 24000,
  },
  language: "en",
} as const;

/**
 * Cartesia Live STT configuration for real-time transcription
 * Using ink-whisper model optimized for low-latency greeting detection
 */
export const LIVE_STT_CONFIG = {
  model: "ink-whisper",
  language: "en",
  encoding: "pcm_s16le",
  sample_rate: 16000,
  min_volume: 0.1,                    // Volume threshold for VAD
  max_silence_duration_secs: 1.2,     // Silence before endpointing (1.2s for greetings)
} as const;

/**
 * Cartesia Batch STT configuration (for fallback batch transcription)
 */
export const BATCH_STT_CONFIG = {
  model: "ink-whisper",
  language: "en",
} as const;

/**
 * WebSocket URLs
 */
export const CARTESIA_WS_URLS = {
  TTS: "wss://api.cartesia.ai/tts/websocket",
  STT: "wss://api.cartesia.ai/stt/websocket",
} as const;

/**
 * REST API URLs
 */
export const CARTESIA_REST_URLS = {
  STT_BATCH: "https://api.cartesia.ai/stt",
} as const;

/**
 * Get the STT WebSocket URL with authentication and config params
 */
export function getSTTWebSocketUrl(): string {
  if (!CARTESIA_API_KEY) {
    throw new Error("CARTESIA_API_KEY environment variable is not set");
  }
  
  const params = new URLSearchParams({
    api_key: CARTESIA_API_KEY,
    cartesia_version: CARTESIA_VERSION,
    model: LIVE_STT_CONFIG.model,
    language: LIVE_STT_CONFIG.language,
    encoding: LIVE_STT_CONFIG.encoding,
    sample_rate: String(LIVE_STT_CONFIG.sample_rate),
    min_volume: String(LIVE_STT_CONFIG.min_volume),
    max_silence_duration_secs: String(LIVE_STT_CONFIG.max_silence_duration_secs),
  });
  
  return `${CARTESIA_WS_URLS.STT}?${params.toString()}`;
}

/**
 * Get the TTS WebSocket URL with authentication
 */
export function getTTSWebSocketUrl(): string {
  if (!CARTESIA_API_KEY) {
    throw new Error("CARTESIA_API_KEY environment variable is not set");
  }
  
  const params = new URLSearchParams({
    api_key: CARTESIA_API_KEY,
    cartesia_version: CARTESIA_VERSION,
  });
  
  return `${CARTESIA_WS_URLS.TTS}?${params.toString()}`;
}

/**
 * Sleep utility for retry logic
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Options for TTS generation
 */
export interface GenerateTTSOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  generationConfig?: TTSGenerationConfig;
}

/**
 * Default timeout for TTS generation (30 seconds)
 * Increased from 10s because successful calls often take 7-8s under load
 */
const DEFAULT_TTS_TIMEOUT = 30000;

/**
 * Activity timeout - reset timer when receiving chunks (15 seconds)
 * This prevents timeout during active streaming
 */
const ACTIVITY_TIMEOUT = 15000;

/**
 * TTS retry configuration for transient WebSocket failures
 */
const TTS_MAX_RETRIES = 3;
const TTS_INITIAL_RETRY_DELAY = 500; // ms

/**
 * Check if an error is retryable (transient network issues)
 */
function isRetryableTTSError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes("websocket closed unexpectedly") ||
    message.includes("1006") ||
    message.includes("econnreset") ||
    message.includes("connection error") ||
    message.includes("etimedout") ||
    message.includes("enotfound") ||
    message.includes("socket hang up") ||
    message.includes("network")
  );
}

/**
 * Generate TTS audio using Cartesia Sonic-3 via WebSocket
 * Includes automatic retry logic for transient network failures
 * Returns audio as ArrayBuffer (PCM s16le format)
 * 
 * @param text - Text to convert to speech
 * @param voiceId - Cartesia voice ID to use
 * @param options - Optional settings including AbortSignal and timeout
 */
export async function generateTTS(
  text: string,
  voiceId: CartesiaVoice = CARTESIA_VOICES.DEFAULT,
  options: GenerateTTSOptions = {}
): Promise<ArrayBuffer> {
  if (!CARTESIA_API_KEY) {
    throw new Error("CARTESIA_API_KEY environment variable is not set");
  }
  
  const { signal } = options;
  
  // Check if already aborted before starting
  if (signal?.aborted) {
    const error = new Error("TTS generation aborted");
    error.name = "AbortError";
    throw error;
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < TTS_MAX_RETRIES; attempt++) {
    // Check abort before each attempt
    if (signal?.aborted) {
      const error = new Error("TTS generation aborted");
      error.name = "AbortError";
      throw error;
    }
    
    try {
      return await attemptTTSGeneration(text, voiceId, options, attempt);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry abort errors
      if (lastError.name === "AbortError") {
        throw lastError;
      }
      
      // Check if error is retryable
      const isRetryable = isRetryableTTSError(lastError);
      
      if (!isRetryable || attempt === TTS_MAX_RETRIES - 1) {
        throw lastError;
      }
      
      // Exponential backoff
      const delay = TTS_INITIAL_RETRY_DELAY * Math.pow(2, attempt);
      console.log(`[Cartesia TTS] Retry ${attempt + 1}/${TTS_MAX_RETRIES} after ${delay}ms: ${lastError.message}`);
      await sleep(delay);
    }
  }
  
  throw lastError || new Error("TTS generation failed after retries");
}

/**
 * Internal function to attempt a single TTS generation via WebSocket
 * Called by generateTTS with retry logic
 */
async function attemptTTSGeneration(
  text: string,
  voiceId: CartesiaVoice,
  options: GenerateTTSOptions,
  attemptNumber: number = 0
): Promise<ArrayBuffer> {
  const { 
    signal, 
    timeoutMs = DEFAULT_TTS_TIMEOUT,
    generationConfig = DEFAULT_GENERATION_CONFIG 
  } = options;
  
  const attemptLabel = attemptNumber > 0 ? ` (attempt ${attemptNumber + 1})` : '';
  console.log(`[Cartesia TTS] Generating speech for ${text.length} chars with voice ${voiceId}${attemptLabel} (timeout: ${timeoutMs}ms)`);
  
  return new Promise((resolve, reject) => {
    const wsUrl = getTTSWebSocketUrl();
    const ws = new WebSocket(wsUrl);
    const audioChunks: ArrayBuffer[] = [];
    const contextId = `tts-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let isResolved = false;
    let activityTimer: ReturnType<typeof setTimeout> | null = null;
    let absoluteTimer: ReturnType<typeof setTimeout> | null = null;
    
    // Handle abort signal
    const abortHandler = () => {
      if (!isResolved) {
        console.log("[Cartesia TTS] Aborted via signal");
        ws.close();
        const error = new Error("TTS generation aborted");
        error.name = "AbortError";
        reject(error);
      }
    };
    
    if (signal) {
      signal.addEventListener("abort", abortHandler, { once: true });
    }
    
    // Reset activity timeout (called when receiving data)
    const resetActivityTimer = () => {
      if (activityTimer) {
        clearTimeout(activityTimer);
      }
      activityTimer = setTimeout(() => {
        if (!isResolved && ws.readyState === WebSocket.OPEN) {
          console.log(`[Cartesia TTS] Activity timeout after ${ACTIVITY_TIMEOUT}ms of inactivity`);
          cleanup();
          ws.close();
          reject(new Error("TTS generation timeout (no activity)"));
        }
      }, ACTIVITY_TIMEOUT);
    };
    
    // Cleanup function
    const cleanup = () => {
      isResolved = true;
      if (signal) {
        signal.removeEventListener("abort", abortHandler);
      }
      if (activityTimer) {
        clearTimeout(activityTimer);
      }
      if (absoluteTimer) {
        clearTimeout(absoluteTimer);
      }
    };
    
    ws.onopen = () => {
      console.log("[Cartesia TTS] WebSocket connected");
      
      // Start activity timer (will be reset when chunks arrive)
      resetActivityTimer();
      
      // Build generation_config for natural speech
      const genConfig: Record<string, unknown> = {};
      if (generationConfig.speed !== undefined) {
        genConfig.speed = generationConfig.speed;
      }
      if (generationConfig.emotion) {
        genConfig.emotion = generationConfig.emotion;
      }
      if (generationConfig.volume !== undefined) {
        genConfig.volume = generationConfig.volume;
      }
      
      // Send generation request with emotion/speed controls
      const request = {
        model_id: TTS_CONFIG.model_id,
        transcript: text,
        voice: {
          mode: "id",
          id: voiceId,
        },
        language: TTS_CONFIG.language,
        context_id: contextId,
        output_format: TTS_CONFIG.output_format,
        add_timestamps: false,
        continue: false,
        ...(Object.keys(genConfig).length > 0 && { generation_config: genConfig }),
      };
      
      console.log(`[Cartesia TTS] Request with emotion: ${generationConfig.emotion || 'default'}, speed: ${generationConfig.speed || 1.0}`);
      ws.send(JSON.stringify(request));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Reset activity timer on any message
        resetActivityTimer();
        
        if (data.type === "chunk" && data.data) {
          // Decode base64 audio chunk
          const binaryString = atob(data.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          audioChunks.push(bytes.buffer);
        } else if (data.type === "done") {
          console.log(`[Cartesia TTS] Generation complete, ${audioChunks.length} chunks`);
          cleanup();
          ws.close();
          
          // Concatenate all audio chunks
          const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of audioChunks) {
            result.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
          }
          
          // Add WAV header for playability
          const wavBuffer = addWavHeader(result.buffer, TTS_CONFIG.output_format.sample_rate);
          console.log(`[Cartesia TTS] Generated ${wavBuffer.byteLength} bytes of audio`);
          resolve(wavBuffer);
        } else if (data.type === "error" || data.error) {
          console.error("[Cartesia TTS] Error:", data.error);
          cleanup();
          ws.close();
          reject(new Error(data.error || "TTS generation failed"));
        }
      } catch (err) {
        console.error("[Cartesia TTS] Failed to parse message:", err);
      }
    };
    
    ws.onerror = (error) => {
      console.error("[Cartesia TTS] WebSocket error:", error);
      cleanup();
      reject(new Error("WebSocket connection error"));
    };
    
    ws.onclose = (event) => {
      if (!isResolved && event.code !== 1000 && audioChunks.length === 0) {
        cleanup();
        reject(new Error(`WebSocket closed unexpectedly: ${event.code} ${event.reason}`));
      }
    };
    
    // Absolute timeout using provided timeout value (fallback safety)
    absoluteTimer = setTimeout(() => {
      if (!isResolved && ws.readyState === WebSocket.OPEN) {
        console.log(`[Cartesia TTS] Absolute timeout after ${timeoutMs}ms`);
        cleanup();
        ws.close();
        reject(new Error("TTS generation timeout (absolute limit)"));
      }
    }, timeoutMs);
  });
}

/**
 * Add WAV header to raw PCM data
 * Converts raw PCM s16le to playable WAV format
 */
function addWavHeader(pcmData: ArrayBuffer, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.byteLength;
  const headerSize = 44;
  
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);
  
  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  
  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);           // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);            // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);  // NumChannels
  view.setUint32(24, sampleRate, true);   // SampleRate
  view.setUint32(28, byteRate, true);     // ByteRate
  view.setUint16(32, blockAlign, true);   // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample
  
  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);
  
  // Copy PCM data
  new Uint8Array(buffer, headerSize).set(new Uint8Array(pcmData));
  
  return buffer;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Transcribe audio using Cartesia ink-whisper batch API
 * Supports various audio formats: WebM, MP3, WAV, OGG, FLAC, MP4
 * Returns transcription text
 */
export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  mimeType: string = "audio/webm"
): Promise<string> {
  if (!CARTESIA_API_KEY) {
    throw new Error("CARTESIA_API_KEY environment variable is not set");
  }
  
  const buffer = Buffer.from(audioBuffer);
  console.log(`[Cartesia STT] Input: ${buffer.length} bytes, type: ${mimeType}`);
  
  // Validate buffer has actual content
  if (buffer.length < 100) {
    throw new Error(`Audio buffer too small: ${buffer.length} bytes`);
  }
  
  // Determine file extension from MIME type
  const mimeToExt: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/ogg": "ogg",
    "audio/flac": "flac",
    "audio/x-m4a": "m4a",
  };
  const baseMime = mimeType.split(";")[0].trim().toLowerCase();
  const ext = mimeToExt[baseMime] || "webm";
  
  // Retry configuration
  const MAX_RETRIES = 3;
  const INITIAL_DELAY_MS = 500;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`[Cartesia STT] Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`);
        await sleep(delay);
      }
      
      // Create form data with the audio file
      const formData = new FormData();
      const blob = new Blob([buffer], { type: baseMime });
      formData.append("file", blob, `audio.${ext}`);
      formData.append("model", BATCH_STT_CONFIG.model);
      formData.append("language", BATCH_STT_CONFIG.language);
      
      const response = await fetch(CARTESIA_REST_URLS.STT_BATCH, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CARTESIA_API_KEY}`,
          "Cartesia-Version": CARTESIA_VERSION,
        },
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        const transcript = result.text || "";
        console.log(`[Cartesia STT] Success (attempt ${attempt + 1}): "${transcript.slice(0, 100) || "(empty)"}"`);
        return transcript;
      }
      
      const errorText = await response.text();
      console.error(`[Cartesia STT] API error (${response.status}, attempt ${attempt + 1}):`, errorText);
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`Cartesia API error: ${response.status} - ${errorText}`);
      }
      
      lastError = new Error(`Cartesia API error: ${response.status} - ${errorText}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[Cartesia STT] Exception (attempt ${attempt + 1}):`, lastError.message);
      
      // Don't retry on validation errors
      if (lastError.message.includes("too small")) {
        throw lastError;
      }
    }
  }
  
  console.error(`[Cartesia STT] All ${MAX_RETRIES} attempts failed`);
  throw lastError || new Error("Transcription failed after all retries");
}

/**
 * Type definitions for Cartesia STT responses
 */
export interface CartesiaTranscriptResult {
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
 * Type definitions for Cartesia TTS responses
 */
export interface CartesiaTTSChunk {
  type: "chunk" | "flush_done" | "done" | "timestamps" | "error";
  data?: string;        // Base64 encoded audio
  done?: boolean;
  status_code?: number;
  context_id?: string;
  step_time?: number;
  error?: string;
  word_timestamps?: {
    words: string[];
    start: number[];
    end: number[];
  };
}

/**
 * Supported audio formats for Cartesia STT
 */
export const SUPPORTED_AUDIO_FORMATS = [
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/flac",
  "audio/x-m4a",
] as const;

export function isSupportedAudioFormat(mimeType: string): boolean {
  const baseMimeType = mimeType.split(";")[0].trim().toLowerCase();
  return SUPPORTED_AUDIO_FORMATS.some(format => 
    format === mimeType || format.startsWith(baseMimeType)
  );
}
