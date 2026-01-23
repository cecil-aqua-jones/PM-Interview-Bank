"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";
import { saveInterview, getCodingInterview } from "@/lib/interviewStorage";
import { CodingEvaluationResult } from "@/lib/codingRubric";
import { Question, SupportedLanguage, SUPPORTED_LANGUAGES, DEFAULT_STARTER_CODE } from "@/lib/types";
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
  const [panelState, setPanelState] = useState<PanelState>("speaking");
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

  // Conversation state
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [currentFollowUp, setCurrentFollowUp] = useState<string | null>(null);
  const [followUpCount, setFollowUpCount] = useState(0);
  const MAX_FOLLOWUPS = 3;

  // Unified conversation state (replaces separate clarifying questions)
  const [isConversing, setIsConversing] = useState(false);
  const [conversationRecordingState, setConversationRecordingState] = useState<
    "idle" | "listening" | "recording" | "paused" | "processing"
  >("idle");
  const [pendingTranscript, setPendingTranscript] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState(0);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Natural conversation flow refs
  const continuationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Configuration for natural conversation flow
  // These settings prevent the AI from responding during natural pauses
  const SILENCE_THRESHOLD = 0.04; // Audio level below this is considered silence
  const SILENCE_DURATION = 1500; // ms of silence before auto-pausing (1.5s per design spec)
  const CONTINUATION_WINDOW = 3500; // ms to wait for continuation before sending (3.5s)

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

    try {
      let audioUrl: string;

      if (item.source === "url") {
        audioUrl = item.data;
      } else if (item.source === "base64") {
        const binaryString = atob(item.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/mpeg" });
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
          } else {
            requestBody = { question: item.data };
          }
        } catch {
          // Plain text - use as question
          requestBody = { question: item.data };
        }

        // Create abort controller for this fetch
        audioAbortControllerRef.current = new AbortController();

        const response = await fetch("/api/interview/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: audioAbortControllerRef.current.signal,
        });
        
        // Check if panel closed while fetching
        if (isClosingRef.current) {
          isPlayingRef.current = false;
          setIsSpeaking(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error("TTS failed");
        }
        const blob = await response.blob();
        audioUrl = URL.createObjectURL(blob);
      }

      // Final check before playing - ensure panel is still open
      if (isClosingRef.current) {
        isPlayingRef.current = false;
        setIsSpeaking(false);
        if (item.source !== "url") {
          URL.revokeObjectURL(audioUrl);
        }
        return;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener("timeupdate", () => {
        if (audio.duration) {
          setSpeakingProgress((audio.currentTime / audio.duration) * 100);
        }
      });

      audio.addEventListener("ended", () => {
        if (item.source !== "url") {
          URL.revokeObjectURL(audioUrl);
        }
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
          // Queue is empty - trigger auto-listen for hands-free conversation
          triggerAutoListen();
        }
      });

      audio.addEventListener("error", () => {
        if (item.source !== "url") {
          URL.revokeObjectURL(audioUrl);
        }
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

      await audio.play();
    } catch (err) {
      // Ignore abort errors - they're expected when closing
      if (err instanceof Error && err.name === "AbortError") {
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
    };
    audioQueueRef.current.push(queueItem);

    // Start processing if not already playing
    if (!isPlayingRef.current) {
      processNextInQueue();
    }
  }, [processNextInQueue]);

  const speakText = useCallback((text: string, onComplete?: () => void) => {
    queueAudio({ source: "fetch", data: text, onComplete });
  }, [queueAudio]);

  const playAudioUrl = useCallback((url: string, onComplete?: () => void) => {
    queueAudio({ source: "url", data: url, onComplete });
  }, [queueAudio]);

  const playBase64Audio = useCallback((base64: string, onComplete?: () => void) => {
    queueAudio({ source: "base64", data: base64, onComplete });
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

  // Play initial question audio (only once)
  useEffect(() => {
    if (initialQuestionPlayedRef.current) return;
    if (activeSessionId && activeSessionId !== sessionIdRef.current) return;

    activeSessionId = sessionIdRef.current;
    initialQuestionPlayedRef.current = true;

    const onQuestionComplete = () => {
      console.log("[Init] Question audio complete, transitioning to coding state");
      // Update ref synchronously so triggerAutoListen sees the correct state immediately
      // React's setState is async and the useEffect that syncs the ref may not run in time
      panelStateRef.current = "coding";
      setPanelState("coding");
      // Trigger auto-listen after a short delay to ensure audio queue is cleared
      setTimeout(() => {
        console.log("[Init] Triggering auto-listen after question");
        triggerAutoListen();
      }, 100);
    };

    if (preloadedAudioUrl) {
      playAudioUrl(preloadedAudioUrl, onQuestionComplete);
    } else {
      // Pass structured data so the AI knows title is the topic name, content is instructions
      const structuredQuestion = JSON.stringify({
        questionTitle: question.title,
        questionContent: question.prompt
      });
      speakText(structuredQuestion, onQuestionComplete);
    }

    return () => {
      if (activeSessionId === sessionIdRef.current) {
        activeSessionId = null;
      }
    };
  }, [question, preloadedAudioUrl, playAudioUrl, speakText, triggerAutoListen]);

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
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { });
      audioContextRef.current = null;
    }
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
    // IMMEDIATELY mark as closing to prevent any new audio/actions
    isClosingRef.current = true;
    
    setIsClosing(true);
    setIsVisible(false);
    
    // Stop all audio immediately - this aborts any in-flight TTS fetches
    clearAudioQueue();

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
  }, [onClose, clearAudioQueue, clearContinuationTimeout, cleanupAudioAnalysis, evaluation, conversation, question.id, code, language]);

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
  }, [onNext, onPrev, clearAudioQueue, clearContinuationTimeout, cleanupAudioAnalysis]);

  const skipToCode = useCallback(() => {
    clearAudioQueue();
    // Update ref synchronously for triggerAutoListen
    panelStateRef.current = "coding";
    setPanelState("coding");
    // Trigger auto-listen since we're now in coding state
    triggerAutoListen();
  }, [clearAudioQueue, triggerAutoListen]);

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

      // Save to localStorage with conversation history for future reference
      // Convert ConversationTurn[] to the storage format
      const conversationForStorage = conversation.map(turn => ({
        role: turn.role,
        content: turn.content
      }));
      saveInterview(question.id, data.evaluation, code, language, undefined, conversationForStorage);
      onScoreUpdate?.(question.id, data.evaluation.overallScore);

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

  /**
   * Send a message to the conversational AI and get a response
   * Memoized to prevent stale closures in setTimeout callbacks
   */
  const sendConversationMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isConversing) return;

    // Stop any playing audio before processing
    clearAudioQueue();
    setIsConversing(true);

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
      const response = await fetch("/api/interview/converse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionTitle: question.title,
          questionContent: question.prompt,
          userMessage: userMessage.trim(),
          // Only send previous turns - current message is in userMessage field
          conversationHistory: previousConversation,
          code,
          language,
          evaluation,
          interviewState: panelState
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add AI response to conversation
      const aiTurn: ConversationTurn = {
        role: "interviewer",
        content: data.response,
        timestamp: Date.now()
      };
      setConversation(prev => [...prev, aiTurn]);

      // Play audio response if available
      if (data.audio) {
        playBase64Audio(data.audio);
      }

      // If in followup state, continue the follow-up flow after response
      if (panelState === "followup") {
        // Build the full conversation including user turn and AI response
        const fullConversation = [...previousConversation, userTurn, aiTurn];
        
        // After the conversational response, generate the next follow-up question
        // Note: followUpCount is incremented inside generateFollowUp
        if (followUpCount < MAX_FOLLOWUPS) {
          // Wait for audio to finish, then generate next follow-up
          // The generateFollowUp function will handle incrementing count and calling the API
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
    }
  }, [
    isConversing,
    clearAudioQueue,
    conversation,
    question.id,
    question.title,
    question.prompt,
    code,
    language,
    evaluation,
    panelState,
    followUpCount,
    generateFollowUp,
    playBase64Audio
  ]);

  /**
   * Monitor audio levels for silence detection
   * Uses a ref for pauseRecording to avoid stale closure issues
   */
  const pauseRecordingRef = useRef<() => Promise<void>>();

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

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5; // More responsive
      analyser.minDecibels = -90;
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

        // Silence detection
        if (normalizedLevel < SILENCE_THRESHOLD) {
          if (!silenceStartRef.current) {
            silenceStartRef.current = Date.now();
          } else if (Date.now() - silenceStartRef.current > SILENCE_DURATION) {
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
        } else {
          silenceStartRef.current = null;
        }

        requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
      console.log("[Audio] Audio level monitoring started");
    } catch (err) {
      console.error("[Audio] Audio level monitoring failed:", err);
    }
  }, []);

  /**
   * Transcribe the current recording chunk
   */
  const transcribeCurrentChunk = async (): Promise<string | null> => {
    if (conversationChunksRef.current.length === 0) {
      return null;
    }

    const mimeType = conversationMediaRecorderRef.current?.mimeType || "audio/webm";
    const recordedBlob = new Blob(conversationChunksRef.current, { type: mimeType });

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
      return transcript?.trim() || null;
    } catch (err) {
      console.error("Transcription error:", err);
      return null;
    }
  };

  // Use a ref to track if we should auto-send when continuation timer expires
  const shouldAutoSendRef = useRef(false);
  const pendingTranscriptRef = useRef<string>("");

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
  }, [clearContinuationTimeout, sendConversationMessage]);

  /**
   * Pause recording (for silence detection / user pause)
   * Enters continuation window where user can resume
   */
  const pauseRecording = useCallback(async () => {
    if (conversationMediaRecorderRef.current?.state === "recording") {
      conversationMediaRecorderRef.current.stop();
    }

    cleanupAudioAnalysis();
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
          console.log("[Recording] Audio chunk received, size:", e.data.size);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("[Recording] MediaRecorder stopped");
      };

      mediaRecorder.onerror = (e) => {
        console.error("[Recording] MediaRecorder error:", e);
        setError("Recording error occurred");
        setConversationRecordingState("idle");
      };

      mediaRecorder.start(100); // Collect data every 100ms for smoother processing
      console.log("[Recording] MediaRecorder started, state:", mediaRecorder.state);
      setConversationRecordingState("recording");
      silenceStartRef.current = null;

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
  }, [clearContinuationTimeout, cleanupAudioAnalysis]);

  /**
   * Effect: Auto-start recording when state becomes "listening"
   */
  useEffect(() => {
    if (conversationRecordingState === "listening") {
      console.log("[Recording] State is 'listening', starting recording...");
      startConversationRecording();
    }
  }, [conversationRecordingState, startConversationRecording]);

  /**
   * Debug: Log state changes
   */
  useEffect(() => {
    console.log("[State] conversationRecordingState:", conversationRecordingState);
  }, [conversationRecordingState]);

  useEffect(() => {
    console.log("[State] panelState:", panelState, "isSpeaking:", isSpeaking);
  }, [panelState, isSpeaking]);

  /**
   * Auto-trigger listening when idle in a conversational state
   * This ensures hands-free operation - no button clicks needed
   */
  useEffect(() => {
    // Only auto-listen in conversational states when idle and not playing audio
    if (
      conversationRecordingState === "idle" &&
      !isSpeaking &&
      !isConversing &&
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
  }, [conversationRecordingState, isSpeaking, isConversing, panelState, triggerAutoListen]);

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

          {/* AI Voice Pill */}
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

          {/* Unified Conversation Section */}
          {(panelState === "coding" || panelState === "speaking" || panelState === "review" || panelState === "followup") && (
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
                        <div className={styles.typingIndicator}>
                          <span></span><span></span><span></span>
                        </div>
                      </div>
                    )}
                    <div ref={conversationEndRef} />
                  </div>
                </div>
              )}

              {/* Hands-free Conversation Interface */}
              <div className={styles.conversationInput}>
                  {conversationRecordingState === "processing" ? (
                    <div className={styles.conversationProcessing}>
                      <span className={styles.spinnerSmall} />
                      <span>Processing...</span>
                    </div>
                  ) : conversationRecordingState === "recording" ? (
                    <div className={styles.recordingActive}>
                      {/* Audio waveform visualizer - shows audio is being captured */}
                      <div className={styles.audioVisualizerDark}>
                        <div className={styles.visualizerBarDark} style={{ height: `${Math.max(15, 15 + audioLevel * 500)}%` }} />
                        <div className={styles.visualizerBarDark} style={{ height: `${Math.max(25, 25 + audioLevel * 450)}%` }} />
                        <div className={styles.visualizerBarDark} style={{ height: `${Math.max(35, 35 + audioLevel * 400)}%` }} />
                        <div className={styles.visualizerBarDark} style={{ height: `${Math.max(25, 25 + audioLevel * 450)}%` }} />
                        <div className={styles.visualizerBarDark} style={{ height: `${Math.max(15, 15 + audioLevel * 500)}%` }} />
                      </div>
                      <div className={styles.listeningStatusDark}>
                        <span>Listening...</span>
                      </div>
                    </div>
                  ) : conversationRecordingState === "paused" ? (
                    <div className={styles.userThinkingState}>
                      {/* Show pending transcript with thinking animation */}
                      {pendingTranscript && (
                        <div className={styles.userTranscript}>
                          <p className={styles.userTranscriptText}>{pendingTranscript}</p>
                        </div>
                      )}
                      <div className={styles.userThinkingIndicator}>
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  ) : conversationRecordingState === "listening" ? (
                    <div className={styles.listeningStarting}>
                      <div className={styles.listeningPulse}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        </svg>
                      </div>
                      <span>Starting microphone...</span>
                    </div>
                  ) : isSpeaking ? (
                    // AI is speaking - show visual indicator, allow interrupt by speaking
                    <div
                      className={styles.aiSpeakingIndicator}
                      onClick={startConversationRecording}
                    >
                      <div className={styles.speakingWave}>
                        <span></span><span></span><span></span><span></span><span></span>
                      </div>
                      <span>Interviewer is speaking... </span>
                    </div>
                  ) : (
                    // Idle state - auto-listening should start, show passive indicator
                    <div
                      className={styles.autoListenIndicator}
                      onClick={startConversationRecording}
                    >
                      <div className={styles.autoListenPulse}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        </svg>
                      </div>
                      <span>{isConversing ? "Processing..." : "Ready to listen..."}</span>
                    </div>
                  )}

                  {/* Skip to Results - show after code is evaluated */}
                  {evaluation && (panelState === "followup" || panelState === "review") &&
                    (conversationRecordingState === "idle" || conversationRecordingState === "listening") &&
                    !isSpeaking && (
                      <button
                        className={styles.skipToResultsBtn}
                        onClick={skipToResults}
                      >
                        Skip to Results
                      </button>
                    )}
                </div>
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
