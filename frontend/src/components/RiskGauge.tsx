"use client";

import React from "react";

interface RiskGaugeProps {
  label: string;
  score: number;
  trend: "rising" | "falling" | "stable" | "volatile";
  confidence: number;
  delay?: number;
}

function getRiskColor(score: number): string {
  if (score >= 80) return "var(--ws-risk-critical)";
  if (score >= 60) return "var(--ws-risk-high)";
  if (score >= 40) return "var(--ws-risk-elevated)";
  if (score >= 20) return "var(--ws-risk-moderate)";
  return "var(--ws-risk-low)";
}

function getTrendText(trend: string): string {
  switch (trend) {
    case "rising": return "+ RISING";
    case "falling": return "- FALLING";
    case "volatile": return "~ VOLATILE";
    default: return "= STABLE";
  }
}

export default function RiskGauge({
  label,
  score,
  trend,
  confidence,
  delay = 0,
}: RiskGaugeProps) {
  const color = getRiskColor(score);
  const trendLabel = getTrendText(trend);

  // Generate ASCII block progress bar (10 segments)
  const totalSegments = 10;
  const filledSegments = Math.round((score / 100) * totalSegments);
  const emptySegments = totalSegments - filledSegments;
  const asciiBar = "█".repeat(filledSegments) + "░".repeat(emptySegments);

  return (
    <div
      className="ws-animate-fade-in"
      style={{
        padding: "12px 0",
        borderBottom: "1px solid var(--ws-border)",
        animationDelay: `${delay}ms`,
        animationFillMode: "backwards",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Metric Line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "13px",
        }}
      >
        {/* Label & Trend */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontWeight: 700,
              color: "var(--ws-text-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
            }}
          >
            {label.replace(/_/g, " ")}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: trend === "rising" ? "var(--ws-risk-critical)" : trend === "falling" ? "var(--ws-risk-moderate)" : "var(--ws-text-muted)",
            }}
          >
            {trendLabel}
          </span>
        </div>

        {/* Index Value & Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            className="ws-mono"
            style={{
              color: color,
              fontSize: "13px",
              letterSpacing: "0.05em",
            }}
          >
            [{asciiBar}]
          </span>
          <span
            className="ws-mono"
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: color,
              minWidth: "35px",
              textAlign: "right",
            }}
          >
            {score}%
          </span>
        </div>
      </div>

      {/* Telemetry Confidence Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "10px",
          color: "var(--ws-text-muted)",
          marginTop: 4,
        }}
      >
        <span>STATUS: ACTIVE_MONITORING</span>
        <span>CONFIDENCE: {confidence}%</span>
      </div>
    </div>
  );
}
