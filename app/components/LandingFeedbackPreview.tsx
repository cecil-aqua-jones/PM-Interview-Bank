"use client";

import { useEffect, useRef, useState } from "react";

type DimensionScore = {
  name: string;
  score: number;
};

const mockDimensions: DimensionScore[] = [
  { name: "Correctness", score: 4.5 },
  { name: "Complexity", score: 4.0 },
  { name: "Code Quality", score: 4.2 },
  { name: "Communication", score: 4.3 },
  { name: "Problem Solving", score: 4.0 },
];

export default function LandingFeedbackPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);

  const overallScore = 4.2;
  const verdict = "Pass";

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

    let animationFrame: number;
    let timeoutId: NodeJS.Timeout;

    const runAnimation = () => {
      const duration = 2500; // 2.5s to fill
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOut = 1 - Math.pow(1 - rawProgress, 3);
        
        setProgress(easeOut);

        if (rawProgress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          // Hold at full for 3s, then reset and restart
          timeoutId = setTimeout(() => {
            setProgress(0);
            // Small pause before restart
            setTimeout(runAnimation, 500);
          }, 3000);
        }
      };

      animationFrame = requestAnimationFrame(animate);
    };

    runAnimation();

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(timeoutId);
    };
  }, [isInView]);

  return (
    <div className="landing-feedback-preview" ref={containerRef}>
      {/* Type Label */}
      <div className="landing-feedback-type">Coding Interview</div>

      {/* Score Display */}
      <div className="landing-feedback-score">
        <span className="landing-feedback-score-value">
          {(overallScore * progress).toFixed(1)}
        </span>
        <span className="landing-feedback-score-max">/5</span>
      </div>

      {/* Verdict Badge */}
      <div className="landing-feedback-verdict">{verdict}</div>

      {/* Dimension Breakdown */}
      <div className="landing-feedback-breakdown">
        {mockDimensions.map((dim) => (
          <div key={dim.name} className="landing-feedback-dimension">
            <div className="landing-feedback-dim-header">
              <span className="landing-feedback-dim-name">{dim.name}</span>
              <span className="landing-feedback-dim-score">
                {(dim.score * progress).toFixed(1)}
              </span>
            </div>
            <div className="landing-feedback-dim-bar">
              <div
                className="landing-feedback-dim-bar-fill"
                style={{ width: `${(dim.score / 5) * progress * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
