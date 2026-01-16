"use client";

import { useEffect, useState, ReactNode } from "react";

type ScreenshotProtectionProps = {
  children: ReactNode;
  enabled?: boolean;
  blurOnInactive?: boolean;
  watermark?: string;
};

/**
 * Screenshot and screen recording protection component
 * - Blurs content when window loses focus (potential screenshot)
 * - Disables text selection on protected content
 * - Prevents right-click context menu
 * - Adds watermark overlay
 * - Detects Print Screen key press
 */
export default function ScreenshotProtection({
  children,
  enabled = true,
  blurOnInactive = true,
  watermark,
}: ScreenshotProtectionProps) {
  const [isBlurred, setIsBlurred] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Detect visibility change (tab switch, minimize, screenshot apps)
    const handleVisibilityChange = () => {
      if (blurOnInactive && document.hidden) {
        setIsBlurred(true);
      } else {
        // Small delay before unblurring to catch quick screenshots
        setTimeout(() => setIsBlurred(false), 300);
      }
    };

    // Detect focus loss
    const handleBlur = () => {
      if (blurOnInactive) {
        setIsBlurred(true);
      }
    };

    const handleFocus = () => {
      setTimeout(() => setIsBlurred(false), 300);
    };

    // Detect Print Screen and other screenshot shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Print Screen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        setIsBlurred(true);
        setShowWarning(true);
        setTimeout(() => {
          setShowWarning(false);
          setIsBlurred(false);
        }, 2000);
      }

      // Cmd+Shift+3/4 on Mac (can't fully prevent but can detect)
      if (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4")) {
        setIsBlurred(true);
        setShowWarning(true);
        setTimeout(() => {
          setShowWarning(false);
          setIsBlurred(false);
        }, 2000);
      }

      // Prevent Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 2000);
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Detect dev tools (basic detection)
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold =
        window.outerWidth - window.innerWidth > threshold;
      const heightThreshold =
        window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        // Dev tools might be open - could log this for monitoring
        console.warn("[Security] Potential dev tools detected");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    // Check periodically for dev tools
    const devToolsInterval = setInterval(detectDevTools, 1000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      clearInterval(devToolsInterval);
    };
  }, [enabled, blurOnInactive]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className="screenshot-protection-wrapper">
      {/* Protected content */}
      <div
        className={`screenshot-protected-content ${isBlurred ? "blurred" : ""}`}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
        {children}
      </div>

      {/* Watermark overlay */}
      {watermark && (
        <div className="screenshot-watermark" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i}>{watermark}</span>
          ))}
        </div>
      )}

      {/* Screenshot warning */}
      {showWarning && (
        <div className="screenshot-warning">
          <div className="screenshot-warning-content">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>Screenshots are not allowed</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .screenshot-protection-wrapper {
          position: relative;
          min-height: 100%;
        }

        .screenshot-protected-content {
          transition: filter 0.2s ease;
        }

        .screenshot-protected-content.blurred {
          filter: blur(20px);
          pointer-events: none;
        }

        .screenshot-watermark {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9998;
          overflow: hidden;
          opacity: 0.03;
          display: flex;
          flex-wrap: wrap;
          gap: 100px;
          padding: 50px;
          transform: rotate(-30deg);
          font-size: 14px;
          color: #000;
          user-select: none;
        }

        .screenshot-warning {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease;
        }

        .screenshot-warning-content {
          text-align: center;
          color: white;
        }

        .screenshot-warning-content svg {
          margin-bottom: 16px;
          color: #f59e0b;
        }

        .screenshot-warning-content p {
          font-size: 18px;
          font-weight: 500;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
