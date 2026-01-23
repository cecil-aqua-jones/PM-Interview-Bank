"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";
import { saveBehavioralInterview, getBehavioralInterview } from "@/lib/interviewStorage";
import { BehavioralEvaluationResult } from "@/lib/behavioralRubric";
import { Question } from "@/lib/types";
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
  | "speaking"      // AI reads the question
  | "listening"     // User responds (recording)
  | "processing"    // Transcribing/evaluating
  | "followup"      // AI asks follow-up
  | "feedback";     // Final evaluation

type ConversationTurn = {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: number;
};

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
  const [panelState, setPanelState] = useState<PanelState>("speaking");
  const [evaluation, setEvaluation] = useState<BehavioralEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState("");
  const [speakingProgress, setSpeakingProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Conversation state
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [currentFollowUp, setCurrentFollowUp] = useState<string | null>(null);
  const [followUpCount, setFollowUpCount] = useState(0);
  const MAX_FOLLOWUPS = 3;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string>(Date.now().toString());
  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const isClosingRef = useRef(false); // Track if panel is closing to prevent new audio
  const isInitialMountRef = useRef(true); // Track initial mount to prevent animation conflict

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

  // Auto-scroll conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // Play initial question
  useEffect(() => {
    if (activeSessionId && activeSessionId !== sessionIdRef.current) {
      return;
    }

    activeSessionId = sessionIdRef.current;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const playAudio = async () => {
      try {
        setIsSpeaking(true);
        let audioUrl = preloadedAudioUrl;

        if (!audioUrl) {
          const fullQuestion = `${question.title}. ${question.prompt}`;
          const response = await fetch("/api/interview/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: fullQuestion }),
            signal: abortController.signal,
          });

          if (abortController.signal.aborted) return;
          if (!response.ok) {
            setPanelState("listening");
            setIsSpeaking(false);
            return;
          }

          const blob = await response.blob();
          audioUrl = URL.createObjectURL(blob);
        }

        if (abortController.signal.aborted) return;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.addEventListener("timeupdate", () => {
          if (audio.duration) {
            setSpeakingProgress((audio.currentTime / audio.duration) * 100);
          }
        });

        audio.addEventListener("ended", () => {
          setPanelState("listening");
          setIsSpeaking(false);
          // Add interviewer's question to conversation
          setConversation([{
            role: "interviewer",
            content: `${question.title}\n\n${question.prompt}`,
            timestamp: Date.now(),
          }]);
          if (!preloadedAudioUrl) URL.revokeObjectURL(audioUrl!);
        });

        audio.addEventListener("error", () => {
          setPanelState("listening");
          setIsSpeaking(false);
        });

        await audio.play();
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setPanelState("listening");
        setIsSpeaking(false);
      }
    };

    playAudio();

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
  }, [question, preloadedAudioUrl]);

  // Load previous interview
  useEffect(() => {
    const previous = getBehavioralInterview(question.id);
    if (previous) {
      setEvaluation(previous.evaluation);
      if (previous.conversationHistory) {
        // Map stored history to include timestamps (use current time as fallback)
        const historyWithTimestamps: ConversationTurn[] = previous.conversationHistory.map((turn, index) => ({
          ...turn,
          timestamp: previous.timestamp - (previous.conversationHistory!.length - index) * 1000
        }));
        setConversation(historyWithTimestamps);
      }
    }
  }, [question.id]);

  const handleClose = useCallback(() => {
    // IMMEDIATELY mark as closing to prevent any new audio/actions
    isClosingRef.current = true;
    
    setIsClosing(true);
    setIsVisible(false);

    // Stop all audio immediately
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsSpeaking(false);

    // Abort any pending requests
    abortControllerRef.current?.abort();
    if (activeSessionId === sessionIdRef.current) {
      activeSessionId = null;
    }

    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  const handleNavigation = useCallback((direction: "next" | "prev") => {
    // IMMEDIATELY mark as closing to prevent any new audio/actions
    isClosingRef.current = true;
    
    setIsClosing(true);
    setIsVisible(false);

    // Stop all audio immediately
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsSpeaking(false);

    // Abort any pending requests
    abortControllerRef.current?.abort();
    if (activeSessionId === sessionIdRef.current) {
      activeSessionId = null;
    }

    setTimeout(() => {
      if (direction === "next" && onNext) onNext();
      else if (direction === "prev" && onPrev) onPrev();
    }, 300);
  }, [onNext, onPrev]);

  const skipToListening = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setPanelState("listening");
    setConversation([{
      role: "interviewer",
      content: `${question.title}\n\n${question.prompt}`,
      timestamp: Date.now(),
    }]);
  }, [question]);

  const handleRecordingToggle = () => {
    if (recorderState === "idle") {
      startRecording();
    } else if (recorderState === "recording") {
      stopRecording();
    }
  };

  // Process recording when stopped
  useEffect(() => {
    if (audioBlob && (panelState === "listening" || panelState === "followup")) {
      processResponse();
    }
  }, [audioBlob]);

  const processResponse = async () => {
    if (!audioBlob) return;

    setPanelState("processing");
    setProcessingStep("Transcribing your response...");

    try {
      // Transcribe audio
      const formData = new FormData();
      formData.append("audio", audioBlob, "response.webm");

      const transcribeResponse = await fetch("/api/interview/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeResponse.ok) throw new Error("Transcription failed");

      const { transcript } = await transcribeResponse.json();

      // Add to conversation
      const candidateTurn: ConversationTurn = {
        role: "candidate",
        content: transcript,
        timestamp: Date.now(),
      };

      const updatedConversation = [...conversation, candidateTurn];
      setConversation(updatedConversation);
      resetRecording();

      // If first response, evaluate and generate follow-up
      if (followUpCount === 0) {
        setProcessingStep("Analyzing your response...");
        await evaluateResponse(transcript, updatedConversation);
      } else if (followUpCount < MAX_FOLLOWUPS) {
        // Generate another follow-up
        await generateFollowUp(updatedConversation);
      } else {
        // Done with follow-ups
        setPanelState("feedback");
      }
    } catch (err) {
      setError("Failed to process response. Please try again.");
      setPanelState("listening");
      resetRecording();
    }
  };

  const evaluateResponse = async (transcript: string, conv: ConversationTurn[]) => {
    try {
      const response = await fetch("/api/interview/evaluate-behavioral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${question.title}\n\n${question.prompt}`,
          transcript,
          tags: question.tags,
          difficulty: question.difficultyLabel,
        }),
      });

      if (!response.ok) throw new Error("Evaluation failed");

      const data = await response.json();
      setEvaluation(data.evaluation);

      // Save to localStorage
      saveBehavioralInterview(question.id, data.evaluation, transcript, conv);
      onScoreUpdate?.(question.id, data.evaluation.overallScore);

      // Speak initial feedback
      await speakFeedback(data.evaluation, conv);
    } catch (err) {
      setError("Failed to evaluate response");
      setPanelState("feedback");
    }
  };

  const speakFeedback = async (eval_result: BehavioralEvaluationResult, conv: ConversationTurn[]) => {
    // Don't speak if panel is closing
    if (isClosingRef.current) return;
    
    try {
      // Generate short verbal feedback
      const feedbackText = eval_result.suggestedFollowUp || 
        `Good response. ${eval_result.overallFeedback}. Let me ask a follow-up question.`;

      const response = await fetch("/api/interview/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: feedbackText }),
      });

      // Check if panel closed while fetching
      if (isClosingRef.current) return;

      if (!response.ok) {
        await generateFollowUp(conv);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Final check before playing
      if (isClosingRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      
      const audio = new Audio(url);
      audioRef.current = audio;

      setIsSpeaking(true);

      audio.addEventListener("ended", async () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        // Don't continue if closing
        if (isClosingRef.current) return;
        await generateFollowUp(conv);
      });

      audio.addEventListener("error", () => {
        setIsSpeaking(false);
      });

      audio.addEventListener("pause", () => {
        setIsSpeaking(false);
      });

      await audio.play();
    } catch {
      if (isClosingRef.current) return;
      await generateFollowUp(conv);
    }
  };

  const generateFollowUp = async (conv: ConversationTurn[]) => {
    // Don't generate follow-up if panel is closing
    if (isClosingRef.current) return;
    
    if (followUpCount >= MAX_FOLLOWUPS) {
      setPanelState("feedback");
      return;
    }

    setFollowUpCount(prev => prev + 1);
    setProcessingStep("Preparing follow-up question...");

    try {
      const response = await fetch("/api/interview/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationHistory: conv,
          question: question.prompt,
          evaluation,
          type: "behavioral",
        }),
      });

      // Check if panel closed while fetching
      if (isClosingRef.current) return;

      if (!response.ok) {
        setPanelState("feedback");
        return;
      }

      const data = await response.json();
      const followUpQuestion = data.followUpQuestion;
      setCurrentFollowUp(followUpQuestion);

      // Add to conversation
      const interviewerTurn: ConversationTurn = {
        role: "interviewer",
        content: followUpQuestion,
        timestamp: Date.now(),
      };
      setConversation([...conv, interviewerTurn]);

      // Don't speak if panel is closing
      if (isClosingRef.current) return;

      // Speak follow-up
      const ttsResponse = await fetch("/api/interview/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: followUpQuestion }),
      });

      // Check if panel closed while fetching TTS
      if (isClosingRef.current) return;

      if (ttsResponse.ok) {
        const blob = await ttsResponse.blob();
        const url = URL.createObjectURL(blob);
        
        // Final check before playing
        if (isClosingRef.current) {
          URL.revokeObjectURL(url);
          return;
        }
        
        const audio = new Audio(url);
        audioRef.current = audio;

        setPanelState("followup");
        setIsSpeaking(true);

        audio.addEventListener("ended", () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
        });

        audio.addEventListener("pause", () => {
          setIsSpeaking(false);
        });

        await audio.play();
      } else {
        setPanelState("followup");
      }
    } catch {
      setPanelState("feedback");
    }
  };

  const skipFollowUp = () => {
    if (followUpCount < MAX_FOLLOWUPS) {
      generateFollowUp(conversation);
    } else {
      setPanelState("feedback");
    }
  };

  const finishInterview = () => {
    setPanelState("feedback");
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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

      {/* Main Content - Conversational Layout */}
      <div className={styles.behavioralPanelContent}>
        {/* Conversation Area */}
        <div className={styles.conversationArea}>
          {/* Initial Question Display (before conversation starts) */}
          {conversation.length === 0 && (
            <div className={styles.initialQuestion}>
              <h2 className={styles.questionTitle}>{question.title}</h2>
              <div className={styles.questionPrompt}>
                <FormattedContent content={question.prompt} />
              </div>
              {question.tags.length > 0 && (
                <div className={styles.panelTags}>
                  {question.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className={styles.panelTag}>{tag}</span>
                  ))}
                </div>
              )}
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
                      {turn.role === "interviewer" ? "🎤 Interviewer" : "👤 You"}
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
              <div ref={conversationEndRef} />
            </div>
          )}

          {/* Processing Indicator */}
          {panelState === "processing" && (
            <div className={styles.processingIndicator}>
              <div className={styles.spinner} />
              <p>{processingStep}</p>
            </div>
          )}
        </div>

        {/* Bottom Control Area */}
        <div className={styles.behavioralControls}>
          {/* AI Speaking Status */}
          <div className={`${styles.aiSpeakingBar} ${isSpeaking ? styles.speaking : ""}`}>
            <div className={styles.aiSpeakingIcon}>
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
            <div className={styles.aiSpeakingText}>
              {isSpeaking ? "AI Interviewer is speaking..." : "AI Interviewer"}
            </div>
            {panelState === "speaking" && (
              <>
                <div className={styles.speakingProgressMini}>
                  <div className={styles.speakingProgressBarMini} style={{ width: `${speakingProgress}%` }} />
                </div>
                <button className={styles.skipBtn} onClick={skipToListening}>
                  Skip
                </button>
              </>
            )}
          </div>

          {/* Recording Controls */}
          {(panelState === "listening" || panelState === "followup") && !isSpeaking && (
            <div className={styles.recordingControls}>
              {recorderState === "recording" && (
                <div className={styles.recordingStatus}>
                  <span className={styles.recordingDot} />
                  Recording: {formatDuration(duration)}
                  <div className={styles.audioLevelBar}>
                    <div 
                      className={styles.audioLevelFill} 
                      style={{ width: `${Math.min(audioLevel * 100, 100)}%` }} 
                    />
                  </div>
                </div>
              )}

              <button
                className={`${styles.mainRecordBtn} ${recorderState === "recording" ? styles.recording : ""}`}
                onClick={handleRecordingToggle}
              >
                {recorderState === "recording" ? (
                  <>
                    <span className={styles.stopIcon}>■</span>
                    Stop Recording
                  </>
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                    {panelState === "followup" ? "Answer Follow-up" : "Start Speaking"}
                  </>
                )}
              </button>

              {panelState === "followup" && (
                <button className={styles.skipFollowupBtn} onClick={skipFollowUp}>
                  Skip Question
                </button>
              )}

              {panelState === "listening" && conversation.length > 1 && (
                <button className={styles.finishBtn} onClick={finishInterview}>
                  Finish Interview
                </button>
              )}
            </div>
          )}

          {/* Feedback Summary */}
          {panelState === "feedback" && evaluation && (
            <div className={styles.behavioralFeedback}>
              <div className={styles.feedbackScoreSection}>
                <div className={styles.scoreCircleLarge}>
                  <span className={styles.scoreValueLarge}>{evaluation.overallScore}</span>
                  <span className={styles.scoreLabelLarge}>/ 100</span>
                </div>
              </div>
              
              <div className={styles.feedbackDetails}>
                <div className={styles.feedbackSection}>
                  <h4>Strengths</h4>
                  <ul>
                    {evaluation.strengths.map((s, i) => (
                      <li key={i}>✓ {s}</li>
                    ))}
                  </ul>
                </div>
                
                <div className={styles.feedbackSection}>
                  <h4>Areas to Improve</h4>
                  <ul>
                    {evaluation.improvements.map((s, i) => (
                      <li key={i}>→ {s}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.feedbackSummaryText}>
                  <h4>Summary</h4>
                  <p>{evaluation.overallFeedback}</p>
                </div>

                {/* Breakdown */}
                <div className={styles.criteriaBreakdown}>
                  <h4>Detailed Breakdown</h4>
                  {Object.entries(evaluation.breakdown).map(([name, data]) => (
                    <div key={name} className={styles.criterionRow}>
                      <span className={styles.criterionName}>{name}</span>
                      <div className={styles.criterionBar}>
                        <div 
                          className={styles.criterionFill} 
                          style={{ width: `${(data.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className={styles.criterionScore}>{data.score}/4</span>
                    </div>
                  ))}
                </div>
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
