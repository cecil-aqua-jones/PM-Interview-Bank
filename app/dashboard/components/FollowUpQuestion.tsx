"use client";

import { useState } from "react";
import styles from "../app.module.css";

type FollowUpQuestionProps = {
  question: string;
  hint?: string;
  interviewType: "coding" | "behavioral" | "system_design";
};

/**
 * Chevron icon for expand/collapse
 */
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`${styles.followUpChevron} ${expanded ? styles.followUpChevronExpanded : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Get section label based on interview type
 */
function getLabel(type: "coding" | "behavioral" | "system_design"): string {
  switch (type) {
    case "coding":
      return "Follow-Up Question";
    case "behavioral":
      return "Probing Question";
    case "system_design":
      return "Deep-Dive Question";
  }
}

/**
 * Get hint text based on interview type
 */
function getDefaultHint(type: "coding" | "behavioral" | "system_design"): string {
  switch (type) {
    case "coding":
      return "This is a common follow-up that interviewers ask to probe understanding. Practice answering this to prepare for real interviews.";
    case "behavioral":
      return "Interviewers often ask follow-up questions to clarify ownership and impact. Be ready to provide more detail.";
    case "system_design":
      return "Senior interviewers will deep-dive into specific areas. Be prepared to discuss trade-offs and alternatives in depth.";
  }
}

/**
 * FollowUpQuestion - Displays the suggested follow-up question
 * Per the evaluation framework: includes the likely next question an interviewer would ask
 * 
 * Follows Hermes design: thought-provoking layout, expandable hint, refined typography
 */
export default function FollowUpQuestion({
  question,
  hint,
  interviewType,
}: FollowUpQuestionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!question) {
    return null;
  }

  const displayHint = hint || getDefaultHint(interviewType);

  return (
    <div className={styles.followUpSection}>
      <div className={styles.followUpHeader}>
        <span className={styles.followUpLabel}>{getLabel(interviewType)}</span>
      </div>

      <div className={styles.followUpQuestionCard}>
        <p className={styles.followUpQuestionText}>"{question}"</p>
        
        <button
          type="button"
          className={styles.followUpExpandBtn}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <span>Why this matters</span>
          <ChevronIcon expanded={expanded} />
        </button>

        {expanded && (
          <div className={styles.followUpHint}>
            <p className={styles.followUpHintText}>{displayHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
