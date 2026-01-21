"use client";

import { CodingEvaluationResult } from "@/lib/codingRubric";
import styles from "../app.module.css";

type ConversationTurn = {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: number;
};

type FeedbackCardsProps = {
  evaluation: CodingEvaluationResult;
  conversation?: ConversationTurn[];
  onTryAgain: () => void;
  onClose: () => void;
};

function CheckIcon() {
  return (
    <svg
      className={styles.feedbackListIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      className={styles.feedbackListIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12,5 19,12 12,19" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className={styles.complexityIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function MemoryIcon() {
  return (
    <svg
      className={styles.complexityIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );
}

/**
 * Score descriptions for 1-5 FAANG scale
 * Based on: Strong Pass (4.5+), Pass (3.5+), Borderline (2.5+), Fail (1.5+), Strong Fail (<1.5)
 */
function getScoreDescription(score: number): string {
  if (score >= 4.5) return "Strong Pass - Exceptional";
  if (score >= 4.0) return "Strong Pass - FAANG ready";
  if (score >= 3.5) return "Pass - Solid solution";
  if (score >= 3.0) return "Pass - Meets bar";
  if (score >= 2.5) return "Borderline - Needs work";
  if (score >= 2.0) return "Fail - Significant issues";
  if (score >= 1.5) return "Fail - Major gaps";
  return "Strong Fail - Fundamental issues";
}

function getScoreColor(score: number): string {
  if (score >= 3.5) return "#16a34a"; // Green for Pass
  if (score >= 2.5) return "#d97706"; // Orange for Borderline
  return "#dc2626"; // Red for Fail
}

function getVerdictStyle(verdict: string): { color: string; bg: string } {
  switch (verdict) {
    case "Strong Pass":
      return { color: "#16a34a", bg: "#dcfce7" };
    case "Pass":
      return { color: "#15803d", bg: "#f0fdf4" };
    case "Borderline":
      return { color: "#d97706", bg: "#fef3c7" };
    case "Fail":
      return { color: "#dc2626", bg: "#fee2e2" };
    case "Strong Fail":
      return { color: "#991b1b", bg: "#fecaca" };
    default:
      return { color: "#6b7280", bg: "#f3f4f6" };
  }
}

export default function FeedbackCards({
  evaluation,
  conversation = [],
  onTryAgain,
  onClose,
}: FeedbackCardsProps) {
  const {
    overallScore,
    verdict,
    breakdown,
    complexityAnalysis,
    strengths,
    improvements,
    suggestedOptimization,
    overallFeedback
  } = evaluation;

  const breakdownItems = [
    { label: "Correctness", score: breakdown.correctness, weight: "30%" },
    { label: "Time Complexity", score: breakdown.timeComplexity, weight: "20%" },
    { label: "Space Complexity", score: breakdown.spaceComplexity, weight: "15%" },
    { label: "Code Quality", score: breakdown.codeQuality, weight: "20%" },
    { label: "Problem-Solving", score: breakdown.problemSolving, weight: "15%" },
  ];

  const verdictStyle = verdict ? getVerdictStyle(verdict) : null;

  return (
    <div className={styles.feedbackContainer}>
      {/* Score Card */}
      <div className={styles.feedbackScoreCard}>
        <div className={styles.feedbackScoreLabel}>Your Score</div>
        <div
          className={styles.feedbackScoreValue}
          style={{ color: getScoreColor(overallScore) }}
        >
          {overallScore.toFixed(1)}
        </div>
        <div className={styles.feedbackScoreMax}>out of 5</div>
        {verdict && verdictStyle && (
          <div
            className={styles.feedbackVerdict}
            style={{
              color: verdictStyle.color,
              backgroundColor: verdictStyle.bg
            }}
          >
            {verdict}
          </div>
        )}
        <div className={styles.feedbackScoreDesc}>
          {getScoreDescription(overallScore)}
        </div>
      </div>

      {/* Complexity Analysis Card */}
      <div className={styles.feedbackComplexity}>
        <div className={styles.feedbackCardTitle}>Complexity Analysis</div>
        <div className={styles.complexityGrid}>
          <div className={styles.complexityItem}>
            <ClockIcon />
            <div className={styles.complexityLabel}>Time</div>
            <div className={styles.complexityValue}>{complexityAnalysis.time}</div>
          </div>
          <div className={styles.complexityItem}>
            <MemoryIcon />
            <div className={styles.complexityLabel}>Space</div>
            <div className={styles.complexityValue}>{complexityAnalysis.space}</div>
          </div>
        </div>
        {complexityAnalysis.explanation && (
          <p className={styles.complexityExplanation}>{complexityAnalysis.explanation}</p>
        )}
      </div>

      {/* Breakdown Card */}
      <div className={styles.feedbackBreakdown}>
        <div className={styles.feedbackCardTitle}>Score Breakdown</div>
        <div className={styles.breakdownList}>
          {breakdownItems.map((item) => (
            <div key={item.label} className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>
                {item.label}
                <span className={styles.breakdownWeight}>{item.weight}</span>
              </span>
              <div className={styles.breakdownBar}>
                <div
                  className={styles.breakdownBarFill}
                  style={{
                    width: `${item.score * 20}%`, // 1-5 scale: score * 20 = percentage
                    backgroundColor: getScoreColor(item.score)
                  }}
                />
              </div>
              <span
                className={styles.breakdownScore}
                style={{ color: getScoreColor(item.score) }}
              >
                {item.score.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths Card */}
      {strengths.length > 0 && (
        <div className={styles.feedbackStrengths}>
          <div className={styles.feedbackCardTitle}>What You Did Well</div>
          <div className={styles.feedbackList}>
            {strengths.map((strength, index) => (
              <div key={index} className={styles.feedbackListItem}>
                <CheckIcon />
                <span>{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements Card */}
      {improvements.length > 0 && (
        <div className={styles.feedbackImprovements}>
          <div className={styles.feedbackCardTitle}>Areas to Improve</div>
          <div className={styles.feedbackList}>
            {improvements.map((improvement, index) => (
              <div key={index} className={styles.feedbackListItem}>
                <ArrowIcon />
                <span>{improvement}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Suggestion */}
      {suggestedOptimization && (
        <div className={styles.feedbackOptimization}>
          <div className={styles.feedbackCardTitle}>💡 Optimization Tip</div>
          <p className={styles.feedbackOptimizationText}>{suggestedOptimization}</p>
        </div>
      )}

      {/* Conversation History */}
      {conversation.length > 0 && (
        <div className={styles.feedbackConversation}>
          <div className={styles.feedbackCardTitle}>Follow-up Discussion</div>
          <div className={styles.conversationList}>
            {conversation.map((turn, index) => (
              <div
                key={index}
                className={`${styles.conversationTurn} ${turn.role === "interviewer"
                    ? styles.conversationInterviewer
                    : styles.conversationCandidate
                  }`}
              >
                <div className={styles.conversationRole}>
                  {turn.role === "interviewer" ? "🎤 Interviewer" : "👤 You"}
                </div>
                <p className={styles.conversationContent}>{turn.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Feedback Card */}
      <div className={styles.feedbackOverall}>
        <div className={styles.feedbackCardTitle}>Summary</div>
        <p className={styles.feedbackOverallText}>"{overallFeedback}"</p>
      </div>

      {/* Actions */}
      <div className={styles.feedbackActions}>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
          onClick={onClose}
        >
          Done
        </button>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          onClick={onTryAgain}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
