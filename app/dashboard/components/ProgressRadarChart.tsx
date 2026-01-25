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
        color: "#9ca3af",
        textAlign: "center",
        padding: "48px",
      }}>
        <p style={{ 
          fontSize: "15px",
          fontWeight: 400,
          color: "#6b7280",
          marginBottom: "8px",
        }}>
          No data available
        </p>
        <p style={{ 
          fontSize: "13px",
          color: "#9ca3af",
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
            stroke="#e5e5e5"
            strokeWidth={0.5}
          />
          <PolarAngleAxis 
            dataKey="dimension" 
            tick={{ 
              fill: "#6b7280", 
              fontSize: 11,
              fontWeight: 400,
            }}
            tickLine={false}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 5]} 
            tick={{ 
              fill: "#9ca3af", 
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
              stroke="#d1d5db"
              fill="#e5e7eb"
              fillOpacity={0.3}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}
          
          {/* Current period */}
          <Radar
            name="Current"
            dataKey="current"
            stroke="#1a1a1a"
            fill="#1a1a1a"
            fillOpacity={0.08}
            strokeWidth={1.5}
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              fontSize: "12px",
              padding: "12px 16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
            formatter={(value) => [typeof value === "number" ? value.toFixed(2) : "N/A", ""]}
            labelStyle={{
              fontWeight: 500,
              marginBottom: "4px",
              color: "#1a1a1a",
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
              backgroundColor: "#1a1a1a",
            }} />
            <span style={{ fontSize: "11px", color: "#6b7280", letterSpacing: "0.05em" }}>Current</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "16px",
              height: "2px",
              backgroundColor: "#d1d5db",
              backgroundImage: "repeating-linear-gradient(90deg, #d1d5db 0, #d1d5db 4px, transparent 4px, transparent 8px)",
            }} />
            <span style={{ fontSize: "11px", color: "#6b7280", letterSpacing: "0.05em" }}>Previous</span>
          </div>
        </div>
      )}
    </div>
  );
}
