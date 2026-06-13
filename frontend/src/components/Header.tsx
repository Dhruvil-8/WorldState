"use client";

import React, { useEffect, useState } from "react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({
  title = "Global Intelligence Terminal",
  subtitle = "OTS Systems Monitoring & Threat Telemetry",
}: HeaderProps) {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "UTC",
        })
      );
      setDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      id="header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 28px",
        background: "var(--ws-bg-primary)",
        borderBottom: "1px solid var(--ws-border)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left — Terminal Title */}
      <div>
        <h1
          style={{
            fontSize: "15px",
            fontWeight: 800,
            color: "var(--ws-text-primary)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          // {title}
        </h1>
        <p
          style={{
            fontSize: "11px",
            color: "var(--ws-text-secondary)",
            fontFamily: "'JetBrains Mono', monospace",
            marginTop: 2,
            opacity: 0.8,
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Right — Live Telemetry & UTC Time */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* Status Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            background: "rgba(16, 185, 129, 0.04)",
            border: "1px solid rgba(16, 185, 129, 0.15)",
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 6px rgba(16, 185, 129, 0.6)",
              animation: "ws-pulse-glow 1.5s infinite",
            }}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "#10b981",
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            SYS.RUNNING
          </span>
        </div>

        {/* Dynamic UTC Clock */}
        <div style={{ textAlign: "right" }}>
          <div
            className="ws-mono"
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--ws-text-primary)",
              letterSpacing: "0.05em",
            }}
          >
            {timeStr || "00:00:00"} UTC
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "var(--ws-text-muted)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {dateStr || "---"}
          </div>
        </div>
      </div>
    </header>
  );
}
