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

  // Clarifying questions state
  const [clarifyingQuestion, setClarifyingQuestion] = useState("");
  const [clarifications, setClarifications] = useState<{ question: string; answer: string }[]>([]);
  const [isAskingClarification, setIsAskingClarification] = useState(false);
  const [showClarifyInput, setShowClarifyInput] = useState(true);
  const [isRecordingClarification, setIsRecordingClarification] = useState(false);
  const [clarifyRecordingState, setClarifyRecordingState] = useState<"idle" | "recording" | "processing">("idle");
  const MAX_CLARIFICATIONS = 5;

  // Audio queue system - prevents simultaneous playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<AudioQueueItem[]>([]);
  const isPlayingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string>(Date.now().toString());
  const clarifyMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const clarifyChunksRef = useRef<Blob[]>([]);
  const initialQuestionPlayedRef = useRef(false);

  const {
    state: recorderState,
    audioBlob,
    duration,
    error: recorderError,
    startRecording,
    stopRecording,
    resetRecording,
    audioLevel,
  } = useAudioRecorder();

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO QUEUE SYSTEM - Ensures sequential playback, never simultaneous
  // ═══════════════════════════════════════════════════════════════════════════
  
  const stopCurrentAudio = useCallback(() => {
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
    // If already playing or queue empty, do nothing
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
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
        // fetch mode - item.data is the text to speak
        const response = await fetch("/api/interview/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: item.data }),
        });
        if (!response.ok) {
          throw new Error("TTS failed");
        }
        const blob = await response.blob();
        audioUrl = URL.createObjectURL(blob);
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
        item.onComplete?.();
        // Process next item in queue
        processNextInQueue();
      });

      audio.addEventListener("error", () => {
        if (item.source !== "url") {
          URL.revokeObjectURL(audioUrl);
        }
        isPlayingRef.current = false;
        setIsSpeaking(false);
        item.onComplete?.();
        processNextInQueue();
      });

      audio.addEventListener("pause", () => {
        // If paused externally, consider it done
        isPlayingRef.current = false;
        setIsSpeaking(false);
      });

      await audio.play();
    } catch (err) {
      console.error("[Audio Queue] Error:", err);
      isPlayingRef.current = false;
      setIsSpeaking(false);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  // Animate panel in
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  // Play initial question audio (only once)
  useEffect(() => {
    if (initialQuestionPlayedRef.current) return;
    if (activeSessionId && activeSessionId !== sessionIdRef.current) return;

    activeSessionId = sessionIdRef.current;
    initialQuestionPlayedRef.current = true;

    const onQuestionComplete = () => {
      setPanelState("coding");
    };

    if (preloadedAudioUrl) {
      playAudioUrl(preloadedAudioUrl, onQuestionComplete);
    } else {
      const fullQuestion = `${question.title}. ${question.prompt}`;
      speakText(fullQuestion, onQuestionComplete);
    }

    return () => {
      if (activeSessionId === sessionIdRef.current) {
        activeSessionId = null;
      }
    };
  }, [question, preloadedAudioUrl, playAudioUrl, speakText]);

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
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setIsVisible(false);
    clearAudioQueue();
    
    if (activeSessionId === sessionIdRef.current) {
      activeSessionId = null;
    }
    
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose, clearAudioQueue]);

  const handleNavigation = useCallback((direction: "next" | "prev") => {
    clearAudioQueue();
    initialQuestionPlayedRef.current = false;
    
    if (activeSessionId === sessionIdRef.current) {
      activeSessionId = null;
    }
    
    // Reset state
    setEvaluation(null);
    setConversation([]);
    setClarifications([]);
    setFollowUpCount(0);
    setCurrentFollowUp(null);
    setPanelState("speaking");
    
    if (direction === "next" && onNext) {
      onNext();
    } else if (direction === "prev" && onPrev) {
      onPrev();
    }
  }, [onNext, onPrev, clearAudioQueue]);

  const skipToCode = useCallback(() => {
    clearAudioQueue();
    setPanelState("coding");
  }, [clearAudioQueue]);

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
      // Include clarifications in context for evaluation
      const clarificationContext = clarifications.length > 0
        ? `\n\nClarifying questions asked:\n${clarifications.map(c => `Q: ${c.question}\nA: ${c.answer}`).join("\n\n")}`
        : "";

      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${question.title}\n\n${question.prompt}${clarificationContext}`,
          code,
          language,
          difficulty: question.difficultyLabel,
          expectedComplexity: question.expectedComplexity,
          clarifications, // Pass clarifications for context
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Evaluation failed");

      const data = await response.json();
      setEvaluation(data.evaluation);

      // Save to localStorage
      saveInterview(question.id, data.evaluation, code, language);
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
      if (followUpCount < MAX_FOLLOWUPS) {
        generateFollowUp("", conversation);
      } else {
        setPanelState("feedback");
      }
    });

    setPanelState("review");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FOLLOW-UP QUESTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const generateFollowUp = async (lastResponse: string, conv: ConversationTurn[]) => {
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
          question: question.prompt,
          evaluation,
          clarifications, // Include clarification context
        }),
      });

      if (!response.ok) {
        setPanelState("feedback");
        return;
      }

      const data = await response.json();
      setCurrentFollowUp(data.followUpQuestion);

      // Speak follow-up question
      speakText(data.followUpQuestion, () => {
        setPanelState("followup");
      });
    } catch {
      setPanelState("feedback");
    }
  };

  const handleRecordingToggle = () => {
    if (recorderState === "idle") {
      startRecording();
    } else if (recorderState === "recording") {
      stopRecording();
    }
  };

  // Process follow-up response after recording
  useEffect(() => {
    if (audioBlob && panelState === "followup") {
      processFollowUpResponse();
    }
  }, [audioBlob, panelState]);

  const processFollowUpResponse = async () => {
    if (!audioBlob) return;

    clearAudioQueue(); // Stop any audio before processing
    setProcessingStep("Processing your response...");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "response.webm");

      const response = await fetch("/api/interview/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Transcription failed");

      const { transcript } = await response.json();

      const candidateTurn: ConversationTurn = {
        role: "candidate",
        content: transcript,
        timestamp: Date.now(),
      };

      const updatedConversation = currentFollowUp
        ? [...conversation, { role: "interviewer" as const, content: currentFollowUp, timestamp: Date.now() - 1 }, candidateTurn]
        : [...conversation, candidateTurn];

      setConversation(updatedConversation);
      resetRecording();

      if (followUpCount < MAX_FOLLOWUPS) {
        await generateFollowUp(transcript, updatedConversation);
      } else {
        setPanelState("feedback");
      }
    } catch {
      setError("Failed to process response");
      resetRecording();
    }
  };

  const skipFollowUp = () => {
    clearAudioQueue();
    if (followUpCount < MAX_FOLLOWUPS) {
      generateFollowUp("", conversation);
    } else {
      setPanelState("feedback");
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CLARIFYING QUESTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const submitClarification = async (questionText: string) => {
    if (!questionText.trim() || isAskingClarification || clarifications.length >= MAX_CLARIFICATIONS) {
      return;
    }

    // Stop current audio before asking clarification
    clearAudioQueue();
    setIsAskingClarification(true);

    try {
      const response = await fetch("/api/interview/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${question.title}\n\n${question.prompt}`,
          clarifyingQuestion: questionText.trim(),
          previousClarifications: clarifications,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get clarification");
      }

      const data = await response.json();
      
      // Add to clarifications list
      setClarifications(prev => [
        ...prev,
        { question: questionText.trim(), answer: data.answer }
      ]);
      setClarifyingQuestion("");

      // Play audio response using queue (will wait for any current audio)
      if (data.audio) {
        playBase64Audio(data.audio);
      }
    } catch (err) {
      setError("Failed to get clarification. Please try again.");
    } finally {
      setIsAskingClarification(false);
    }
  };

  const handleAskClarification = () => {
    submitClarification(clarifyingQuestion);
  };

  // Voice recording for clarification
  const startClarifyRecording = async () => {
    // Stop any playing audio first
    clearAudioQueue();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4"
      });
      
      clarifyChunksRef.current = [];
      clarifyMediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          clarifyChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (clarifyChunksRef.current.length === 0) {
          setClarifyRecordingState("idle");
          return;
        }
        
        setClarifyRecordingState("processing");
        
        const recordedBlob = new Blob(clarifyChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        
        try {
          const formData = new FormData();
          formData.append("audio", recordedBlob, "clarification.webm");
          
          const transcribeResponse = await fetch("/api/interview/transcribe", {
            method: "POST",
            body: formData,
          });
          
          if (!transcribeResponse.ok) {
            throw new Error("Transcription failed");
          }
          
          const { transcript } = await transcribeResponse.json();
          
          if (transcript && transcript.trim()) {
            await submitClarification(transcript);
          } else {
            setError("Couldn't hear your question. Please try again.");
          }
        } catch (err) {
          setError("Failed to process your question. Please try typing instead.");
        } finally {
          setClarifyRecordingState("idle");
        }
      };
      
      mediaRecorder.start();
      setClarifyRecordingState("recording");
      setIsRecordingClarification(true);
    } catch (err) {
      setError("Microphone access denied. Please type your question instead.");
      setClarifyRecordingState("idle");
    }
  };

  const stopClarifyRecording = () => {
    if (clarifyMediaRecorderRef.current && clarifyMediaRecorderRef.current.state === "recording") {
      clarifyMediaRecorderRef.current.stop();
      setIsRecordingClarification(false);
    }
  };

  const toggleClarifyRecording = () => {
    if (clarifyRecordingState === "recording") {
      stopClarifyRecording();
    } else if (clarifyRecordingState === "idle") {
      startClarifyRecording();
    }
  };

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

          {/* Clarifying Questions Section */}
          {(panelState === "coding" || panelState === "speaking") && !isSpeaking && (
            <div className={styles.clarifySection}>
              {/* Previous Clarifications */}
              {clarifications.length > 0 && (
                <div className={styles.clarifyHistory}>
                  <h4 className={styles.clarifyHistoryTitle}>Clarifications</h4>
                  {clarifications.map((c, i) => (
                    <div key={i} className={styles.clarifyItem}>
                      <div className={styles.clarifyQuestion}>
                        <span className={styles.clarifyIcon}>Q:</span>
                        {c.question}
                      </div>
                      <div className={styles.clarifyAnswer}>
                        <span className={styles.clarifyIcon}>A:</span>
                        {c.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Ask Clarification Input */}
              {clarifications.length < MAX_CLARIFICATIONS && (
                <div className={styles.clarifyInput}>
                  {clarifyRecordingState === "processing" ? (
                    <div className={styles.clarifyProcessing}>
                      <span className={styles.spinnerSmall} />
                      <span>Processing your question...</span>
                    </div>
                  ) : clarifyRecordingState === "recording" ? (
                    <div className={styles.clarifyRecording}>
                      <div className={styles.clarifyRecordingIndicator}>
                        <span className={styles.recordingDotSmall} />
                        <span>Recording... Ask your question</span>
                      </div>
                      <button
                        className={styles.clarifyStopRecordBtn}
                        onClick={stopClarifyRecording}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                        Done
                      </button>
                    </div>
                  ) : (
                    <div className={styles.clarifyInputRow}>
                      <input
                        type="text"
                        value={clarifyingQuestion}
                        onChange={(e) => setClarifyingQuestion(e.target.value)}
                        placeholder="Type or speak your question..."
                        className={styles.clarifyTextInput}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAskClarification();
                          }
                        }}
                        disabled={isAskingClarification || isSpeaking}
                      />
                      <button
                        className={styles.clarifyMicBtn}
                        onClick={toggleClarifyRecording}
                        title="Ask with voice"
                        disabled={isAskingClarification || isSpeaking}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" y1="19" x2="12" y2="23" />
                          <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                      </button>
                      <button
                        className={styles.clarifySubmitBtn}
                        onClick={handleAskClarification}
                        disabled={!clarifyingQuestion.trim() || isAskingClarification || isSpeaking}
                      >
                        {isAskingClarification ? (
                          <>
                            <span className={styles.spinnerSmall} />
                            Asking...
                          </>
                        ) : (
                          "Ask"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {clarifications.length >= MAX_CLARIFICATIONS && (
                <p className={styles.clarifyLimitReached}>
                  Maximum clarifications reached. Time to start coding!
                </p>
              )}
            </div>
          )}

          {/* Follow-up Recording Area */}
          {panelState === "followup" && !isSpeaking && (
            <div className={styles.followupRecording}>
              <p className={styles.followupPrompt}>
                {currentFollowUp || "Answer the follow-up question:"}
              </p>
              
              <div className={styles.recordingControls}>
                <button
                  className={`${styles.recordBtn} ${recorderState === "recording" ? styles.recordBtnActive : ""}`}
                  onClick={handleRecordingToggle}
                >
                  {recorderState === "recording" ? (
                    <>
                      <span className={styles.recordingDot} />
                      Recording... ({Math.floor(duration)}s) - Click to stop
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                      Record your answer
                    </>
                  )}
                </button>
                
                {recorderState === "recording" && (
                  <div className={styles.audioLevelContainer}>
                    <div 
                      className={styles.audioLevelBar} 
                      style={{ width: `${Math.min(100, audioLevel * 100)}%` }}
                    />
                  </div>
                )}
                
                <button className={styles.skipFollowUpBtn} onClick={skipFollowUp}>
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Feedback Section */}
          {panelState === "feedback" && evaluation && (
            <div className={styles.feedbackSection}>
              <FeedbackCards evaluation={evaluation} questionType="coding" />
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
