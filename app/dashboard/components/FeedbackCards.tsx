"use client";

import { EvaluationResult } from "@/lib/pmRubric";
import styles from "../app.module.css";

type FeedbackCardsProps = {
  evaluation: EvaluationResult;
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

function getScoreDescription(score: number): string {
  if (score >= 9) return "Exceptional performance";
  if (score >= 8) return "Excellent - very strong";
  if (score >= 7) return "Strong performance";
  if (score >= 6) return "Above average";
  if (score >= 5) return "Solid - meets expectations";
  if (score >= 4) return "Meets minimum bar";
  if (score >= 3) return "Needs improvement";
  return "Significant work needed";
}

export default function FeedbackCards({
  evaluation,
  onTryAgain,
  onClose,
}: FeedbackCardsProps) {
  const { overallScore, breakdown, strengths, improvements, overallFeedback } =
    evaluation;

  const breakdownItems = [
    { label: "Structure", score: breakdown.structure },
    { label: "Product Thinking", score: breakdown.productThinking },
    { label: "Metrics & Data", score: breakdown.metrics },
    { label: "Communication", score: breakdown.communication },
    { label: "Execution", score: breakdown.execution },
  ];

  return (
    <div className={styles.feedbackContainer}>
      {/* Score Card */}
      <div className={styles.feedbackScoreCard}>
        <div className={styles.feedbackScoreLabel}>Your Score</div>
        <div className={styles.feedbackScoreValue}>{overallScore}</div>
        <div className={styles.feedbackScoreMax}>out of 10</div>
        <div className={styles.feedbackScoreDesc}>
          {getScoreDescription(overallScore)}
        </div>
      </div>

      {/* Breakdown Card */}
      <div className={styles.feedbackBreakdown}>
        <div className={styles.feedbackCardTitle}>Score Breakdown</div>
        <div className={styles.breakdownList}>
          {breakdownItems.map((item) => (
            <div key={item.label} className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>{item.label}</span>
              <div className={styles.breakdownBar}>
                <div
                  className={styles.breakdownBarFill}
                  style={{ width: `${item.score * 10}%` }}
                />
              </div>
              <span className={styles.breakdownScore}>{item.score}</span>
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
