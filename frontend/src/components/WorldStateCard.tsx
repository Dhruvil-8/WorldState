"use client";

import React from "react";

interface WorldStateCardProps {
  stability: number;
  confidence: number;
}

function getStabilityLabel(score: number): string {
  if (score >= 80) return "OPTIMAL / SECURE";
  if (score >= 60) return "WARNING / CAUTIOUS";
  if (score >= 40) return "ELEVATED_THREAT_DETECTION";
  return "CRITICAL_SYSTEM_ALERT";
}

function getStabilityColor(score: number): string {
  if (score >= 80) return "#10b981"; // Green
  if (score >= 60) return "#eab308"; // Yellow
  if (score >= 40) return "#f97316"; // Orange
  return "#f43f5e"; // Rose/Red
}

export default function WorldStateCard({
  stability,
  confidence,
}: WorldStateCardProps) {
  const color = getStabilityColor(stability);
  const label = getStabilityLabel(stability);

  // Generate ASCII block progress bar (15 segments)
  const totalSegments = 15;
  const filledSegments = Math.round((stability / 100) * totalSegments);
  const emptySegments = totalSegments - filledSegments;
  const asciiBar = "█".repeat(filledSegments) + "░".repeat(emptySegments);

  // Dynamic values
  const dateStr = new Date().toISOString().split("T")[0];

  return (
    <div
      className="ws-card ws-animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--ws-bg-card)",
        border: "1px solid var(--ws-border)",
        padding: "24px",
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--ws-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: "16px",
          borderBottom: "1px dashed var(--ws-border)",
          paddingBottom: "8px",
        }}
      >
        // CORE_TELEMETRY_LOG
      </div>

      {/* Stability Value */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "10px",
            color: "var(--ws-text-secondary)",
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: "4px",
          }}
        >
          GLOBAL_STABILITY_INDEX:
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "10px",
          }}
        >
          <span
            className="ws-mono"
            style={{
              fontSize: "36px",
              fontWeight: 800,
              color: color,
              lineHeight: 1,
            }}
          >
            {stability}.0%
          </span>
          <span
            style={{
              fontSize: "10px",
              color: color,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              border: `1px solid ${color}30`,
              padding: "1px 6px",
              background: `${color}06`,
            }}
          >
            {label}
          </span>
        </div>

        {/* ASCII Block Bar */}
        <div
          className="ws-mono"
          style={{
            fontSize: "16px",
            color: color,
            marginTop: "10px",
            letterSpacing: "0.1em",
            lineHeight: 1,
          }}
        >
          [{asciiBar}]
        </div>
      </div>

      {/* Grid Specs / Metadata */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          borderTop: "1px dashed var(--ws-border)",
          paddingTop: "16px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--ws-text-muted)" }}>TELEMETRY_DATE:</span>
          <span style={{ color: "var(--ws-text-secondary)" }}>{dateStr}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--ws-text-muted)" }}>SYSTEM_INTEGRITY:</span>
          <span style={{ color: "#10b981" }}>SECURE</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--ws-text-muted)" }}>COGNITIVE_PIPELINE:</span>
          <span style={{ color: "var(--ws-text-secondary)" }}>ACTIVE // DIRECTED</span>
        </div>
      </div>

      {/* Model Confidence Bar */}
      <div style={{ borderTop: "1px dashed var(--ws-border)", paddingTop: "14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            color: "var(--ws-text-secondary)",
            marginBottom: "6px",
          }}
        >
          <span style={{ color: "var(--ws-text-muted)" }}>MODEL_CONFIDENCE:</span>
          <span>{confidence}%</span>
        </div>
        <div
          style={{
            width: "100%",
            height: "4px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--ws-border)",
          }}
        >
          <div
            style={{
              width: `${confidence}%`,
              height: "100%",
              background: "var(--ws-text-primary)",
              transition: "width 1s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
