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

// Helper to validate and normalize language to a supported value
const getSupportedLanguage = (lang: string | undefined): SupportedLanguage => {
  if (!lang) return "python";
  const supportedIds = SUPPORTED_LANGUAGES.map(l => l.id);
  return supportedIds.includes(lang as SupportedLanguage)
    ? (lang as SupportedLanguage)
    : "python";
};

type InterviewModalProps = {
  question: Question;
  onClose: () => void;
  onScoreUpdate?: (questionId: string, score: number) => void;
};

type ModalState =
  | "speaking"      // AI reads the question
  | "coding"        // User writes code
  | "processing"    // Evaluating code
  | "review"        // AI speaks initial feedback
  | "followup"      // AI asks follow-up, user responds
  | "feedback";     // Final feedback display

type ConversationTurn = {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: number;
};

// Track active interview session globally to prevent duplicates
let activeSessionId: string | null = null;

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      className={styles.micIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      className={styles.micIcon}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function InterviewModal({
  question,
  onClose,
  onScoreUpdate,
}: InterviewModalProps) {
  const [modalState, setModalState] = useState<ModalState>("speaking");
  const [evaluation, setEvaluation] = useState<CodingEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState("");
  const [speakingProgress, setSpeakingProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // Code editor state - use helper to ensure valid language
  const initialLanguage = getSupportedLanguage(question.language);
  const [code, setCode] = useState(question.starterCode || DEFAULT_STARTER_CODE[initialLanguage]);
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);

  // Conversation state for follow-ups
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [currentFollowUp, setCurrentFollowUp] = useState<string | null>(null);
  const [followUpCount, setFollowUpCount] = useState(0);
  const MAX_FOLLOWUPS = 3;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string>(Date.now().toString());

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

  // Fetch and play the question audio on mount
  useEffect(() => {
    if (activeSessionId && activeSessionId !== sessionIdRef.current) {
      console.warn("[Interview] Another session is already active");
      return;
    }

    activeSessionId = sessionIdRef.current;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchAndPlayAudio = async () => {
      try {
        // Build the full question text for TTS
        const fullQuestion = `${question.title}. ${question.prompt}`;

        const response = await fetch("/api/interview/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: fullQuestion,
            category: question.tags[0],
          }),
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) return;

        if (!response.ok) {
          console.error("[TTS] Failed to generate speech");
          setModalState("coding");
          return;
        }

        const audioBlob = await response.blob();

        if (abortController.signal.aborted) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        // Track playback for debugging
        let playbackStarted = false;
        
        audio.addEventListener("timeupdate", () => {
          if (audio.duration) {
            setSpeakingProgress((audio.currentTime / audio.duration) * 100);
          }
        });
        
        audio.addEventListener("playing", () => {
          playbackStarted = true;
          console.log("[TTS] Audio playback started");
        });

        audio.addEventListener("ended", () => {
          console.log(`[TTS] Audio playback ended normally - duration: ${audio.duration?.toFixed(1)}s`);
          setModalState("coding");
          URL.revokeObjectURL(audioUrl);
        });

        audio.addEventListener("error", () => {
          const errorCode = audio.error?.code;
          const errorMessage = audio.error?.message || "Unknown error";
          console.error(`[TTS] Audio playback error - code: ${errorCode}, message: ${errorMessage}, playbackStarted: ${playbackStarted}`);
          
          // Clean up the audio URL
          URL.revokeObjectURL(audioUrl);
          
          // Transition to coding after a brief delay to avoid jarring UX
          // The question is visible on screen, so user can still proceed
          setTimeout(() => {
            if (!abortController.signal.aborted) {
              setModalState("coding");
            }
          }, 500);
        });

        if (!abortController.signal.aborted) {
          await audio.play();
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          console.log("[TTS] Fetch aborted");
          return;
        }
        console.error("[TTS] Error:", err);
        setModalState("coding");
      }
    };

    fetchAndPlayAudio();

    return () => {
      abortController.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (activeSessionId === sessionIdRef.current) {
        activeSessionId = null;
      }
    };
  }, [question.title, question.prompt, question.tags]);

  // Check for previous coding interview
  useEffect(() => {
    // Use getCodingInterview to ensure we only get coding-type records
    // This prevents type errors when accessing .code and .language
    const previous = getCodingInterview(question.id);
    if (previous) {
      setEvaluation(previous.evaluation);

      // Validate the stored language - if invalid, it defaults to "python"
      const validatedLang = getSupportedLanguage(previous.language);
      const storedLang = previous.language as SupportedLanguage;

      // If the language was changed (invalid stored language), reset to starter code
      // Otherwise, use the stored code
      if (validatedLang !== storedLang || !SUPPORTED_LANGUAGES.some(l => l.id === storedLang)) {
        // Language changed - use default starter code for the validated language
        setCode(DEFAULT_STARTER_CODE[validatedLang]);
      } else {
        // Language is valid - use stored code
        setCode(previous.code);
      }
      setLanguage(validatedLang);
    }
  }, [question.id]);

  // Handle recording state changes
  useEffect(() => {
    if (recorderState === "recording") {
      // Recording started
    }
  }, [recorderState]);

  // Process audio when recording stops (for follow-up responses)
  useEffect(() => {
    if (recorderState === "stopped" && audioBlob && modalState === "followup") {
      processFollowUpResponse(audioBlob);
    }
  }, [recorderState, audioBlob, modalState]);

  const processFollowUpResponse = async (blob: Blob) => {
    setProcessingStep("Transcribing your response...");

    try {
      const formData = new FormData();
      formData.append("audio", blob, "audio.webm");

      const transcribeRes = await fetch("/api/interview/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeRes.ok) {
        throw new Error("Transcription failed");
      }

      const { transcript } = await transcribeRes.json();

      if (!transcript || transcript.trim().length < 5) {
        setError("Could not detect speech. Please try again.");
        return;
      }

      // Add candidate response to conversation
      const candidateTurn: ConversationTurn = {
        role: "candidate",
        content: transcript,
        timestamp: Date.now()
      };

      // Build the complete updated conversation BEFORE updating state
      // This avoids issues with stale state in React's async updates
      // We need to check if the current interviewer's follow-up is already in conversation
      const hasCurrentFollowUpInConversation = currentFollowUp && conversation.some(
        turn => turn.role === "interviewer" && turn.content === currentFollowUp
      );

      // Build the full conversation history
      let updatedConversation: ConversationTurn[];
      if (currentFollowUp && !hasCurrentFollowUpInConversation) {
        // The interviewer's question isn't in conversation yet, add it
        const interviewerTurn: ConversationTurn = {
          role: "interviewer",
          content: currentFollowUp,
          timestamp: Date.now() - 1 // Slightly before candidate response
        };
        updatedConversation = [...conversation, interviewerTurn, candidateTurn];
      } else {
        // Interviewer's question is already there (or doesn't exist), just add candidate
        updatedConversation = [...conversation, candidateTurn];
      }

      // Update state for UI with the complete conversation
      setConversation(updatedConversation);

      // Check if we should continue with more follow-ups
      if (followUpCount < MAX_FOLLOWUPS) {
        // Pass the locally computed conversation (not stale state)
        await generateFollowUp(transcript, updatedConversation);
      } else {
        // Move to final feedback
        setModalState("feedback");
      }
    } catch (err) {
      console.error("[FollowUp] Error:", err);
      setError("Failed to process response");
    }
  };

  const generateFollowUp = async (
    lastResponse?: string,
    updatedConversation?: ConversationTurn[],
    newEvaluation?: CodingEvaluationResult
  ) => {
    setProcessingStep("Generating follow-up question...");

    try {
      // Use provided values or fall back to current state
      const conversationToSend = updatedConversation ?? conversation;
      const evaluationToSend = newEvaluation ?? evaluation;

      const response = await fetch("/api/interview/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${question.title}\n${question.prompt}`,
          code,
          language,
          conversationHistory: conversationToSend,
          previousEvaluation: evaluationToSend
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate follow-up");
      }

      const { followUpQuestion } = await response.json();

      // Add interviewer question to conversation
      setConversation(prev => [...prev, {
        role: "interviewer",
        content: followUpQuestion,
        timestamp: Date.now()
      }]);

      setCurrentFollowUp(followUpQuestion);
      setFollowUpCount(prev => prev + 1);

      // Speak the follow-up question
      await speakText(followUpQuestion);

      setModalState("followup");
      resetRecording();
    } catch (err) {
      console.error("[FollowUp] Error:", err);
      // If follow-up fails, just go to feedback
      setModalState("feedback");
    }
  };

  const speakText = async (text: string) => {
    try {
      const response = await fetch("/api/interview/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });

      if (!response.ok) return;

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      await audio.play();

      return new Promise<void>((resolve) => {
        // Resolve on ended (normal completion)
        const handleEnded = () => {
          cleanup();
          resolve();
        };

        // Also resolve on pause/error/abort to prevent hanging promises
        const handlePause = () => {
          cleanup();
          resolve();
        };

        const handleError = () => {
          cleanup();
          resolve();
        };

        const cleanup = () => {
          audio.removeEventListener("ended", handleEnded);
          audio.removeEventListener("pause", handlePause);
          audio.removeEventListener("error", handleError);
          URL.revokeObjectURL(audioUrl);
        };

        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("error", handleError);
      });
    } catch (err) {
      console.error("[TTS] Error:", err);
    }
  };

  const submitCode = async () => {
    if (code.trim().length < 10) {
      setError("Please write some code before submitting");
      return;
    }

    setModalState("processing");
    setError(null);
    setProcessingStep("Analyzing your code...");

    try {
      const evaluateRes = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${question.title}\n${question.prompt}`,
          code,
          language,
          difficulty: question.difficultyLabel,
          expectedComplexity: question.expectedComplexity
        }),
      });

      if (!evaluateRes.ok) {
        const errorData = await evaluateRes.json();
        throw new Error(errorData.error || "Evaluation failed");
      }

      const { evaluation: result } = await evaluateRes.json();

      // Save to localStorage
      saveInterview(question.id, result, code, language);

      // Update parent
      if (onScoreUpdate) {
        onScoreUpdate(question.id, result.overallScore);
      }

      setEvaluation(result);

      // Speak initial feedback
      setModalState("review");
      setProcessingStep("Reviewing your solution...");

      const feedbackText = `Your solution scored ${result.overallScore.toFixed(1)} out of 5. ${result.overallFeedback}`;
      await speakText(feedbackText);

      // Start follow-up questions - pass result directly to avoid race condition
      // (setEvaluation is async, so evaluation state may not be updated yet)
      await generateFollowUp(undefined, undefined, result);
    } catch (err) {
      console.error("[Interview] Error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setModalState("coding");
    }
  };

  const handleStartRecording = async () => {
    setError(null);
    await startRecording();
  };

  const handleStopRecording = () => {
    if (duration < 3) {
      setError("Please record for at least 3 seconds");
      return;
    }
    stopRecording();
  };

  const handleTryAgain = () => {
    resetRecording();
    setEvaluation(null);
    setConversation([]);
    setFollowUpCount(0);
    setCurrentFollowUp(null);
    setCode(question.starterCode || DEFAULT_STARTER_CODE[language]);
    setModalState("coding");
  };

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    if (recorderState === "recording") {
      stopRecording();
    }

    resetRecording();

    if (activeSessionId === sessionIdRef.current) {
      activeSessionId = null;
    }

    setTimeout(() => {
      onClose();
    }, 50);
  }, [isClosing, recorderState, stopRecording, resetRecording, onClose]);

  const skipSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setModalState("coding");
  };

  const skipToFeedback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setModalState("feedback");
  };

  // Generate speaking visualizer bars
  const speakingBars = Array.from({ length: 5 }, (_, i) => {
    const phase = Date.now() * 0.003 + i * 0.8;
    return 20 + Math.sin(phase) * 15;
  });

  // Generate audio bars for recording visualizer
  const audioBars = Array.from({ length: 20 }, (_, i) => {
    const baseHeight = 8;
    const maxHeight = 50;
    const randomFactor = Math.sin(i * 0.5 + Date.now() * 0.005) * 0.5 + 0.5;
    const height = baseHeight + (maxHeight - baseHeight) * audioLevel * randomFactor;
    return height;
  });

  return (
    <div className={styles.interviewOverlay} onClick={handleClose}>
      <div
        className={`${styles.interviewModal} ${styles.interviewModalWide}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.interviewHeader}>
          <div className={styles.interviewHeaderContent}>
            <div className={styles.interviewEyebrow}>
              Coding Interview • {question.difficultyLabel || "Medium"}
            </div>
            <h2 className={styles.interviewQuestion}>{question.title}</h2>
            <div className={styles.interviewTags}>
              {question.tags.slice(0, 3).map(tag => (
                <span key={tag} className={styles.interviewTag}>{tag}</span>
              ))}
            </div>
          </div>
          <button className={styles.interviewClose} onClick={handleClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className={styles.interviewBody}>
          {/* Error State */}
          {(error || recorderError) && (
            <div className={styles.errorState}>
              <p className={styles.errorText}>{error || recorderError}</p>
            </div>
          )}

          {/* Speaking State - AI reading the question while showing content */}
          {modalState === "speaking" && (
            <div className={styles.speakingWithContent}>
              {/* Speaker indicator - floating card */}
              <div className={styles.speakerCard}>
                <div className={styles.speakerCardInner}>
                  <div className={styles.speakerIconSmall}>
                    <SpeakerIcon />
                  </div>
                  <div className={styles.speakerInfo}>
                    <span className={styles.speakerLabel}>AI Interviewer</span>
                    <div className={styles.speakingVisualizerSmall}>
                      {speakingBars.map((height, i) => (
                        <div
                          key={i}
                          className={styles.speakingBarSmall}
                          style={{ height: `${Math.max(4, height * 0.6)}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles.speakingProgressSmall}>
                  <div
                    className={styles.speakingProgressBarSmall}
                    style={{ width: `${speakingProgress}%` }}
                  />
                </div>
              </div>

              {/* Problem content - scrollable */}
              <div className={styles.problemContent}>
                <div className={styles.problemSection}>
                  <h3>Problem Description</h3>
                  <FormattedContent content={question.prompt} />
                </div>

                {question.examples && question.examples.length > 0 && (
                  <div className={styles.problemSection}>
                    <h4>Examples</h4>
                    {question.examples.slice(0, 3).map((ex, i) => (
                      <div key={i} className={styles.codingExample}>
                        <div><strong>Input:</strong> <code>{ex.input}</code></div>
                        <div><strong>Output:</strong> <code>{ex.output}</code></div>
                        {ex.explanation && (
                          <div className={styles.codingExplanation}>{ex.explanation}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {question.constraints && question.constraints.length > 0 && (
                  <div className={styles.problemSection}>
                    <h4>Constraints</h4>
                    <ul className={styles.constraintsList}>
                      {question.constraints.map((c, i) => (
                        <li key={i}><code>{c}</code></li>
                      ))}
                    </ul>
                  </div>
                )}

                {question.hints && question.hints.length > 0 && (
                  <div className={styles.problemSection}>
                    <h4>Hints</h4>
                    <ul className={styles.hintsList}>
                      {question.hints.map((hint, i) => (
                        <li key={i}>{hint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Skip button */}
              <div className={styles.speakingActions}>
                <button
                  className={styles.skipButton}
                  onClick={skipSpeaking}
                >
                  Skip to coding →
                </button>
              </div>
            </div>
          )}

          {/* Coding State - User writes code */}
          {modalState === "coding" && (
            <div className={styles.codingArea}>
              <div className={styles.codingHeader}>
                <div className={styles.codingProblem}>
                  <h3>Problem</h3>
                  <p>{question.prompt}</p>

                  {question.examples && question.examples.length > 0 && (
                    <div className={styles.codingExamples}>
                      <h4>Examples</h4>
                      {question.examples.slice(0, 2).map((ex, i) => (
                        <div key={i} className={styles.codingExample}>
                          <div><strong>Input:</strong> <code>{ex.input}</code></div>
                          <div><strong>Output:</strong> <code>{ex.output}</code></div>
                          {ex.explanation && (
                            <div className={styles.codingExplanation}>{ex.explanation}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.constraints && question.constraints.length > 0 && (
                    <div className={styles.codingConstraints}>
                      <h4>Constraints</h4>
                      <ul>
                        {question.constraints.map((c, i) => (
                          <li key={i}><code>{c}</code></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className={styles.languageSelector}>
                  <label htmlFor="language">Language:</label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => {
                      const newLang = e.target.value as SupportedLanguage;
                      const oldLang = language; // Capture current language before state update
                      const currentCode = code;
                      setLanguage(newLang);
                      // Only replace code if it's empty or still has the old language's starter code
                      if (!currentCode || currentCode === DEFAULT_STARTER_CODE[oldLang]) {
                        setCode(DEFAULT_STARTER_CODE[newLang]);
                      }
                    }}
                  >
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <option key={lang.id} value={lang.id}>{lang.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.codeEditorWrapper}>
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                  height="350px"
                />
              </div>

              <div className={styles.codingActions}>
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                  onClick={submitCode}
                  disabled={code.trim().length < 10}
                >
                  Submit & Discuss
                </button>
              </div>

              {evaluation && (
                <div className={styles.previousScoreHint}>
                  Previous score: {evaluation.overallScore}/5
                  <button
                    className={styles.viewPreviousBtn}
                    onClick={() => setModalState("feedback")}
                  >
                    View feedback
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Processing State */}
          {modalState === "processing" && (
            <div className={styles.processingState}>
              <div className={styles.spinner} />
              <p className={styles.processingText}>{processingStep}</p>
              <p className={styles.processingSubtext}>
                This usually takes 10-15 seconds
              </p>
            </div>
          )}

          {/* Review State - AI speaking feedback */}
          {modalState === "review" && (
            <div className={styles.speakingArea}>
              <div className={styles.speakingIcon}>
                <SpeakerIcon />
              </div>
              <div className={styles.speakingVisualizer}>
                {speakingBars.map((height, i) => (
                  <div
                    key={i}
                    className={styles.speakingBar}
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
              <p className={styles.speakingStatus}>Reviewing your solution...</p>
              {evaluation && (
                <p className={styles.speakingHint}>
                  Score: {evaluation.overallScore}/5
                </p>
              )}
            </div>
          )}

          {/* Follow-up State - AI asks questions, user responds */}
          {modalState === "followup" && (
            <div className={styles.followupArea}>
              <div className={styles.followupHeader}>
                <span className={styles.followupCount}>
                  Follow-up {followUpCount} of {MAX_FOLLOWUPS}
                </span>
              </div>

              {currentFollowUp && (
                <div className={styles.followupQuestion}>
                  <div className={styles.followupIcon}>🎤</div>
                  <p>{currentFollowUp}</p>
                </div>
              )}

              <div className={styles.recordingArea}>
                {recorderState !== "recording" ? (
                  <>
                    <button
                      className={styles.micButton}
                      onClick={handleStartRecording}
                    >
                      <MicIcon />
                    </button>
                    <p className={styles.recordingStatus}>
                      Click to record your response
                    </p>
                  </>
                ) : (
                  <>
                    <button
                      className={`${styles.micButton} ${styles.micButtonRecording}`}
                      onClick={handleStopRecording}
                    >
                      <StopIcon />
                    </button>
                    <p className={styles.recordingStatus}>Recording...</p>
                    <p className={styles.recordingTimer}>{formatDuration(duration)}</p>

                    <div className={styles.audioVisualizer}>
                      {audioBars.map((height, i) => (
                        <div
                          key={i}
                          className={styles.audioBar}
                          style={{ height: `${height}px` }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className={styles.followupActions}>
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                  onClick={skipToFeedback}
                >
                  Skip to results
                </button>
              </div>
            </div>
          )}

          {/* Feedback State */}
          {modalState === "feedback" && evaluation && (
            <FeedbackCards
              evaluation={evaluation}
              conversation={conversation}
              onTryAgain={handleTryAgain}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
