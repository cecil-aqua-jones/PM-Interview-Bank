"use client";

import styles from "../app.module.css";

type DesignHighlights = {
  keyComponents: string[];
  scalingStrategy: string;
  dataStorage: string;
  mainTradeoff: string;
};

type DesignSummaryCardProps = {
  designHighlights: DesignHighlights;
  missedConsiderations: string[];
};

/**
 * Component icon
 */
function ComponentIcon() {
  return (
    <svg
      className={styles.designSummaryIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

/**
 * Scale icon
 */
function ScaleIcon() {
  return (
    <svg
      className={styles.designSummaryIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3" />
      <path d="M7 15L12 10L16 14L21 9" />
    </svg>
  );
}

/**
 * Database icon
 */
function DatabaseIcon() {
  return (
    <svg
      className={styles.designSummaryIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19C3 20.6569 7.02944 22 12 22C16.9706 22 21 20.6569 21 19V5" />
      <path d="M3 12C3 13.6569 7.02944 15 12 15C16.9706 15 21 13.6569 21 12" />
    </svg>
  );
}

/**
 * Balance icon for trade-offs
 */
function BalanceIcon() {
  return (
    <svg
      className={styles.designSummaryIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 3v18" />
      <path d="M4 7h16" />
      <path d="M4 7l-2 8c0 2 2 3 4 3s4-1 4-3l-2-8" />
      <path d="M20 7l-2 8c0 2 2 3 4 3s4-1 4-3l-2-8" />
    </svg>
  );
}

/**
 * Warning icon for missed topics
 */
function MissedIcon() {
  return (
    <svg
      className={styles.designSummaryIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

/**
 * DesignSummaryCard - Summary of system design interview
 * Per the evaluation framework: Components, Scaling Strategy, Main Trade-off, Missed Topics
 * 
 * Follows Hermes design: grid layout, generous whitespace, refined typography
 */
export default function DesignSummaryCard({
  designHighlights,
  missedConsiderations,
}: DesignSummaryCardProps) {
  const { keyComponents, scalingStrategy, dataStorage, mainTradeoff } = designHighlights;

  const hasContent = 
    keyComponents.length > 0 || 
    scalingStrategy || 
    dataStorage || 
    mainTradeoff;

  if (!hasContent && missedConsiderations.length === 0) {
    return null;
  }

  return (
    <div className={styles.designSummarySection}>
      <div className={styles.designSummarySectionHeader}>
        <span className={styles.designSummarySectionLabel}>Design Summary</span>
      </div>

      <div className={styles.designSummaryGrid}>
        {/* Key Components */}
        {keyComponents.length > 0 && (
          <div className={styles.designSummaryItem}>
            <div className={styles.designSummaryItemHeader}>
              <ComponentIcon />
              <span className={styles.designSummaryItemLabel}>Components</span>
            </div>
            <div className={styles.designSummaryTags}>
              {keyComponents.map((component, index) => (
                <span key={index} className={styles.designSummaryTag}>
                  {component}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Scaling Strategy */}
        {scalingStrategy && (
          <div className={styles.designSummaryItem}>
            <div className={styles.designSummaryItemHeader}>
              <ScaleIcon />
              <span className={styles.designSummaryItemLabel}>Scaling Strategy</span>
            </div>
            <p className={styles.designSummaryItemText}>{scalingStrategy}</p>
          </div>
        )}

        {/* Data Storage */}
        {dataStorage && (
          <div className={styles.designSummaryItem}>
            <div className={styles.designSummaryItemHeader}>
              <DatabaseIcon />
              <span className={styles.designSummaryItemLabel}>Data Storage</span>
            </div>
            <p className={styles.designSummaryItemText}>{dataStorage}</p>
          </div>
        )}

        {/* Main Trade-off */}
        {mainTradeoff && (
          <div className={styles.designSummaryItem}>
            <div className={styles.designSummaryItemHeader}>
              <BalanceIcon />
              <span className={styles.designSummaryItemLabel}>Key Trade-off</span>
            </div>
            <p className={styles.designSummaryItemText}>{mainTradeoff}</p>
          </div>
        )}
      </div>

      {/* Missed Considerations */}
      {missedConsiderations.length > 0 && (
        <div className={styles.designSummaryMissed}>
          <div className={styles.designSummaryMissedHeader}>
            <MissedIcon />
            <span className={styles.designSummaryMissedLabel}>Topics to Address</span>
          </div>
          <p className={styles.designSummaryMissedSubtitle}>
            Areas you should have covered for a stronger evaluation
          </p>
          <ul className={styles.designSummaryMissedList}>
            {missedConsiderations.map((topic, index) => (
              <li key={index} className={styles.designSummaryMissedItem}>
                {topic}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
