"use client";

import type { ProgressStats } from "@/lib/progressStorage";
import { getVerdictForScore } from "@/lib/progressStorage";

type ProgressStatsCardsProps = {
  stats: ProgressStats;
};

export default function ProgressStatsCards({ stats }: ProgressStatsCardsProps) {
  // Calculate overall average across all types
  const validAverages = [
    stats.averages.coding,
    stats.averages.behavioral,
    stats.averages.systemDesign,
  ].filter((a): a is number => a !== null);
  
  const overallAverage = validAverages.length > 0
    ? validAverages.reduce((a, b) => a + b, 0) / validAverages.length
    : null;

  const overallVerdict = overallAverage !== null ? getVerdictForScore(overallAverage) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
      {/* Primary Summary Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1px",
        backgroundColor: "var(--smoke)",
        borderRadius: "4px",
        overflow: "hidden",
      }}>
        {/* Total Interviews */}
        <div style={{
          padding: "40px 32px",
          backgroundColor: "var(--pearl)",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--graphite)",
            marginBottom: "16px",
          }}>
            Total Sessions
          </p>
          <p style={{
            fontSize: "48px",
            fontWeight: 300,
            color: "var(--ink)",
            fontFamily: "Playfair Display, Georgia, serif",
            lineHeight: 1,
          }}>
            {stats.totalInterviews}
          </p>
        </div>

        {/* Overall Average */}
        <div style={{
          padding: "40px 32px",
          backgroundColor: "var(--pearl)",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--graphite)",
            marginBottom: "16px",
          }}>
            Overall Score
          </p>
          <p style={{
            fontSize: "48px",
            fontWeight: 300,
            color: "var(--ink)",
            fontFamily: "Playfair Display, Georgia, serif",
            lineHeight: 1,
            marginBottom: overallVerdict ? "12px" : "0",
          }}>
            {overallAverage !== null ? overallAverage.toFixed(1) : "—"}
          </p>
          {overallVerdict && (
            <span style={{
              fontSize: "10px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: overallVerdict.color === "green" ? "#4ade80" 
                : overallVerdict.color === "amber" ? "#fbbf24" 
                : overallVerdict.color === "red" ? "#f87171" 
                : "var(--graphite)",
            }}>
              {overallVerdict.verdict}
            </span>
          )}
        </div>

        {/* This Week */}
        <div style={{
          padding: "40px 32px",
          backgroundColor: "var(--pearl)",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--graphite)",
            marginBottom: "16px",
          }}>
            This Week
          </p>
          <p style={{
            fontSize: "48px",
            fontWeight: 300,
            color: "var(--ink)",
            fontFamily: "Playfair Display, Georgia, serif",
            lineHeight: 1,
          }}>
            {stats.weeklySnapshots[0] ? countThisWeek(stats.weeklySnapshots[0]) : 0}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "24px",
      }}>
        <CategoryCard
          category="Coding"
          count={stats.counts.coding}
          average={stats.averages.coding}
        />
        <CategoryCard
          category="Behavioral"
          count={stats.counts.behavioral}
          average={stats.averages.behavioral}
        />
        <CategoryCard
          category="System Design"
          count={stats.counts.systemDesign}
          average={stats.averages.systemDesign}
        />
      </div>
    </div>
  );
}

type CategoryCardProps = {
  category: string;
  count: number;
  average: number | null;
};

function CategoryCard({ category, count, average }: CategoryCardProps) {
  const verdict = getVerdictForScore(average);
  
  return (
    <div style={{
      padding: "32px",
      backgroundColor: "var(--pearl)",
      borderRadius: "4px",
      border: "1px solid var(--smoke)",
    }}>
      <p style={{
        fontSize: "11px",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "var(--graphite)",
        marginBottom: "20px",
      }}>
        {category}
      </p>
      
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: "8px",
        marginBottom: "8px",
      }}>
        <span style={{
          fontSize: "32px",
          fontWeight: 300,
          color: "var(--ink)",
          fontFamily: "Playfair Display, Georgia, serif",
        }}>
          {average !== null ? average.toFixed(1) : "—"}
        </span>
        <span style={{
          fontSize: "13px",
          color: "var(--graphite)",
        }}>
          / 5
        </span>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{
          fontSize: "13px",
          color: "var(--graphite)",
        }}>
          {count} {count === 1 ? "session" : "sessions"}
        </span>
        
        {average !== null && (
          <span style={{
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: verdict.color === "green" ? "#4ade80" 
              : verdict.color === "amber" ? "#fbbf24" 
              : verdict.color === "red" ? "#f87171" 
              : "var(--graphite)",
          }}>
            {verdict.verdict}
          </span>
        )}
      </div>
    </div>
  );
}

function countThisWeek(snapshot: { coding: number | null; behavioral: number | null; system_design: number | null }): number {
  let count = 0;
  if (snapshot.coding !== null) count++;
  if (snapshot.behavioral !== null) count++;
  if (snapshot.system_design !== null) count++;
  return count;
}
