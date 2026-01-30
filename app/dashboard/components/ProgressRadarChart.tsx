"use client";

import { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ProgressStats, WeeklySnapshot } from "@/lib/progressStorage";

type RadarChartProps = {
  stats: ProgressStats;
  showPreviousPeriod?: boolean;
};

type RadarDataPoint = {
  dimension: string;
  current: number;
  previous: number;
  fullMark: number;
};

/**
 * Calculate average score for a previous period from weekly snapshots
 */
function getPreviousPeriodAverages(
  snapshots: WeeklySnapshot[]
): { coding: number | null; behavioral: number | null; systemDesign: number | null } {
  const previousSnapshots = snapshots.slice(1, 5);
  
  if (previousSnapshots.length === 0) {
    return { coding: null, behavioral: null, systemDesign: null };
  }

  const codingScores = previousSnapshots.map(s => s.coding).filter((s): s is number => s !== null);
  const behavioralScores = previousSnapshots.map(s => s.behavioral).filter((s): s is number => s !== null);
  const systemDesignScores = previousSnapshots.map(s => s.system_design).filter((s): s is number => s !== null);

  return {
    coding: codingScores.length > 0 ? codingScores.reduce((a, b) => a + b, 0) / codingScores.length : null,
    behavioral: behavioralScores.length > 0 ? behavioralScores.reduce((a, b) => a + b, 0) / behavioralScores.length : null,
    systemDesign: systemDesignScores.length > 0 ? systemDesignScores.reduce((a, b) => a + b, 0) / systemDesignScores.length : null,
  };
}

export default function ProgressRadarChart({ stats, showPreviousPeriod = true }: RadarChartProps) {
  const radarData = useMemo<RadarDataPoint[]>(() => {
    const previous = showPreviousPeriod ? getPreviousPeriodAverages(stats.weeklySnapshots) : null;
    
    return [
      // Coding dimensions
      {
        dimension: "Correctness",
        current: stats.radarData.correctness ?? 0,
        previous: previous?.coding ?? 0,
        fullMark: 5,
      },
      {
        dimension: "Complexity",
        current: stats.radarData.complexityAnalysis ?? 0,
        previous: previous?.coding ?? 0,
        fullMark: 5,
      },
      {
        dimension: "Code Quality",
        current: stats.radarData.codeQuality ?? 0,
        previous: previous?.coding ?? 0,
        fullMark: 5,
      },
      // Behavioral dimensions
      {
        dimension: "STAR Structure",
        current: stats.radarData.starStructure ?? 0,
        previous: previous?.behavioral ?? 0,
        fullMark: 5,
      },
      {
        dimension: "Impact",
        current: stats.radarData.impactResults ?? 0,
        previous: previous?.behavioral ?? 0,
        fullMark: 5,
      },
      {
        dimension: "Leadership",
        current: stats.radarData.leadership ?? 0,
        previous: previous?.behavioral ?? 0,
        fullMark: 5,
      },
      // System Design dimensions
      {
        dimension: "Architecture",
        current: stats.radarData.architecture ?? 0,
        previous: previous?.systemDesign ?? 0,
        fullMark: 5,
      },
      {
        dimension: "Scalability",
        current: stats.radarData.scalability ?? 0,
        previous: previous?.systemDesign ?? 0,
        fullMark: 5,
      },
      {
        dimension: "Trade-offs",
        current: stats.radarData.tradeoffs ?? 0,
        previous: previous?.systemDesign ?? 0,
        fullMark: 5,
      },
    ];
  }, [stats, showPreviousPeriod]);

  const hasData = radarData.some(d => d.current > 0);
  const hasPreviousData = radarData.some(d => d.previous > 0);

  if (!hasData) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "350px",
        color: "var(--graphite)",
        textAlign: "center",
        padding: "48px",
      }}>
        <p style={{ 
          fontSize: "15px",
          fontWeight: 400,
          color: "var(--charcoal)",
          marginBottom: "8px",
        }}>
          No data available
        </p>
        <p style={{ 
          fontSize: "13px",
          color: "var(--graphite)",
        }}>
          Complete interviews to see your performance
        </p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid 
            stroke="var(--smoke)"
            strokeWidth={0.5}
          />
          <PolarAngleAxis 
            dataKey="dimension" 
            tick={{ 
              fill: "var(--charcoal)", 
              fontSize: 11,
              fontWeight: 400,
            }}
            tickLine={false}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 5]} 
            tick={{ 
              fill: "var(--graphite)", 
              fontSize: 10,
            }}
            tickCount={6}
            axisLine={false}
          />
          
          {/* Previous period */}
          {showPreviousPeriod && hasPreviousData && (
            <Radar
              name="Previous"
              dataKey="previous"
              stroke="var(--silver)"
              fill="var(--smoke)"
              fillOpacity={0.3}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}
          
          {/* Current period */}
          <Radar
            name="Current"
            dataKey="current"
            stroke="var(--accent)"
            fill="var(--accent)"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--pearl)",
              border: "1px solid var(--smoke)",
              borderRadius: "4px",
              fontSize: "12px",
              padding: "12px 16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              color: "var(--ink)",
            }}
            formatter={(value) => [typeof value === "number" ? value.toFixed(2) : "N/A", ""]}
            labelStyle={{
              fontWeight: 500,
              marginBottom: "4px",
              color: "var(--ink)",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Legend */}
      {showPreviousPeriod && hasPreviousData && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "32px",
          marginTop: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "16px",
              height: "2px",
              backgroundColor: "var(--accent)",
            }} />
            <span style={{ fontSize: "11px", color: "var(--charcoal)", letterSpacing: "0.05em" }}>Current</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "16px",
              height: "2px",
              backgroundColor: "var(--silver)",
              backgroundImage: "repeating-linear-gradient(90deg, var(--silver) 0, var(--silver) 4px, transparent 4px, transparent 8px)",
            }} />
            <span style={{ fontSize: "11px", color: "var(--charcoal)", letterSpacing: "0.05em" }}>Previous</span>
          </div>
        </div>
      )}
    </div>
  );
}
