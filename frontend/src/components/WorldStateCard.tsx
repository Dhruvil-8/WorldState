"use client";

import React from "react";

interface WorldStateCardProps {
  stability: number;
  confidence: number;
}

function getStabilityColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function getStabilityLabel(score: number): string {
  if (score >= 80) return "STABLE";
  if (score >= 60) return "CAUTIOUS";
  if (score >= 40) return "ELEVATED RISK";
  return "CRITICAL";
}

export default function WorldStateCard({
  stability,
  confidence,
}: WorldStateCardProps) {
  const color = getStabilityColor(stability);
  const label = getStabilityLabel(stability);

  // SVG arc parameters
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const progress = (stability / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div
      className="ws-card ws-animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        background:
          "linear-gradient(135deg, var(--ws-bg-card) 0%, rgba(59, 130, 246, 0.03) 100%)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--ws-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 20,
        }}
      >
        Global Stability Index
      </div>

      {/* Stability Ring */}
      <div className="ws-stability-ring">
        <svg width="180" height="180" viewBox="0 0 180 180">
          {/* Background circle */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: `drop-shadow(0 0 6px ${color}60)`,
            }}
          />
        </svg>
        <div className="ws-stability-value">
          <span
            className="ws-mono"
            style={{
              fontSize: 44,
              fontWeight: 800,
              color,
              lineHeight: 1,
            }}
          >
            {stability}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginTop: 6,
            }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Confidence bar */}
      <div style={{ width: "100%", marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--ws-text-muted)",
            marginBottom: 6,
          }}
        >
          <span>Model Confidence</span>
          <span className="ws-mono" style={{ color: "var(--ws-text-secondary)" }}>
            {confidence}%
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: 4,
            background: "rgba(255, 255, 255, 0.06)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${confidence}%`,
              height: "100%",
              background:
                "linear-gradient(90deg, var(--ws-accent), #8b5cf6)",
              borderRadius: 2,
              transition: "width 1s ease",
            }}
          />
        </div>
      </div>

      {/* Timestamp */}
      <div
        className="ws-mono"
        style={{
          fontSize: 11,
          color: "var(--ws-text-muted)",
          marginTop: 16,
        }}
      >
        Last updated: {new Date().toLocaleTimeString("en-US", { hour12: false })} UTC
      </div>
    </div>
  );
}
