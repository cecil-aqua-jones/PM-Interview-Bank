"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useStreamingConversation } from "@/lib/hooks/useStreamingConversation";
import { useStreamingSpeech } from "@/lib/hooks/useStreamingSpeech";
import { useProgressiveTranscription } from "@/lib/hooks/useProgressiveTranscription";
import { saveBehavioralInterview, getBehavioralInterview } from "@/lib/interviewStorage";
import { BehavioralEvaluationResult } from "@/lib/behavioralRubric";
import { Question } from "@/lib/types";
import { isGreeting } from "@/lib/greetingDetection";
import FormattedContent from "./FormattedContent";
import styles from "../app.module.css";

type BehavioralInterviewPanelProps = {
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
  | "awaiting_greeting"  // Waiting for user to say hello
  | "speaking"      // AI reads the question (only once)
  | "conversing"    // Free-form conversation (clarifying questions, answers)
  | "processing"    // Transcribing or AI responding
  | "evaluating"    // Evaluating final response
  | "feedback";     // Final evaluation display

type ConversationTurn = {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: number;
};

type RecordingState = "idle" | "listening" | "recording" | "paused" | "processing";

let activeSessionId: string | null = null;

export default function BehavioralInterviewPanel({
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
}: BehavioralInterviewPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [panelState, setPanelState] = useState<PanelState>("awaiting_greeting");
  const [evaluation, setEvaluation] = useState<BehavioralEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [isPlayingPreloadedAudio, setIsPlayingPreloadedAudio] = useState(false);

  // Conversation state - initialize with the question
  const [conversation, setConversation] = useState<ConversationTurn[]>([{
    role: "interviewer",
    content: `${question.title}\n\n${question.prompt}`,
    timestamp: Date.now(),
  }]);

  // Hands-free conversation state
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

  // Question refs to avoid stale closures
  const questionTitleRef = useRef(question.title);
  const questionPromptRef = useRef(question.prompt);

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const speechDetectedRef = useRef(false);
  const recordingStartTimeRef = useRef<number>(0);
  const continuationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoListenEnabledRef = useRef(true);
  const shouldAutoSendRef = useRef(false);
  const pendingTranscriptRef = useRef<string>("");
  const streamingFallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State refs for async callbacks
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
  
  // Progressive transcription for reduced latency
  const progressiveTranscription = useProgressiveTranscription();
  
  // Streaming speech with callbacks
  const streamingSpeechCallbacksRef = useRef<{ onComplete?: () => void }>({});
  const streamingSpeech = useStreamingSpeech({
    onComplete: () => {
      console.log("[BehavioralPanel] Streaming speech complete");
      streamingSpeechCallbacksRef.current.onComplete?.();
    },
    onError: (err) => {
      console.error("[BehavioralPanel] Streaming speech error:", err);
      streamingSpeechCallbacksRef.current.onComplete?.();
    },
  });

  // Extract stable references
  const streamingSpeechSpeak = streamingSpeech.speak;
  const streamingSpeechStop = streamingSpeech.stop;
  const streamingSpeechIsPlaying = streamingSpeech.isPlaying;

  // Configuration for natural conversation flow
  // NOTE: Thresholds lowered significantly to accommodate quieter microphones
  // User testing showed levels of 0.004-0.007 during speech
  const SILENCE_THRESHOLD = 0.003;  // Was 0.015 - lowered for quiet mics
  const SPEECH_THRESHOLD = 0.005;   // Was 0.025 - lowered for quiet mics
  const SILENCE_DURATION = 1500;
  const GREETING_SILENCE_DURATION = 1200; // Silence detection for greetings (1.2s) - gives streaming time to connect
  const CONTINUATION_WINDOW = 3500;
  const MIN_RECORDING_DURATION = 500;

  // ═══════════════════════════════════════════════════════════════════════════
  // SENTENCE COMPLETENESS CHECK
  // ═══════════════════════════════════════════════════════════════════════════

  const isCompleteSentence = (text: string): boolean => {
    if (!text || text.trim().length === 0) return false;
    const trimmed = text.trim();

    const incompleteEndings = [
      /\s(and|but|so|or|because|if|when|while|although|though|since|unless|after|before|that|which|who|where|what|how|why|the|a|an|to|for|with|in|on|at|by|of|is|are|was|were|have|has|had|will|would|could|should|can|may|might|must|shall|do|does|did|be|being|been|it's|its|this|these|those|like|such|as|than|then|just|also|only|even|still|yet|already|about|into|from|over|under|between|through|during|toward|towards|against|among|within|without|upon|along|across|behind|beside|besides|beyond|except|around|above|below|beneath|inside|outside|i|we|you|they|he|she|it|my|our|your|their|his|her|its|im|i'm|i'll|i've|i'd|we're|we'll|we've|they're|they'll|they've|he's|she's|it's)$/i,
    ];

    for (const pattern of incompleteEndings) {
      if (pattern.test(trimmed)) return false;
    }

    if (/[…\-–—]$/.test(trimmed) || trimmed.endsWith('...')) return false;

    const words = trimmed.split(/\s+/);
    if (words.length <= 2) {
      const lowerTrimmed = trimmed.toLowerCase();
      const singleWordResponses = ['yes', 'no', 'okay', 'sure', 'right', 'correct', 'exactly', 'agreed', 'understood', 'thanks', 'yep', 'nope', 'yeah', 'nah', 'ok', 'alright', 'definitely', 'absolutely'];
      const multiWordResponses = ['got it', 'makes sense', 'i see', 'thank you', 'of course', 'for sure'];
      
      if (singleWordResponses.includes(lowerTrimmed)) return true;
      if (multiWordResponses.includes(lowerTrimmed)) return true;
      if (words.length === 2 && singleWordResponses.includes(words[0].toLowerCase())) return true;
    }

    return /[.!?]$/.test(trimmed) || words.length >= 5;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  const stopCurrentAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsPlayingPreloadedAudio(false);
    streamingSpeechStop();
  }, [streamingSpeechStop]);

  const cleanupAudioAnalysis = useCallback(() => {
    // Check state before closing to avoid errors on already-closed context
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close().catch(() => {});
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    silenceStartRef.current = null;
    setAudioLevel(0);
  }, []);

  const clearContinuationTimeout = useCallback(() => {
    if (continuationTimeoutRef.current) {
      clearTimeout(continuationTimeoutRef.current);
      continuationTimeoutRef.current = null;
    }
    shouldAutoSendRef.current = false;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-LISTEN SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════


  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERSATION MESSAGE HANDLING (No auto-evaluation)
  // ═══════════════════════════════════════════════════════════════════════════

  // Track last sent message and response to prevent duplicates
  const lastSentMessageRef = useRef<string>("");
  const lastAddedResponseRef = useRef<string>("");
  const isProcessingMessageRef = useRef(false);

  const sendConversationMessage = useCallback(async (message: string) => {
    if (!message.trim() || isClosingRef.current) return;

    // Prevent duplicate sends of the same message
    if (lastSentMessageRef.current === message.trim()) {
      console.log("[Behavioral] Duplicate message detected, skipping");
      return;
    }
    
    // Prevent concurrent processing
    if (isProcessingMessageRef.current) {
      console.log("[Behavioral] Already processing a message, skipping");
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
    
    // Capture history BEFORE adding new message to avoid duplication
    // (userMessage is passed separately to the API)
    const historyBeforeNewMessage = conversationRef.current.map(t => ({ role: t.role, content: t.content }));
    
    const updatedConversation = [...conversationRef.current, candidateTurn];
    setConversation(updatedConversation);

    // Get AI response (clarifying question response, acknowledgment, or probe)
    // This is NOT evaluation - just natural conversation
    setRecordingState("processing");
    setProcessingStep("AI is thinking...");

    try {
      const response = await streamingConversation.sendMessage({
        questionTitle: questionTitleRef.current,
        questionContent: questionPromptRef.current,
        userMessage: message,
        conversationHistory: historyBeforeNewMessage, // Don't include current message - it's in userMessage
        interviewState: "followup", // Use followup state for conversational responses
      });

      if (isClosingRef.current) {
        isProcessingMessageRef.current = false;
        return;
      }

      if (response?.fullText) {
        // Clear streaming text FIRST to prevent duplicate display
        setStreamingText("");
        
        // Prevent duplicate responses
        if (lastAddedResponseRef.current === response.fullText) {
          console.log("[Behavioral] Duplicate response content, skipping add");
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
        console.log(`[Behavioral] Waiting at least ${minDelay}ms for ${wordCount} words, then polling for audio completion`);
        
        // Set to idle first
        setRecordingState("idle");
        isProcessingMessageRef.current = false;
        
        // Wait minimum delay, then poll until audio is done
        setTimeout(() => {
          const pollForAudioCompletion = () => {
            if (isClosingRef.current || panelStateRef.current !== "conversing") {
              console.log("[Behavioral] Panel state changed, cancelling auto-listen");
              return;
            }
            
            // Check if audio is still playing (both streaming text and audio playback)
            if (streamingConversation.isStreaming || streamingConversation.isPlaying) {
              console.log("[Behavioral] Audio still playing, waiting 500ms...");
              setTimeout(pollForAudioCompletion, 500);
              return;
            }
            
            // Audio done - start recording if still in idle state
            if (recordingStateRef.current === "idle") {
              console.log("[Behavioral] Audio complete, auto-starting recording now");
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
      console.error("[Behavioral] Conversation error:", err);
      setError("Failed to get response");
      setRecordingState("idle");
      isProcessingMessageRef.current = false;
    }
  }, [streamingConversation]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBMIT RESPONSE (Triggers Evaluation)
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSubmitResponse = useCallback(async () => {
    if (conversationRef.current.length < 2) {
      setError("Please provide a response before submitting");
      return;
    }

    // Stop any recording
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    cleanupAudioAnalysis();
    clearContinuationTimeout();
    setRecordingState("idle");
    setPendingTranscript("");
    pendingTranscriptRef.current = "";

    setPanelState("evaluating");
    setProcessingStep("Evaluating your response...");

    try {
      // Combine all candidate responses for evaluation
      const candidateResponses = conversationRef.current
        .filter(t => t.role === "candidate")
        .map(t => t.content)
        .join("\n\n");

      const evalResponse = await fetch("/api/interview/evaluate-behavioral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${questionTitleRef.current}\n\n${questionPromptRef.current}`,
          transcript: candidateResponses,
          conversationHistory: conversationRef.current.map(t => ({ role: t.role, content: t.content })),
          tags: question.tags,
          difficulty: question.difficultyLabel,
        }),
      });

      if (!evalResponse.ok) throw new Error("Evaluation failed");

      const data = await evalResponse.json();
      setEvaluation(data.evaluation);

      // Save to localStorage
      saveBehavioralInterview(question.id, data.evaluation, candidateResponses, conversationRef.current);
      onScoreUpdate?.(question.id, data.evaluation.overallScore);

      // Save to progress tracking (async, don't block)
      console.log("[Behavioral] Saving progress to database...");
      fetch("/api/progress/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "behavioral",
          evaluation: data.evaluation,
        }),
      })
        .then(res => {
          console.log("[Behavioral] Progress save response:", res.status);
          return res.json();
        })
        .then(result => console.log("[Behavioral] Progress save result:", result))
        .catch(err => console.error("[Behavioral] Failed to save progress:", err));

      // Close panel and navigate back to questions page
      // Score will be visible on the questions list
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
      console.error("[Behavioral] Evaluation error:", err);
      setError("Failed to evaluate response. Please try again.");
      setPanelState("conversing");
    }
  }, [question, onScoreUpdate, cleanupAudioAnalysis, clearContinuationTimeout, stopCurrentAudio, streamingConversation, onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RECORDING & TRANSCRIPTION
  // ═══════════════════════════════════════════════════════════════════════════

  const pauseRecordingRef = useRef<() => Promise<void>>();
  const handleGreetingDetectedRef = useRef<(text: string) => Promise<void>>();

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

    const words = normalized.split(/\s+/);
    if (words.length === 1) {
      // Single word not in allowed list - filter it
      console.log("[Transcribe] Filtered - single word:", text);
      return true;
    }

    const hallucinationPatterns = [
      /^thanks?\s*(for\s*)?(watching|listening|viewing)/i,
      /subscribe/i, /like\s*(and|&)\s*subscribe/i, /see\s*you\s*(next|later|soon)/i,
      /\botter\.ai\b/i, /transcribed\s*by/i, /^beep\.?$/i, /^\[.*\]$/, /^\(.*\)$/,
      /^\.{2,}$/, /^music\.?$/i, /^the\s*end\.?$/i, /^bye\.?$/i, /^goodbye\.?$/i,
      /^hello\.?$/i, /^hey\.?$/i, /^you\.?$/i, /^i\.?$/i, /^okay\.?$/i, /^ok\.?$/i,
      /^um+\.?$/i, /^uh+\.?$/i, /^hmm+\.?$/i, /^mm+\.?$/i, /^ah+\.?$/i, /^oh+\.?$/i,
      /^huh\.?$/i, /^mhm+\.?$/i, /^yeah\.?$/i, /^yep\.?$/i, /^nope\.?$/i, /^nah\.?$/i,
      /^wow\.?$/i, /^whoa\.?$/i, /please\s*subscribe/i, /don'?t\s*forget\s*to/i,
      /hit\s*the\s*(like|bell)/i, /comment\s*(below|down)/i, /^\s*$/,
    ];

    for (const pattern of hallucinationPatterns) {
      if (pattern.test(normalized)) return true;
    }

    if (/^(.)\1{3,}$/.test(normalized)) return true;
    if (/^(\w+\s*)\1{2,}$/.test(normalized)) return true;

    return false;
  };

  const transcribeCurrentChunk = async (): Promise<string | null> => {
    if (audioChunksRef.current.length === 0) return null;
    if (!speechDetectedRef.current) {
      console.log("[Transcribe] No speech detected, skipping");
      return null;
    }

    const recordingDuration = Date.now() - recordingStartTimeRef.current;
    if (recordingDuration < MIN_RECORDING_DURATION) return null;

    const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
    const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType });
    if (recordedBlob.size < 1000) return null;

    try {
      const formData = new FormData();
      formData.append("audio", recordedBlob, "behavioral.webm");

      const response = await fetch("/api/interview/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Transcription failed");

      const { transcript } = await response.json();
      const trimmed = transcript?.trim() || null;

      if (trimmed && isLikelyHallucination(trimmed)) return null;

      console.log("[Transcribe] Got transcript:", trimmed);
      return trimmed;
    } catch (err) {
      console.error("[Transcribe] Error:", err);
      return null;
    }
  };

  const finalizePendingMessage = useCallback(async () => {
    clearContinuationTimeout();
    shouldAutoSendRef.current = false;

    const messageToSend = pendingTranscriptRef.current.trim();

    // If in awaiting_greeting state, check for greeting
    if (panelStateRef.current === "awaiting_greeting") {
      pendingTranscriptRef.current = "";
      setPendingTranscript("");
      
      // CRITICAL: Check if streaming already handled the greeting
      if (streamingGreetingTriggeredRef.current) {
        console.log("[Finalize] Streaming already handled greeting, skipping");
        return;
      }
      
      // Clean up stream before greeting processing to prevent resource leaks
      // (greeting flow will request a new stream when auto-listen triggers)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (messageToSend) {
        // Inline greeting detection to avoid circular dependency
        if (isGreeting(messageToSend)) {
          // Stop recording and process greeting
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
          cleanupAudioAnalysis();
          setRecordingState("processing");
          
          // Show visual feedback that greeting was detected
          setIsProcessingGreeting(true);
          
          // Request AI greeting + question (unified response)
          try {
            const response = await streamingConversation.sendMessage({
              questionTitle: questionTitleRef.current,
              questionContent: questionPromptRef.current,
              userMessage: messageToSend,
              conversationHistory: [],
              interviewState: "greeting",
            });
            
            if (response?.fullText) {
              // Replace conversation entirely - AI's unified response includes the question
              // so we don't need the initial question turn anymore
              setConversation([
                { role: "candidate", content: messageToSend, timestamp: Date.now() },
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
          console.log("[Greeting] Not recognized as greeting:", messageToSend);
          setRecordingState("listening");
        }
      } else {
        // No transcript, keep listening
        setRecordingState("listening");
      }
      return;
    }

    if (messageToSend && !isCompleteSentence(messageToSend)) {
      const extendedWait = 2000;
      console.log("[Conversation] Message seems incomplete, extending wait");

      shouldAutoSendRef.current = true;
      continuationTimeoutRef.current = setTimeout(async () => {
        if (shouldAutoSendRef.current && pendingTranscriptRef.current.trim()) {
          shouldAutoSendRef.current = false;
          const finalMessage = pendingTranscriptRef.current.trim();
          pendingTranscriptRef.current = "";
          setPendingTranscript("");

          if (finalMessage) {
            await sendConversationMessage(finalMessage);
          }
        }
      }, extendedWait);
      return;
    }

    pendingTranscriptRef.current = "";
    setPendingTranscript("");

    if (messageToSend) {
      await sendConversationMessage(messageToSend);
    } else {
      setRecordingState("idle");
    }
  }, [clearContinuationTimeout, sendConversationMessage, cleanupAudioAnalysis, streamingConversation, preloadedAudioUrl, question.tags, streamingSpeechSpeak]);

  const pauseRecording = useCallback(async () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    cleanupAudioAnalysis();
    
    // CRITICAL: Check if streaming already handled the greeting
    // This prevents duplicate audio playback when both paths trigger
    if (streamingGreetingTriggeredRef.current) {
      console.log("[Pause] Streaming already handled greeting, skipping batch path");
      audioChunksRef.current = [];
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
      audioChunksRef.current = [];
      setRecordingState("processing");
      
      // Directly trigger greeting flow with synthetic "Hello"
      // This saves 500-1500ms of Whisper API latency
      await handleGreetingDetectedRef.current("Hello");
      return;
    }
    
    setRecordingState("paused");

    const transcript = await transcribeCurrentChunk();
    if (transcript) {
      const current = pendingTranscriptRef.current;
      const combined = current ? `${current} ${transcript}` : transcript;
      pendingTranscriptRef.current = combined;
      setPendingTranscript(combined);
    }

    audioChunksRef.current = [];

    clearContinuationTimeout();
    shouldAutoSendRef.current = true;
    continuationTimeoutRef.current = setTimeout(() => {
      if (shouldAutoSendRef.current) {
        finalizePendingMessage();
      }
    }, CONTINUATION_WINDOW);
  }, [cleanupAudioAnalysis, clearContinuationTimeout, finalizePendingMessage]);

  useEffect(() => {
    pauseRecordingRef.current = pauseRecording;
  }, [pauseRecording]);

  const startAudioLevelMonitoring = useCallback(async (stream: MediaStream) => {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const audioContext = new AudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyser.minDecibels = -80;
      analyser.maxDecibels = -10;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let frameCount = 0;

      const checkAudioLevel = () => {
        if (!analyserRef.current || !audioContextRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = average / 255;
        setAudioLevel(normalizedLevel);

        frameCount++;
        if (frameCount % 30 === 0) {
          console.log("[Audio] Level:", normalizedLevel.toFixed(3));
        }

        const isActiveSpeech = normalizedLevel >= SPEECH_THRESHOLD;
        const isSilent = normalizedLevel < SILENCE_THRESHOLD;

        if (isSilent) {
          if (!silenceStartRef.current) {
            silenceStartRef.current = Date.now();
          } else {
            // Use shorter silence duration during greeting for faster response
            // Greetings are typically 1-2 words, so we can detect end of speech sooner
            const effectiveSilenceDuration = panelStateRef.current === "awaiting_greeting" 
              ? GREETING_SILENCE_DURATION // 1.2s - allows streaming transcription to connect
              : SILENCE_DURATION;
            
            if (Date.now() - silenceStartRef.current > effectiveSilenceDuration) {
              console.log("[Audio] Silence detected, auto-pausing");
              if (pauseRecordingRef.current) {
                void pauseRecordingRef.current().catch(console.error);
              }
              return;
            }
          }
        } else if (isActiveSpeech) {
          silenceStartRef.current = null;
          speechDetectedRef.current = true;
        }

        requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
    } catch (err) {
      console.error("[Audio] Monitoring failed:", err);
    }
  }, []);

  const startRecording = useCallback(async () => {
    console.log("[Recording] Starting...");
    stopCurrentAudio();
    streamingConversation.abort();

    if (recordingStateRef.current === "paused") {
      clearContinuationTimeout();
    }

    try {
      let stream = streamRef.current;
      if (!stream || !stream.active) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        streamRef.current = stream;
      }

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0 || !audioTracks[0].enabled) {
        setError("Microphone not available");
        setRecordingState("idle");
        return;
      }

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          // Progressive transcription disabled - causing rate limiting issues
          // progressiveTranscription.updateChunks(audioChunksRef.current);
        }
      };

      mediaRecorder.onerror = () => {
        setError("Recording error occurred");
        setRecordingState("idle");
      };

      mediaRecorder.start(100);
      
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
      // (setRecordingState is async, but audio monitoring may read the ref immediately)
      recordingStateRef.current = "recording";
      setRecordingState("recording");
      silenceStartRef.current = null;
      recordingStartTimeRef.current = Date.now();
      speechDetectedRef.current = false;

      await startAudioLevelMonitoring(stream);
    } catch (err) {
      console.error("[Recording] Error:", err);
      setError("Microphone access denied");
      setRecordingState("idle");
    }
  }, [stopCurrentAudio, streamingConversation, clearContinuationTimeout, startAudioLevelMonitoring]);

  // Auto-start recording when state becomes "listening"
  // Use a ref to prevent rapid restarts (debounce)
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
  // INITIALIZATION & LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  // Request microphone permission immediately
  useEffect(() => {
    const requestMic = async () => {
      try {
        console.log("[Init] Requesting microphone permission...");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        streamRef.current = stream;
        console.log("[Init] Microphone permission granted");
      } catch (err) {
        console.error("[Init] Microphone permission denied:", err);
        setError("Microphone access is required for the interview");
      }
    };

    requestMic();

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

  // Animate panel in
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
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
    
    // Reset conversation with the new question (like handleTryAgain does)
    setConversation([{
      role: "interviewer",
      content: `${question.title}\n\n${question.prompt}`,
      timestamp: Date.now(),
    }]);
    setEvaluation(null);
    setPanelState("speaking");
  }, [question.id, question.title, question.prompt]);

  // Initialize greeting flow - start listening for "hello"
  useEffect(() => {
    let wasCleanedUp = false;
    const mountId = `mount-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    activeMountIdRef.current = mountId;

    // Skip if already played (prevents double-play in strict mode second mount)
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
      // Reset for React Strict Mode - allows audio to play on remount
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

  // Keep ref in sync for use in pauseRecording
  useEffect(() => {
    handleGreetingDetectedRef.current = handleGreetingDetected;
  }, [handleGreetingDetected]);

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
    const previous = getBehavioralInterview(question.id);
    if (previous) {
      setEvaluation(previous.evaluation);
      if (previous.conversationHistory) {
        const historyWithTimestamps: ConversationTurn[] = previous.conversationHistory.map((turn, index) => ({
          ...turn,
          timestamp: previous.timestamp - (previous.conversationHistory!.length - index) * 1000
        }));
        setConversation(historyWithTimestamps);
        setPanelState("feedback"); // Go straight to feedback if already evaluated
        initialQuestionPlayedRef.current = true; // Don't replay
      }
    }
  }, [question.id]);

  // Auto-scroll conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, streamingText]);

  // Sync streaming text - only while actively streaming
  useEffect(() => {
    if (streamingConversation.isStreaming) {
      setStreamingText(streamingConversation.currentText);
    } else {
      // Clear when streaming ends
      setStreamingText("");
    }
  }, [streamingConversation.currentText, streamingConversation.isStreaming]);

  // Store current text in ref for audio duration estimation
  const streamingTextRef = useRef(streamingConversation.currentText);
  streamingTextRef.current = streamingConversation.currentText;

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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Reset state for new question
    // Note: conversation, evaluation, and panelState are reset in the question.id effect
    setRecordingState("idle");
    initialQuestionPlayedRef.current = false;

    // Wait for 300ms closing animation to complete before navigating
    setTimeout(() => {
      if (direction === "next" && onNext) onNext();
      else if (direction === "prev" && onPrev) onPrev();
    }, 300);
  }, [onNext, onPrev, stopCurrentAudio, streamingConversation, clearContinuationTimeout, cleanupAudioAnalysis]);

  const skipToConversing = useCallback(() => {
    stopCurrentAudio();
    
    panelStateRef.current = "conversing";
    setPanelState("conversing");
    // Auto-start recording immediately
    recordingStateRef.current = "listening";
    setRecordingState("listening");
  }, [stopCurrentAudio]);

  // Interrupt handler - tap to stop AI speaking
  const handleInterrupt = useCallback(() => {
    if (isPlayingPreloadedAudio || streamingSpeechIsPlaying || streamingConversation.isStreaming) {
      stopCurrentAudio();
      streamingConversation.stopAudio();
      
      // Transition to conversing if in speaking state
      if (panelStateRef.current === "speaking") {
        panelStateRef.current = "conversing";
        setPanelState("conversing");
      }
      
      // Auto-start recording immediately after interrupt
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
    // Reset tracking refs
    lastSentMessageRef.current = "";
    lastAddedResponseRef.current = "";
    isProcessingMessageRef.current = false;
    // Auto-start recording immediately
    recordingStateRef.current = "listening";
    setRecordingState("listening");
  }, []);

  // Manual start recording
  const handleStartRecording = useCallback(() => {
    if (recordingState === "idle" || recordingState === "paused") {
      setRecordingState("listening");
    }
  }, [recordingState]);

  // Manual stop recording
  const handleStopRecording = useCallback(async () => {
    if (recordingState === "recording") {
      await pauseRecording();
    }
  }, [recordingState, pauseRecording]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  const isAISpeaking = isPlayingPreloadedAudio || streamingSpeechIsPlaying || streamingConversation.isStreaming;
  const hasCandidateResponse = conversation.some(t => t.role === "candidate");

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
          <span className={styles.panelTitle}>Behavioral Interview</span>
          <span className={styles.panelQuestionNumber}>
            Question {questionIndex + 1} of {totalQuestions}
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
        {/* Conversation Area */}
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
              <p>Your AI interviewer will greet you and begin the behavioral interview</p>
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

          {/* Speaking state hint - shown above conversation when AI is speaking */}
          {panelState === "speaking" && (
            <div className={styles.speakingHint}>
              <p>Listen to the question, then respond when ready</p>
            </div>
          )}

          {/* Conversation Thread - Always visible (initialized with question) */}
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
                      <FormattedContent content={turn.content} />
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

              {/* Inline Feedback - Show below conversation when evaluated */}
              {panelState === "feedback" && evaluation && (
                <div className={styles.inlineFeedback}>
                  <div className={styles.feedbackDivider}>
                    <span>Evaluation Results</span>
                  </div>
                  
                  <div className={styles.inlineScoreRow}>
                    <div className={styles.scoreCircleSmall}>
                      <span className={styles.scoreValue}>{evaluation.overallScore}</span>
                      <span className={styles.scoreLabel}>/ 100</span>
                    </div>
                    <div className={styles.scoreSummary}>
                      <p>{evaluation.overallFeedback}</p>
                    </div>
                  </div>

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

                  {/* Criteria Breakdown */}
                  <div className={styles.feedbackBlock}>
                    <h4>Breakdown</h4>
                    <div className={styles.criteriaGrid}>
                      {Object.entries(evaluation.breakdown).map(([name, data]) => (
                        <div key={name} className={styles.criterionItem}>
                          <span className={styles.criterionLabel}>{name}</span>
                          <div className={styles.criterionBarSmall}>
                            <div 
                              className={styles.criterionFillSmall} 
                              style={{ width: `${(data.score / 4) * 100}%` }}
                            />
                          </div>
                          <span className={styles.criterionScoreSmall}>{data.score}/4</span>
                        </div>
                      ))}
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
          {/* AI Speaking Status - tap to interrupt */}
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

          {/* Recording Controls - Show when in conversing state and not AI speaking */}
          {panelState === "conversing" && !isAISpeaking && (
            <div className={styles.recordingControls}>
              {/* Recording State Indicator */}
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

              {/* Pending Transcript Preview */}
              {pendingTranscript && recordingState === "paused" && (
                <div className={styles.pendingTranscript}>
                  <p>&quot;{pendingTranscript}&quot;</p>
                </div>
              )}

              {/* Microphone Button */}
              <div className={styles.microphoneButtonContainer}>
                {recordingState === "recording" ? (
                  <button 
                    className={`${styles.microphoneBtn} ${styles.recording}`}
                    onClick={handleStopRecording}
                    title="Stop recording"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  </button>
                ) : (
                  <button 
                    className={styles.microphoneBtn}
                    onClick={handleStartRecording}
                    disabled={recordingState === "processing"}
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
                  {recordingState === "recording" 
                    ? "Tap to stop" 
                    : "Tap to speak"}
                </p>
              </div>

              {/* Submit Response Button */}
              {hasCandidateResponse && recordingState === "idle" && (
                <button 
                  className={styles.submitResponseBtn} 
                  onClick={handleSubmitResponse}
                >
                  Submit Response
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
