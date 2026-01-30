"use client";

import type { ProgressStats } from "@/lib/progressStorage";
import { calculateStrengthsAndWeaknesses } from "@/lib/progressStorage";

type StrengthsWeaknessesProps = {
  stats: ProgressStats;
};

export default function StrengthsWeaknesses({ stats }: StrengthsWeaknessesProps) {
  const { strengths, weaknesses } = calculateStrengthsAndWeaknesses(stats);

  if (strengths.length === 0 && weaknesses.length === 0) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 48px",
        color: "var(--graphite)",
        textAlign: "center",
      }}>
        <p style={{ 
          fontSize: "15px",
          fontWeight: 400,
          color: "var(--charcoal)",
          marginBottom: "8px",
        }}>
          Analysis pending
        </p>
        <p style={{ 
          fontSize: "13px",
          color: "var(--graphite)",
          maxWidth: "320px",
        }}>
          Complete a few interviews to reveal your strengths and areas for development
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1px 1fr",
      gap: "0",
    }}>
      {/* Strengths */}
      <div style={{ padding: "0 48px 0 0" }}>
        <p style={{
          fontSize: "11px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--success)",
          marginBottom: "24px",
        }}>
          Strongest Areas
        </p>
        
        {strengths.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {strengths.map((item, index) => (
              <div
                key={item.dimension}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--ink)",
                    marginBottom: "2px",
                  }}>
                    {item.dimension}
                  </p>
                  <p style={{
                    fontSize: "11px",
                    color: "var(--graphite)",
                    letterSpacing: "0.05em",
                  }}>
                    {item.category}
                  </p>
                </div>
                <span style={{
                  fontSize: "18px",
                  fontWeight: 300,
                  color: "var(--success)",
                  fontFamily: "Playfair Display, Georgia, serif",
                }}>
                  {item.score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "var(--graphite)" }}>
            More data needed
          </p>
        )}
      </div>

      {/* Divider */}
      <div style={{ backgroundColor: "var(--smoke)" }} />

      {/* Areas for Improvement */}
      <div style={{ padding: "0 0 0 48px" }}>
        <p style={{
          fontSize: "11px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--accent)",
          marginBottom: "24px",
        }}>
          Focus Areas
        </p>
        
        {weaknesses.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {weaknesses.map((item, index) => (
              <div
                key={item.dimension}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--ink)",
                    marginBottom: "2px",
                  }}>
                    {item.dimension}
                  </p>
                  <p style={{
                    fontSize: "11px",
                    color: "var(--graphite)",
                    letterSpacing: "0.05em",
                  }}>
                    {item.category}
                  </p>
                </div>
                <span style={{
                  fontSize: "18px",
                  fontWeight: 300,
                  color: "var(--accent)",
                  fontFamily: "Playfair Display, Georgia, serif",
                }}>
                  {item.score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "var(--graphite)" }}>
            More data needed
          </p>
        )}
      </div>
    </div>
  );
}
