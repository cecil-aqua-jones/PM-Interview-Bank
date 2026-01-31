"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import LandingRadarChart from "./LandingRadarChart";
import LandingTrendChart from "./LandingTrendChart";
import LandingStrengthsWeaknesses from "./LandingStrengthsWeaknesses";

const PANEL_TITLES = [
  "Skill Distribution",
  "Weekly Progress",
  "Performance Analysis",
];

export default function ProgressShowcaseSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const lastScrollTime = useRef(0);
  const touchStartY = useRef(0);

  // Intersection Observer to detect when section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!hasCompleted) {
            setIsLocked(true);
          }
        } else if (!entry.isIntersecting) {
          // Reset when section leaves viewport
          if (entry.boundingClientRect.top > 0) {
            // Section is below viewport, reset
            setActivePanel(0);
            setHasCompleted(false);
          }
        }
      },
      { threshold: [0.5] }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasCompleted]);

  // Handle wheel events
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!isLocked) return;

      e.preventDefault();

      // Debounce scroll events
      const now = Date.now();
      if (now - lastScrollTime.current < 500) return;
      lastScrollTime.current = now;

      if (e.deltaY > 0) {
        // Scrolling down
        if (activePanel < 2) {
          setActivePanel((prev) => prev + 1);
        } else {
          // At last panel, release lock
          setIsLocked(false);
          setHasCompleted(true);
        }
      } else if (e.deltaY < 0) {
        // Scrolling up
        if (activePanel > 0) {
          setActivePanel((prev) => prev - 1);
        } else {
          // At first panel scrolling up, release lock
          setIsLocked(false);
        }
      }
    },
    [isLocked, activePanel]
  );

  // Handle touch events for mobile
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isLocked) return;

      e.preventDefault();

      const now = Date.now();
      if (now - lastScrollTime.current < 500) return;

      const touchEndY = e.touches[0].clientY;
      const deltaY = touchStartY.current - touchEndY;

      if (Math.abs(deltaY) < 50) return; // Minimum swipe distance

      lastScrollTime.current = now;
      touchStartY.current = touchEndY;

      if (deltaY > 0) {
        // Swiping up (scroll down)
        if (activePanel < 2) {
          setActivePanel((prev) => prev + 1);
        } else {
          setIsLocked(false);
          setHasCompleted(true);
        }
      } else {
        // Swiping down (scroll up)
        if (activePanel > 0) {
          setActivePanel((prev) => prev - 1);
        } else {
          setIsLocked(false);
        }
      }
    },
    [isLocked, activePanel]
  );

  // Lock body scroll when section is active
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = "hidden";
      document.addEventListener("wheel", handleWheel, { passive: false });
      document.addEventListener("touchstart", handleTouchStart, { passive: true });
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isLocked, handleWheel, handleTouchStart, handleTouchMove]);

  return (
    <section className="progress-showcase" ref={sectionRef}>
      <div className="progress-showcase-content">
        <div className="progress-showcase-text">
          <p className="eyebrow">Measurable Progress</p>
          <h3>The Only Platform That Proves You're Improving</h3>
          <p className="progress-showcase-description">
            Watch your skills grow from first attempt to interview-ready.
            Our scoring system tracks 9 dimensions across coding, behavioral,
            and system design—so you know exactly when you're ready.
          </p>
          
          {/* Progress Indicators */}
          <div className="progress-showcase-indicators">
            {PANEL_TITLES.map((title, index) => (
              <button
                key={title}
                className={`progress-showcase-indicator ${index === activePanel ? "active" : ""} ${index < activePanel ? "completed" : ""}`}
                onClick={() => {
                  if (isLocked) {
                    setActivePanel(index);
                  }
                }}
              >
                <span className="progress-showcase-indicator-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="progress-showcase-indicator-title">{title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Panels Container */}
        <div className="progress-showcase-panels">
          <div
            className="progress-showcase-panels-track"
            style={{ transform: `translateY(-${activePanel * 100}%)` }}
          >
            <div className="progress-showcase-panel">
              <LandingRadarChart />
            </div>
            <div className="progress-showcase-panel">
              <LandingTrendChart />
            </div>
            <div className="progress-showcase-panel">
              <LandingStrengthsWeaknesses />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      {isLocked && activePanel < 2 && (
        <div className="progress-showcase-scroll-hint">
          <span>Scroll to explore</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3v10m0 0l-4-4m4 4l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </section>
  );
}
