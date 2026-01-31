"use client";

import { useEffect, useRef, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

type DataPoint = {
  dimension: string;
  score: number;
  fullMark: number;
};

// Three progression states
const weakHireData: DataPoint[] = [
  { dimension: "Correctness", score: 1.8, fullMark: 5 },
  { dimension: "Complexity", score: 1.5, fullMark: 5 },
  { dimension: "Code Quality", score: 1.7, fullMark: 5 },
  { dimension: "STAR Structure", score: 1.4, fullMark: 5 },
  { dimension: "Impact", score: 1.6, fullMark: 5 },
  { dimension: "Leadership", score: 1.2, fullMark: 5 },
  { dimension: "Architecture", score: 1.5, fullMark: 5 },
  { dimension: "Scalability", score: 1.3, fullMark: 5 },
  { dimension: "Trade-offs", score: 1.4, fullMark: 5 },
];

const moderateHireData: DataPoint[] = [
  { dimension: "Correctness", score: 3.2, fullMark: 5 },
  { dimension: "Complexity", score: 3.0, fullMark: 5 },
  { dimension: "Code Quality", score: 3.3, fullMark: 5 },
  { dimension: "STAR Structure", score: 2.9, fullMark: 5 },
  { dimension: "Impact", score: 3.1, fullMark: 5 },
  { dimension: "Leadership", score: 2.8, fullMark: 5 },
  { dimension: "Architecture", score: 3.0, fullMark: 5 },
  { dimension: "Scalability", score: 2.9, fullMark: 5 },
  { dimension: "Trade-offs", score: 3.2, fullMark: 5 },
];

const excellentHireData: DataPoint[] = [
  { dimension: "Correctness", score: 4.8, fullMark: 5 },
  { dimension: "Complexity", score: 4.5, fullMark: 5 },
  { dimension: "Code Quality", score: 4.7, fullMark: 5 },
  { dimension: "STAR Structure", score: 4.6, fullMark: 5 },
  { dimension: "Impact", score: 4.9, fullMark: 5 },
  { dimension: "Leadership", score: 4.4, fullMark: 5 },
  { dimension: "Architecture", score: 4.6, fullMark: 5 },
  { dimension: "Scalability", score: 4.3, fullMark: 5 },
  { dimension: "Trade-offs", score: 4.5, fullMark: 5 },
];

type Stage = "weak" | "moderate" | "excellent";

const stageConfig: Record<Stage, { data: DataPoint[]; label: string }> = {
  weak: { data: weakHireData, label: "Needs Work" },
  moderate: { data: moderateHireData, label: "Getting There" },
  excellent: { data: excellentHireData, label: "Interview Ready" },
};

export default function LandingRadarChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<Stage>("weak");
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          // Start animation sequence
          setStage("weak");
          
          // Transition to moderate after 2s
          setTimeout(() => {
            setStage("moderate");
          }, 2000);
          
          // Transition to excellent after 4s
          setTimeout(() => {
            setStage("excellent");
          }, 4000);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const { data, label } = stageConfig[stage];

  return (
    <div className="landing-radar-container" ref={containerRef}>
      <p className="landing-radar-label">{label}</p>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid 
            stroke="var(--silver)"
            strokeWidth={0.5}
          />
          <PolarAngleAxis 
            dataKey="dimension" 
            tick={{ 
              fill: "var(--graphite)", 
              fontSize: 11,
              fontWeight: 400,
            }}
            tickLine={false}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 5]} 
            tick={{ 
              fill: "var(--slate)", 
              fontSize: 10,
            }}
            tickCount={6}
            axisLine={false}
          />
          
          <Radar
            name="Score"
            dataKey="score"
            stroke="var(--accent)"
            fill="var(--accent)"
            fillOpacity={0.2}
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
