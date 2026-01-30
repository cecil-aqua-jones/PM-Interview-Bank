"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";
import { useStreamingConversation } from "@/lib/hooks/useStreamingConversation";
import { useStreamingSpeech } from "@/lib/hooks/useStreamingSpeech";
import { useProgressiveTranscription } from "@/lib/hooks/useProgressiveTranscription";
import { saveInterview, getCodingInterview } from "@/lib/interviewStorage";
import { CodingEvaluationResult } from "@/lib/codingRubric";
import { Question, SupportedLanguage, SUPPORTED_LANGUAGES, DEFAULT_STARTER_CODE } from "@/lib/types";
import { isGreeting } from "@/lib/greetingDetection";
import { track } from "@/lib/posthog";
import FeedbackCards from "./FeedbackCards";
import FormattedContent from "./FormattedContent";
import styles from "../app.module.css";

// Dynamically import CodeEditor to avoid SSR issues
const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className={styles.codeEditorLoading}>
      <div className={styles.spinner} />
      <p>Loading editor...</p>
    </div>
  )
});

const getSupportedLanguage = (lang: string | undefined): SupportedLanguage => {
  if (!lang) return "python";
  const supportedIds = SUPPORTED_LANGUAGES.map(l => l.id);
  return supportedIds.includes(lang as SupportedLanguage) ? (lang as SupportedLanguage) : "python";
};

type InterviewPanelProps = {
  question: Question;
  preloadedAudioUrl?: string | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onScoreUpdate?: (questionId: string, score: number) => void;
  questionIndex?: number;
  totalQuestions?: number;
};

type PanelState =
  | "awaiting_greeting"
  | "speaking"
  | "coding"
  | "processing"
  | "review"
  | "followup"
  | "feedback";

type ConversationTurn = {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: number;
};

type AudioQueueItem = {
  id: string;
  source: "url" | "base64" | "fetch";
  data: string;
  onComplete?: () => void;
  mountId?: string; // Track which mount created this item (for React Strict Mode)
};

let activeSessionId: string | null = null;

