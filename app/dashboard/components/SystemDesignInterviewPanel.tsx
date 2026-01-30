"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useStreamingConversation } from "@/lib/hooks/useStreamingConversation";
import { useStreamingSpeech } from "@/lib/hooks/useStreamingSpeech";
import { useProgressiveTranscription } from "@/lib/hooks/useProgressiveTranscription";
import { saveSystemDesignInterview, getSystemDesignInterview } from "@/lib/interviewStorage";
import { SystemDesignEvaluationResult } from "@/lib/systemDesignRubric";
import { Question } from "@/lib/types";
import { isGreeting } from "@/lib/greetingDetection";
import { track } from "@/lib/posthog";
import FormattedContent from "./FormattedContent";
import styles from "../app.module.css";

// Prevent multiple simultaneous audio sessions
let activeSessionId: string | null = null;

type PanelState = 
  | "awaiting_greeting"  // Waiting for user to say hello
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
  const [panelState, setPanelState] = useState<PanelState>("awaiting_greeting");
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
  const [isProcessingGreeting, setIsProcessingGreeting] = useState(false);

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
  const questionIdRef = useRef(question.id);
  const questionCompanyNameRef = useRef(question.companyName);

  // Track interview start time for duration analytics
  const interviewStartTimeRef = useRef<number>(Date.now());
  
  // Track if we've fired the interview_started event for this question
  const hasTrackedStartRef = useRef<string | null>(null);
  
  // Ref for evaluation to avoid stale closures in callbacks
  const evaluationRef = useRef(evaluation);
  useEffect(() => {
    evaluationRef.current = evaluation;
  }, [evaluation]);

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const speechDetectedRef = useRef<boolean>(false);
  const continuationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoListenEnabledRef = useRef(true);
  const pendingTranscriptRef = useRef("");
  const streamingFallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    questionIdRef.current = question.id;
    questionCompanyNameRef.current = question.companyName;
  }, [question.title, question.prompt, question.id, question.companyName]);

  // Streaming hooks
  const streamingConversation = useStreamingConversation();
  
  // Progressive transcription for reduced latency
  const progressiveTranscription = useProgressiveTranscription();
  
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
    // Validate blob before sending
    console.log(`[Transcribe Client] Blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
    
    if (audioBlob.size < 1000) {
      console.warn("[Transcribe Client] Blob too small, skipping");
      return null;
    }
    
    // Check WebM header
    const headerBytes = await audioBlob.slice(0, 4).arrayBuffer();
    const header = new Uint8Array(headerBytes);
    const isValidWebM = header[0] === 0x1A && header[1] === 0x45 && header[2] === 0xDF && header[3] === 0xA3;
    console.log(`[Transcribe Client] Header: [${Array.from(header).map(b => '0x' + b.toString(16)).join(', ')}], valid: ${isValidWebM}`);
    
    if (!isValidWebM && audioBlob.type.includes("webm")) {
      console.error("[Transcribe Client] Invalid WebM header");
      return null;
    }
    
    // Use the blob's actual type for the filename extension
    const extension = audioBlob.type.includes("webm") ? "webm" : 
                     audioBlob.type.includes("mp4") ? "mp4" : 
                     audioBlob.type.includes("ogg") ? "ogg" : "webm";
    
    const formData = new FormData();
    formData.append("audio", audioBlob, `recording.${extension}`);

    try {
      const response = await fetch("/api/interview/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Transcribe Client] Failed:", response.status, errorData);
        return null;
      }

      const data = await response.json();
      console.log(`[Transcribe Client] Success: "${data.transcript?.slice(0, 50) || '(empty)'}"`);
      return data.transcript || null;
    } catch (err) {
      console.error("[Transcribe Client] Error:", err);
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

      // Track interview completed
      track({
        name: "interview_completed",
        properties: {
          type: "system_design",
          company: question.companyName ?? "unknown",
          question_id: question.id,
          score: data.evaluation.overallScore,
          duration_seconds: Math.floor((Date.now() - interviewStartTimeRef.current) / 1000),
        },
      });

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

      // Save to progress tracking (async, don't block)
      console.log("[SystemDesign] Saving progress to database...");
      fetch("/api/progress/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "system_design",
          evaluation: data.evaluation,
        }),
      })
        .then(res => {
          console.log("[SystemDesign] Progress save response:", res.status);
          return res.json();
        })
        .then(result => console.log("[SystemDesign] Progress save result:", result))
        .catch(err => console.error("[SystemDesign] Failed to save progress:", err));

      // Close panel and navigate back to questions page
      isClosingRef.current = true;
      setIsClosing(true);
      setIsVisible(false);
      stopCurrentAudio();
      streamingConversation.abort();
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      setTimeout(onClose, 300);
    } catch (err) {
      console.error("[SystemDesign] Evaluation error:", err);
      setError("Failed to evaluate response");
      setPanelState("conversing");
    }
  }, [question.id, onScoreUpdate, cleanupAudioAnalysis, clearContinuationTimeout, stopCurrentAudio, streamingConversation, onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO LEVEL MONITORING
  // ═══════════════════════════════════════════════════════════════════════════

  const startAudioLevelMonitoring = useCallback(async (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      
      // Resume AudioContext if suspended (browsers block until user interaction)
      if (audioContext.state === 'suspended') {
        console.log("[Audio] AudioContext suspended, resuming...");
        await audioContext.resume();
      }
      console.log("[Audio] AudioContext state:", audioContext.state);
      
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
      // NOTE: Thresholds lowered significantly to accommodate quieter microphones
      const SILENCE_THRESHOLD = 0.003;  // Was 0.02 - lowered for quiet mics
      const SPEECH_THRESHOLD = 0.005;   // Was 0.05 - lowered for quiet mics
      const SILENCE_DURATION = 1500;
      const GREETING_SILENCE_DURATION = 1200; // Silence detection for greetings (1.2s) - gives streaming time to connect

      const checkLevel = () => {
        if (!analyserRef.current || recordingStateRef.current !== "recording") {
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        // Use /255 for consistent normalization across all panels
        const normalizedLevel = average / 255;

        setAudioLevel(normalizedLevel);
        // Only log every 30 frames to reduce console noise
        if (Math.random() < 0.033) {
          console.log("[Audio] Level:", normalizedLevel.toFixed(3));
        }

        if (normalizedLevel < SILENCE_THRESHOLD) {
          if (!silenceStartRef.current) {
            silenceStartRef.current = Date.now();
          } else {
            // Use shorter silence duration during greeting for faster response
            const effectiveSilenceDuration = panelStateRef.current === "awaiting_greeting" 
              ? GREETING_SILENCE_DURATION // 1.2s - allows streaming transcription to connect
              : SILENCE_DURATION;
            
            if (Date.now() - silenceStartRef.current > effectiveSilenceDuration) {
              const recordingDuration = Date.now() - recordingStartTimeRef.current;
              // Use shorter minimum for greetings (300ms vs 1000ms)
              const minDuration = panelStateRef.current === "awaiting_greeting" ? 300 : 1000;
              if (recordingDuration > minDuration) {
                console.log("[Audio] Silence detected, auto-pausing");
                silenceStartRef.current = null;
                setRecordingState("paused");
                return;
              }
            }
          }
        } else {
          silenceStartRef.current = null;
          // Track that actual speech was detected (above threshold)
          if (normalizedLevel >= SPEECH_THRESHOLD) {
            speechDetectedRef.current = true;
          }
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
      // Reuse existing stream or create new one
      let stream = streamRef.current;
      if (!stream || !stream.active) {
        console.log("[Recording] Requesting microphone access...");
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        streamRef.current = stream;
        console.log("[Recording] Microphone access granted");
      }

      // Verify stream has active audio tracks
      const audioTracks = stream.getAudioTracks();
      console.log("[Recording] Audio tracks:", audioTracks.length, "enabled:", audioTracks[0]?.enabled);

      if (audioTracks.length === 0 || !audioTracks[0].enabled) {
        console.error("[Recording] No active audio tracks!");
        setError("Microphone not available. Please check your microphone settings.");
        setRecordingState("idle");
        return;
      }

      // Use browser-supported mimeType (matches BehavioralInterviewPanel)
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          console.log(`[Recording] Chunk ${audioChunksRef.current.length}: ${e.data.size} bytes`);
        }
      };

      recorder.onstop = async () => {
        // If streaming greeting detection already handled this, skip batch processing
        if (streamingGreetingTriggeredRef.current) {
          console.log("[Recording] Streaming greeting already triggered, skipping batch processing");
          audioChunksRef.current = [];
          return;
        }
        
        // Only reset progressive transcription if we're falling back to batch
        progressiveTranscription.reset();
        
        const chunkCount = audioChunksRef.current.length;
        if (chunkCount === 0) {
          console.log("[Recording] No audio chunks captured");
          return;
        }

        // Use the recorder's actual mimeType for the blob
        const blobMimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
        console.log(`[Recording] Creating blob from ${chunkCount} chunks, mimeType: ${blobMimeType}`);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: blobMimeType });
        
        // Verify blob has valid WebM/audio header
        const headerBuffer = await audioBlob.slice(0, 12).arrayBuffer();
        const header = new Uint8Array(headerBuffer);
        const headerHex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join(' ');
        console.log(`[Recording] Blob header: ${headerHex}`);
        
        // WebM files start with 0x1A 0x45 0xDF 0xA3 (EBML header)
        const isValidWebM = header[0] === 0x1A && header[1] === 0x45 && header[2] === 0xDF && header[3] === 0xA3;
        if (!isValidWebM && blobMimeType.includes("webm")) {
          console.error("[Recording] Invalid WebM header! First 12 bytes:", headerHex);
        }
        
        audioChunksRef.current = [];
        
        const recordingDuration = Date.now() - recordingStartTimeRef.current;
        console.log(`[Recording] Stopped - chunks: ${chunkCount}, blob: ${audioBlob.size} bytes, type: ${blobMimeType}, duration: ${recordingDuration}ms, speech: ${speechDetectedRef.current}, validWebM: ${isValidWebM}`);

        // Minimum blob size for valid audio (WebM header + minimal data)
        if (audioBlob.size < 3000) {
          console.log("[Recording] Audio too small, skipping transcription");
          if (!isClosingRef.current && (panelStateRef.current === "conversing" || panelStateRef.current === "awaiting_greeting")) {
            recordingStateRef.current = "listening";
            setRecordingState("listening");
          }
          return;
        }
        
        // Minimum recording duration (300ms) to ensure we have real audio
        if (recordingDuration < 300) {
          console.log("[Recording] Recording too short, skipping transcription");
          if (!isClosingRef.current && (panelStateRef.current === "conversing" || panelStateRef.current === "awaiting_greeting")) {
            recordingStateRef.current = "listening";
            setRecordingState("listening");
          }
          return;
        }
        
        // Skip if we don't have a valid WebM header
        if (!isValidWebM && blobMimeType.includes("webm")) {
          console.error("[Recording] Skipping transcription - invalid audio format");
          if (!isClosingRef.current && (panelStateRef.current === "conversing" || panelStateRef.current === "awaiting_greeting")) {
            recordingStateRef.current = "listening";
            setRecordingState("listening");
          }
          return;
        }

        // FAST GREETING DETECTION: Skip transcription if audio looks like a greeting
        // Greetings are short (200-1500ms) with detected speech
        const isGreetingCandidate = 
          panelStateRef.current === "awaiting_greeting" &&
          speechDetectedRef.current &&
          recordingDuration >= 200 &&
          recordingDuration <= 1500;
        
        if (isGreetingCandidate) {
          console.log(`[Greeting] Fast path - skipping transcription (duration: ${recordingDuration}ms)`);
          setRecordingState("processing");
          
          // Directly trigger greeting flow with synthetic "Hello"
          // This saves 500-1500ms of Whisper API latency
          
          // Clean up stream before greeting processing
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          setIsProcessingGreeting(true);
          
          try {
            const response = await streamingConversation.sendMessage({
              questionTitle: questionTitleRef.current,
              questionContent: questionPromptRef.current,
              userMessage: "Hello",
              conversationHistory: [],
              interviewState: "greeting",
            });
            
            if (response?.fullText) {
              setConversation([
                { role: "candidate", content: "Hello", timestamp: Date.now() },
                { role: "interviewer", content: response.fullText, timestamp: Date.now() },
              ]);
            }
            
            panelStateRef.current = "speaking";
            setPanelState("speaking");
            setIsProcessingGreeting(false);
            
            const waitForGreetingAudio = (): Promise<void> => {
              return new Promise((resolve) => {
                const checkAudio = () => {
                  if (!streamingConversation.isStreaming && !streamingConversation.isPlaying) {
                    resolve();
                  } else {
                    setTimeout(checkAudio, 100);
                  }
                };
                setTimeout(checkAudio, 300);
              });
            };
            
            await waitForGreetingAudio();
            
            panelStateRef.current = "conversing";
            setPanelState("conversing");
            recordingStateRef.current = "listening";
            setRecordingState("listening");
          } catch (err) {
            console.error("[Greeting] Failed:", err);
            setIsProcessingGreeting(false);
            setRecordingState("listening");
          }
          return;
        }

        setRecordingState("processing");
        setProcessingStep("Transcribing...");

        const transcript = await transcribeAudio(audioBlob);

        if (transcript && transcript.trim()) {
          console.log("[Transcribe] Got transcript:", transcript);
          
          // If in awaiting_greeting state, check for greeting (inline to avoid circular dependency)
          if (panelStateRef.current === "awaiting_greeting") {
            // Clean up stream before greeting processing to prevent resource leaks
            // (greeting flow will request a new stream when auto-listen triggers)
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
            
            if (isGreeting(transcript)) {
              console.log("[Greeting] Detected greeting:", transcript);
              cleanupAudioAnalysis();
              setRecordingState("processing");
              
              // Show visual feedback that greeting was detected
              setIsProcessingGreeting(true);
              
              // Request AI greeting + question (unified response)
              try {
                const response = await streamingConversation.sendMessage({
                  questionTitle: questionTitleRef.current,
                  questionContent: questionPromptRef.current,
                  userMessage: transcript,
                  conversationHistory: [],
                  interviewState: "greeting",
                });
                
                if (response?.fullText) {
                  // Replace conversation entirely - AI's unified response includes the question
                  // so we don't need the initial question turn anymore
                  setConversation([
                    { role: "candidate", content: transcript, timestamp: Date.now() },
                    { role: "interviewer", content: response.fullText, timestamp: Date.now() },
                  ]);
                }
                
                // Transition to speaking state once AI starts responding
                panelStateRef.current = "speaking";
                setPanelState("speaking");
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
                
                // Transition directly to conversing (question was included in greeting)
                console.log("[Greeting] Complete, transitioning to conversing");
                panelStateRef.current = "conversing";
                setPanelState("conversing");
                recordingStateRef.current = "listening";
                setRecordingState("listening");
              } catch (err) {
                console.error("[Greeting] Failed to get AI greeting+question:", err);
                setIsProcessingGreeting(false);
                // On error, return to awaiting_greeting state so user can try again
                setRecordingState("listening");
                return;
              }
            } else {
              console.log("[Greeting] Not recognized as greeting:", transcript);
              setRecordingState("listening");
            }
          } else {
            await sendConversationMessage(transcript);
          }
        } else {
          console.log("[Transcribe] Empty transcript");
          if (!isClosingRef.current && (panelStateRef.current === "conversing" || panelStateRef.current === "awaiting_greeting")) {
            recordingStateRef.current = "listening";
            setRecordingState("listening");
          }
        }
      };

      recorder.start(100);
      recordingStartTimeRef.current = Date.now();
      speechDetectedRef.current = false; // Reset speech detection for this recording session
      
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
  }, [stopCurrentAudio, streamingConversation, transcribeAudio, sendConversationMessage, startAudioLevelMonitoring, cleanupAudioAnalysis, preloadedAudioUrl, question.tags, streamingSpeechSpeak]);

  // Handle recording state changes with debouncing
  const lastRecordingStartRef = useRef<number>(0);
  
  useEffect(() => {
    if (recordingState === "listening") {
      const now = Date.now();
      const timeSinceLastStart = now - lastRecordingStartRef.current;
      
      // Debounce: require at least 500ms between recording starts
      if (timeSinceLastStart < 500) {
        console.log("[Recording] Debounce - waiting before restart...");
        const delay = 500 - timeSinceLastStart;
        const timeout = setTimeout(() => {
          if (recordingStateRef.current === "listening") {
            console.log("[Recording] State is 'listening', starting after debounce...");
            lastRecordingStartRef.current = Date.now();
            startRecording();
          }
        }, delay);
        return () => clearTimeout(timeout);
      }
      
      console.log("[Recording] State is 'listening', starting...");
      lastRecordingStartRef.current = now;
      startRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingState]); // Intentionally exclude startRecording to prevent infinite loop

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
  // STREAMING GREETING DETECTION (Fast path - ~300ms latency)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const streamingGreetingTriggeredRef = useRef(false);
  const preloadedAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Helper to play prefetched audio
  const playPrefetchedAudio = useCallback(async (): Promise<void> => {
    if (!preloadedAudioUrl) return;
    
    return new Promise((resolve, reject) => {
      const audio = new Audio(preloadedAudioUrl);
      preloadedAudioRef.current = audio;
      setIsPlayingPreloadedAudio(true);
      
      audio.onended = () => {
        setIsPlayingPreloadedAudio(false);
        preloadedAudioRef.current = null;
        resolve();
      };
      
      audio.onerror = (e) => {
        setIsPlayingPreloadedAudio(false);
        preloadedAudioRef.current = null;
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
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      
      // Trigger greeting flow
      setRecordingState("processing");
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
          
          // Transition to conversing
          console.log("[Greeting] Complete, transitioning to conversing");
          panelStateRef.current = "conversing";
          setPanelState("conversing");
          recordingStateRef.current = "listening";
          setRecordingState("listening");
        } catch (err) {
          console.error("[Greeting] Streaming greeting flow failed:", err);
          setIsProcessingGreeting(false);
          streamingGreetingTriggeredRef.current = false;
          setRecordingState("listening");
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

  // Request microphone on mount and store stream for later use
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
        // Store the stream for later use (don't stop tracks!)
        streamRef.current = stream;
        const tracks = stream.getAudioTracks();
        console.log("[Init] Microphone permission granted. Tracks:", tracks.length);
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

  // Track interview started - only once per question
  useEffect(() => {
    if (hasTrackedStartRef.current === question.id) return;
    hasTrackedStartRef.current = question.id;
    interviewStartTimeRef.current = Date.now(); // Reset timer for new question
    
    track({
      name: "interview_started",
      properties: {
        type: "system_design",
        company: question.companyName ?? "unknown",
        question_id: question.id,
        question_title: question.title,
      },
    });
  }, [question.id, question.companyName, question.title]);

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

  // Initialize greeting flow - start listening for "hello"
  useEffect(() => {
    let wasCleanedUp = false;
    const mountId = `mount-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    activeMountIdRef.current = mountId;

    if (initialQuestionPlayedRef.current) {
      console.log("[Init] Question already initialized, skipping");
      return;
    }
    initialQuestionPlayedRef.current = true;

    activeSessionId = sessionIdRef.current;
    console.log("[Init] Awaiting greeting for question:", question.title);

    // Start listening for greeting
    panelStateRef.current = "awaiting_greeting";
    setPanelState("awaiting_greeting");
    recordingStateRef.current = "listening";
    setRecordingState("listening");

    return () => {
      console.log("[Init] Cleanup running for mount:", mountId);
      wasCleanedUp = true;
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
  }, [question.id, streamingSpeechStop]);

  /**
   * Handle greeting detection and transition to speaking state
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
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    cleanupAudioAnalysis();
    
    // Clean up stream to prevent resource leaks
    // (greeting flow will request a new stream when auto-listen triggers)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setRecordingState("processing");
    
    // Show visual feedback that greeting was detected
    setIsProcessingGreeting(true);
    
    // Request AI greeting + question via conversation API (unified response)
    try {
      const response = await streamingConversation.sendMessage({
        questionTitle: questionTitleRef.current,
        questionContent: questionPromptRef.current,
        userMessage: greetingText,
        conversationHistory: [],
        interviewState: "greeting",
      });
      
      if (response?.fullText) {
        // Replace conversation entirely - AI's unified response includes the question
        // so we don't need the initial question turn anymore
        setConversation([
          { role: "candidate", content: greetingText, timestamp: Date.now() },
          { role: "interviewer", content: response.fullText, timestamp: Date.now() },
        ]);
      }
      
      // Transition to speaking state once AI starts responding
      panelStateRef.current = "speaking";
      setPanelState("speaking");
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
      
      // Transition directly to conversing state (question was included in greeting)
      console.log("[Greeting] Complete, transitioning to conversing");
      panelStateRef.current = "conversing";
      setPanelState("conversing");
      recordingStateRef.current = "listening";
      setRecordingState("listening");
    } catch (err) {
      console.error("[Greeting] Failed to get AI greeting+question:", err);
      setIsProcessingGreeting(false);
      // On error, return to awaiting_greeting state so user can try again
      setRecordingState("listening");
    }
  }, [streamingConversation, cleanupAudioAnalysis]);

  /**
   * Process greeting transcription result
   */
  const processGreetingTranscript = useCallback(async (transcript: string) => {
    if (!transcript || panelStateRef.current !== "awaiting_greeting") {
      return;
    }
    
    if (isGreeting(transcript)) {
      await handleGreetingDetected(transcript);
    } else {
      console.log("[Greeting] Not recognized as greeting:", transcript);
      setRecordingState("listening");
    }
  }, [handleGreetingDetected]);

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
    // Track interview closed
    track({
      name: "interview_closed",
      properties: {
        type: "system_design",
        company: questionCompanyNameRef.current ?? "unknown",
        question_id: questionIdRef.current,
        completed: evaluationRef.current !== null,
      },
    });

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
            Question {(questionIndex ?? 0) + 1} of {totalQuestions ?? 1}
          </span>
        </div>

        <div className={styles.panelHeaderRight}>
          {/* Finish Interview Button - show when conversing (with responses) or evaluating */}
          {(panelState === "conversing" || panelState === "evaluating") && conversation.filter(t => t.role === "candidate").length > 0 && (
            <button 
              className={styles.finishInterviewBtn} 
              onClick={handleSubmitResponse}
              disabled={panelState === "evaluating"}
            >
              {panelState === "evaluating" ? "Evaluating..." : "Finish Interview"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}
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
          {/* Greeting Prompt - Say Hello to Start */}
          {panelState === "awaiting_greeting" && !isProcessingGreeting && (
            <div className={`${styles.greetingPrompt} ${recordingState === "recording" ? styles.recording : ""}`}>
              <div className={styles.greetingMicIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </div>
              <h3>Say &quot;Hello&quot; to start your interview</h3>
              <p>Your AI interviewer will greet you and present the system design challenge</p>
              {recordingState === "recording" && (
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

              {/* Live Transcript Preview (Progressive Transcription) */}
              {recordingState === "recording" && progressiveTranscription.partialTranscript && (
                <div className={styles.partialTranscriptPreview}>
                  <span className={styles.liveIndicator}>LIVE</span>
                  <p>{progressiveTranscription.partialTranscript}</p>
                </div>
              )}

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
