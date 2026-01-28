"use client";

import { CodingEvaluationResult } from "@/lib/codingRubric";
import { BehavioralEvaluationResult } from "@/lib/behavioralRubric";
import { SystemDesignEvaluationResult } from "@/lib/systemDesignRubric";
import styles from "../app.module.css";
import ResultsSummaryCard from "./ResultsSummaryCard";
import RedFlagsSection from "./RedFlagsSection";
import PriorityImprovements from "./PriorityImprovements";
import FollowUpQuestion from "./FollowUpQuestion";
import DesignSummaryCard from "./DesignSummaryCard";

type ConversationTurn = {
  role: "interviewer" | "candidate";
  content: string;
  timestamp?: number;
};

// Union type for all evaluation results
type EvaluationResult = CodingEvaluationResult | BehavioralEvaluationResult | SystemDesignEvaluationResult;

type FeedbackCardsProps = {
  evaluation: EvaluationResult;
  conversation?: ConversationTurn[];
  onTryAgain: () => void;
  onClose: () => void;
  interviewType?: "coding" | "behavioral" | "system_design";
};

/**
 * Type guard for Coding evaluation
 */
function isCodingEvaluation(result: EvaluationResult): result is CodingEvaluationResult {
  return "complexityAnalysis" in result && "breakdown" in result && "correctness" in (result as CodingEvaluationResult).breakdown;
}

/**
 * Type guard for Behavioral evaluation
 */
function isBehavioralEvaluation(result: EvaluationResult): result is BehavioralEvaluationResult {
  return "leadershipPrinciplesShown" in result || ("breakdown" in result && !("correctness" in (result.breakdown as Record<string, unknown>)));
}

/**
 * Type guard for System Design evaluation
 */
function isSystemDesignEvaluation(result: EvaluationResult): result is SystemDesignEvaluationResult {
  return "designHighlights" in result && "missedConsiderations" in result;
}

/**
 * Detect interview type from evaluation structure
 */
function detectInterviewType(evaluation: EvaluationResult): "coding" | "behavioral" | "system_design" {
  if (isSystemDesignEvaluation(evaluation)) return "system_design";
  if (isCodingEvaluation(evaluation)) return "coding";
  if (isBehavioralEvaluation(evaluation)) return "behavioral";
  return "coding"; // fallback
}

/**
 * Build dimension scores from evaluation
 */
function buildDimensionScores(
  evaluation: EvaluationResult,
  type: "coding" | "behavioral" | "system_design"
): { name: string; score: number; weight: number }[] {
  if (type === "coding" && isCodingEvaluation(evaluation)) {
    const { breakdown } = evaluation;
    return [
      { name: "Correctness", score: breakdown.correctness, weight: 0.30 },
      { name: "Time Complexity", score: breakdown.timeComplexity, weight: 0.20 },
      { name: "Space Complexity", score: breakdown.spaceComplexity, weight: 0.15 },
      { name: "Code Quality", score: breakdown.codeQuality, weight: 0.20 },
      { name: "Problem-Solving", score: breakdown.problemSolving, weight: 0.15 },
    ];
  }

  if (type === "behavioral" && isBehavioralEvaluation(evaluation)) {
    const { breakdown } = evaluation;
    return Object.entries(breakdown).map(([name, data]) => ({
      name,
      score: data.score,
      weight: data.weight,
    }));
  }

  if (type === "system_design" && isSystemDesignEvaluation(evaluation)) {
    const { breakdown } = evaluation;
    return [
      { name: "Requirements", score: breakdown.requirements, weight: 0.15 },
      { name: "Architecture", score: breakdown.architecture, weight: 0.20 },
      { name: "Scalability", score: breakdown.scalability, weight: 0.20 },
      { name: "Data Model", score: breakdown.dataModel, weight: 0.15 },
      { name: "Trade-offs", score: breakdown.tradeoffs, weight: 0.15 },
      { name: "Reliability", score: breakdown.reliability, weight: 0.10 },
      { name: "Communication", score: breakdown.communication, weight: 0.05 },
    ];
  }

  return [];
}

/**
 * Get the follow-up question from evaluation
 */
