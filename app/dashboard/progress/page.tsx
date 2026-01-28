"use client";

import { useState, useEffect } from "react";
import ProgressRadarChart from "../components/ProgressRadarChart";
import ProgressStatsCards from "../components/ProgressStats";
import TrendChart from "../components/TrendChart";
import StrengthsWeaknesses from "../components/StrengthsWeaknesses";
import type { ProgressStats } from "@/lib/progressStorage";

export default function ProgressPage() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/progress");
        if (!response.ok) {
          throw new Error("Failed to fetch progress data");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("[Progress] Error fetching stats:", err);
        setError("Unable to load your progress. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        color: "#6b7280",
        backgroundColor: "#faf9f7",
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "2px solid #f3f4f6",
          borderTopColor: "#1a1a1a",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ 
          marginTop: "32px", 
          fontSize: "11px",
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}>
          Loading your progress
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        color: "#6b7280",
        textAlign: "center",
        padding: "48px",
        backgroundColor: "#faf9f7",
      }}>
        {/* Error Icon */}
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          border: "1px solid rgba(185, 28, 28, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "28px",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p style={{ 
          fontSize: "15px", 
          marginBottom: "28px",
          lineHeight: 1.7,
          maxWidth: "320px",
        }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "14px 36px",
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#1a1a1a",
            backgroundColor: "transparent",
            border: "1px solid #1a1a1a",
            borderRadius: "2px",
            cursor: "pointer",
            transition: "all 0.4s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1a1a1a";
            e.currentTarget.style.color = "#faf9f7";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#1a1a1a";
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Empty state - no interviews completed yet
  if (stats.totalInterviews === 0) {
    return (
      <div style={{
        padding: "64px 48px 96px",
        maxWidth: "720px",
        margin: "0 auto",
        backgroundColor: "#faf9f7",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Decorative Icon */}
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          border: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "40px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <path d="M12 20V10" />
            <path d="M18 20V4" />
            <path d="M6 20v-4" />
          </svg>
        </div>

        {/* Header */}
        <p style={{
          fontSize: "11px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#9ca3af",
          marginBottom: "16px",
        }}>
          Performance Analytics
        </p>
        <h1 style={{
          fontSize: "36px",
          fontWeight: 400,
          color: "#1a1a1a",
          fontFamily: "Playfair Display, Georgia, serif",
          letterSpacing: "-0.01em",
          marginBottom: "24px",
          textAlign: "center",
        }}>
          Your Journey Begins Here
        </h1>
        <p style={{
          fontSize: "16px",
          color: "#6b7280",
          lineHeight: 1.8,
          textAlign: "center",
          maxWidth: "480px",
          marginBottom: "48px",
        }}>
          Complete your first practice session to start tracking. 
          Your performance insights, trends, and personalized recommendations will appear here.
        </p>

        {/* CTA Button */}
        <a
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "16px 40px",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#ffffff",
            backgroundColor: "#1a1a1a",
            border: "none",
            borderRadius: "2px",
            textDecoration: "none",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#333333";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#1a1a1a";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span>Start Practicing</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div style={{
      padding: "64px 48px 96px",
      maxWidth: "1280px",
      margin: "0 auto",
      backgroundColor: "#faf9f7",
      minHeight: "100vh",
    }}>
      {/* Greeting Header */}
      <header style={{ 
        marginBottom: "56px",
      }}>
        <p style={{
          fontSize: "11px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#9ca3af",
          marginBottom: "12px",
        }}>
          Performance Analytics
        </p>
        <h1 style={{
          fontSize: "36px",
          fontWeight: 400,
          color: "#1a1a1a",
          fontFamily: "Playfair Display, Georgia, serif",
          letterSpacing: "-0.01em",
          marginBottom: "12px",
        }}>
          Hi there
        </h1>
        <p style={{
          fontSize: "15px",
          color: "#6b7280",
          lineHeight: 1.7,
        }}>
          Complete at least five interviews across different types to unlock 
          comprehensive trend analysis and personalized recommendations.
        </p>
      </header>

      {/* Legacy Header (commented out) */}
      {/* <header style={{ 
        marginBottom: "72px",
        textAlign: "center",
      }}>
        <p style={{
          fontSize: "11px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#9ca3af",
          marginBottom: "16px",
        }}>
          Performance Analytics
        </p>
        <h1 style={{
          fontSize: "42px",
          fontWeight: 400,
          color: "#1a1a1a",
          fontFamily: "Playfair Display, Georgia, serif",
          letterSpacing: "-0.01em",
          marginBottom: "16px",
        }}>
          Your Progress
        </h1>
        <p style={{
          fontSize: "15px",
          color: "#6b7280",
          lineHeight: 1.8,
          maxWidth: "520px",
          margin: "0 auto",
        }}>
          A comprehensive view of your interview performance across coding, 
          behavioral, and system design disciplines.
        </p>
      </header> */}
      {/* Getting Started Tip
      {stats.totalInterviews > 0 && stats.totalInterviews < 5 && (
        <aside style={{
          marginTop: "24px",
          padding: "22px 30px",
          backgroundColor: "#ffffff",
          borderRadius: "4px",
          border: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "flex-start",
          gap: "20px",
        }}>
          <div>
            <p style={{ 
              fontSize: "14px", 
              fontWeight: 500, 
              color: "#1a1a1a",
              marginBottom: "6px",
            }}>
              Building Your Profile
            </p>
            <p style={{ 
              fontSize: "14px", 
              color: "#6b7280",
              lineHeight: 1.7,
            }}>
              Complete at least five interviews across different types to unlock 
              comprehensive trend analysis and personalized recommendations.
            </p>
          </div>
        </aside>
      )} */}

      {/* Charts Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
        gap: "40px",
        marginBottom: "80px",
      }}>
        {/* Radar Chart Card */}
        <article style={{
          backgroundColor: "#ffffff",
          borderRadius: "4px",
          border: "1px solid rgba(0,0,0,0.06)",
          padding: "48px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}>
          <header style={{ marginBottom: "40px" }}>
            <p style={{
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#9ca3af",
              marginBottom: "8px",
            }}>
              Skill Distribution
            </p>
            <h2 style={{
              fontSize: "24px",
              fontWeight: 400,
              color: "#1a1a1a",
              fontFamily: "Playfair Display, Georgia, serif",
            }}>
              Performance Overview
            </h2>
          </header>
          <ProgressRadarChart stats={stats} showPreviousPeriod={true} />
        </article>

        {/* Trend Chart Card */}
        <article style={{
          backgroundColor: "#ffffff",
          borderRadius: "4px",
          border: "1px solid rgba(0,0,0,0.06)",
          padding: "48px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}>
          <header style={{ marginBottom: "40px" }}>
            <p style={{
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#9ca3af",
              marginBottom: "8px",
            }}>
              Progression
            </p>
            <h2 style={{
              fontSize: "24px",
              fontWeight: 400,
              color: "#1a1a1a",
              fontFamily: "Playfair Display, Georgia, serif",
            }}>
              Weekly Trends
            </h2>
          </header>
          <TrendChart weeklySnapshots={stats.weeklySnapshots} />
        </article>
      </div>

        {/* Stats Cards */}
        <section style={{ marginBottom: "80px" }}>
        <ProgressStatsCards stats={stats} />
      </section>

      {/* Strengths & Weaknesses */}
      <section style={{
        backgroundColor: "#ffffff",
        borderRadius: "4px",
        border: "1px solid rgba(0,0,0,0.06)",
        padding: "48px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}>
        <header style={{ marginBottom: "40px", textAlign: "center" }}>
          <p style={{
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#9ca3af",
            marginBottom: "8px",
          }}>
            Insights
          </p>
          <h2 style={{
            fontSize: "24px",
            fontWeight: 400,
            color: "#1a1a1a",
            fontFamily: "Playfair Display, Georgia, serif",
          }}>
            Areas of Focus
          </h2>
        </header>
        <StrengthsWeaknesses stats={stats} />
      </section>

      
    </div>
  );
}