export default function InterviewPanel({
  question,
  preloadedAudioUrl,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  onScoreUpdate,
  questionIndex = 0,
  totalQuestions = 1,
}: InterviewPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [panelState, setPanelState] = useState<PanelState>("awaiting_greeting");
  const [evaluation, setEvaluation] = useState<CodingEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState("");
  const [speakingProgress, setSpeakingProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Code editor state
  const initialLanguage = getSupportedLanguage(question.language);
  const [code, setCode] = useState(question.starterCode || DEFAULT_STARTER_CODE[initialLanguage]);
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);

  // Check if user has written meaningful code (different from starter code)
  const starterCode = question.starterCode || DEFAULT_STARTER_CODE[language];
  const hasUserCode = code.trim() !== starterCode.trim() && code.trim().length >= 10;

  // Conversation state
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [currentFollowUp, setCurrentFollowUp] = useState<string | null>(null);
  const [followUpCount, setFollowUpCount] = useState(0);
  const MAX_FOLLOWUPS = 3;

  // Unified conversation state (replaces separate clarifying questions)
  const [isConversing, setIsConversing] = useState(false);
  const [isProcessingGreeting, setIsProcessingGreeting] = useState(false);
  const [conversationRecordingState, setConversationRecordingState] = useState<
    "idle" | "listening" | "recording" | "paused" | "processing"
  >("idle");
  const [pendingTranscript, setPendingTranscript] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState(0);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Streaming conversation for low-latency responses
  const [streamingText, setStreamingText] = useState<string>("");
  const streamingConversation = useStreamingConversation();
  
  // Streaming speech for initial question (faster time-to-first-audio)
  const streamingSpeechCallbacksRef = useRef<{
    onComplete?: () => void;
  }>({});
  const streamingSpeechHook = useStreamingSpeech({
    onComplete: () => {
      streamingSpeechCallbacksRef.current.onComplete?.();
    },
    onError: (err) => {
      console.error("[StreamingSpeech] Error:", err);
      // On error, transition to coding anyway
      streamingSpeechCallbacksRef.current.onComplete?.();
    },
  });
  // Extract stable references to avoid effect re-runs when state changes
  const streamingSpeechSpeak = streamingSpeechHook.speak;
  const streamingSpeechStop = streamingSpeechHook.stop;
  const streamingSpeechIsPlaying = streamingSpeechHook.isPlaying;
  
  // State for prefetched audio playback
  const [isPlayingPreloadedAudio, setIsPlayingPreloadedAudio] = useState(false);

  // Progressive transcription for reduced latency
  const progressiveTranscription = useProgressiveTranscription();

  // Natural conversation flow refs
  const continuationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamingFallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-listen mode: automatically start listening after AI finishes speaking
  const autoListenEnabledRef = useRef(true);
  const autoListenDelayRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to track recording state for async callbacks (avoids stale closures)
  const conversationRecordingStateRef = useRef(conversationRecordingState);
  const panelStateRef = useRef(panelState);
  const conversationRef = useRef(conversation);
  
  // Track active mount ID to prevent React Strict Mode double audio
  const activeMountIdRef = useRef<string | null>(null);
  
  // Track interview start time for duration analytics
  const interviewStartTimeRef = useRef<number>(Date.now());
  
  // Track if we've fired the interview_started event for this question
  const hasTrackedStartRef = useRef<string | null>(null);
  
  // Ref for evaluation to avoid stale closures in callbacks
  const evaluationRef = useRef(evaluation);
  useEffect(() => {
    evaluationRef.current = evaluation;
  }, [evaluation]);

  // Refs for question data to avoid stale closures in audio callbacks
  const questionTitleRef = useRef(question.title);
  const questionPromptRef = useRef(question.prompt);
  const questionIdRef = useRef(question.id);
  const questionCompanyNameRef = useRef(question.companyName);

  // Keep refs in sync with state
  useEffect(() => {
    conversationRecordingStateRef.current = conversationRecordingState;
  }, [conversationRecordingState]);

  useEffect(() => {
    panelStateRef.current = panelState;
  }, [panelState]);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    questionTitleRef.current = question.title;
    questionPromptRef.current = question.prompt;
    questionIdRef.current = question.id;
    questionCompanyNameRef.current = question.companyName;
  }, [question.title, question.prompt, question.id, question.companyName]);

  // Configuration for natural conversation flow
  // These settings prevent the AI from responding during natural pauses
  // Tuned for high sensitivity - works with quieter microphones
  // NOTE: Thresholds lowered significantly to accommodate quieter microphones
  const SILENCE_THRESHOLD = 0.003; // Was 0.015 - lowered for quiet mics
  const SPEECH_THRESHOLD = 0.005;  // Was 0.025 - lowered for quiet mics
  const SILENCE_DURATION = 1500; // ms of silence before auto-pausing (1.5s per design spec)
  const GREETING_SILENCE_DURATION = 1200; // Silence detection for greetings (1.2s) - gives streaming time to connect
  const CONTINUATION_WINDOW = 3500; // ms to wait for continuation before sending (3.5s)
  const MIN_RECORDING_DURATION = 500; // Minimum ms of recording before allowing transcription

  /**
   * Check if the transcribed text appears to be a complete thought
   * Returns false if it looks like the user was cut off mid-sentence
   */
  const isCompleteSentence = (text: string): boolean => {
    if (!text || text.trim().length === 0) return false;

    const trimmed = text.trim();

    // Check for trailing conjunctions/prepositions that indicate incomplete thought
    const incompleteEndings = [
      /\s(and|but|so|or|because|if|when|while|although|though|since|unless|after|before|that|which|who|where|what|how|why|the|a|an|to|for|with|in|on|at|by|of|is|are|was|were|have|has|had|will|would|could|should|can|may|might|must|shall|do|does|did|be|being|been|it's|its|this|these|those|like|such|as|than|then|just|also|only|even|still|yet|already|about|into|from|over|under|between|through|during|toward|towards|against|among|within|without|upon|along|across|behind|beside|besides|beyond|except|around|above|below|beneath|inside|outside|i|we|you|they|he|she|it|my|our|your|their|his|her|its|im|i'm|i'll|i've|i'd|we're|we'll|we've|they're|they'll|they've|he's|she's|it's)$/i,
    ];

    // Check for incomplete endings
    for (const pattern of incompleteEndings) {
      if (pattern.test(trimmed)) {
        return false;
      }
    }

    // Check if ends with ellipsis or dash (trailing off)
    if (/[…\-–—]$/.test(trimmed) || trimmed.endsWith('...')) {
      return false;
    }

    // Very short responses (1-2 words) might be incomplete unless they're common phrases
    const words = trimmed.split(/\s+/);
    if (words.length <= 2) {
      const lowerTrimmed = trimmed.toLowerCase();
      // Single word responses - check exact match
      const singleWordResponses = ['yes', 'no', 'okay', 'sure', 'right', 'correct', 'exactly', 'agreed', 'understood', 'thanks', 'yep', 'nope', 'yeah', 'nah', 'ok', 'alright', 'definitely', 'absolutely'];
      // Multi-word responses - check exact match for full phrase
      const multiWordResponses = ['got it', 'makes sense', 'i see', 'mm-hm', 'uh-huh', 'thank you', 'of course', 'for sure'];
      
      // Check if the entire text matches a single word response
      if (singleWordResponses.includes(lowerTrimmed)) {
        return true;
      }
      // Check if the entire text matches a multi-word response
      if (multiWordResponses.includes(lowerTrimmed)) {
        return true;
      }
      // Check if text starts with a complete response followed by more words
      // e.g., "yes I think so" or "okay so"
      if (words.length === 2 && singleWordResponses.includes(words[0].toLowerCase())) {
        return true;
      }
      // Very short and not a common complete phrase - likely incomplete
      // Fall through to punctuation/length check below
    }

    // Generally assume complete if it ends with sentence-ending punctuation
    // or is reasonably long
    return /[.!?]$/.test(trimmed) || words.length >= 5;
  };

  // Audio queue system - prevents simultaneous playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<AudioQueueItem[]>([]);
  const isPlayingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioAbortControllerRef = useRef<AbortController | null>(null); // For TTS fetch requests
  const isClosingRef = useRef(false); // Track if panel is closing to prevent new audio
  const isInitialMountRef = useRef(true); // Track initial mount to prevent animation conflict
  const sessionIdRef = useRef<string>(Date.now().toString());
  const conversationMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const conversationChunksRef = useRef<Blob[]>([]);
  const initialQuestionPlayedRef = useRef(false);

  // Note: useAudioRecorder is still available for future enhancements
  // For now we use our own MediaRecorder implementation in the conversation system
  const { error: recorderError } = useAudioRecorder();

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO QUEUE SYSTEM - Ensures sequential playback, never simultaneous
  // ═══════════════════════════════════════════════════════════════════════════

  const stopCurrentAudio = useCallback(() => {
    // Abort any in-flight TTS fetch requests
    if (audioAbortControllerRef.current) {
      audioAbortControllerRef.current.abort();
      audioAbortControllerRef.current = null;
    }
    // Stop and clean up current audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsSpeaking(false);
    isPlayingRef.current = false;
  }, []);

  const clearAudioQueue = useCallback(() => {
    audioQueueRef.current = [];
    stopCurrentAudio();
  }, [stopCurrentAudio]);

  const processNextInQueue = useCallback(async () => {
    // If already playing, queue empty, or panel is closing, do nothing
    if (isPlayingRef.current || audioQueueRef.current.length === 0 || isClosingRef.current) {
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const item = audioQueueRef.current.shift()!;
    
    // Check if this item is from the current active mount (React Strict Mode fix)
    if (item.mountId && item.mountId !== activeMountIdRef.current) {
      console.log("[Audio] Skipping stale mount item:", item.mountId, "current:", activeMountIdRef.current);
      isPlayingRef.current = false;
      setIsSpeaking(false);
      // Continue processing - there might be valid items from current mount
      processNextInQueue();
      return;
    }
    
    console.log("[Audio] Processing:", item.source);

    // Helper function to try playing audio with various fallbacks
    const tryPlayAudio = async (url: string, shouldRevokeUrl: boolean = false): Promise<boolean> => {
      // Check if this item's mount is still active (React Strict Mode fix)
      if (item.mountId && item.mountId !== activeMountIdRef.current) {
        console.log("[Audio] Aborting tryPlayAudio - mount is stale:", item.mountId, "current:", activeMountIdRef.current);
        return false;
      }
      
      return new Promise((resolve) => {
        // Double-check mount is still active before creating audio element
        if (item.mountId && item.mountId !== activeMountIdRef.current) {
          console.log("[Audio] Aborting audio creation - mount is stale");
          resolve(false);
          return;
        }
        
        const audio = new Audio();
        audioRef.current = audio;
        let resolved = false;

        const cleanup = () => {
          audio.removeEventListener("canplaythrough", onCanPlay);
          audio.removeEventListener("error", onError);
        };

        const onCanPlay = async () => {
          cleanup();
          // Final mount check before actually playing
          if (item.mountId && item.mountId !== activeMountIdRef.current) {
            console.log("[Audio] Aborting play - mount became stale during load");
            audio.src = "";
            resolved = true;
            resolve(false);
            return;
          }
          try {
            await audio.play();
            console.log("[Audio] Playback started");
            resolved = true;
            resolve(true);
          } catch (playErr) {
            console.error("[Audio] Play failed after canplaythrough:", playErr);
            resolved = true;
            resolve(false);
          }
        };

        const onError = () => {
          cleanup();
          console.error("[Audio] Load error:", audio.error?.code, audio.error?.message);
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        };

        audio.addEventListener("canplaythrough", onCanPlay, { once: true });
        audio.addEventListener("error", onError, { once: true });

        audio.addEventListener("timeupdate", () => {
          if (audio.duration) {
            setSpeakingProgress((audio.currentTime / audio.duration) * 100);
          }
        });

        audio.addEventListener("ended", () => {
          console.log("[Audio] Playback ended");
          if (shouldRevokeUrl && url.startsWith("blob:")) {
            URL.revokeObjectURL(url);
          }
          audioRef.current = null;
          isPlayingRef.current = false;
          setIsSpeaking(false);
          setSpeakingProgress(0);
          
          if (isClosingRef.current) return;
          
          item.onComplete?.();

          if (audioQueueRef.current.length > 0) {
            processNextInQueue();
          } else {
            triggerAutoListen();
          }
        });

        audio.addEventListener("pause", () => {
          isPlayingRef.current = false;
          setIsSpeaking(false);
        });

        // Set source and try to load
        audio.src = url;
        audio.load();

        // Timeout for load attempt
        setTimeout(() => {
          if (!resolved) {
            cleanup();
            resolved = true;
            resolve(false);
          }
        }, 5000);
      });
    };

    // Helper to fetch fresh TTS and play via data URL
    const fetchAndPlayFallback = async (): Promise<boolean> => {
      // Check if mount is still active before fetching
      if (item.mountId && item.mountId !== activeMountIdRef.current) {
        console.log("[Audio Queue] Aborting fallback - mount is stale:", item.mountId);
        return false;
      }
      
      try {
        audioAbortControllerRef.current = new AbortController();
        
        const response = await fetch("/api/interview/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            questionTitle: questionTitleRef.current, 
            questionContent: questionPromptRef.current 
          }),
          signal: audioAbortControllerRef.current.signal,
        });
        
        // Check again after fetch completes
        if (item.mountId && item.mountId !== activeMountIdRef.current) {
          console.log("[Audio Queue] Aborting after fetch - mount is stale");
          return false;
        }
        
        if (!response.ok) {
          console.error("[Audio Queue] Fallback TTS fetch failed:", response.status);
          return false;
        }
        
        const blob = await response.blob();
        // Use data URL instead of blob URL to avoid CSP issues
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        console.log("[Audio Queue] Using data URL fallback");
        return await tryPlayAudio(dataUrl, false);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          console.log("[Audio Queue] Fallback fetch aborted");
        } else {
          console.error("[Audio Queue] Fallback error:", err);
        }
        return false;
      }
    };

    try {
      let audioUrl: string;

      if (item.source === "url") {
        audioUrl = item.data;
        console.log("[Audio Queue] Using preloaded URL:", audioUrl ? audioUrl.slice(0, 50) + "..." : "EMPTY!");
        
        // Validate URL before trying to play
        if (!audioUrl || audioUrl.length === 0) {
          console.error("[Audio Queue] Preloaded URL is empty, falling back to fresh fetch");
          // Skip to fallback
          const fallbackSuccess = await fetchAndPlayFallback();
          if (!fallbackSuccess && !isClosingRef.current) {
            throw new Error("Audio playback failed");
          }
          return;
        }

        // Try the preloaded blob URL first (don't revoke it - the preloader manages it)
        const success = await tryPlayAudio(audioUrl, false);
        
        if (!success && !isClosingRef.current) {
          console.log("[Audio Queue] Preloaded URL failed, fetching fresh audio...");
          const fallbackSuccess = await fetchAndPlayFallback();
          
          if (!fallbackSuccess && !isClosingRef.current) {
            throw new Error("Audio playback failed with all methods");
          }
        }
        return;
      } else if (item.source === "base64") {
        console.log("[Audio Queue] Decoding base64 audio");
        const binaryString = atob(item.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/wav" });
        audioUrl = URL.createObjectURL(blob);
      } else {
        // fetch mode - item.data is either plain text or JSON with title/content
        let requestBody: Record<string, string>;

        // Try to parse as JSON for structured data (title + content)
        try {
          const parsed = JSON.parse(item.data);
          if (parsed.questionTitle !== undefined || parsed.questionContent !== undefined) {
            requestBody = {
              questionTitle: parsed.questionTitle || "",
              questionContent: parsed.questionContent || ""
            };
            console.log("[Audio Queue] Fetching TTS for question:", parsed.questionTitle?.slice(0, 50));
          } else {
            requestBody = { question: item.data };
            console.log("[Audio Queue] Fetching TTS for text:", item.data.slice(0, 50));
          }
        } catch {
          // Plain text - use as question
          requestBody = { question: item.data };
          console.log("[Audio Queue] Fetching TTS for plain text:", item.data.slice(0, 50));
        }

        // Create abort controller for this fetch
        audioAbortControllerRef.current = new AbortController();

        console.log("[Audio Queue] Calling /api/interview/speak...");
        const response = await fetch("/api/interview/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: audioAbortControllerRef.current.signal,
        });
        
        // Check if panel closed while fetching
        if (isClosingRef.current) {
          console.log("[Audio Queue] Panel closed during fetch, aborting");
          isPlayingRef.current = false;
          setIsSpeaking(false);
          return;
        }
        
        if (!response.ok) {
          console.error("[Audio Queue] TTS failed:", response.status, response.statusText);
          throw new Error("TTS failed");
        }
        console.log("[Audio Queue] TTS response OK, creating blob URL");
        const blob = await response.blob();
        audioUrl = URL.createObjectURL(blob);
      }

      // Final check before playing - ensure panel is still open
      if (isClosingRef.current) {
        console.log("[Audio Queue] Panel closed before play, aborting");
        isPlayingRef.current = false;
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        return;
      }

      console.log("[Audio Queue] Creating Audio element for playback");
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener("timeupdate", () => {
        if (audio.duration) {
          setSpeakingProgress((audio.currentTime / audio.duration) * 100);
        }
      });

      audio.addEventListener("ended", () => {
        console.log("[Audio] Playback ended");
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        isPlayingRef.current = false;
        setIsSpeaking(false);
        setSpeakingProgress(0);
        
        // Don't continue if panel is closing
        if (isClosingRef.current) return;
        
        item.onComplete?.();

        // Process next item in queue, or auto-listen if queue is empty
        if (audioQueueRef.current.length > 0) {
          processNextInQueue();
        } else {
          triggerAutoListen();
        }
      });

      audio.addEventListener("error", () => {
        console.error("[Audio] Error:", audio.error?.code, audio.error?.message);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        isPlayingRef.current = false;
        setIsSpeaking(false);
        
        // Don't continue if panel is closing
        if (isClosingRef.current) return;
        
        item.onComplete?.();

        if (audioQueueRef.current.length > 0) {
          processNextInQueue();
        } else {
          triggerAutoListen();
        }
      });

      audio.addEventListener("pause", () => {
        // If paused externally, consider it done
        isPlayingRef.current = false;
        setIsSpeaking(false);
      });

      // Try to play - handle autoplay restrictions
      console.log("[Audio Queue] Attempting to play audio...");
      try {
        await audio.play();
        console.log("[Audio Queue] Audio playback started successfully");
      } catch (playError) {
        console.error("[Audio Queue] Initial play failed:", playError);
        
        // Try playing with a small delay (helps with some browsers)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          await audio.play();
          console.log("[Audio Queue] Delayed play succeeded");
        } catch (retryError) {
          console.error("[Audio Queue] Retry also failed:", retryError);
          
          // Set up a click handler to resume playback on user interaction
          const resumePlayback = async () => {
            document.removeEventListener("click", resumePlayback);
            try {
              await audio.play();
              console.log("[Audio Queue] Play succeeded after user interaction");
            } catch (e) {
              console.error("[Audio Queue] Play still failed after interaction:", e);
              // Give up and proceed
              URL.revokeObjectURL(audioUrl);
              audioRef.current = null;
              isPlayingRef.current = false;
              setIsSpeaking(false);
              if (!isClosingRef.current) {
                item.onComplete?.();
                if (audioQueueRef.current.length > 0) {
                  processNextInQueue();
                } else {
                  triggerAutoListen();
                }
              }
            }
          };
          
          // Listen for next click to resume audio
          document.addEventListener("click", resumePlayback, { once: true });
          console.log("[Audio Queue] Waiting for user interaction to play audio...");
          return; // Don't call onComplete yet - wait for user interaction
        }
      }
    } catch (err) {
      // Ignore abort errors - they're expected when closing
      if (err instanceof Error && err.name === "AbortError") {
        console.log("[Audio Queue] Fetch aborted (expected during close)");
        isPlayingRef.current = false;
        setIsSpeaking(false);
        return;
      }
      console.error("[Audio Queue] Error:", err);
      isPlayingRef.current = false;
      setIsSpeaking(false);
      
      // Don't continue if panel is closing
      if (isClosingRef.current) return;
      
      item.onComplete?.();
      processNextInQueue();
    }
  }, []);

  const queueAudio = useCallback((item: Omit<AudioQueueItem, "id">) => {
    const queueItem: AudioQueueItem = {
      ...item,
      id: Date.now().toString(),
      mountId: item.mountId || activeMountIdRef.current || undefined,
    };
    audioQueueRef.current.push(queueItem);
    console.log("[Audio Queue] Queued item:", queueItem.id, "source:", item.source, "mountId:", queueItem.mountId?.slice(-8), "queue length:", audioQueueRef.current.length);

    // Start processing if not already playing
    if (!isPlayingRef.current) {
      console.log("[Audio Queue] Starting queue processing");
      processNextInQueue();
    } else {
      console.log("[Audio Queue] Already playing, item will wait in queue");
    }
  }, [processNextInQueue]);

  const speakText = useCallback((text: string, onComplete?: () => void, mountId?: string) => {
    queueAudio({ source: "fetch", data: text, onComplete, mountId });
  }, [queueAudio]);

  const playAudioUrl = useCallback((url: string, onComplete?: () => void, mountId?: string) => {
    queueAudio({ source: "url", data: url, onComplete, mountId });
  }, [queueAudio]);

  const playBase64Audio = useCallback((base64: string, onComplete?: () => void, mountId?: string) => {
    queueAudio({ source: "base64", data: base64, onComplete, mountId });
  }, [queueAudio]);

  /**
   * Trigger auto-listen after AI finishes speaking
   * This creates the hands-free conversation experience
   * Uses refs to avoid stale closure issues in setTimeout
   */
  const triggerAutoListen = useCallback(() => {
    // Don't auto-listen if panel is closing
    if (isClosingRef.current) {
      console.log("[Auto-Listen] Panel closing, skipping");
      return;
    }
    
    // Only auto-listen in conversational states (use refs for current values)
    if (!autoListenEnabledRef.current) {
      console.log("[Auto-Listen] Disabled, skipping");
      return;
    }

    const currentPanelState = panelStateRef.current;
    if (currentPanelState !== "coding" && currentPanelState !== "review" && currentPanelState !== "followup") {
      console.log("[Auto-Listen] Not in conversational state:", currentPanelState);
      return;
    }

    const currentRecordingState = conversationRecordingStateRef.current;
    if (currentRecordingState !== "idle") {
      console.log("[Auto-Listen] Already recording or processing:", currentRecordingState);
      return;
    }

    // Clear any existing delay
    if (autoListenDelayRef.current) {
      clearTimeout(autoListenDelayRef.current);
    }

    console.log("[Auto-Listen] Scheduling auto-listen in 800ms...");

    // Delay before starting to listen (800ms per design spec for natural conversation flow)
    autoListenDelayRef.current = setTimeout(() => {
      // Double-check state hasn't changed using refs (including closing state)
      if (isClosingRef.current) return;
      
      const stillIdle = conversationRecordingStateRef.current === "idle";
      const notPlaying = !isPlayingRef.current;
      const queueEmpty = audioQueueRef.current.length === 0;
      const enabled = autoListenEnabledRef.current;

      console.log("[Auto-Listen] Timeout fired. idle:", stillIdle, "notPlaying:", notPlaying, "queueEmpty:", queueEmpty, "enabled:", enabled);

      if (enabled && stillIdle && notPlaying && queueEmpty) {
        console.log("[Auto-Listen] Starting to listen...");
        setConversationRecordingState("listening");
      }
    }, 800); // 800ms delay per design spec - allows natural speech pauses
  }, []); // No dependencies - uses refs for all values

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  // Request microphone permission immediately on mount
  // This ensures the permission prompt appears as soon as the user enters the interview
  useEffect(() => {
    const requestMicrophonePermission = async () => {
      try {
        console.log("[Init] Requesting microphone permission...");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        // Store the stream for later use
        streamRef.current = stream;

        const tracks = stream.getAudioTracks();
        console.log("[Init] Microphone permission granted. Tracks:", tracks.length);
        console.log("[Init] Track settings:", tracks[0]?.getSettings());
      } catch (err) {
        console.error("[Init] Microphone permission denied:", err);
        setError("Microphone access is required for the interview. Please allow microphone access and refresh.");
      }
    };

    requestMicrophonePermission();

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Stop audio playback on page reload/navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      // Clear the audio queue
      audioQueueRef.current = [];
      // Stop media recorder
      if (conversationMediaRecorderRef.current?.state === "recording") {
        conversationMediaRecorderRef.current.stop();
      }
      // Stop microphone stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Also run cleanup on unmount
      handleBeforeUnload();
    };
  }, []);

  // Animate panel in on initial mount
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  // Track interview started - only once per question
  useEffect(() => {
    if (hasTrackedStartRef.current === question.id) return;
    hasTrackedStartRef.current = question.id;
    interviewStartTimeRef.current = Date.now(); // Reset timer for new question
    
    track({
      name: "interview_started",
      properties: {
        type: "coding",
        company: question.companyName ?? "unknown",
        question_id: question.id,
        question_title: question.title,
      },
    });
  }, [question.id, question.companyName, question.title]);

  // Reset closing state when question changes (navigation completed)
  // Skip on initial mount to avoid conflicting with the animation effect above
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    // Only reset on subsequent question changes (navigation)
    isClosingRef.current = false;
    setIsClosing(false);
    setIsVisible(true);
  }, [question.id]);

  // Store preloadedAudioUrl in a ref to avoid effect re-runs when prefetch completes
  const preloadedAudioUrlRef = useRef(preloadedAudioUrl);
  
  useEffect(() => {
    preloadedAudioUrlRef.current = preloadedAudioUrl;
  }, [preloadedAudioUrl]);

  // Initialize greeting flow - start listening for "hello"
  useEffect(() => {
    // Track if this effect instance was cleaned up (React Strict Mode runs effects twice)
    let wasCleanedUp = false;
    
    // Generate unique mount ID for this effect instance
    const mountId = `mount-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    activeMountIdRef.current = mountId;
    console.log("[Init] New mount:", mountId);
    
    // Skip if already played for this question
    if (initialQuestionPlayedRef.current) {
      return;
    }

    // Mark as initialized immediately to prevent duplicate runs
    initialQuestionPlayedRef.current = true;
    console.log("[Init] Awaiting greeting for question:", question.title);
    
    // Start listening for greeting
    panelStateRef.current = "awaiting_greeting";
    setPanelState("awaiting_greeting");
    setConversationRecordingState("listening");
    
    return () => {
      console.log("[Init] Cleanup for mount:", mountId);
      wasCleanedUp = true;
      // Invalidate this mount so any pending audio from it won't play
      if (activeMountIdRef.current === mountId) {
        activeMountIdRef.current = null;
      }
      // Stop streaming speech if it was started
      streamingSpeechStop();
      // Stop any in-progress audio playback and fetches
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (audioAbortControllerRef.current) {
        audioAbortControllerRef.current.abort();
        audioAbortControllerRef.current = null;
      }
      // Reset playing state so second mount can start fresh
      isPlayingRef.current = false;
      // Clear audio queue to remove items with stale onComplete closures
      audioQueueRef.current = [];
      // Reset so the next mount can queue fresh audio
      initialQuestionPlayedRef.current = false;
    };
  }, [question.id, streamingSpeechStop]);

  /**
   * Handle greeting detection and transition to speaking state
   * Called when user's transcribed speech is detected as a greeting
   * The AI now greets AND presents the question in a single unified response
   */
  const handleGreetingDetected = useCallback(async (greetingText: string) => {
    console.log("[Greeting] Detected greeting:", greetingText);
    
    // CRITICAL: Check if streaming already handled the greeting
    // This prevents duplicate audio playback
    if (streamingGreetingTriggeredRef.current) {
      console.log("[Greeting] Streaming already handled, skipping handleGreetingDetected");
      return;
    }
    
    // Stop recording
    if (conversationMediaRecorderRef.current?.state === "recording") {
      conversationMediaRecorderRef.current.stop();
    }
    
    // Cleanup audio analysis resources inline (avoid circular dependency)
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { });
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    silenceStartRef.current = null;
    setAudioLevel(0);
    
    // Clean up stream to prevent resource leaks
    // (greeting flow will request a new stream when auto-listen triggers)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setConversationRecordingState("processing");
    
    // Show visual feedback that greeting was detected
    setIsProcessingGreeting(true);
    
    // Request AI greeting + question via conversation API (unified response)
    try {
      const response = await streamingConversation.sendMessage({
        questionTitle: question.title,
        questionContent: question.prompt,
        userMessage: greetingText,
        conversationHistory: [],
        interviewState: "greeting",
      });
      
      if (response?.fullText) {
        // Add greeting+question exchange to conversation
        setConversation([
          { role: "candidate", content: greetingText, timestamp: Date.now() },
          { role: "interviewer", content: response.fullText, timestamp: Date.now() },
        ]);
      }
      
      // Transition to speaking state once AI starts responding
      panelStateRef.current = "speaking";
      setPanelState("speaking");
      setIsSpeaking(true);
      setIsProcessingGreeting(false);
      
      // Wait for unified greeting+question audio to finish playing
      const waitForGreetingAudio = (): Promise<void> => {
        return new Promise((resolve) => {
          const checkAudio = () => {
            if (!streamingConversation.isStreaming && !streamingConversation.isPlaying) {
              console.log("[Greeting] Unified greeting+question audio finished");
              resolve();
            } else {
              setTimeout(checkAudio, 100);
            }
          };
          setTimeout(checkAudio, 300);
        });
      };
      
      await waitForGreetingAudio();
      
      // Transition directly to coding state (question was included in greeting)
      console.log("[Greeting] Complete, transitioning to coding");
      setIsSpeaking(false);
      panelStateRef.current = "coding";
      setPanelState("coding");
      
      // Reset recording state to idle so triggerAutoListen can proceed
      conversationRecordingStateRef.current = "idle";
      setConversationRecordingState("idle");
      
      setTimeout(() => triggerAutoListen(), 100);
    } catch (err) {
      console.error("[Greeting] Failed to get AI greeting+question:", err);
      setIsProcessingGreeting(false);
      // On error, return to awaiting_greeting state so user can try again
      conversationRecordingStateRef.current = "listening";
      setConversationRecordingState("listening");
    }
  }, [question.title, question.prompt, streamingConversation, triggerAutoListen]);

  // Keep ref in sync for use in pauseRecording
  useEffect(() => {
    handleGreetingDetectedRef.current = handleGreetingDetected;
  }, [handleGreetingDetected]);

  /**
   * Process greeting transcription result
   * Checks if the transcribed text is a greeting and handles accordingly
   */
  const processGreetingTranscript = useCallback(async (transcript: string) => {
    if (!transcript || panelStateRef.current !== "awaiting_greeting") {
      return;
    }
    
    if (isGreeting(transcript)) {
      await handleGreetingDetected(transcript);
    } else {
      // Not a greeting, keep listening
      console.log("[Greeting] Not recognized as greeting:", transcript);
      setConversationRecordingState("listening");
    }
  }, [handleGreetingDetected]);

  // Load previous interview
  useEffect(() => {
    const previous = getCodingInterview(question.id);
    if (previous) {
      setEvaluation(previous.evaluation);
      setCode(previous.code);
      setLanguage(getSupportedLanguage(previous.language));
    }
  }, [question.id]);

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO CLEANUP UTILITIES (defined early for use in handlers)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Clean up audio analysis resources
   */
  const cleanupAudioAnalysis = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    // Check state before closing to avoid errors on already-closed context
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close().catch(() => { });
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    silenceStartRef.current = null;
    setAudioLevel(0);
  }, []);

  /**
   * Clear continuation timeout and reset auto-send flag
   */
  const clearContinuationTimeout = useCallback(() => {
    if (continuationTimeoutRef.current) {
      clearTimeout(continuationTimeoutRef.current);
      continuationTimeoutRef.current = null;
    }
    shouldAutoSendRef.current = false; // Always reset flag when clearing timeout
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleClose = useCallback(() => {
    // Track interview closed (use refs for current values to avoid stale closures)
    track({
      name: "interview_closed",
      properties: {
        type: "coding",
        company: questionCompanyNameRef.current ?? "unknown",
        question_id: questionIdRef.current,
        completed: evaluationRef.current !== null,
      },
    });

    // IMMEDIATELY mark as closing to prevent any new audio/actions
    isClosingRef.current = true;
    
    setIsClosing(true);
    setIsVisible(false);
    
    // Stop all audio immediately - this aborts any in-flight TTS fetches
    clearAudioQueue();
    
    // Stop streaming speech (initial question) and conversation
    streamingSpeechStop();
    streamingConversation.abort();
    setStreamingText("");

    // Clear any pending auto-listen timeout
    if (autoListenDelayRef.current) {
      clearTimeout(autoListenDelayRef.current);
      autoListenDelayRef.current = null;
    }

    // Abort any pending evaluation requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clean up media resources to release microphone
    clearContinuationTimeout();
    cleanupAudioAnalysis();
    if (conversationMediaRecorderRef.current?.state === "recording") {
      conversationMediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Save conversation progress before closing (if we have an evaluation)
    // This ensures follow-up Q&A is not lost
    if (evaluation) {
      const conversationForStorage = conversation.map(turn => ({
        role: turn.role,
        content: turn.content
      }));
      saveInterview(question.id, evaluation, code, language, undefined, conversationForStorage);
    }

    if (activeSessionId === sessionIdRef.current) {
      activeSessionId = null;
    }

    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose, clearAudioQueue, streamingSpeechStop, streamingConversation, clearContinuationTimeout, cleanupAudioAnalysis, evaluation, conversation, question.id, code, language]);

  const handleTryAgain = useCallback(() => {
    clearAudioQueue();
    initialQuestionPlayedRef.current = false;

    // Stop any active recording and clean up media resources
    clearContinuationTimeout();
    cleanupAudioAnalysis();
    pendingTranscriptRef.current = ""; // Sync clear to prevent stale reads
    setPendingTranscript("");
    conversationChunksRef.current = [];
    if (conversationMediaRecorderRef.current?.state === "recording") {
      conversationMediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Reset all state for a fresh attempt
    setEvaluation(null);
    setConversation([]);
    setFollowUpCount(0);
    setCurrentFollowUp(null);
    setIsConversing(false);
    setConversationRecordingState("idle");
    setError(null);

    // Reset code to starter
    const lang = getSupportedLanguage(question.language);
    setLanguage(lang);
    setCode(question.starterCode || DEFAULT_STARTER_CODE[lang]);

    // Go back to coding state (skip intro on retry)
    setPanelState("coding");
  }, [clearAudioQueue, clearContinuationTimeout, cleanupAudioAnalysis, question.language, question.starterCode]);

  const handleNavigation = useCallback((direction: "next" | "prev") => {
    // Mark as closing to prevent any pending callbacks from firing
    isClosingRef.current = true;
    
    clearAudioQueue();
    initialQuestionPlayedRef.current = false;

    // Stop streaming speech and conversation
    streamingSpeechStop();
    streamingConversation.abort();
    setStreamingText("");

    // Clear any pending auto-listen timeout (same as handleClose)
    if (autoListenDelayRef.current) {
      clearTimeout(autoListenDelayRef.current);
      autoListenDelayRef.current = null;
    }

    if (activeSessionId === sessionIdRef.current) {
      activeSessionId = null;
    }

    // Stop any active recording and clean up media resources
    clearContinuationTimeout();
    cleanupAudioAnalysis();
    pendingTranscriptRef.current = ""; // Sync clear to prevent stale reads
    setPendingTranscript("");
    conversationChunksRef.current = [];
    if (conversationMediaRecorderRef.current?.state === "recording") {
      conversationMediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Reset state
    setEvaluation(null);
    setConversation([]);
    setFollowUpCount(0);
    setCurrentFollowUp(null);
    setIsConversing(false);
    setConversationRecordingState("idle");
    setPanelState("speaking");

    if (direction === "next" && onNext) {
      onNext();
    } else if (direction === "prev" && onPrev) {
      onPrev();
    }
  }, [onNext, onPrev, clearAudioQueue, streamingSpeechStop, streamingConversation, clearContinuationTimeout, cleanupAudioAnalysis]);

  const skipToCode = useCallback(() => {
    clearAudioQueue();
    streamingSpeechStop();
    
    // Stop any active recording
    if (conversationMediaRecorderRef.current?.state === "recording") {
      conversationMediaRecorderRef.current.stop();
    }
    cleanupAudioAnalysis();
    clearContinuationTimeout();
    setConversationRecordingState("idle");
    
    // Update ref synchronously for triggerAutoListen
    panelStateRef.current = "coding";
    setPanelState("coding");
    // Trigger auto-listen since we're now in coding state
    triggerAutoListen();
  }, [clearAudioQueue, streamingSpeechStop, cleanupAudioAnalysis, clearContinuationTimeout, triggerAutoListen]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CODE SUBMISSION & EVALUATION
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSubmitCode = async () => {
    if (!code.trim() || code.trim().length < 10) {
      setError("Please write at least 10 characters of code");
      return;
    }

    // Stop any playing audio before processing
    clearAudioQueue();
    setPanelState("processing");
    setProcessingStep("Analyzing your code...");
    abortControllerRef.current = new AbortController();

    try {
      // Submit code with full conversation history for evaluation
      // The conversationHistory captures the user's thinking process, questions asked,
      // and how they responded to guidance - this factors into the Problem-Solving score
      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${question.title}\n\n${question.prompt}`,
          code,
          language,
          difficulty: question.difficultyLabel,
          expectedComplexity: question.expectedComplexity,
          conversationHistory: conversation,  // Full thinking/questioning process
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Evaluation failed");

      const data = await response.json();
      setEvaluation(data.evaluation);

      // Track interview completed
      track({
        name: "interview_completed",
        properties: {
          type: "coding",
          company: question.companyName ?? "unknown",
          question_id: question.id,
          score: data.evaluation.overallScore,
          duration_seconds: Math.floor((Date.now() - interviewStartTimeRef.current) / 1000),
        },
      });

      // Save to localStorage with conversation history for future reference
      // Convert ConversationTurn[] to the storage format
      const conversationForStorage = conversation.map(turn => ({
        role: turn.role,
        content: turn.content
      }));
      saveInterview(question.id, data.evaluation, code, language, undefined, conversationForStorage);
      onScoreUpdate?.(question.id, data.evaluation.overallScore);

      // Save to progress tracking (async, don't block)
      fetch("/api/progress/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "coding",
          evaluation: data.evaluation,
        }),
      }).catch(err => console.warn("[Progress] Failed to save progress:", err));

      // Speak feedback
      setProcessingStep("Generating feedback...");
      await speakFeedbackAndFollowUp(data.evaluation);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Failed to evaluate code. Please try again.");
      setPanelState("coding");
    }
  };

  const speakFeedbackAndFollowUp = async (evalResult: CodingEvaluationResult) => {
    const score = evalResult.overallScore;
    const verdict = score >= 4 ? "Strong work!" : score >= 3 ? "Good effort." : "Let's talk about some improvements.";

    const feedbackText = `Alright, I've reviewed your solution. ${verdict} Your score is ${score.toFixed(1)} out of 5. ${evalResult.overallFeedback || ""}`;

    speakText(feedbackText, () => {
      // After feedback, decide whether to ask follow-up or show final feedback
      // Use conversationRef.current to get latest conversation state at execution time
      // (callback executes asynchronously after audio playback, conversation may have changed)
      const currentConversation = conversationRef.current;
      if (followUpCount < MAX_FOLLOWUPS) {
        generateFollowUp("", currentConversation);
      } else {
        // All follow-ups complete - save final conversation state
        const conversationForStorage = currentConversation.map(turn => ({
          role: turn.role,
          content: turn.content
        }));
        saveInterview(question.id, evalResult, code, language, undefined, conversationForStorage);
        setPanelState("feedback");
      }
    });

    setPanelState("review");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FOLLOW-UP QUESTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a follow-up question based on the conversation
   * Memoized to prevent stale closures and cascading dependency updates
   */
  const generateFollowUp = useCallback(async (lastResponse: string, conv: ConversationTurn[]) => {
    setFollowUpCount(prev => prev + 1);
    setProcessingStep("Thinking of a follow-up question...");

    try {
      const response = await fetch("/api/interview/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationHistory: conv,
          code,
          language,
          questionTitle: question.title,
          questionContent: question.prompt,
          previousEvaluation: evaluation,  // Backend expects "previousEvaluation" key
        }),
      });

      if (!response.ok) {
        setPanelState("feedback");
        return;
      }

      const data = await response.json();
      setCurrentFollowUp(data.followUpQuestion);

      // Add to conversation history
      setConversation(prev => [...prev, {
        role: "interviewer" as const,
        content: data.followUpQuestion,
        timestamp: Date.now()
      }]);

      // Speak follow-up question
      speakText(data.followUpQuestion, () => {
        // Update ref synchronously so triggerAutoListen (called next by processNextInQueue) sees correct state
        panelStateRef.current = "followup";
        setPanelState("followup");
      });
    } catch {
      setPanelState("feedback");
    }
  }, [code, language, question.title, question.prompt, evaluation, speakText]);

  /**
   * Skip to final results/feedback
   */
  const skipToResults = () => {
    clearAudioQueue();
    setPanelState("feedback");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // UNIFIED CONVERSATION SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════

  // Scroll to bottom of conversation when new messages arrive
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  // Sync streaming text from the hook for real-time display
  useEffect(() => {
    if (streamingConversation.currentText) {
      setStreamingText(streamingConversation.currentText);
    }
  }, [streamingConversation.currentText]);

  /**
   * Send a message to the conversational AI with streaming response
   * Uses sentence-based TTS for ~50-70% lower perceived latency
   * 
   * Flow:
   * 1. Text streams in real-time as LLM generates
   * 2. First sentence audio plays while LLM still generating
   * 3. Subsequent sentences queued and played in order
   */
  const sendConversationMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isConversing) return;

    // Stop any playing audio before processing
    clearAudioQueue();
    streamingConversation.stopAudio();
    setIsConversing(true);
    setStreamingText("");

    // Add user message to conversation immediately for UI display
    const userTurn: ConversationTurn = {
      role: "candidate",
      content: userMessage.trim(),
      timestamp: Date.now()
    };
    // Keep previous conversation for API (excludes current message to avoid duplication)
    const previousConversation = [...conversation];
    setConversation(prev => [...prev, userTurn]);

    try {
      // Use streaming API for low-latency response
      const result = await streamingConversation.sendMessage({
        questionTitle: question.title,
        questionContent: question.prompt,
        userMessage: userMessage.trim(),
        conversationHistory: previousConversation,
        code,
        language,
        evaluation: evaluation || undefined,
        interviewState: panelState
      });

      if (!result) {
        throw new Error("Failed to get response");
      }

      // Add AI response to conversation (full text after streaming completes)
      const aiTurn: ConversationTurn = {
        role: "interviewer",
        content: result.fullText,
        timestamp: Date.now()
      };
      setConversation(prev => [...prev, aiTurn]);
      setStreamingText(""); // Clear streaming text now that it's in conversation

      // If in followup state, continue the follow-up flow after response
      if (panelState === "followup") {
        // Build the full conversation including user turn and AI response
        const fullConversation = [...previousConversation, userTurn, aiTurn];
        
        // After the conversational response, generate the next follow-up question
        // Note: followUpCount is incremented inside generateFollowUp
        if (followUpCount < MAX_FOLLOWUPS) {
          // Wait for audio to finish, then generate next follow-up
          setTimeout(() => {
            generateFollowUp(userMessage, fullConversation);
          }, 1500); // Small delay to let the conversational response play
        } else {
          // Max follow-ups reached - save final conversation state before showing feedback
          if (evaluation) {
            const conversationForStorage = fullConversation.map(turn => ({
              role: turn.role,
              content: turn.content
            }));
            saveInterview(question.id, evaluation, code, language, undefined, conversationForStorage);
          }
          // Show feedback
          setTimeout(() => {
            setPanelState("feedback");
          }, 2000);
        }
      }
    } catch (err) {
      setError("Failed to get response. Please try again.");
      // Remove the user message if we couldn't get a response
      setConversation(prev => prev.slice(0, -1));
    } finally {
      setIsConversing(false);
      setStreamingText("");
    }
  }, [
    isConversing,
    clearAudioQueue,
    streamingConversation,
    conversation,
    question.id,
    question.title,
    question.prompt,
    code,
    language,
    evaluation,
    panelState,
    followUpCount,
    generateFollowUp
  ]);

  /**
   * Monitor audio levels for silence detection
   * Uses a ref for pauseRecording to avoid stale closure issues
   */
  const pauseRecordingRef = useRef<() => Promise<void>>();
  const handleGreetingDetectedRef = useRef<(text: string) => Promise<void>>();

  const startAudioLevelMonitoring = useCallback(async (stream: MediaStream) => {
    try {
      console.log("[Audio] Starting audio level monitoring...");

      // Clean up existing audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const audioContext = new AudioContext();

      // Resume AudioContext if suspended (browsers block until user interaction)
      if (audioContext.state === 'suspended') {
        console.log("[Audio] AudioContext suspended, resuming...");
        await audioContext.resume();
      }

      console.log("[Audio] AudioContext state:", audioContext.state);

      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      // Configure analyser for balanced sensitivity
      // -80dB captures quieter speech, more sensitive for various microphones
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5; // Less smoothing = more responsive to speech
      analyser.minDecibels = -80; // More sensitive - captures quieter voices
      analyser.maxDecibels = -10;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let frameCount = 0;

      const checkAudioLevel = () => {
        if (!analyserRef.current || !audioContextRef.current) {
          console.log("[Audio] Analyser or context gone, stopping monitoring");
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = average / 255;
        setAudioLevel(normalizedLevel);

        // Log every 30 frames (~0.5 seconds) for debugging
        frameCount++;
        if (frameCount % 30 === 0) {
          console.log("[Audio] Level:", normalizedLevel.toFixed(3), "Avg raw:", average.toFixed(1));
        }

        // Silence/speech detection with noise gate
        // Audio must exceed SPEECH_THRESHOLD to be considered active speech
        // Audio below SILENCE_THRESHOLD triggers silence detection
        // This creates a "noise gate" effect that ignores background noise
        const isActiveSpeech = normalizedLevel >= SPEECH_THRESHOLD;
        const isSilent = normalizedLevel < SILENCE_THRESHOLD;
        
        if (isSilent) {
          if (!silenceStartRef.current) {
            silenceStartRef.current = Date.now();
          } else {
            // Use shorter silence duration during greeting for faster response
            const effectiveSilenceDuration = panelStateRef.current === "awaiting_greeting" 
              ? GREETING_SILENCE_DURATION // 1.2s - allows streaming transcription to connect
              : SILENCE_DURATION;
            
            if (Date.now() - silenceStartRef.current > effectiveSilenceDuration) {
              console.log("[Audio] Silence detected, auto-pausing");
              // Auto-pause after silence
              // The pauseRecording function is async - we call it and let it handle
              // transcription in the background. The return statement stops the monitoring loop.
              // Using void to explicitly indicate we're intentionally not awaiting.
              if (pauseRecordingRef.current) {
                void pauseRecordingRef.current().catch(err => 
                  console.error("[Audio] Pause recording error:", err)
                );
              }
              return; // Stop monitoring loop - pauseRecording handles state transition
            }
          }
        } else if (isActiveSpeech) {
          // Clear silence timer when active speech is detected
          silenceStartRef.current = null;
          // Mark that we detected actual speech (not just background noise)
          speechDetectedRef.current = true;
        }
        // Audio between SILENCE_THRESHOLD and SPEECH_THRESHOLD is ambiguous
        // We keep the silence timer running but don't reset it (noise gate behavior)

        requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
      console.log("[Audio] Audio level monitoring started");
    } catch (err) {
      console.error("[Audio] Audio level monitoring failed:", err);
    }
  }, []);

  /**
   * Check if transcript is likely a Whisper hallucination
   * Whisper often generates these phrases when given silence or background noise
   */
  const isLikelyHallucination = (text: string): boolean => {
    if (!text) return true;
    
    const normalized = text.toLowerCase().trim();
    const cleanedWord = normalized.replace(/[.!?,]$/, "");
    
    // Check allowed single words FIRST (before length check)
    // This ensures short greeting words like "hi", "hey", "ok", "sup" are not filtered
    const allowedSingleWords = [
      "yes", "no", "sure", "correct", "right", "wrong", "done", "finished", "ready", "help",
      // Greeting words - important for "Say Hello to Start" flow (must match greetingDetection.ts)
      "hello", "hi", "hey", "howdy", "greetings", "start", "begin", "okay", "ok", "yeah", "yep", "sup"
    ];
    
    if (allowedSingleWords.includes(cleanedWord)) {
      console.log("[Transcribe] Allowed word:", text);
      return false;
    }
    
    // Very short responses (under 4 chars) are almost always hallucinations
    // This check runs AFTER allowed words check
    if (normalized.length < 4) {
      console.log("[Transcribe] Filtered - too short:", text);
      return true;
    }
    
    // Single word responses are usually hallucinations unless they're meaningful
    const words = normalized.split(/\s+/);
    if (words.length === 1) {
      // Single word not in allowed list - filter it
      console.log("[Transcribe] Filtered - single word:", text);
      return true;
    }
    
    // Common Whisper hallucination patterns (partial matching)
    const hallucinationPatterns = [
      /^thanks?\s*(for\s*)?(watching|listening|viewing)/i,
      /subscribe/i,
      /like\s*(and|&)\s*subscribe/i,
      /see\s*you\s*(next|later|soon)/i,
      /\botter\.ai\b/i,
      /transcribed\s*by/i,
      /^beep\.?$/i,
      /^\[.*\]$/,  // [music], [applause], etc.
      /^\(.*\)$/,  // (music), (silence), etc.
      /^\.{2,}$/,  // "...", "...."
      /^music\.?$/i,
      /^the\s*end\.?$/i,
      /^bye\.?$/i,
      /^goodbye\.?$/i,
      /^hello\.?$/i,
      /^hey\.?$/i,
      /^you\.?$/i,
      /^i\.?$/i,
      /^okay\.?$/i,
      /^ok\.?$/i,
      /^um+\.?$/i,
      /^uh+\.?$/i,
      /^hmm+\.?$/i,
      /^mm+\.?$/i,
      /^ah+\.?$/i,
      /^oh+\.?$/i,
      /^huh\.?$/i,
      /^mhm+\.?$/i,
      /^yeah\.?$/i,
      /^yep\.?$/i,
      /^nope\.?$/i,
      /^nah\.?$/i,
      /^wow\.?$/i,
      /^whoa\.?$/i,
      /please\s*subscribe/i,
      /don'?t\s*forget\s*to/i,
      /hit\s*the\s*(like|bell)/i,
      /comment\s*(below|down)/i,
      /^\s*$/,  // Empty or whitespace only
    ];
    
    for (const pattern of hallucinationPatterns) {
      if (pattern.test(normalized)) {
        console.log("[Transcribe] Filtered hallucination:", text, "matched:", pattern);
        return true;
      }
    }
    
    // Repeated characters/words are often hallucinations
    if (/^(.)\1{3,}$/.test(normalized)) {
      console.log("[Transcribe] Filtered - repeated chars:", text);
      return true;
    }
    if (/^(\w+\s*)\1{2,}$/.test(normalized)) {
      console.log("[Transcribe] Filtered - repeated words:", text);
      return true;
    }
    
    return false;
  };

  /**
   * Transcribe the current recording chunk
   */
  const transcribeCurrentChunk = async (): Promise<string | null> => {
    if (conversationChunksRef.current.length === 0) {
      console.log("[Transcribe] No audio chunks to transcribe");
      return null;
    }

    // Only transcribe if actual speech was detected (not just background noise)
    if (!speechDetectedRef.current) {
      console.log("[Transcribe] No speech detected during recording, skipping transcription");
      return null;
    }

    // Check minimum recording duration to avoid transcribing noise/clicks
    const recordingDuration = Date.now() - recordingStartTimeRef.current;
    if (recordingDuration < MIN_RECORDING_DURATION) {
      console.log("[Transcribe] Recording too short:", recordingDuration, "ms, skipping");
      return null;
    }

    const mimeType = conversationMediaRecorderRef.current?.mimeType || "audio/webm";
    const recordedBlob = new Blob(conversationChunksRef.current, { type: mimeType });
    
    // Check blob size - very small blobs are unlikely to contain real speech
    if (recordedBlob.size < 1000) {
      console.log("[Transcribe] Audio blob too small:", recordedBlob.size, "bytes, skipping");
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("audio", recordedBlob, "conversation.webm");

      const transcribeResponse = await fetch("/api/interview/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error("Transcription failed");
      }

      const { transcript } = await transcribeResponse.json();
      const trimmed = transcript?.trim() || null;
      
      // Filter out likely hallucinations
      if (trimmed && isLikelyHallucination(trimmed)) {
        return null;
      }
      
      console.log("[Transcribe] Got transcript:", trimmed);
      return trimmed;
    } catch (err) {
      console.error("Transcription error:", err);
      return null;
    }
  };

  // Use a ref to track if we should auto-send when continuation timer expires
  const shouldAutoSendRef = useRef(false);
  const pendingTranscriptRef = useRef<string>("");
  const recordingStartTimeRef = useRef<number>(0); // Track when recording started
  const speechDetectedRef = useRef(false); // Track if actual speech was detected

  // Keep ref in sync with state
  useEffect(() => {
    pendingTranscriptRef.current = pendingTranscript;
  }, [pendingTranscript]);

  /**
   * Send the accumulated pending transcript
   */
  const finalizePendingMessage = useCallback(async () => {
    clearContinuationTimeout();
    shouldAutoSendRef.current = false;

    const messageToSend = pendingTranscriptRef.current.trim();

    // If in awaiting_greeting state, check for greeting
    if (panelStateRef.current === "awaiting_greeting") {
      pendingTranscriptRef.current = "";
      setPendingTranscript("");
      
      // Clean up stream before greeting processing to prevent resource leaks
      // (greeting flow will request a new stream when auto-listen triggers)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (messageToSend) {
        await processGreetingTranscript(messageToSend);
      } else {
        // No transcript, keep listening
        setConversationRecordingState("listening");
      }
      return;
    }

    // Check if the message appears complete
    // If it seems incomplete, give the user a bit more time
    if (messageToSend && !isCompleteSentence(messageToSend)) {
      // Message seems incomplete - extend the window slightly
      // But only do this once to avoid infinite waiting
      const extendedWait = 2000; // 2 more seconds
      console.log("[Conversation] Message seems incomplete, extending wait:", messageToSend);

      shouldAutoSendRef.current = true;
      continuationTimeoutRef.current = setTimeout(async () => {
        if (shouldAutoSendRef.current && pendingTranscriptRef.current.trim()) {
          // Force send even if still incomplete after extended wait
          shouldAutoSendRef.current = false;
          const finalMessage = pendingTranscriptRef.current.trim();
          pendingTranscriptRef.current = ""; // Sync clear
          setPendingTranscript("");

          if (finalMessage) {
            setConversationRecordingState("processing");
            try {
              await sendConversationMessage(finalMessage);
            } catch (err) {
              console.error("[Conversation] Failed to send message:", err);
            }
          }

          // Always cleanup after message sending completes (success or failure)
          setConversationRecordingState("idle");
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        }
      }, extendedWait);
      return;
    }

    pendingTranscriptRef.current = ""; // Sync clear
    setPendingTranscript("");

    if (messageToSend) {
      setConversationRecordingState("processing");
      try {
        await sendConversationMessage(messageToSend);
      } catch (err) {
        console.error("[Conversation] Failed to send message:", err);
      }
    }

    // Always cleanup - use finally-like pattern to ensure this runs
    setConversationRecordingState("idle");

    // Stop the stream if still active
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [clearContinuationTimeout, sendConversationMessage, processGreetingTranscript]);

  /**
   * Pause recording (for silence detection / user pause)
   * Enters continuation window where user can resume
   */
  const pauseRecording = useCallback(async () => {
    if (conversationMediaRecorderRef.current?.state === "recording") {
      conversationMediaRecorderRef.current.stop();
    }

    cleanupAudioAnalysis();
    
    // CRITICAL: Check if streaming already handled the greeting
    // This prevents duplicate audio playback when both paths trigger
    if (streamingGreetingTriggeredRef.current) {
      console.log("[Pause] Streaming already handled greeting, skipping batch path");
      conversationChunksRef.current = [];
      return;
    }
    
    // FAST GREETING DETECTION: Skip transcription if audio looks like a greeting
    // Greetings are short (200-1500ms) with detected speech
    const recordingDuration = Date.now() - recordingStartTimeRef.current;
    const isGreetingCandidate = 
      panelStateRef.current === "awaiting_greeting" &&
      speechDetectedRef.current &&
      recordingDuration >= 200 &&
      recordingDuration <= 1500;
    
    if (isGreetingCandidate && handleGreetingDetectedRef.current) {
      console.log(`[Greeting] Fast path - skipping transcription (duration: ${recordingDuration}ms)`);
      conversationChunksRef.current = [];
      setConversationRecordingState("processing");
      
      // Directly trigger greeting flow with synthetic "Hello"
      // This saves 500-1500ms of Whisper API latency
      await handleGreetingDetectedRef.current("Hello");
      return;
    }
    
    setConversationRecordingState("paused");

    // Transcribe what we have so far
    const transcript = await transcribeCurrentChunk();
    if (transcript) {
      // Update both ref and state to ensure finalizePendingMessage sees the new value
      // Ref is updated synchronously to avoid race with continuation timeout
      // State is updated for UI reactivity
      const currentPending = pendingTranscriptRef.current;
      const combined = currentPending ? `${currentPending} ${transcript}` : transcript;
      pendingTranscriptRef.current = combined; // Sync update for timeout
      setPendingTranscript(combined); // Async update for UI
    }

    // Clear chunks for potential continuation
    conversationChunksRef.current = [];

    // Start continuation window timer
    clearContinuationTimeout();
    shouldAutoSendRef.current = true;
    continuationTimeoutRef.current = setTimeout(() => {
      // Time's up - send the accumulated message
      if (shouldAutoSendRef.current) {
        finalizePendingMessage();
      }
    }, CONTINUATION_WINDOW);
  }, [cleanupAudioAnalysis, clearContinuationTimeout, finalizePendingMessage]);

  // Keep pauseRecording ref in sync for use in audio monitoring
  useEffect(() => {
    pauseRecordingRef.current = pauseRecording;
  }, [pauseRecording]);

  /**
   * Start or resume recording
   * Wrapped in useCallback to ensure stable reference for useEffect dependencies
   */
  const startConversationRecording = useCallback(async () => {
    console.log("[Recording] startConversationRecording called");

    // Stop any playing audio first (allows interruption)
    clearAudioQueue();

    // If we're in paused state, cancel the send timer and continue
    // clearContinuationTimeout also resets shouldAutoSendRef to prevent any race conditions
    if (conversationRecordingStateRef.current === "paused") {
      clearContinuationTimeout();
    }

    try {
      // Reuse existing stream or create new one
      let stream = streamRef.current;
      if (!stream || !stream.active) {
        console.log("[Recording] Requesting microphone access...");
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        console.log("[Recording] Microphone access granted");
      }

      // Verify stream has active audio tracks BEFORE starting recorder
      const audioTracks = stream.getAudioTracks();
      console.log("[Recording] Audio tracks:", audioTracks.length, "enabled:", audioTracks[0]?.enabled, "muted:", audioTracks[0]?.muted);

      if (audioTracks.length === 0 || !audioTracks[0].enabled) {
        console.error("[Recording] No active audio tracks!");
        setError("Microphone not available. Please check your microphone settings.");
        setConversationRecordingState("idle");
        return;
      }

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      console.log("[Recording] Using MIME type:", mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      conversationChunksRef.current = [];
      conversationMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          conversationChunksRef.current.push(e.data);
          // Progressive transcription disabled - causing rate limiting issues
          // progressiveTranscription.updateChunks(conversationChunksRef.current);
          console.log("[Recording] Audio chunk received, size:", e.data.size);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("[Recording] MediaRecorder stopped");
      };

      // Progressive transcription disabled - causing rate limiting issues
      // progressiveTranscription.start(mediaRecorder, conversationChunksRef.current);

      mediaRecorder.onerror = (e) => {
        console.error("[Recording] MediaRecorder error:", e);
        setError("Recording error occurred");
        setConversationRecordingState("idle");
      };

      mediaRecorder.start(100); // Collect data every 100ms for smoother processing
      console.log("[Recording] MediaRecorder started, state:", mediaRecorder.state);
      
      // Start streaming transcription for fast greeting detection
      // Only in awaiting_greeting state for fastest response
      if (panelStateRef.current === "awaiting_greeting") {
        console.log("[Recording] Starting streaming transcription for greeting detection...");
        
        // Clear any existing fallback timeout
        if (streamingFallbackTimeoutRef.current) {
          clearTimeout(streamingFallbackTimeoutRef.current);
        }
        
        progressiveTranscription.start(stream).catch(err => {
          console.warn("[Recording] Streaming transcription failed to start:", err);
          // Continue with batch transcription as fallback
        });
        
        // Set fallback timeout - if streaming doesn't detect greeting in 2.5s, allow batch fallback
        streamingFallbackTimeoutRef.current = setTimeout(() => {
          if (!streamingGreetingTriggeredRef.current && panelStateRef.current === "awaiting_greeting") {
            console.log("[Recording] Streaming detection timeout (2.5s), batch fallback will handle");
          }
        }, 2500);
      }
      
      setConversationRecordingState("recording");
      silenceStartRef.current = null;
      recordingStartTimeRef.current = Date.now(); // Track when recording started
      speechDetectedRef.current = false; // Reset speech detection for this recording session

      // Start audio level monitoring
      await startAudioLevelMonitoring(stream);
    } catch (err) {
      console.error("[Recording] Error starting recording:", err);
      setError("Microphone access denied. Please allow microphone access.");
      setConversationRecordingState("idle");
    }
  }, [clearAudioQueue, clearContinuationTimeout, startAudioLevelMonitoring]);

  /**
   * Manually stop recording and enter pause state
   */
  const stopConversationRecording = () => {
    pauseRecording();
  };

  /**
   * Cancel recording without sending
   */
  const cancelRecording = useCallback(() => {
    clearContinuationTimeout();
    cleanupAudioAnalysis();
    pendingTranscriptRef.current = ""; // Sync clear to prevent stale reads
    setPendingTranscript("");
    conversationChunksRef.current = [];
    
    // Reset progressive transcription
    progressiveTranscription.reset();

    if (conversationMediaRecorderRef.current?.state === "recording") {
      conversationMediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setConversationRecordingState("idle");
    // Disable auto-listen temporarily after cancel
    autoListenEnabledRef.current = false;
    setTimeout(() => {
      autoListenEnabledRef.current = true;
    }, 5000); // Re-enable after 5 seconds
  }, [clearContinuationTimeout, cleanupAudioAnalysis, progressiveTranscription]);

  /**
   * Effect: Auto-start recording when state becomes "listening"
   * Use a ref to prevent rapid restarts (debounce)
   */
  const lastRecordingStartRef = useRef<number>(0);
  
  useEffect(() => {
    if (conversationRecordingState === "listening") {
      const now = Date.now();
      const timeSinceLastStart = now - lastRecordingStartRef.current;
      
      // Debounce: require at least 500ms between recording starts
      if (timeSinceLastStart < 500) {
        console.log("[Recording] Debounce - waiting before restart...");
        const delay = 500 - timeSinceLastStart;
        const timeout = setTimeout(() => {
          if (conversationRecordingStateRef.current === "listening") {
            console.log("[Recording] State is 'listening', starting after debounce...");
            lastRecordingStartRef.current = Date.now();
            startConversationRecording();
          }
        }, delay);
        return () => clearTimeout(timeout);
      }
      
      console.log("[Recording] State is 'listening', starting recording...");
      lastRecordingStartRef.current = now;
      startConversationRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationRecordingState]); // Intentionally exclude startConversationRecording to prevent infinite loop

  /**
   * Debug: Log state changes
   */
  useEffect(() => {
    console.log("[State] conversationRecordingState:", conversationRecordingState);
  }, [conversationRecordingState]);

  useEffect(() => {
    console.log("[State] panelState:", panelState, "isSpeaking:", isSpeaking);
  }, [panelState, isSpeaking]);

  // ═══════════════════════════════════════════════════════════════════════════
  // STREAMING GREETING DETECTION (Fast path - ~300ms latency)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const streamingGreetingTriggeredRef = useRef(false);
  const preloadedAudioPlayRef = useRef<HTMLAudioElement | null>(null);
  
  // Helper to play prefetched audio
  const playPrefetchedAudio = useCallback(async (): Promise<void> => {
    if (!preloadedAudioUrl) return;
    
    return new Promise((resolve, reject) => {
      const audio = new Audio(preloadedAudioUrl);
      preloadedAudioPlayRef.current = audio;
      setIsPlayingPreloadedAudio(true);
      
      audio.onended = () => {
        setIsPlayingPreloadedAudio(false);
        preloadedAudioPlayRef.current = null;
        resolve();
      };
      
      audio.onerror = (e) => {
        setIsPlayingPreloadedAudio(false);
        preloadedAudioPlayRef.current = null;
        reject(e);
      };
      
      audio.play().catch(reject);
    });
  }, [preloadedAudioUrl]);
  
  useEffect(() => {
    // Only check for greeting during awaiting_greeting state
    if (panelStateRef.current !== "awaiting_greeting") {
      streamingGreetingTriggeredRef.current = false;
      return;
    }
    
    // Prevent duplicate triggers
    if (streamingGreetingTriggeredRef.current || isProcessingGreeting) {
      return;
    }
    
    // Check both partial and interim transcripts for greeting patterns
    const transcriptToCheck = progressiveTranscription.displayTranscript || 
                              progressiveTranscription.interimTranscript || 
                              progressiveTranscription.partialTranscript;
    
    if (transcriptToCheck && isGreeting(transcriptToCheck)) {
      console.log(`[Greeting] Fast detection via streaming: "${transcriptToCheck}"`);
      streamingGreetingTriggeredRef.current = true;
      
      // Clear the fallback timeout since streaming succeeded
      if (streamingFallbackTimeoutRef.current) {
        clearTimeout(streamingFallbackTimeoutRef.current);
        streamingFallbackTimeoutRef.current = null;
      }
      
      // Stop recording and transcription
      progressiveTranscription.reset();
      cleanupAudioAnalysis();
      if (conversationMediaRecorderRef.current?.state === "recording") {
        conversationMediaRecorderRef.current.stop();
      }
      
      // Trigger greeting flow
      setConversationRecordingState("processing");
      setIsProcessingGreeting(true);
      
      // Clean up stream before greeting processing
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Handle greeting asynchronously - ALWAYS use streaming conversation
      // This ensures greeting + question are generated together as a single audio stream
      (async () => {
        try {
          console.log("[Greeting] Using unified streaming conversation for greeting + question");
          
          const response = await streamingConversation.sendMessage({
            questionTitle: questionTitleRef.current,
            questionContent: questionPromptRef.current,
            userMessage: transcriptToCheck,
            conversationHistory: [],
            interviewState: "greeting",
          });
          
          if (response?.fullText) {
            setConversation([
              { role: "candidate", content: transcriptToCheck, timestamp: Date.now() },
              { role: "interviewer", content: response.fullText, timestamp: Date.now() },
            ]);
          }
          
          panelStateRef.current = "speaking";
          setPanelState("speaking");
          setIsProcessingGreeting(false);
          
          // Wait for unified greeting+question audio to finish
          const waitForAudio = (): Promise<void> => {
            return new Promise((resolve) => {
              const check = () => {
                if (!streamingConversation.isStreaming && !streamingConversation.isPlaying) {
                  resolve();
                } else {
                  setTimeout(check, 100);
                }
              };
              setTimeout(check, 300);
            });
          };
          
          await waitForAudio();
          
          // Transition to coding
          console.log("[Greeting] Complete, transitioning to coding");
          panelStateRef.current = "coding";
          setPanelState("coding");
          conversationRecordingStateRef.current = "listening";
          setConversationRecordingState("listening");
        } catch (err) {
          console.error("[Greeting] Streaming greeting flow failed:", err);
          setIsProcessingGreeting(false);
          streamingGreetingTriggeredRef.current = false;
          setConversationRecordingState("listening");
        }
      })();
    }
  }, [
    progressiveTranscription.displayTranscript,
    progressiveTranscription.interimTranscript,
    progressiveTranscription.partialTranscript,
    isProcessingGreeting,
    cleanupAudioAnalysis,
    streamingConversation,
  ]);

  /**
   * Auto-trigger listening when idle in a conversational state
   * This ensures hands-free operation - no button clicks needed
   */
  useEffect(() => {
    // Only auto-listen in conversational states when idle and not playing audio
    // Also check streaming conversation state to ensure AI has finished speaking
    if (
      conversationRecordingState === "idle" &&
      !isSpeaking &&
      !isConversing &&
      !streamingConversation.isStreaming &&
      !streamingConversation.isPlaying &&
      (panelState === "coding" || panelState === "review" || panelState === "followup")
    ) {
      console.log("[Auto] Idle in conversational state, triggering auto-listen");
      // Small delay to ensure state is stable
      const timer = setTimeout(() => {
        if (autoListenEnabledRef.current && conversationRecordingStateRef.current === "idle") {
          triggerAutoListen();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [conversationRecordingState, isSpeaking, isConversing, panelState, triggerAutoListen, streamingConversation.isStreaming, streamingConversation.isPlaying]);

  /**
   * Cleanup auto-listen timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (autoListenDelayRef.current) {
        clearTimeout(autoListenDelayRef.current);
      }
    };
  }, []);

  /**
   * Send immediately without waiting for continuation window
   */
  const sendNow = useCallback(() => {
    finalizePendingMessage();
  }, [finalizePendingMessage]);

  /**
   * Toggle recording state (main button action)
   */
  const toggleConversationRecording = () => {
    if (conversationRecordingState === "recording") {
      stopConversationRecording();
    } else if (conversationRecordingState === "idle" || conversationRecordingState === "paused") {
      startConversationRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearContinuationTimeout();
      cleanupAudioAnalysis();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [clearContinuationTimeout, cleanupAudioAnalysis]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className={`${styles.interviewPanel} ${isVisible ? styles.interviewPanelVisible : ""}`}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderLeft}>
          <button className={styles.panelCloseBtn} onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <span className={styles.panelTitle}>Coding Interview</span>
          <span className={styles.panelQuestionNumber}>
            Question {questionIndex + 1} of {totalQuestions}
          </span>
        </div>
        <div className={styles.panelHeaderRight}>
          {hasPrev && (
            <button
              className={styles.panelNavBtn}
              onClick={() => handleNavigation("prev")}
              title="Previous question"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Previous
            </button>
          )}
          {hasNext && (
            <button
              className={styles.panelNavBtn}
              onClick={() => handleNavigation("next")}
              title="Next question"
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.panelContent}>
        {/* Left Side - Question & AI */}
        <div className={styles.panelLeft}>
          {/* Question Section */}
          <div className={styles.panelQuestion}>
            <div className={styles.panelQuestionHeader}>
              <h2 className={styles.panelQuestionTitle}>{question.title}</h2>
              {question.difficultyLabel && (
                <span className={`${styles.difficultyBadge} ${styles[`difficulty${question.difficultyLabel}`]}`}>
                  {question.difficultyLabel}
                </span>
              )}
            </div>
            <div className={styles.panelQuestionContent}>
              <FormattedContent content={question.prompt} />
            </div>
          </div>

          {/* Greeting Prompt - Say Hello to Start */}
          {panelState === "awaiting_greeting" && !isProcessingGreeting && (
            <div className={`${styles.greetingPrompt} ${conversationRecordingState === "recording" ? styles.recording : ""}`}>
              <div className={styles.greetingMicIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </div>
              <h3>Say &quot;Hello&quot; to start your interview</h3>
              <p>Your AI interviewer will greet you and present the coding challenge</p>
              {conversationRecordingState === "recording" && (
                <>
                  <div className={styles.greetingAudioLevel}>
                    <div 
                      className={styles.greetingAudioLevelFill} 
                      style={{ width: `${Math.min(audioLevel * 300, 100)}%` }} 
                    />
                  </div>
                  <div className={styles.greetingStatus}>
                    <span className={styles.greetingStatusDot} />
                    <span>Listening...</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Greeting Detected - Minimalist Processing */}
          {isProcessingGreeting && (
            <div className={styles.greetingDetected}>
              <div className={styles.typingAnimation}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p className={styles.greetingDetectedText}>Starting interview...</p>
            </div>
          )}

          {/* AI Voice Pill */}
          {panelState !== "awaiting_greeting" && (
          <div className={styles.aiVoicePill}>
            <div className={`${styles.aiVoiceIndicator} ${isSpeaking ? styles.aiSpeaking : ""}`}>
              <div className={styles.aiVoiceIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  {isSpeaking && (
                    <>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </>
                  )}
                </svg>
              </div>
              <div className={styles.aiVoiceInfo}>
                <span className={styles.aiVoiceLabel}>AI Interviewer</span>
                <span className={styles.aiVoiceStatus}>
                  {isSpeaking ? "Speaking..." : panelState === "coding" ? "Ready for your code" : "Listening"}
                </span>
              </div>
            </div>

            {panelState === "speaking" && (
              <div className={styles.aiVoiceProgress}>
                <div className={styles.aiVoiceProgressBar} style={{ width: `${speakingProgress}%` }} />
              </div>
            )}

            {panelState === "speaking" && (
              <button className={styles.skipSpeakingBtn} onClick={skipToCode}>
                Skip to coding
              </button>
            )}
          </div>
          )}

          {/* Unified Conversation Section */}
          {(panelState === "coding" || panelState === "speaking" || panelState === "review" || panelState === "followup" || panelState === "awaiting_greeting") && (
            <div className={styles.conversationSection}>
              {/* Conversation Thread */}
              {conversation.length > 0 && (
                <div className={styles.conversationThread}>
                  <h4 className={styles.conversationTitle}>Conversation</h4>
                  <div className={styles.conversationMessages}>
                    {conversation.map((turn, i) => (
                      <div
                        key={i}
                        className={`${styles.conversationMessage} ${turn.role === "interviewer" ? styles.messageInterviewer : styles.messageCandidate
                          }`}
                      >
                        <span className={styles.messageRole}>
                          {turn.role === "interviewer" ? "Interviewer" : "You"}
                        </span>
                        <p className={styles.messageContent}>{turn.content}</p>
                      </div>
                    ))}
                    {isConversing && (
                      <div className={`${styles.conversationMessage} ${styles.messageInterviewer}`}>
                        <span className={styles.messageRole}>Interviewer</span>
                        {streamingText ? (
                          <p className={styles.messageContent}>
                            {streamingText}
                            <span className={styles.streamingCursor}>▌</span>
                          </p>
                        ) : (
                          <div className={styles.typingIndicator}>
                            <span></span><span></span><span></span>
                          </div>
                        )}
                      </div>
                    )}
                    <div ref={conversationEndRef} />
                  </div>
                </div>
              )}

              {/* AI Speaking Status - tap to interrupt */}
              {isSpeaking && (
                <div 
                  className={`${styles.aiSpeakingBar} ${styles.speaking}`}
                  onClick={() => { clearAudioQueue(); streamingSpeechStop(); }}
                >
                  <div className={styles.aiSpeakingIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  </div>
                  <span className={styles.aiSpeakingText}>Speaking</span>
                  <span className={styles.aiSpeakingHint}>tap to interrupt</span>
                </div>
              )}

              {/* Recording Controls - Show when in coding/followup state and not AI speaking */}
              {(panelState === "coding" || panelState === "followup" || panelState === "review") && !isSpeaking && (
                <div className={styles.recordingControls}>
                  {/* Recording State Indicator */}
                  <div className={`${styles.conversationStatus} ${styles.statusMinimal}`}>
                    {conversationRecordingState === "recording" && (
                      <>
                        <span className={styles.statusDot} data-state="recording" />
                        <span>Listening</span>
                        <div className={styles.audioLevelBar}>
                          <div className={styles.audioLevelFill} style={{ width: `${Math.min(audioLevel * 100, 100)}%` }} />
                        </div>
                      </>
                    )}
                    {conversationRecordingState === "paused" && pendingTranscript && (
                      <>
                        <span className={styles.statusDot} data-state="paused" />
                        <span>Processing</span>
                      </>
                    )}
                    {(conversationRecordingState === "idle" || conversationRecordingState === "listening") && !pendingTranscript && (
                      <>
                        <span className={styles.statusDot} data-state="ready" />
                        <span>Ready to listen</span>
                      </>
                    )}
                    {(conversationRecordingState === "processing" || isConversing) && (
                      <>
                        <span className={styles.statusDot} data-state="processing" />
                        <span>Processing</span>
                      </>
                    )}
                  </div>

                  {/* Live Transcript Preview (Progressive Transcription) */}
                  {conversationRecordingState === "recording" && progressiveTranscription.partialTranscript && (
                    <div className={styles.partialTranscriptPreview}>
                      <span className={styles.liveIndicator}>LIVE</span>
                      <p>{progressiveTranscription.partialTranscript}</p>
                    </div>
                  )}

                  {/* Pending Transcript Preview */}
                  {pendingTranscript && conversationRecordingState === "paused" && (
                    <div className={styles.pendingTranscript}>
                      <p>&quot;{pendingTranscript}&quot;</p>
                    </div>
                  )}

                  {/* Microphone Button */}
                  <div className={styles.microphoneButtonContainer}>
                    {conversationRecordingState === "recording" ? (
                      <button 
                        className={`${styles.microphoneBtn} ${styles.recording}`}
                        onClick={stopConversationRecording}
                        title="Stop recording"
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                      </button>
                    ) : (
                      <button 
                        className={styles.microphoneBtn}
                        onClick={startConversationRecording}
                        disabled={conversationRecordingState === "processing" || isConversing}
                        title="Start recording"
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" y1="19" x2="12" y2="23" />
                          <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                      </button>
                    )}
                    <p className={styles.microphoneHint}>
                      {conversationRecordingState === "recording" 
                        ? "Tap to stop" 
                        : "Tap to speak"}
                    </p>
                  </div>

                  {/* Skip to Results - show after code is evaluated */}
                  {evaluation && (panelState === "followup" || panelState === "review") &&
                    (conversationRecordingState === "idle" || conversationRecordingState === "listening") && (
                      <button
                        className={styles.skipToResultsBtn}
                        onClick={skipToResults}
                      >
                        Skip to Results
                      </button>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Follow-up is now handled by the unified conversation section above */}

          {/* Feedback Section */}
          {panelState === "feedback" && evaluation && (
            <div className={styles.feedbackSection}>
              <FeedbackCards
                evaluation={evaluation}
                conversation={conversation}
                onTryAgain={handleTryAgain}
                onClose={handleClose}
              />
            </div>
          )}
        </div>

        {/* Right Side - Code Editor */}
        <div className={styles.panelRight}>
          {panelState === "processing" ? (
            <div className={styles.processingOverlay}>
              <div className={styles.spinner} />
              <p>{processingStep}</p>
            </div>
          ) : (
            <>
              <div className={styles.editorHeader}>
                <select
                  value={language}
                  onChange={(e) => {
                    const newLang = e.target.value as SupportedLanguage;
                    const oldLang = language;
                    const currentCode = code;
                    setLanguage(newLang);
                    if (!currentCode || currentCode === DEFAULT_STARTER_CODE[oldLang]) {
                      setCode(DEFAULT_STARTER_CODE[newLang]);
                    }
                  }}
                  className={styles.languageSelect}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>{lang.label}</option>
                  ))}
                </select>

                {(panelState === "coding" || panelState === "feedback") && (
                  <button
                    className={styles.submitCodeBtn}
                    onClick={handleSubmitCode}
                    disabled={!code.trim() || code.trim().length < 10 || isSpeaking}
                  >
                    {evaluation ? "Resubmit Code" : "Submit Code"}
                  </button>
                )}

                {/* Show submit button when user has written code but hasn't started the AI conversation */}
                {panelState === "awaiting_greeting" && hasUserCode && (
                  <button
                    className={styles.submitCodeBtn}
                    onClick={handleSubmitCode}
                    disabled={!code.trim() || code.trim().length < 10}
                  >
                    Submit Code
                  </button>
                )}
              </div>

              <div className={styles.editorContainer}>
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                />
              </div>
            </>
          )}

          {error && (
            <div className={styles.errorBanner}>
              {error}
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
