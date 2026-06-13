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
    title: "Coordinated technology export controls enacted between western states",
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
    title: "Critical port logistics network offline following coordinated intrusion",
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
    title: "Central bank maintains high base rate amid rising commodity indexes",
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
  { signal: "Cyber threat profile volatility rising across maritime transit zones", confidence: 68 },
  { signal: "Non-standard diplomatic coordination monitored in eastern trade channels", confidence: 55 },
  { signal: "Agricultural yield expectations reduced in strategic grain corridors", confidence: 62 },
  { signal: "Primary mineral supply chain redundancy initiatives accelerated", confidence: 71 },
];

function getSeverityColor(severity: number): string {
  if (severity >= 8) return "var(--ws-risk-critical)";
  if (severity >= 6) return "var(--ws-risk-high)";
  if (severity >= 4) return "var(--ws-risk-elevated)";
  return "var(--ws-risk-moderate)";
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    geopolitical: "GEOPOL",
    cyber: "CYBER",
    economic: "ECON",
    supply_chain: "SUPPLY",
    trade: "TRADE",
    commodity: "COMMOD",
    environment: "ENV",
    other: "OTHER",
  };
  return labels[category] || "MISC";
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
      <Header
        title="Operations Command Center"
        subtitle="Unified Telemetry Overview & Threat Registry Feed"
      />

      <div style={{ padding: "20px 24px" }} className="bg-terminal-grid min-h-[calc(100vh-69px)]">
        {usingFallback && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              color: "var(--ws-risk-elevated)",
              background: "rgba(234, 179, 8, 0.04)",
              border: "1px solid rgba(234, 179, 8, 0.2)",
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            [OFFLINE_NOTICE]: LIVE_DB_API_UNAVAILABLE // RENDERING_STABLE_BASELINE_REGISTRY_DATA
          </div>
        )}

        {/* Top Split: Global Stability Telemetry & Risk Index */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "350px 1fr",
            gap: 20,
            marginBottom: 20,
          }}
        >
          <WorldStateCard
            stability={worldState.global_stability}
            confidence={worldState.confidence}
          />

          <div className="ws-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
                borderBottom: "1px dashed var(--ws-border)",
                paddingBottom: "8px",
              }}
            >
              <h2
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "var(--ws-text-muted)",
                }}
              >
                // SYSTEM_RISK_SPECTRUM_INDEX
              </h2>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--ws-text-muted)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {loading ? "querying..." : `${risks.length}_METRIC_CHANNELS`}
              </span>
            </div>
            <div style={{ maxHeight: 270, overflowY: "auto", paddingRight: 4 }}>
              {risks.map((risk, i) => (
                <RiskGauge
                  key={risk.risk_type}
                  label={risk.risk_type}
                  score={risk.score}
                  trend={risk.trend}
                  confidence={risk.confidence}
                  delay={i * 30}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Split: Critical Threat Log & Ingestion Signals */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 400px",
            gap: 20,
          }}
        >
          {/* Critical Events Feed */}
          <div className="ws-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                borderBottom: "1px dashed var(--ws-border)",
                paddingBottom: "8px",
              }}
            >
              <h2
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "var(--ws-text-muted)",
                }}
              >
                // CRITICAL_THREAT_REGISTRY
              </h2>
              <span
                className="ws-badge"
                style={{
                  color: "var(--ws-risk-critical)",
                  background: "rgba(244, 63, 94, 0.05)",
                  border: "1px solid rgba(244, 63, 94, 0.2)",
                  fontSize: 10,
                }}
              >
                {events.length} ACTIVE_EVENTS
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {events.map((evt, i) => (
                <div
                  key={evt.id}
                  className="ws-animate-slide-in"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.01)",
                    border: "1px solid var(--ws-border)",
                    animationDelay: `${i * 40}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  {/* Category Pill */}
                  <span
                    className="ws-mono"
                    style={{
                      padding: "2px 6px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--ws-border)",
                      color: "var(--ws-text-secondary)",
                      fontSize: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {getCategoryLabel(evt.category)}
                  </span>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--ws-text-primary)",
                        lineHeight: 1.4,
                        marginBottom: 4,
                      }}
                    >
                      {evt.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "var(--ws-text-muted)",
                      }}
                    >
                      <span
                        style={{
                          color: getSeverityColor(evt.severity),
                          fontWeight: 700,
                        }}
                      >
                        SEV: {evt.severity.toFixed(1)}
                      </span>
                      <span>TIME: {formatRelativeTime(evt.first_seen_at)}</span>
                      <span>SOURCES: {evt.source_count}</span>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className="ws-badge"
                    style={{
                      color: evt.status === "active" ? "#10b981" : "#eab308",
                      background:
                        evt.status === "active"
                          ? "rgba(16, 185, 129, 0.05)"
                          : "rgba(234, 179, 8, 0.05)",
                      border: `1px solid ${
                        evt.status === "active"
                          ? "rgba(16, 185, 129, 0.2)"
                          : "rgba(234, 179, 8, 0.2)"
                      }`,
                      fontSize: 9,
                    }}
                  >
                    {evt.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Emerging Signals panel */}
          <div className="ws-card">
            <div
              style={{
                marginBottom: 16,
                borderBottom: "1px dashed var(--ws-border)",
                paddingBottom: "8px",
              }}
            >
              <h2
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "var(--ws-text-muted)",
                }}
              >
                // RAW_INGESTION_TICKER
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {signals.map((sig, i) => (
                <div
                  key={`${sig.signal}-${i}`}
                  className="ws-animate-fade-in"
                  style={{
                    paddingBottom: 10,
                    borderBottom: i < signals.length - 1 ? "1px solid var(--ws-border)" : "none",
                    animationDelay: `${i * 50}ms`,
                    animationFillMode: "backwards",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      marginTop: 6,
                      background: sig.confidence > 65 ? "var(--ws-risk-high)" : "var(--ws-text-muted)",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--ws-text-secondary)",
                        lineHeight: 1.4,
                        marginBottom: 3,
                      }}
                    >
                      {sig.signal}
                    </div>
                    <div
                      className="ws-mono"
                      style={{ fontSize: 10, color: "var(--ws-text-muted)" }}
                    >
                      CONFIDENCE: {sig.confidence}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 14,
                padding: 10,
                background: "rgba(255, 255, 255, 0.01)",
                border: "1px solid var(--ws-border)",
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                color: "var(--ws-text-muted)",
                lineHeight: 1.4,
              }}
            >
              // NOTE: INGESTION_SIGNALS ARE PRE-EXTRACTED STATE INDICATORS COLLECTED PRIOR TO THE FORMATION OF VERIFIED TIMELINES.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
