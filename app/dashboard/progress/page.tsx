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
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          border: "2px solid #f3f4f6",
          borderTopColor: "#9ca3af",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <p style={{ 
          marginTop: "24px", 
          fontSize: "13px",
          letterSpacing: "0.02em",
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
      }}>
        <p style={{ 
          fontSize: "15px", 
          marginBottom: "24px",
          lineHeight: 1.7,
        }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "12px 32px",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            color: "#1a1a1a",
            backgroundColor: "transparent",
            border: "1px solid #1a1a1a",
            borderRadius: "2px",
            cursor: "pointer",
            transition: "all 0.3s ease",
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

  return (
    <div style={{
      padding: "64px 48px 96px",
      maxWidth: "1280px",
      margin: "0 auto",
      backgroundColor: "#faf9f7",
      minHeight: "100vh",
    }}>
      {/* Header */}
      <header style={{ 
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
      </header>

      {/* Stats Cards */}
      <section style={{ marginBottom: "80px" }}>
        <ProgressStatsCards stats={stats} />
      </section>

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

      {/* Getting Started Tip */}
      {stats.totalInterviews > 0 && stats.totalInterviews < 5 && (
        <aside style={{
          marginTop: "64px",
          padding: "32px 40px",
          backgroundColor: "#ffffff",
          borderRadius: "4px",
          border: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "flex-start",
          gap: "20px",
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
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
      )}
    </div>
  );
}
