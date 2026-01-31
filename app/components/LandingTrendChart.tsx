"use client";

import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type DataPoint = {
  week: string;
  coding: number;
  behavioral: number;
  systemDesign: number;
};

type Stage = "weak" | "moderate" | "excellent";

// Mock data for three progression states
const weakData: DataPoint[] = [
  { week: "W1", coding: 1.2, behavioral: 1.4, systemDesign: 1.1 },
  { week: "W2", coding: 1.3, behavioral: 1.3, systemDesign: 1.2 },
  { week: "W3", coding: 1.4, behavioral: 1.5, systemDesign: 1.3 },
  { week: "W4", coding: 1.5, behavioral: 1.4, systemDesign: 1.4 },
  { week: "W5", coding: 1.6, behavioral: 1.6, systemDesign: 1.5 },
  { week: "W6", coding: 1.7, behavioral: 1.7, systemDesign: 1.6 },
];

const moderateData: DataPoint[] = [
  { week: "W1", coding: 2.1, behavioral: 2.3, systemDesign: 2.0 },
  { week: "W2", coding: 2.4, behavioral: 2.5, systemDesign: 2.3 },
  { week: "W3", coding: 2.7, behavioral: 2.8, systemDesign: 2.6 },
  { week: "W4", coding: 2.9, behavioral: 3.0, systemDesign: 2.8 },
  { week: "W5", coding: 3.1, behavioral: 3.2, systemDesign: 3.0 },
  { week: "W6", coding: 3.3, behavioral: 3.4, systemDesign: 3.2 },
];

const excellentData: DataPoint[] = [
  { week: "W1", coding: 3.8, behavioral: 4.0, systemDesign: 3.9 },
  { week: "W2", coding: 4.0, behavioral: 4.2, systemDesign: 4.1 },
  { week: "W3", coding: 4.2, behavioral: 4.3, systemDesign: 4.3 },
  { week: "W4", coding: 4.4, behavioral: 4.5, systemDesign: 4.4 },
  { week: "W5", coding: 4.6, behavioral: 4.6, systemDesign: 4.5 },
  { week: "W6", coding: 4.7, behavioral: 4.8, systemDesign: 4.7 },
];

const stageConfig: Record<Stage, { data: DataPoint[]; label: string }> = {
  weak: { data: weakData, label: "Starting Out" },
  moderate: { data: moderateData, label: "Building Momentum" },
  excellent: { data: excellentData, label: "Interview Ready" },
};

export default function LandingTrendChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<Stage>("weak");
  const [isInView, setIsInView] = useState(false);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isInView) return;

    let timeoutIds: NodeJS.Timeout[] = [];

    const runAnimation = () => {
      setStage("weak");

      const t1 = setTimeout(() => {
        setStage("moderate");
      }, 2000);
      timeoutIds.push(t1);

      const t2 = setTimeout(() => {
        setStage("excellent");
      }, 4000);
      timeoutIds.push(t2);

      const t3 = setTimeout(() => {
        runAnimation();
      }, 8000);
      timeoutIds.push(t3);
    };

    runAnimation();

    return () => {
      timeoutIds.forEach((id) => clearTimeout(id));
    };
  }, [isInView]);

  const { data, label } = stageConfig[stage];

  return (
    <div className="landing-trend-container" ref={containerRef}>
      <p className="landing-trend-label">{label}</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="0"
            stroke="var(--silver)"
            strokeWidth={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: "var(--graphite)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--silver)", strokeWidth: 0.5 }}
          />
          <YAxis
            domain={[0, 5]}
            tick={{ fontSize: 10, fill: "var(--graphite)" }}
            tickLine={false}
            axisLine={false}
            tickCount={6}
          />
          <Line
            type="monotone"
            dataKey="coding"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", strokeWidth: 0, r: 3 }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="behavioral"
            stroke="#ff5500"
            strokeWidth={2}
            dot={{ fill: "#ff5500", strokeWidth: 0, r: 3 }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="systemDesign"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: "#22c55e", strokeWidth: 0, r: 3 }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="landing-trend-legend">
        <div className="landing-trend-legend-item">
          <div className="landing-trend-legend-line" style={{ backgroundColor: "#3b82f6" }} />
          <span>Coding</span>
        </div>
        <div className="landing-trend-legend-item">
          <div className="landing-trend-legend-line" style={{ backgroundColor: "#ff5500" }} />
          <span>Behavioral</span>
        </div>
        <div className="landing-trend-legend-item">
          <div className="landing-trend-legend-line" style={{ backgroundColor: "#22c55e" }} />
          <span>System Design</span>
        </div>
      </div>
    </div>
  );
}
