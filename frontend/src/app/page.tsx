"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import WorldStateCard from "@/components/WorldStateCard";
import RiskGauge from "@/components/RiskGauge";
import {
  fetchEvents,
  fetchLatestIntelligence,
  fetchRisks,
  fetchWorldState,
} from "@/lib/api";
import type {
  IntelligenceSnapshot,
  RiskScore,
  WorldEvent,
  WorldState,
} from "@/types";

const fallbackWorldState: Pick<WorldState, "global_stability" | "confidence"> = {
  global_stability: 74,
  confidence: 86,
};

const fallbackRisks: RiskScore[] = [
  { id: "risk_1", risk_type: "geopolitical", score: 68, trend: "rising", confidence: 84, measured_at: new Date().toISOString() },
  { id: "risk_2", risk_type: "supply_chain", score: 63, trend: "rising", confidence: 71, measured_at: new Date().toISOString() },
  { id: "risk_3", risk_type: "economic", score: 57, trend: "stable", confidence: 79, measured_at: new Date().toISOString() },
  { id: "risk_4", risk_type: "trade", score: 55, trend: "rising", confidence: 80, measured_at: new Date().toISOString() },
  { id: "risk_5", risk_type: "energy", score: 52, trend: "rising", confidence: 76, measured_at: new Date().toISOString() },
  { id: "risk_6", risk_type: "financial", score: 48, trend: "falling", confidence: 82, measured_at: new Date().toISOString() },
  { id: "risk_7", risk_type: "cyber", score: 45, trend: "volatile", confidence: 68, measured_at: new Date().toISOString() },
  { id: "risk_8", risk_type: "food_security", score: 41, trend: "stable", confidence: 77, measured_at: new Date().toISOString() },
  { id: "risk_9", risk_type: "climate", score: 38, trend: "rising", confidence: 73, measured_at: new Date().toISOString() },
  { id: "risk_10", risk_type: "technology", score: 33, trend: "stable", confidence: 69, measured_at: new Date().toISOString() },
];

const fallbackEvents: WorldEvent[] = [
  {
    id: "event_1",
    event_type: "sanction",
    title: "New trade sanctions announced between major economies",
    severity: 8.2,
    confidence: 0.88,
    source_count: 12,
    status: "active",
    category: "geopolitical",
    first_seen_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    last_updated_at: new Date().toISOString(),
  },
  {
    id: "event_2",
    event_type: "cyber_attack",
    title: "Critical infrastructure targeted in coordinated cyber operation",
    severity: 7.8,
    confidence: 0.72,
    source_count: 5,
    status: "verified",
    category: "cyber",
    first_seen_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    last_updated_at: new Date().toISOString(),
  },
  {
    id: "event_3",
    event_type: "interest_rate_change",
    title: "Central bank holds rates steady amid inflation concerns",
    severity: 5.5,
    confidence: 0.95,
    source_count: 8,
    status: "active",
    category: "economic",
    first_seen_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    last_updated_at: new Date().toISOString(),
  },
];

const fallbackSignals: IntelligenceSnapshot["emerging_signals"] = [
  { signal: "Cyber risk volatility increasing across multiple regions", confidence: 68 },
  { signal: "New diplomatic channels opening in contested territories", confidence: 55 },
  { signal: "Agricultural output projections declining in key producers", confidence: 62 },
  { signal: "Critical mineral supply diversification accelerating", confidence: 71 },
];

function getSeverityColor(severity: number): string {
  if (severity >= 8) return "#ef4444";
  if (severity >= 6) return "#f97316";
  if (severity >= 4) return "#eab308";
  return "#22c55e";
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    geopolitical: "G",
    cyber: "C",
    economic: "E",
    supply_chain: "S",
    trade: "T",
    commodity: "M",
    environment: "N",
    other: "*",
  };
  return icons[category] || "*";
}

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "unknown";

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatConfidence(confidence: number): string {
  const percent = confidence <= 1 ? confidence * 100 : confidence;
  return `${Math.round(percent)}%`;
}

