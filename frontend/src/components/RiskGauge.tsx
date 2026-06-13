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
  if (score >= 80) return "#ef4444";
  if (score >= 60) return "#f97316";
  if (score >= 40) return "#eab308";
  if (score >= 20) return "#22c55e";
  return "#06b6d4";
}

function getRiskLevel(score: number): string {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "ELEVATED";
  if (score >= 20) return "MODERATE";
  return "LOW";
}

function getTrendIcon(trend: string): string {
  switch (trend) {
    case "rising": return "↑";
    case "falling": return "↓";
    case "volatile": return "⇅";
    default: return "→";
  }
}

function getTrendClass(trend: string): string {
  switch (trend) {
    case "rising": return "ws-trend-rising";
    case "falling": return "ws-trend-falling";
    case "volatile": return "ws-trend-volatile";
    default: return "ws-trend-stable";
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
  const level = getRiskLevel(score);
  const barWidth = `${score}%`;

  return (
    <div
      className="ws-animate-fade-in"
      style={{
        padding: "16px 0",
        borderBottom: "1px solid var(--ws-border)",
        animationDelay: `${delay}ms`,
        animationFillMode: "backwards",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--ws-text-primary)",
              textTransform: "capitalize",
            }}
          >
            {label.replace(/_/g, " ")}
          </span>
          <span
            className={getTrendClass(trend)}
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {getTrendIcon(trend)} {trend}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            className="ws-badge"
            style={{
              color,
              background: `${color}15`,
              border: `1px solid ${color}30`,
              fontSize: 11,
            }}
          >
            {level}
          </span>
          <span
            className="ws-mono"
            style={{ fontSize: 20, fontWeight: 700, color }}
          >
            {score}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: "100%",
          height: 6,
          background: "rgba(255, 255, 255, 0.06)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: barWidth,
            height: "100%",
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            borderRadius: 3,
            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>

      {/* Confidence */}
      <div
        style={{
          fontSize: 11,
          color: "var(--ws-text-muted)",
          marginTop: 6,
          textAlign: "right",
        }}
      >
        Confidence: {confidence}%
      </div>
    </div>
  );
}
