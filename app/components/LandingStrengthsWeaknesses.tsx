"use client";

import { useEffect, useRef, useState } from "react";

type SkillItem = {
  dimension: string;
  category: string;
  score: number;
};

type StageData = {
  strengths: SkillItem[];
  weaknesses: SkillItem[];
  label: string;
};

type Stage = "weak" | "moderate" | "excellent";

const stageConfig: Record<Stage, StageData> = {
  weak: {
    label: "Areas to Develop",
    strengths: [
      { dimension: "Correctness", category: "Coding", score: 2.1 },
    ],
    weaknesses: [
      { dimension: "Communication", category: "Behavioral", score: 1.2 },
      { dimension: "Trade-offs", category: "System Design", score: 1.4 },
      { dimension: "Leadership", category: "Behavioral", score: 1.3 },
    ],
  },
  moderate: {
    label: "Making Progress",
    strengths: [
      { dimension: "Correctness", category: "Coding", score: 3.4 },
      { dimension: "Impact", category: "Behavioral", score: 3.2 },
    ],
    weaknesses: [
      { dimension: "Scalability", category: "System Design", score: 2.6 },
      { dimension: "Trade-offs", category: "System Design", score: 2.8 },
    ],
  },
  excellent: {
    label: "Interview Ready",
    strengths: [
      { dimension: "Impact", category: "Behavioral", score: 4.8 },
      { dimension: "Architecture", category: "System Design", score: 4.6 },
      { dimension: "Correctness", category: "Coding", score: 4.7 },
    ],
    weaknesses: [
      { dimension: "Trade-offs", category: "System Design", score: 3.9 },
    ],
  },
};

export default function LandingStrengthsWeaknesses() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<Stage>("weak");
  const [isInView, setIsInView] = useState(false);
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});

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

  // Animation loop for stages
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

  // Animate scores when stage changes
  useEffect(() => {
    const { strengths, weaknesses } = stageConfig[stage];
    const allItems = [...strengths, ...weaknesses];
    
    // Reset scores to 0
    const initialScores: Record<string, number> = {};
    allItems.forEach((item) => {
      initialScores[item.dimension] = 0;
    });
    setAnimatedScores(initialScores);

    // Animate to target scores
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      const newScores: Record<string, number> = {};
      allItems.forEach((item) => {
        newScores[item.dimension] = item.score * eased;
      });
      setAnimatedScores(newScores);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [stage]);

  const { strengths, weaknesses, label } = stageConfig[stage];

  return (
    <div className="landing-strengths-container" ref={containerRef}>
      <p className="landing-strengths-label">{label}</p>
      
      <div className="landing-strengths-grid">
        {/* Strengths Column */}
        <div className="landing-strengths-column">
          <p className="landing-strengths-heading strengths">Strongest Areas</p>
          <div className="landing-strengths-list">
            {strengths.map((item, index) => (
              <div
                key={`${stage}-strength-${item.dimension}`}
                className="landing-strengths-item"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="landing-strengths-item-info">
                  <p className="landing-strengths-dimension">{item.dimension}</p>
                  <p className="landing-strengths-category">{item.category}</p>
                </div>
                <span className="landing-strengths-score strengths">
                  {(animatedScores[item.dimension] || 0).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="landing-strengths-divider" />

        {/* Weaknesses Column */}
        <div className="landing-strengths-column">
          <p className="landing-strengths-heading weaknesses">Focus Areas</p>
          <div className="landing-strengths-list">
            {weaknesses.map((item, index) => (
              <div
                key={`${stage}-weakness-${item.dimension}`}
                className="landing-strengths-item"
                style={{ animationDelay: `${(strengths.length + index) * 100}ms` }}
              >
                <div className="landing-strengths-item-info">
                  <p className="landing-strengths-dimension">{item.dimension}</p>
                  <p className="landing-strengths-category">{item.category}</p>
                </div>
                <span className="landing-strengths-score weaknesses">
                  {(animatedScores[item.dimension] || 0).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