function getFollowUpQuestion(
  evaluation: EvaluationResult,
  type: "coding" | "behavioral" | "system_design"
): string {
  if (type === "coding" && isCodingEvaluation(evaluation)) {
    return evaluation.nextFollowUp || "";
  }
  if (type === "behavioral" && isBehavioralEvaluation(evaluation)) {
    return evaluation.suggestedFollowUp || "";
  }
  if (type === "system_design" && isSystemDesignEvaluation(evaluation)) {
    return evaluation.suggestedDeepDive || "";
  }
  return "";
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
 * FeedbackCards - Comprehensive evaluation feedback display
 * 
 * Supports all interview types: Coding, Behavioral, System Design
 * Follows Hermes design principles: generous whitespace, refined typography
 */
export default function FeedbackCards({
  evaluation,
  conversation = [],
  onTryAgain,
  onClose,
  interviewType,
}: FeedbackCardsProps) {
  // Detect interview type if not provided
  const type = interviewType || detectInterviewType(evaluation);
  
  const {
    overallScore,
    verdict,
    strengths,
    improvements,
    redFlagsIdentified,
    overallFeedback,
  } = evaluation;

  // Build dimension scores for the summary card
  const dimensions = buildDimensionScores(evaluation, type);
  
  // Get follow-up question
  const followUpQuestion = getFollowUpQuestion(evaluation, type);

  // Coding-specific data
  const codingEval = isCodingEvaluation(evaluation) ? evaluation : null;
  
  // System design-specific data
  const systemDesignEval = isSystemDesignEvaluation(evaluation) ? evaluation : null;

  return (
    <div className={styles.feedbackContainer}>
      {/* Results Summary Card - At-a-glance score with dimensions */}
      <ResultsSummaryCard
        overallScore={overallScore}
        verdict={verdict}
        dimensions={dimensions}
        interviewType={type}
      />

      {/* Red Flags Section - Critical issues (if any) */}
      <RedFlagsSection flags={redFlagsIdentified || []} />

      {/* Complexity Analysis - Coding interviews only */}
      {codingEval && (
        <div className={styles.feedbackComplexity}>
          <div className={styles.feedbackCardTitle}>Complexity Analysis</div>
          <div className={styles.complexityGrid}>
            <div className={styles.complexityItem}>
              <ClockIcon />
              <div className={styles.complexityLabel}>Time</div>
              <div className={styles.complexityValue}>{codingEval.complexityAnalysis.time}</div>
            </div>
            <div className={styles.complexityItem}>
              <MemoryIcon />
              <div className={styles.complexityLabel}>Space</div>
              <div className={styles.complexityValue}>{codingEval.complexityAnalysis.space}</div>
            </div>
          </div>
          {codingEval.complexityAnalysis.explanation && (
            <p className={styles.complexityExplanation}>{codingEval.complexityAnalysis.explanation}</p>
          )}
          {!codingEval.complexityAnalysis.isOptimal && codingEval.suggestedOptimization && (
            <div className={styles.optimizationHint}>
              <span className={styles.optimizationLabel}>Optimization Tip</span>
              <p className={styles.optimizationText}>{codingEval.suggestedOptimization}</p>
            </div>
          )}
        </div>
      )}

      {/* Design Summary Card - System Design interviews only */}
      {systemDesignEval && (
        <DesignSummaryCard
          designHighlights={systemDesignEval.designHighlights}
          missedConsiderations={systemDesignEval.missedConsiderations || []}
        />
      )}

      {/* Priority Improvements - Top 3 areas to focus on */}
      <PriorityImprovements
        improvements={improvements}
        conversation={conversation}
        maxItems={3}
      />

      {/* Strengths Section */}
      {strengths.length > 0 && (
        <div className={styles.feedbackStrengthsSection}>
          <div className={styles.feedbackSectionHeader}>
            <svg
              className={styles.feedbackSectionIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className={styles.feedbackSectionLabel}>What You Did Well</span>
          </div>
          <ul className={styles.feedbackStrengthsList}>
            {strengths.map((strength, index) => (
              <li key={index} className={styles.feedbackStrengthItem}>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow-Up Question */}
      <FollowUpQuestion
        question={followUpQuestion}
        interviewType={type}
      />

      {/* Overall Summary */}
      <div className={styles.feedbackOverallSummary}>
        <div className={styles.feedbackSectionHeader}>
          <span className={styles.feedbackSectionLabel}>Summary</span>
        </div>
        <p className={styles.feedbackOverallText}>{overallFeedback}</p>
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
