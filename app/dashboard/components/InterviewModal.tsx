"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";
import { saveInterview, getInterview } from "@/lib/interviewStorage";
import { EvaluationResult } from "@/lib/pmRubric";
import { Question } from "@/lib/types";
import FeedbackCards from "./FeedbackCards";
import styles from "../app.module.css";

type InterviewModalProps = {
  question: Question;
  onClose: () => void;
  onScoreUpdate?: (questionId: string, score: number) => void;
};

type ModalState = "speaking" | "ready" | "recording" | "processing" | "feedback";

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
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState("");
  const [speakingProgress, setSpeakingProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasFetchedAudio = useRef(false);

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
    if (hasFetchedAudio.current) return;
    hasFetchedAudio.current = true;

    const fetchAndPlayAudio = async () => {
      try {
        const response = await fetch("/api/interview/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question.title,
            category: question.tags[0],
          }),
        });

        if (!response.ok) {
          // If TTS fails, just skip to ready state
          console.error("[TTS] Failed to generate speech");
          setModalState("ready");
          return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        // Track progress
        audio.addEventListener("timeupdate", () => {
          if (audio.duration) {
            setSpeakingProgress((audio.currentTime / audio.duration) * 100);
          }
        });

        audio.addEventListener("ended", () => {
          setModalState("ready");
          URL.revokeObjectURL(audioUrl);
        });

        audio.addEventListener("error", () => {
          console.error("[TTS] Audio playback error");
          setModalState("ready");
        });

        // Start playing
        await audio.play();
      } catch (err) {
        console.error("[TTS] Error:", err);
        setModalState("ready");
      }
    };

    fetchAndPlayAudio();

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [question.title, question.tags]);

  // Check for previous interview
  useEffect(() => {
    const previous = getInterview(question.id);
    if (previous) {
      setEvaluation(previous.evaluation);
    }
  }, [question.id]);

  // Handle recording state changes
  useEffect(() => {
    if (recorderState === "recording") {
      setModalState("recording");
    }
  }, [recorderState]);

  // Process audio when recording stops
  useEffect(() => {
    if (recorderState === "stopped" && audioBlob && modalState === "recording") {
      processAudio(audioBlob);
    }
  }, [recorderState, audioBlob, modalState]);

  const processAudio = async (blob: Blob) => {
    setModalState("processing");
    setError(null);

    try {
      // Step 1: Transcribe
      setProcessingStep("Transcribing your response...");
      const formData = new FormData();
      formData.append("audio", blob, "audio.webm");

      const transcribeRes = await fetch("/api/interview/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeRes.ok) {
        const errorData = await transcribeRes.json();
        throw new Error(errorData.error || "Transcription failed");
      }

      const { transcript } = await transcribeRes.json();

      if (!transcript || transcript.trim().length < 10) {
        throw new Error("Could not detect speech. Please try again and speak clearly.");
      }

      // Step 2: Evaluate
      setProcessingStep("Analyzing your answer...");
      const evaluateRes = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.title,
          transcript,
          tags: question.tags,
          difficulty: question.difficultyLabel,
        }),
      });

      if (!evaluateRes.ok) {
        const errorData = await evaluateRes.json();
        throw new Error(errorData.error || "Evaluation failed");
      }

      const { evaluation: result } = await evaluateRes.json();

      // Save to localStorage
      saveInterview(question.id, result, transcript);

      // Update parent
      if (onScoreUpdate) {
        onScoreUpdate(question.id, result.overallScore);
      }

      setEvaluation(result);
      setModalState("feedback");
    } catch (err) {
      console.error("[Interview] Error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setModalState("ready");
    }
  };

  const handleStartRecording = async () => {
    setError(null);
    setEvaluation(null);
    await startRecording();
  };

  const handleStopRecording = () => {
    if (duration < 5) {
      setError("Please record for at least 5 seconds");
      return;
    }
    stopRecording();
  };

  const handleTryAgain = () => {
    resetRecording();
    setEvaluation(null);
    setModalState("ready");
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (modalState === "recording") {
      stopRecording();
    }
    onClose();
  };

  const skipSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setModalState("ready");
  };

  // Generate audio bars for visualizer
  const audioBars = Array.from({ length: 20 }, (_, i) => {
    const baseHeight = 8;
    const maxHeight = 50;
    const randomFactor = Math.sin(i * 0.5 + Date.now() * 0.005) * 0.5 + 0.5;
    const height = baseHeight + (maxHeight - baseHeight) * audioLevel * randomFactor;
    return height;
  });

  // Generate speaking visualizer bars
  const speakingBars = Array.from({ length: 5 }, (_, i) => {
    const phase = Date.now() * 0.003 + i * 0.8;
    return 20 + Math.sin(phase) * 15;
  });

  return (
    <div className={styles.interviewOverlay} onClick={handleClose}>
      <div
        className={styles.interviewModal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.interviewHeader}>
          <div className={styles.interviewHeaderContent}>
            <div className={styles.interviewEyebrow}>Mock Interview</div>
            <h2 className={styles.interviewQuestion}>{question.title}</h2>
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

          {/* Speaking State - AI reading the question */}
          {modalState === "speaking" && (
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
              <p className={styles.speakingStatus}>Interviewer is speaking...</p>
              <p className={styles.speakingHint}>Listen to the question carefully</p>
              <div className={styles.speakingProgress}>
                <div 
                  className={styles.speakingProgressBar} 
                  style={{ width: `${speakingProgress}%` }}
                />
              </div>
              <button
                className={styles.skipButton}
                onClick={skipSpeaking}
              >
                Skip to answer
              </button>
            </div>
          )}

          {/* Ready State - User ready to record */}
          {modalState === "ready" && (
            <div className={styles.recordingArea}>
              <button
                className={styles.micButton}
                onClick={handleStartRecording}
              >
                <MicIcon />
              </button>
              <p className={styles.recordingStatus}>
                Your turn — click to record your answer
              </p>
              <p className={styles.recordingHint}>
                Structure your response using frameworks like STAR or CIRCLES.
                Take a moment to gather your thoughts.
              </p>
              {evaluation && (
                <div className={styles.recordingActions}>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                    onClick={() => setModalState("feedback")}
                  >
                    View Previous Feedback
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Recording State */}
          {modalState === "recording" && (
            <div className={styles.recordingArea}>
              <button
                className={`${styles.micButton} ${styles.micButtonRecording}`}
                onClick={handleStopRecording}
              >
                <StopIcon />
              </button>
              <p className={styles.recordingStatus}>Recording your answer...</p>
              <p className={styles.recordingTimer}>{formatDuration(duration)}</p>
              
              {/* Audio Visualizer */}
              <div className={styles.audioVisualizer}>
                {audioBars.map((height, i) => (
                  <div
                    key={i}
                    className={styles.audioBar}
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>

              <div className={styles.recordingActions}>
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                  onClick={() => {
                    stopRecording();
                    resetRecording();
                    setModalState("ready");
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                  onClick={handleStopRecording}
                  disabled={duration < 5}
                >
                  Submit Answer
                </button>
              </div>
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

          {/* Feedback State */}
          {modalState === "feedback" && evaluation && (
            <FeedbackCards
              evaluation={evaluation}
              onTryAgain={handleTryAgain}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
