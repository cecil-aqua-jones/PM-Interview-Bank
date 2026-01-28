"use client";

import styles from "../app.module.css";

type RedFlagsSectionProps = {
  flags: string[];
};

/**
 * Warning icon - subtle, elegant design
 */
function WarningIcon() {
  return (
    <svg
      className={styles.redFlagIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}

/**
 * RedFlagsSection - Displays critical issues that affected the score
 * Per the evaluation framework: blocking issues that must be fixed (0-3 items)
 * 
 * Follows Hermes design: subtle burgundy accent, generous spacing, refined typography
 */
export default function RedFlagsSection({ flags }: RedFlagsSectionProps) {
  // Don't render if no red flags
  if (!flags || flags.length === 0) {
    return null;
  }

  return (
    <div className={styles.redFlagsSection}>
      <div className={styles.redFlagsSectionHeader}>
        <WarningIcon />
        <span className={styles.redFlagsSectionTitle}>Critical Issues</span>
        <span className={styles.redFlagsSectionCount}>{flags.length}</span>
      </div>
      
      <p className={styles.redFlagsSectionSubtitle}>
        These patterns significantly impacted your score and should be addressed first.
      </p>

      <div className={styles.redFlagsList}>
        {flags.map((flag, index) => (
          <div key={index} className={styles.redFlagItem}>
            <span className={styles.redFlagNumber}>{index + 1}</span>
            <p className={styles.redFlagText}>{flag}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