export default function DashboardPage() {
  const [worldState, setWorldState] = useState(fallbackWorldState);
  const [risks, setRisks] = useState<RiskScore[]>(fallbackRisks);
  const [events, setEvents] = useState<WorldEvent[]>(fallbackEvents);
  const [signals, setSignals] = useState(fallbackSignals);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [state, riskResponse, eventResponse, intelligence] = await Promise.all([
          fetchWorldState(),
          fetchRisks(),
          fetchEvents(5),
          fetchLatestIntelligence(),
        ]);

        if (cancelled) return;

        setWorldState({
          global_stability: state.global_stability,
          confidence: state.confidence,
        });
        setRisks(riskResponse.data.length > 0 ? riskResponse.data : fallbackRisks);
        setEvents(eventResponse.data.length > 0 ? eventResponse.data : fallbackEvents);
        setSignals(
          intelligence.emerging_signals.length > 0
            ? intelligence.emerging_signals
            : fallbackSignals
        );
        setUsingFallback(false);
      } catch (err) {
        console.warn("Failed to load live dashboard data, using fallback data.", err);
        if (!cancelled) {
          setUsingFallback(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <Header />

      <div style={{ padding: "24px 32px" }}>
        {usingFallback && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 12px",
              borderRadius: 8,
              color: "var(--ws-text-secondary)",
              background: "rgba(234, 179, 8, 0.08)",
              border: "1px solid rgba(234, 179, 8, 0.18)",
              fontSize: 12,
            }}
          >
            Live API unavailable. Showing local baseline intelligence data.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "340px 1fr",
            gap: 24,
            marginBottom: 24,
          }}
        >
          <WorldStateCard
            stability={worldState.global_stability}
            confidence={worldState.confidence}
          />

          <div className="ws-card" style={{ padding: "24px 28px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>
                Risk Matrix
              </h2>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--ws-text-muted)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {loading ? "loading" : `${risks.length} categories`}
              </span>
            </div>
            <div style={{ maxHeight: 440, overflowY: "auto", paddingRight: 8 }}>
              {risks.map((risk, i) => (
                <RiskGauge
                  key={risk.risk_type}
                  label={risk.risk_type}
                  score={risk.score}
                  trend={risk.trend}
                  confidence={risk.confidence}
                  delay={i * 60}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 24,
          }}
        >
          <div className="ws-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>
                Critical Events
              </h2>
              <span
                className="ws-badge"
                style={{
                  color: "#ef4444",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                {events.length} active
              </span>
            </div>

            {events.map((evt, i) => (
              <div
                key={evt.id}
                className="ws-animate-slide-in"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--ws-border)",
                  marginBottom: 10,
                  animationDelay: `${i * 80}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <span
                  className="ws-mono"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--ws-accent)",
                    background: "rgba(59, 130, 246, 0.1)",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {getCategoryIcon(evt.category)}
                </span>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      marginBottom: 6,
                      lineHeight: 1.4,
                    }}
                  >
                    {evt.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      className="ws-badge"
                      style={{
                        color: "var(--ws-text-secondary)",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid var(--ws-border)",
                        textTransform: "capitalize",
                        fontSize: 11,
                      }}
                    >
                      {evt.category.replace(/_/g, " ")}
                    </span>
                    <span
                      className="ws-badge"
                      style={{
                        color: getSeverityColor(evt.severity),
                        background: `${getSeverityColor(evt.severity)}12`,
                        border: `1px solid ${getSeverityColor(evt.severity)}25`,
                        fontSize: 11,
                      }}
                    >
                      SEV {evt.severity}
                    </span>
                    <span style={{ color: "var(--ws-text-muted)" }}>
                      {formatRelativeTime(evt.first_seen_at)}
                    </span>
                  </div>
                </div>

                <span
                  className="ws-badge"
                  style={{
                    color: evt.status === "active" ? "#22c55e" : "#eab308",
                    background:
                      evt.status === "active"
                        ? "rgba(34, 197, 94, 0.1)"
                        : "rgba(234, 179, 8, 0.1)",
                    border: `1px solid ${
                      evt.status === "active"
                        ? "rgba(34, 197, 94, 0.2)"
                        : "rgba(234, 179, 8, 0.2)"
                    }`,
                    fontSize: 10,
                    textTransform: "uppercase",
                  }}
                >
                  {evt.status}
                </span>
              </div>
            ))}
          </div>

          <div className="ws-card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              Emerging Signals
            </h2>

            {signals.map((sig, i) => (
              <div
                key={`${sig.signal}-${i}`}
                className="ws-animate-fade-in"
                style={{
                  padding: "14px 0",
                  borderBottom:
                    i < signals.length - 1
                      ? "1px solid var(--ws-border)"
                      : "none",
                  animationDelay: `${i * 100}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      marginTop: 5,
                      background:
                        sig.confidence > 65
                          ? "#f97316"
                          : sig.confidence > 55
                            ? "#eab308"
                            : "#94a3b8",
                      boxShadow:
                        sig.confidence > 65
                          ? "0 0 8px rgba(249, 115, 22, 0.4)"
                          : "none",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        marginBottom: 4,
                      }}
                    >
                      {sig.signal}
                    </div>
                    <div
                      className="ws-mono"
                      style={{ fontSize: 11, color: "var(--ws-text-muted)" }}
                    >
                      Confidence: {formatConfidence(sig.confidence)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div
              style={{
                marginTop: 16,
                padding: "12px",
                borderRadius: 8,
                background: "rgba(59, 130, 246, 0.05)",
                border: "1px solid rgba(59, 130, 246, 0.1)",
                fontSize: 12,
                color: "var(--ws-text-muted)",
                lineHeight: 1.5,
              }}
            >
              Signals are pre-intelligence indicators detected before they
              develop into confirmed events.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
