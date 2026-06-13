"use client";

import React from "react";

export default function Header() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <header
      id="header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 32px",
        background: "var(--ws-bg-primary)",
        borderBottom: "1px solid var(--ws-border)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left — Page title */}
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--ws-text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Global Intelligence Dashboard
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--ws-text-muted)",
            marginTop: 2,
          }}
        >
          Global State Overview · Real-time Monitoring
        </p>
      </div>

      {/* Right — Time + Status */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {/* Live indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 8,
            background: "rgba(34, 197, 94, 0.08)",
            border: "1px solid rgba(34, 197, 94, 0.15)",
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 8px rgba(34, 197, 94, 0.5)",
              animation: "ws-pulse-glow 2s infinite",
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#22c55e",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Live
          </span>
        </div>

        {/* Time */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--ws-text-primary)",
              letterSpacing: "0.02em",
            }}
          >
            {timeStr} UTC
          </div>
          <div style={{ fontSize: 12, color: "var(--ws-text-muted)" }}>
            {dateStr}
          </div>
        </div>
      </div>
    </header>
  );
}
