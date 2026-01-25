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
        color: "#9ca3af",
        textAlign: "center",
      }}>
        <p style={{ 
          fontSize: "15px",
          fontWeight: 400,
          color: "#6b7280",
          marginBottom: "8px",
        }}>
          Analysis pending
        </p>
        <p style={{ 
          fontSize: "13px",
          color: "#9ca3af",
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
          color: "#166534",
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
                    color: "#1a1a1a",
                    marginBottom: "2px",
                  }}>
                    {item.dimension}
                  </p>
                  <p style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    letterSpacing: "0.05em",
                  }}>
                    {item.category}
                  </p>
                </div>
                <span style={{
                  fontSize: "18px",
                  fontWeight: 300,
                  color: "#166534",
                  fontFamily: "Playfair Display, Georgia, serif",
                }}>
                  {item.score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>
            More data needed
          </p>
        )}
      </div>

      {/* Divider */}
      <div style={{ backgroundColor: "#e5e7eb" }} />

      {/* Areas for Improvement */}
      <div style={{ padding: "0 0 0 48px" }}>
        <p style={{
          fontSize: "11px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#92400e",
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
                    color: "#1a1a1a",
                    marginBottom: "2px",
                  }}>
                    {item.dimension}
                  </p>
                  <p style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    letterSpacing: "0.05em",
                  }}>
                    {item.category}
                  </p>
                </div>
                <span style={{
                  fontSize: "18px",
                  fontWeight: 300,
                  color: "#92400e",
                  fontFamily: "Playfair Display, Georgia, serif",
                }}>
                  {item.score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>
            More data needed
          </p>
        )}
      </div>
    </div>
  );
}
