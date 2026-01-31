"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "typing" | "revealed";

export default function LandingInterviewPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("typing");
  const [isInView, setIsInView] = useState(false);

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

  useEffect(() => {
    if (!isInView) return;

    // Animation loop
    const runAnimation = () => {
      // Start with typing
      setPhase("typing");

      // After 1.5s, reveal the text
      const revealTimer = setTimeout(() => {
        setPhase("revealed");
      }, 1500);

      // After 3s of being revealed (4.5s total), pause then restart
      const restartTimer = setTimeout(() => {
        // Small pause before restart
        setTimeout(runAnimation, 1000);
      }, 4500);

      return () => {
        clearTimeout(revealTimer);
        clearTimeout(restartTimer);
      };
    };

    const cleanup = runAnimation();
    return cleanup;
  }, [isInView]);

  return (
    <div className="landing-interview-preview" ref={containerRef}>
      {/* Question Header */}
      <div className="landing-interview-header">
        <span className="landing-interview-difficulty">Medium</span>
        <h4 className="landing-interview-title">Two Sum</h4>
      </div>

      {/* Mini Code Editor */}
      <div className="landing-interview-editor">
        <div className="landing-interview-editor-header">
          <span className="landing-interview-lang">Python</span>
        </div>
        <pre className="landing-interview-code">
{`def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`}
        </pre>
      </div>

      {/* AI Follow-up */}
      <div className="landing-interview-ai">
        <div className="landing-interview-ai-avatar">AI</div>
        <div className="landing-interview-ai-bubble">
          {phase === "typing" ? (
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>
          ) : (
            <p>"What's the time complexity of your solution? How would it handle duplicate values?"</p>
          )}
        </div>
      </div>
    </div>
  );
}
