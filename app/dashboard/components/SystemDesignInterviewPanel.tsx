"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useStreamingConversation } from "@/lib/hooks/useStreamingConversation";
import { useStreamingSpeech } from "@/lib/hooks/useStreamingSpeech";
import { saveSystemDesignInterview, getSystemDesignInterview } from "@/lib/interviewStorage";
import { SystemDesignEvaluationResult } from "@/lib/systemDesignRubric";
import { Question } from "@/lib/types";
import FormattedContent from "./FormattedContent";
import styles from "../app.module.css";

// Prevent multiple simultaneous audio sessions
let activeSessionId: string | null = null;

type PanelState = 
  | "speaking"     // AI reading the question
  | "conversing"   // Active back-and-forth discussion
  | "evaluating"   // Processing evaluation
  | "feedback";    // Results displayed inline

type RecordingState = 
  | "idle" 
  | "listening" 
  | "recording" 
  | "paused" 
  | "processing";

type ConversationTurn = {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: number;
};

interface Props {
  question: Question;
  preloadedAudioUrl?: string;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onScoreUpdate?: (questionId: string, score: number) => void;
  questionIndex?: number;
  totalQuestions?: number;
}

export default function SystemDesignInterviewPanel({
  question,
  preloadedAudioUrl,
  onClose,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
  onScoreUpdate,
  questionIndex,
  totalQuestions,
}: Props) {
  // Visibility & animation
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // Panel state
  const [panelState, setPanelState] = useState<PanelState>("speaking");
  const [evaluation, setEvaluation] = useState<SystemDesignEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState("");
  const [isPlayingPreloadedAudio, setIsPlayingPreloadedAudio] = useState(false);

  // Conversation state - initialize with the question
  const [conversation, setConversation] = useState<ConversationTurn[]>([{
    role: "interviewer",
    content: `${question.title}\n\n${question.prompt}`,
    timestamp: Date.now(),
  }]);

  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [pendingTranscript, setPendingTranscript] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [streamingText, setStreamingText] = useState<string>("");

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef<string>(Date.now().toString());
  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const isClosingRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const initialQuestionPlayedRef = useRef(false);
  const activeMountIdRef = useRef<string | null>(null);

  // Question refs
  const questionTitleRef = useRef(question.title);
  const questionPromptRef = useRef(question.prompt);

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const continuationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoListenEnabledRef = useRef(true);
  const pendingTranscriptRef = useRef("");

  // State refs for callbacks
  const recordingStateRef = useRef(recordingState);
  const panelStateRef = useRef(panelState);
  const conversationRef = useRef(conversation);

  // Keep refs in sync
  useEffect(() => { recordingStateRef.current = recordingState; }, [recordingState]);
  useEffect(() => { panelStateRef.current = panelState; }, [panelState]);
  useEffect(() => { conversationRef.current = conversation; }, [conversation]);
  useEffect(() => { pendingTranscriptRef.current = pendingTranscript; }, [pendingTranscript]);
  useEffect(() => {
    questionTitleRef.current = question.title;
    questionPromptRef.current = question.prompt;
  }, [question.title, question.prompt]);

  // Streaming hooks
  const streamingConversation = useStreamingConversation();
  
  // Streaming speech with callbacks
  const streamingSpeechCallbacksRef = useRef<{ onComplete?: () => void }>({});
  const streamingSpeech = useStreamingSpeech({
    onComplete: () => {
      console.log("[SystemDesign] Streaming speech complete");
      streamingSpeechCallbacksRef.current.onComplete?.();
    },
    onError: (err) => {
      console.error("[SystemDesign] Streaming speech error:", err);
      streamingSpeechCallbacksRef.current.onComplete?.();
    },
  });

  // Extract stable references
  const streamingSpeechSpeak = streamingSpeech.speak;
  const streamingSpeechStop = streamingSpeech.stop;
  const streamingSpeechIsPlaying = streamingSpeech.isPlaying;

  // Computed states
  const isAISpeaking = useMemo(() => 
    isPlayingPreloadedAudio || streamingSpeechIsPlaying || streamingConversation.isStreaming,
    [isPlayingPreloadedAudio, streamingSpeechIsPlaying, streamingConversation.isStreaming]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  const stopCurrentAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    streamingSpeechStop();
    setIsPlayingPreloadedAudio(false);
  }, [streamingSpeechStop]);

  const clearContinuationTimeout = useCallback(() => {
    if (continuationTimeoutRef.current) {
      clearTimeout(continuationTimeoutRef.current);
      continuationTimeoutRef.current = null;
    }
  }, []);

  const cleanupAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close().catch(() => {});
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    silenceStartRef.current = null;
    setAudioLevel(0);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSCRIPTION
  // ═══════════════════════════════════════════════════════════════════════════

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string | null> => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    try {
      const response = await fetch("/api/interview/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("[Transcribe] Failed:", response.status);
        return null;
      }

      const data = await response.json();
      return data.transcript || null;
    } catch (err) {
      console.error("[Transcribe] Error:", err);
      return null;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // DUPLICATE PREVENTION
  // ═══════════════════════════════════════════════════════════════════════════

  const lastSentMessageRef = useRef<string>("");
  const lastAddedResponseRef = useRef<string>("");
  const isProcessingMessageRef = useRef(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERSATION MESSAGE HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  const sendConversationMessage = useCallback(async (message: string) => {
    if (!message.trim() || isClosingRef.current) return;

    if (lastSentMessageRef.current === message.trim()) {
      console.log("[SystemDesign] Duplicate message detected, skipping");
      return;
    }
    
    if (isProcessingMessageRef.current) {
      console.log("[SystemDesign] Already processing a message, skipping");
      return;
    }
    
    isProcessingMessageRef.current = true;
    lastSentMessageRef.current = message.trim();

    // Add candidate message to conversation
    const candidateTurn: ConversationTurn = {
      role: "candidate",
      content: message,
      timestamp: Date.now(),
    };
    const updatedConversation = [...conversationRef.current, candidateTurn];
    setConversation(updatedConversation);

    setRecordingState("processing");
    setProcessingStep("AI is thinking...");

    try {
      const response = await streamingConversation.sendMessage({
        questionTitle: questionTitleRef.current,
        questionContent: questionPromptRef.current,
        userMessage: message,
        conversationHistory: updatedConversation.map(t => ({ role: t.role, content: t.content })),
        interviewState: "followup",
      });

      if (isClosingRef.current) {
        isProcessingMessageRef.current = false;
        return;
      }

      if (response?.fullText) {
        setStreamingText("");
        
        if (lastAddedResponseRef.current === response.fullText) {
          console.log("[SystemDesign] Duplicate response content, skipping add");
        } else {
          lastAddedResponseRef.current = response.fullText;
          setConversation(prev => [...prev, {
            role: "interviewer" as const,
            content: response.fullText,
            timestamp: Date.now(),
          }]);
        }
        
        // Wait for audio to finish playing before auto-starting recording
        // Poll the isPlaying state to avoid cutting off audio mid-sentence
        const wordCount = response.fullText.split(/\s+/).length;
        const minDelay = Math.max(3000, Math.min(12000, wordCount * 350));
        console.log(`[SystemDesign] Waiting at least ${minDelay}ms for ${wordCount} words, then polling for audio completion`);
        
        setRecordingState("idle");
        isProcessingMessageRef.current = false;
        
        // Wait minimum delay, then poll until audio is done
        setTimeout(() => {
          const pollForAudioCompletion = () => {
            if (isClosingRef.current || panelStateRef.current !== "conversing") {
              console.log("[SystemDesign] Panel state changed, cancelling auto-listen");
              return;
            }
            
            // Check if audio is still playing (both streaming text and audio playback)
            if (streamingConversation.isStreaming || streamingConversation.isPlaying) {
              console.log("[SystemDesign] Audio still playing, waiting 500ms...");
              setTimeout(pollForAudioCompletion, 500);
              return;
            }
            
            // Audio done - start recording if still in idle state
            if (recordingStateRef.current === "idle") {
              console.log("[SystemDesign] Audio complete, auto-starting recording now");
              recordingStateRef.current = "listening";
              setRecordingState("listening");
            }
          };
          
          pollForAudioCompletion();
        }, minDelay);
      } else {
        setRecordingState("idle");
        isProcessingMessageRef.current = false;
      }
    } catch (err) {
      console.error("[SystemDesign] Conversation error:", err);
      setError("Failed to get response");
      setRecordingState("idle");
      isProcessingMessageRef.current = false;
    }
  }, [streamingConversation]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBMIT FOR EVALUATION
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSubmitResponse = useCallback(async () => {
    if (conversationRef.current.length < 2) {
      setError("Please provide a response before submitting");
      return;
    }

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    cleanupAudioAnalysis();
    clearContinuationTimeout();
    setRecordingState("idle");
    setPendingTranscript("");
    pendingTranscriptRef.current = "";

    setPanelState("evaluating");
    setProcessingStep("Evaluating your design...");

    try {
      const candidateResponses = conversationRef.current
        .filter(t => t.role === "candidate")
        .map(t => t.content)
        .join("\n\n");

      const evalResponse = await fetch("/api/interview/evaluate-system-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${questionTitleRef.current}\n\n${questionPromptRef.current}`,
          transcript: candidateResponses,
          conversationHistory: conversationRef.current.map(t => ({
            role: t.role,
            content: t.content
          })),
        }),
      });

      if (!evalResponse.ok) {
        throw new Error("Evaluation failed");
      }

      const data = await evalResponse.json();
      setEvaluation(data.evaluation);
      setPanelState("feedback");

      // Save to storage
      const candidateTranscript = conversationRef.current
        .filter(t => t.role === "candidate")
        .map(t => t.content)
        .join("\n\n");
      
      saveSystemDesignInterview(
        question.id,
        data.evaluation,
        candidateTranscript,
        undefined, // diagramDescription
        conversationRef.current.map(t => ({ role: t.role, content: t.content }))
      );

      // Update score in parent
      if (onScoreUpdate && data.evaluation?.overallScore) {
        const normalizedScore = Math.round((data.evaluation.overallScore / 5) * 100);
        onScoreUpdate(question.id, normalizedScore);
      }
    } catch (err) {
      console.error("[SystemDesign] Evaluation error:", err);
      setError("Failed to evaluate response");
      setPanelState("conversing");
    }
  }, [question.id, onScoreUpdate, cleanupAudioAnalysis, clearContinuationTimeout]);

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO LEVEL MONITORING
  // ═══════════════════════════════════════════════════════════════════════════

  const startAudioLevelMonitoring = useCallback(async (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const SILENCE_THRESHOLD = 0.02;
      const SILENCE_DURATION = 1500;

      const checkLevel = () => {
        if (!analyserRef.current || recordingStateRef.current !== "recording") {
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1);

        setAudioLevel(normalizedLevel);
        console.log("[Audio] Level:", normalizedLevel.toFixed(3));

        if (normalizedLevel < SILENCE_THRESHOLD) {
          if (!silenceStartRef.current) {
            silenceStartRef.current = Date.now();
          } else if (Date.now() - silenceStartRef.current > SILENCE_DURATION) {
            const recordingDuration = Date.now() - recordingStartTimeRef.current;
            if (recordingDuration > 1000) {
              console.log("[Audio] Silence detected, auto-pausing");
              silenceStartRef.current = null;
              setRecordingState("paused");
              return;
            }
          }
        } else {
          silenceStartRef.current = null;
        }

        animationFrameRef.current = requestAnimationFrame(checkLevel);
      };

      checkLevel();
    } catch (err) {
      console.error("[Audio] Monitoring failed:", err);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // RECORDING
  // ═══════════════════════════════════════════════════════════════════════════

  const startRecording = useCallback(async () => {
    console.log("[Recording] Starting...");
    stopCurrentAudio();
    streamingConversation.abort();

    if (recordingStateRef.current === "paused") {
      audioChunksRef.current = [];
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      // Use browser-supported mimeType (matches BehavioralInterviewPanel)
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;

        // Use the recorder's actual mimeType for the blob
        const blobMimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: blobMimeType });
        audioChunksRef.current = [];

        if (audioBlob.size < 1000) {
          console.log("[Transcribe] No speech detected, skipping");
          if (!isClosingRef.current && panelStateRef.current === "conversing") {
            recordingStateRef.current = "listening";
            setRecordingState("listening");
          }
          return;
        }

        setRecordingState("processing");
        setProcessingStep("Transcribing...");

        const transcript = await transcribeAudio(audioBlob);

        if (transcript && transcript.trim()) {
          console.log("[Transcribe] Got transcript:", transcript);
          await sendConversationMessage(transcript);
        } else {
          console.log("[Transcribe] Empty transcript");
          if (!isClosingRef.current && panelStateRef.current === "conversing") {
            recordingStateRef.current = "listening";
            setRecordingState("listening");
          }
        }
      };

      recorder.start(100);
      recordingStartTimeRef.current = Date.now();
      
      // CRITICAL: Update ref BEFORE starting audio monitoring
      // (setRecordingState is async, but checkLevel reads the ref immediately)
      recordingStateRef.current = "recording";
      setRecordingState("recording");

      await startAudioLevelMonitoring(stream);
    } catch (err) {
      console.error("[Recording] Failed:", err);
      setError("Microphone access denied");
      setRecordingState("idle");
    }
  }, [stopCurrentAudio, streamingConversation, transcribeAudio, sendConversationMessage, startAudioLevelMonitoring]);

  // Handle recording state changes
  useEffect(() => {
    if (recordingState === "listening") {
      console.log("[Recording] State is 'listening', starting...");
      startRecording();
    }
  }, [recordingState, startRecording]);

  // Handle paused state - process and potentially continue
  useEffect(() => {
    if (recordingState === "paused") {
      cleanupAudioAnalysis();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }
  }, [recordingState, cleanupAudioAnalysis]);

  // ═══════════════════════════════════════════════════════════════════════════
  // STREAMING TEXT SYNC
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (streamingConversation.isStreaming) {
      setStreamingText(streamingConversation.currentText);
    } else {
      setStreamingText("");
    }
  }, [streamingConversation.currentText, streamingConversation.isStreaming]);

  // Auto-scroll
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, streamingText]);

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  // Request microphone on mount
  useEffect(() => {
    console.log("[Init] Requesting microphone permission...");
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        console.log("[Init] Microphone permission granted");
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(err => {
        console.error("[Init] Microphone permission denied:", err);
      });
  }, []);

  // Reset on question change - reinitialize conversation with new question
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    isClosingRef.current = false;
    setIsClosing(false);
    setIsVisible(true);
    
    // Reset conversation with the new question
    setConversation([{
      role: "interviewer",
      content: `${question.title}\n\n${question.prompt}`,
      timestamp: Date.now(),
    }]);
    setEvaluation(null);
    setPanelState("speaking");
    initialQuestionPlayedRef.current = false;
  }, [question.id, question.title, question.prompt]);

  // Play initial question
  useEffect(() => {
    let wasCleanedUp = false;
    const mountId = `mount-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    activeMountIdRef.current = mountId;

    if (initialQuestionPlayedRef.current) {
      console.log("[Init] Question already played, skipping");
      return;
    }
    initialQuestionPlayedRef.current = true;

    activeSessionId = sessionIdRef.current;
    console.log("[Init] Playing question:", question.title);

    const onComplete = () => {
      if (wasCleanedUp || activeMountIdRef.current !== mountId) {
        console.log("[Init] onComplete called but mount is stale, ignoring");
        return;
      }
      
      console.log("[Init] Audio complete, transitioning to conversing and auto-starting recording");

      panelStateRef.current = "conversing";
      setPanelState("conversing");
      
      recordingStateRef.current = "listening";
      setRecordingState("listening");
    };

    streamingSpeechCallbacksRef.current.onComplete = onComplete;

    if (preloadedAudioUrl && preloadedAudioUrl.length > 0) {
      console.log("[Init] Using preloaded audio URL");
      const audio = new Audio(preloadedAudioUrl);
      audioRef.current = audio;
      
      let audioStarted = false;
      let fallbackTriggered = false;
      
      const triggerFallback = () => {
        if (fallbackTriggered || audioStarted) return;
        fallbackTriggered = true;
        console.log("[Init] Falling back to streaming speech");
        streamingSpeechSpeak(question.title, question.prompt, question.tags?.[0]);
      };
      
      audio.addEventListener("ended", () => {
        console.log("[Init] Preloaded audio ended");
        setIsPlayingPreloadedAudio(false);
        onComplete();
      });
      
      audio.addEventListener("error", (e) => {
        console.error("[Init] Preloaded audio error:", e);
        setIsPlayingPreloadedAudio(false);
        triggerFallback();
      });
      
      audio.addEventListener("playing", () => {
        console.log("[Init] Preloaded audio started playing");
        audioStarted = true;
        setIsPlayingPreloadedAudio(true);
      });
      
      setIsPlayingPreloadedAudio(true);
      
      audio.play()
        .then(() => console.log("[Init] Preloaded audio play() promise resolved"))
        .catch((err) => {
          console.error("[Init] Preloaded audio play failed:", err);
          setIsPlayingPreloadedAudio(false);
          triggerFallback();
        });
        
      setTimeout(() => {
        if (!audioStarted && !fallbackTriggered) {
          console.log("[Init] Audio didn't start after timeout, using fallback");
          audio.pause();
          triggerFallback();
        }
      }, 3000);
    } else {
      console.log("[Init] No preloaded audio, using streaming speech");
      streamingSpeechSpeak(question.title, question.prompt, question.tags?.[0]);
    }

    const fallbackTimer = setTimeout(() => {
      if (panelStateRef.current === "speaking" && !wasCleanedUp) {
        console.log("[Init] Fallback timeout - transitioning to conversing");
        streamingSpeechStop();
        if (audioRef.current) {
          audioRef.current.pause();
        }
        onComplete();
      }
    }, 30000);

    return () => {
      console.log("[Init] Cleanup running for mount:", mountId);
      wasCleanedUp = true;
      clearTimeout(fallbackTimer);
      streamingSpeechStop();
      setIsPlayingPreloadedAudio(false);
      if (activeMountIdRef.current === mountId) {
        activeMountIdRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      initialQuestionPlayedRef.current = false;
    };
  }, [question.id, preloadedAudioUrl, streamingSpeechSpeak, streamingSpeechStop]);

  // Load previous interview
  useEffect(() => {
    const previous = getSystemDesignInterview(question.id);
    if (previous) {
      setEvaluation(previous.evaluation);
      if (previous.conversationHistory) {
        const historyWithTimestamps: ConversationTurn[] = previous.conversationHistory.map((turn, index) => ({
          ...turn,
          timestamp: previous.timestamp - (previous.conversationHistory!.length - index) * 1000
        }));
        setConversation(historyWithTimestamps);
        setPanelState("feedback");
        initialQuestionPlayedRef.current = true;
      }
    }
  }, [question.id]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleClose = useCallback(() => {
    isClosingRef.current = true;
    setIsClosing(true);
    setIsVisible(false);

    stopCurrentAudio();
    streamingConversation.abort();
    clearContinuationTimeout();
    cleanupAudioAnalysis();

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (activeSessionId === sessionIdRef.current) {
      activeSessionId = null;
    }

    setTimeout(onClose, 300);
  }, [onClose, stopCurrentAudio, streamingConversation, clearContinuationTimeout, cleanupAudioAnalysis]);

  const handleNavigation = useCallback((direction: "next" | "prev") => {
    isClosingRef.current = true;
    setIsClosing(true);
    setIsVisible(false);

    stopCurrentAudio();
    streamingConversation.abort();
    clearContinuationTimeout();
    cleanupAudioAnalysis();

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    setTimeout(() => {
      if (direction === "next" && onNext) onNext();
      else if (direction === "prev" && onPrev) onPrev();
    }, 300);
  }, [onNext, onPrev, stopCurrentAudio, streamingConversation, clearContinuationTimeout, cleanupAudioAnalysis]);

  const skipToConversing = useCallback(() => {
    stopCurrentAudio();
    
    panelStateRef.current = "conversing";
    setPanelState("conversing");
    recordingStateRef.current = "listening";
    setRecordingState("listening");
  }, [stopCurrentAudio]);

  const handleInterrupt = useCallback(() => {
    if (isPlayingPreloadedAudio || streamingSpeechIsPlaying || streamingConversation.isStreaming) {
      stopCurrentAudio();
      streamingConversation.stopAudio();
      
      if (panelStateRef.current === "speaking") {
        panelStateRef.current = "conversing";
        setPanelState("conversing");
      }
      
      recordingStateRef.current = "listening";
      setRecordingState("listening");
    }
  }, [isPlayingPreloadedAudio, streamingSpeechIsPlaying, streamingConversation, stopCurrentAudio]);

  const handleTryAgain = useCallback(() => {
    setEvaluation(null);
    setConversation([{
      role: "interviewer",
      content: `${questionTitleRef.current}\n\n${questionPromptRef.current}`,
      timestamp: Date.now(),
    }]);
    panelStateRef.current = "conversing";
    setPanelState("conversing");
    lastSentMessageRef.current = "";
    lastAddedResponseRef.current = "";
    isProcessingMessageRef.current = false;
    recordingStateRef.current = "listening";
    setRecordingState("listening");
  }, []);

  const handleStartRecording = useCallback(() => {
    if (recordingState === "idle" || recordingState === "paused") {
      setRecordingState("listening");
    }
  }, [recordingState]);

  const handleStopRecording = useCallback(() => {
    if (recordingState === "recording") {
      setRecordingState("paused");
    }
  }, [recordingState]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div 
      className={`${styles.interviewPanel} ${isVisible ? styles.interviewPanelVisible : ""} ${isClosing ? styles.interviewPanelClosing : ""}`}
    >
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderLeft}>
          <button className={styles.panelCloseBtn} onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <span className={styles.panelTitle}>System Design Interview</span>
          <span className={styles.panelQuestionNumber}>
            Question {questionIndex + 1} of {totalQuestions}
          </span>
        </div>

        <div className={styles.panelHeaderRight}>
          {hasPrev && (
            <button className={styles.panelNavBtn} onClick={() => handleNavigation("prev")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Previous
            </button>
          )}
          {hasNext && (
            <button className={styles.panelNavBtn} onClick={() => handleNavigation("next")}>
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.behavioralPanelContent}>
        <div className={styles.conversationArea}>
          {/* Speaking State Hint */}
          {panelState === "speaking" && (
            <div className={styles.speakingHint}>
              <p>Listen to the question, then discuss your design approach</p>
            </div>
          )}

          {/* Conversation Thread */}
          {conversation.length > 0 && (
            <div className={styles.conversationThread}>
              {conversation.map((turn, index) => (
                <div
                  key={index}
                  className={`${styles.conversationBubble} ${
                    turn.role === "interviewer" ? styles.interviewerBubble : styles.candidateBubble
                  }`}
                >
                  <div className={styles.bubbleHeader}>
                    <span className={styles.bubbleRole}>
                      {turn.role === "interviewer" ? "Interviewer" : "You"}
                    </span>
                  </div>
                  <div className={styles.bubbleContent}>
                    {turn.role === "interviewer" && index === 0 ? (
                      <>
                        <h3 className={styles.questionTitleInline}>{question.title}</h3>
                        <FormattedContent content={question.prompt} />
                      </>
                    ) : (
                      <p>{turn.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming Text */}
              {streamingText && (
                <div className={`${styles.conversationBubble} ${styles.interviewerBubble}`}>
                  <div className={styles.bubbleHeader}>
                    <span className={styles.bubbleRole}>Interviewer</span>
                  </div>
                  <div className={styles.bubbleContent}>
                    <p>{streamingText}<span className={styles.streamingCursor}>|</span></p>
                  </div>
                </div>
              )}

              {/* Inline Feedback */}
              {panelState === "feedback" && evaluation && (
                <div className={styles.inlineFeedback}>
                  <div className={styles.feedbackDivider}>
                    <span>Evaluation Results</span>
                  </div>
                  
                  <div className={styles.inlineScoreRow}>
                    <div className={styles.scoreCircleSmall}>
                      <span className={styles.scoreValue}>{evaluation.overallScore.toFixed(1)}</span>
                      <span className={styles.scoreLabel}>/ 5</span>
                    </div>
                    <div className={styles.scoreSummary}>
                      <div className={styles.verdictBadge} data-verdict={evaluation.verdict.toLowerCase().replace(" ", "-")}>
                        {evaluation.verdict}
                      </div>
                      <p>{evaluation.overallFeedback}</p>
                    </div>
                  </div>

                  {/* Design Highlights */}
                  {evaluation.designHighlights && (
                    <div className={styles.feedbackBlock}>
                      <h4>Design Highlights</h4>
                      <div className={styles.highlightsGrid}>
                        {evaluation.designHighlights.keyComponents?.length > 0 && (
                          <div className={styles.highlightItem}>
                            <span className={styles.highlightLabel}>Key Components</span>
                            <span className={styles.highlightValue}>{evaluation.designHighlights.keyComponents.join(", ")}</span>
                          </div>
                        )}
                        {evaluation.designHighlights.scalingStrategy && (
                          <div className={styles.highlightItem}>
                            <span className={styles.highlightLabel}>Scaling Strategy</span>
                            <span className={styles.highlightValue}>{evaluation.designHighlights.scalingStrategy}</span>
                          </div>
                        )}
                        {evaluation.designHighlights.dataStorage && (
                          <div className={styles.highlightItem}>
                            <span className={styles.highlightLabel}>Data Storage</span>
                            <span className={styles.highlightValue}>{evaluation.designHighlights.dataStorage}</span>
                          </div>
                        )}
                        {evaluation.designHighlights.mainTradeoff && (
                          <div className={styles.highlightItem}>
                            <span className={styles.highlightLabel}>Main Trade-off</span>
                            <span className={styles.highlightValue}>{evaluation.designHighlights.mainTradeoff}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {evaluation.strengths.length > 0 && (
                    <div className={styles.feedbackBlock}>
                      <h4>Strengths</h4>
                      <ul>
                        {evaluation.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.improvements.length > 0 && (
                    <div className={styles.feedbackBlock}>
                      <h4>Areas to Improve</h4>
                      <ul>
                        {evaluation.improvements.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.missedConsiderations && evaluation.missedConsiderations.length > 0 && (
                    <div className={styles.feedbackBlock}>
                      <h4>Missed Considerations</h4>
                      <ul>
                        {evaluation.missedConsiderations.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Criteria Breakdown */}
                  <div className={styles.feedbackBlock}>
                    <h4>Detailed Breakdown</h4>
                    <div className={styles.criteriaGrid}>
                      {Object.entries(evaluation.breakdown).map(([key, score]) => {
                        const numScore = typeof score === 'number' ? score : 0;
                        const labels: Record<string, string> = {
                          requirements: "Requirements Gathering",
                          architecture: "High-Level Architecture",
                          scalability: "Scalability & Performance",
                          dataModel: "Data Model & Storage",
                          tradeoffs: "Trade-off Analysis",
                          reliability: "Reliability & Fault Tolerance",
                          communication: "Communication & Clarity",
                        };
                        return (
                          <div key={key} className={styles.criterionItem}>
                            <span className={styles.criterionLabel}>{labels[key] || key}</span>
                            <div className={styles.criterionBarSmall}>
                              <div 
                                className={styles.criterionFillSmall} 
                                style={{ width: `${(numScore / 5) * 100}%` }}
                              />
                            </div>
                            <span className={styles.criterionScoreSmall}>{numScore}/5</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    className={styles.tryAgainBtnInline} 
                    onClick={handleTryAgain}
                  >
                    Try Again
                  </button>
                </div>
              )}

              <div ref={conversationEndRef} />
            </div>
          )}

          {/* Processing Indicator */}
          {(recordingState === "processing" || panelState === "evaluating") && (
            <div className={styles.processingIndicator}>
              <div className={styles.spinner} />
              <p>{processingStep}</p>
            </div>
          )}
        </div>

        {/* Bottom Control Area */}
        <div className={styles.behavioralControls}>
          {/* AI Speaking Status */}
          {isAISpeaking && (
            <div 
              className={`${styles.aiSpeakingBar} ${styles.speaking}`}
              onClick={handleInterrupt}
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
              {panelState === "speaking" && (
                <button className={styles.skipBtn} onClick={(e) => { e.stopPropagation(); skipToConversing(); }}>
                  Skip
                </button>
              )}
            </div>
          )}

          {/* Recording Controls */}
          {panelState === "conversing" && !isAISpeaking && (
            <div className={styles.recordingControls}>
              <div className={`${styles.conversationStatus} ${styles.statusMinimal}`}>
                {recordingState === "recording" && (
                  <>
                    <span className={styles.statusDot} data-state="recording" />
                    <span>Listening</span>
                    <div className={styles.audioLevelBar}>
                      <div className={styles.audioLevelFill} style={{ width: `${Math.min(audioLevel * 100, 100)}%` }} />
                    </div>
                  </>
                )}
                {recordingState === "paused" && pendingTranscript && (
                  <>
                    <span className={styles.statusDot} data-state="paused" />
                    <span>Processing</span>
                  </>
                )}
                {(recordingState === "idle" || recordingState === "listening") && !pendingTranscript && (
                  <>
                    <span className={styles.statusDot} data-state="ready" />
                    <span>Ready to listen</span>
                  </>
                )}
                {recordingState === "processing" && (
                  <>
                    <span className={styles.statusDot} data-state="processing" />
                    <span>Processing</span>
                  </>
                )}
              </div>

              {/* Microphone Button */}
              <div className={styles.microphoneButtonContainer}>
                <button
                  className={`${styles.microphoneBtn} ${recordingState === "recording" ? styles.recording : ""}`}
                  onClick={recordingState === "recording" ? handleStopRecording : handleStartRecording}
                >
                  {recordingState === "recording" ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  )}
                </button>
                <span className={styles.microphoneHint}>
                  {recordingState === "recording" ? "Tap to stop" : "Tap to speak"}
                </span>
              </div>

              {/* Submit Button */}
              {conversation.length > 1 && (
                <button 
                  className={styles.submitResponseBtn} 
                  onClick={handleSubmitResponse}
                >
                  Submit Design for Evaluation
                </button>
              )}
            </div>
          )}

          {/* Error Display */}
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
