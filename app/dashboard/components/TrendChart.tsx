"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeeklySnapshot } from "@/lib/progressStorage";

type TrendChartProps = {
  weeklySnapshots: WeeklySnapshot[];
};

type ChartDataPoint = {
  week: string;
  weekLabel: string;
  coding: number | null;
  behavioral: number | null;
  systemDesign: number | null;
};

/**
 * Format ISO week string to human-readable label
 */
function formatWeekLabel(isoWeek: string): string {
  const match = isoWeek.match(/W(\d+)$/);
  if (match) {
    return `W${parseInt(match[1], 10)}`;
  }
  return isoWeek;
}

export default function TrendChart({ weeklySnapshots }: TrendChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return [...weeklySnapshots]
      .reverse()
      .map(snapshot => ({
        week: snapshot.week,
        weekLabel: formatWeekLabel(snapshot.week),
        coding: snapshot.coding,
        behavioral: snapshot.behavioral,
        systemDesign: snapshot.system_design,
      }));
  }, [weeklySnapshots]);

  const hasData = chartData.some(
    d => d.coding !== null || d.behavioral !== null || d.systemDesign !== null
  );

  if (!hasData || chartData.length === 0) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "250px",
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
          Insufficient data
        </p>
        <p style={{ 
          fontSize: "13px",
          color: "var(--graphite)",
        }}>
          Complete sessions over multiple weeks
        </p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid 
            strokeDasharray="0"
            stroke="var(--smoke)"
            vertical={false}
          />
          <XAxis 
            dataKey="weekLabel" 
            tick={{ fontSize: 10, fill: "var(--graphite)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--smoke)", strokeWidth: 0.5 }}
          />
          <YAxis 
            domain={[0, 5]}
            tick={{ fontSize: 10, fill: "var(--graphite)" }}
            tickLine={false}
            axisLine={false}
            tickCount={6}
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
            formatter={(value, name) => {
              const label = name === "coding" ? "Coding" 
                : name === "behavioral" ? "Behavioral" 
                : "System Design";
              return [typeof value === "number" ? value.toFixed(2) : "N/A", label];
            }}
            labelStyle={{
              fontWeight: 500,
              marginBottom: "4px",
              color: "var(--ink)",
            }}
          />
          <Line
            type="monotone"
            dataKey="coding"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={{ fill: "#3b82f6", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="behavioral"
            stroke="#ff5500"
            strokeWidth={1.5}
            dot={{ fill: "#ff5500", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="systemDesign"
            stroke="#22c55e"
            strokeWidth={1.5}
            dot={{ fill: "#22c55e", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "32px",
        marginTop: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "16px",
            height: "2px",
            backgroundColor: "#3b82f6",
          }} />
          <span style={{ fontSize: "11px", color: "var(--charcoal)", letterSpacing: "0.05em" }}>Coding</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "16px",
            height: "2px",
            backgroundColor: "#ff5500",
          }} />
          <span style={{ fontSize: "11px", color: "var(--charcoal)", letterSpacing: "0.05em" }}>Behavioral</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "16px",
            height: "2px",
            backgroundColor: "#22c55e",
          }} />
          <span style={{ fontSize: "11px", color: "var(--charcoal)", letterSpacing: "0.05em" }}>System Design</span>
        </div>
      </div>
    </div>
  );
}
