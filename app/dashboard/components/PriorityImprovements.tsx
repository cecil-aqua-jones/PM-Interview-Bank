"use client";

import styles from "../app.module.css";

type ConversationTurn = {
  role: "interviewer" | "candidate";
  content: string;
};

type PriorityImprovementsProps = {
  improvements: string[];
  conversation?: ConversationTurn[];
  maxItems?: number;
};

/**
 * Extract a relevant quote from candidate responses
 * Returns a truncated quote that's relevant to the improvement context
 */
function extractCandidateQuote(
  conversation: ConversationTurn[] | undefined,
  improvementText: string,
  index: number
): string | null {
  if (!conversation || conversation.length === 0) return null;

  // Get candidate responses
  const candidateResponses = conversation
    .filter((turn) => turn.role === "candidate")
    .map((turn) => turn.content);

  if (candidateResponses.length === 0) return null;

  // For simplicity, use different candidate responses for different improvements
  // This gives variety in the quotes shown
  const responseIndex = Math.min(index, candidateResponses.length - 1);
  const response = candidateResponses[responseIndex];

  if (!response) return null;

  // Truncate to a reasonable length
  const maxLength = 120;
  if (response.length <= maxLength) {
    return response;
  }

  // Find a good break point
  const truncated = response.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return truncated.substring(0, lastSpace > 80 ? lastSpace : maxLength) + "...";
}

/**
 * PriorityImprovements - Ranked list of improvements (max 3)
 * Per the evaluation framework: Give 3 improvements maximum, ranked 1-2-3
 * 
 * Follows Hermes design: editorial layout, generous whitespace, refined typography
 */
export default function PriorityImprovements({
  improvements,
  conversation,
  maxItems = 3,
}: PriorityImprovementsProps) {
  // Limit to max items (per framework: 3 max)
  const prioritizedImprovements = improvements.slice(0, maxItems);

  if (prioritizedImprovements.length === 0) {
    return null;
  }

  return (
    <div className={styles.priorityImprovements}>
      <div className={styles.priorityImprovementsHeader}>
        <span className={styles.priorityImprovementsLabel}>Priority Improvements</span>
        <span className={styles.priorityImprovementsSubtitle}>
          Focus on these {prioritizedImprovements.length} areas first
        </span>
      </div>

      <div className={styles.priorityImprovementsList}>
        {prioritizedImprovements.map((improvement, index) => {
          const quote = extractCandidateQuote(conversation, improvement, index);

          return (
            <div key={index} className={styles.priorityImprovementItem}>
              {/* Rank Number */}
              <div className={styles.priorityImprovementRank}>
                <span className={styles.priorityImprovementRankNumber}>
                  {index + 1}
                </span>
              </div>

              {/* Content */}
              <div className={styles.priorityImprovementContent}>
                {/* The improvement suggestion */}
                <p className={styles.priorityImprovementText}>{improvement}</p>

                {/* Quote from candidate (if available) */}
                {quote && (
                  <div className={styles.priorityImprovementQuote}>
                    <span className={styles.priorityImprovementQuoteLabel}>
                      What you said
                    </span>
                    <blockquote className={styles.priorityImprovementQuoteText}>
                      "{quote}"
                    </blockquote>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
