"use client";

import styles from "../app.module.css";

type Verdict = "Strong Pass" | "Pass" | "Borderline" | "Fail" | "Strong Fail";

type DimensionScore = {
  name: string;
  score: number;
  weight: number;
};

type ResultsSummaryCardProps = {
  overallScore: number;
  verdict: Verdict;
  dimensions: DimensionScore[];
  interviewType: "coding" | "behavioral" | "system_design";
};

/**
 * Get verdict styling - elegant color scheme
 */
function getVerdictStyle(verdict: Verdict): { color: string; bg: string; border: string } {
  switch (verdict) {
    case "Strong Pass":
      return { color: "#15803d", bg: "rgba(21, 128, 61, 0.06)", border: "rgba(21, 128, 61, 0.15)" };
    case "Pass":
      return { color: "#166534", bg: "rgba(22, 101, 52, 0.05)", border: "rgba(22, 101, 52, 0.12)" };
    case "Borderline":
      return { color: "#b45309", bg: "rgba(180, 83, 9, 0.05)", border: "rgba(180, 83, 9, 0.12)" };
    case "Fail":
      return { color: "#b91c1c", bg: "rgba(185, 28, 28, 0.05)", border: "rgba(185, 28, 28, 0.12)" };
    case "Strong Fail":
      return { color: "#7f1d1d", bg: "rgba(127, 29, 29, 0.05)", border: "rgba(127, 29, 29, 0.12)" };
    default:
      return { color: "#6b7280", bg: "rgba(107, 114, 128, 0.05)", border: "rgba(107, 114, 128, 0.12)" };
  }
}

/**
 * Get score color based on value
 */
function getScoreColor(score: number): string {
  if (score >= 4.0) return "#15803d";
  if (score >= 3.5) return "#166534";
  if (score >= 2.5) return "#b45309";
  return "#b91c1c";
}

/**
 * Get interview type label
 */
function getTypeLabel(type: "coding" | "behavioral" | "system_design"): string {
  switch (type) {
    case "coding": return "Coding Interview";
    case "behavioral": return "Behavioral Interview";
    case "system_design": return "System Design Interview";
  }
}

/**
 * ResultsSummaryCard - Elegant at-a-glance score summary
 * Follows Hermes design principles: generous whitespace, subtle typography, refined colors
 */
export default function ResultsSummaryCard({
  overallScore,
  verdict,
  dimensions,
  interviewType,
}: ResultsSummaryCardProps) {
  const verdictStyle = getVerdictStyle(verdict);
  const scoreColor = getScoreColor(overallScore);

  return (
    <div className={styles.resultsSummary}>
      {/* Type Label */}
      <div className={styles.resultsSummaryType}>
        {getTypeLabel(interviewType)}
      </div>

      {/* Score Display */}
      <div className={styles.resultsSummaryScore}>
        <span 
          className={styles.resultsSummaryScoreValue}
          style={{ color: scoreColor }}
        >
          {overallScore.toFixed(1)}
        </span>
        <span className={styles.resultsSummaryScoreMax}>/5</span>
      </div>

      {/* Verdict Badge */}
      <div
        className={styles.resultsSummaryVerdict}
        style={{
          color: verdictStyle.color,
          backgroundColor: verdictStyle.bg,
          borderColor: verdictStyle.border,
        }}
      >
        {verdict}
      </div>

      {/* Dimension Breakdown */}
      <div className={styles.resultsSummaryBreakdown}>
        {dimensions.map((dim) => (
          <div key={dim.name} className={styles.resultsSummaryDimension}>
            <div className={styles.resultsSummaryDimHeader}>
              <span className={styles.resultsSummaryDimName}>
                {dim.name.split(" ")[0]}
              </span>
              <span 
                className={styles.resultsSummaryDimScore}
                style={{ color: getScoreColor(dim.score) }}
              >
                {dim.score.toFixed(1)}
              </span>
            </div>
            <div className={styles.resultsSummaryDimBar}>
              <div
                className={styles.resultsSummaryDimBarFill}
                style={{
                  width: `${(dim.score / 5) * 100}%`,
                  backgroundColor: getScoreColor(dim.score),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
