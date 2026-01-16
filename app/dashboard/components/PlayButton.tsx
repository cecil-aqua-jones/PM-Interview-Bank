"use client";

import styles from "../app.module.css";

type PlayButtonProps = {
  onClick: () => void;
  score?: number | null;
};

function PlayIcon() {
  return (
    <svg
      className={styles.playButtonIcon}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function getScoreBadgeClass(score: number): string {
  if (score >= 7) return styles.scoreBadgeGood;
  if (score >= 5) return styles.scoreBadgeAverage;
  return styles.scoreBadgeLow;
}

export default function PlayButton({ onClick, score }: PlayButtonProps) {
  return (
    <button
      className={styles.playButton}
      onClick={onClick}
      title={score ? `Last score: ${score}/10 - Click to practice` : "Practice this question"}
      aria-label="Start mock interview"
    >
      <PlayIcon />
      {score !== null && score !== undefined && (
        <span className={`${styles.scoreBadge} ${getScoreBadgeClass(score)}`}>
          {score}
        </span>
      )}
    </button>
  );
}
