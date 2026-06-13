"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import RiskGauge from "@/components/RiskGauge";
import { fetchRisks } from "@/lib/api";
import type { RiskScore, RiskTrend } from "@/types";

// Stub data with reasoning and contributing elements

export default function RisksPage() {
  const [risks, setRisks] = useState<RiskScore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRisk, setSelectedRisk] = useState<RiskScore | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchRisks();
        if (response && response.data && response.data.length > 0) {
          setRisks(response.data);
        } else {
          setRisks([]);
        }
      } catch (err) {
        console.warn("Failed to fetch risks from backend.", err);
        setRisks([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function getRiskSeverityName(score: number): { text: string; color: string } {
    if (score >= 80) return { text: "Critical Risk", color: "var(--ws-risk-critical)" };
    if (score >= 65) return { text: "High Risk", color: "var(--ws-risk-high)" };
    if (score >= 50) return { text: "Elevated Risk", color: "var(--ws-risk-elevated)" };
    if (score >= 35) return { text: "Moderate Risk", color: "var(--ws-risk-moderate)" };
    return { text: "Low Risk", color: "var(--ws-risk-low)" };
  }

  function getTrendBadge(trend: RiskTrend): { text: string; bg: string; color: string; arrow: string } {
    switch (trend) {
      case "rising":
        return { text: "Rising", bg: "rgba(239, 68, 68, 0.1)", color: "var(--ws-risk-critical)", arrow: "↗" };
      case "falling":
        return { text: "Falling", bg: "rgba(34, 197, 94, 0.1)", color: "var(--ws-risk-moderate)", arrow: "↘" };
      case "volatile":
        return { text: "Volatile", bg: "rgba(168, 85, 247, 0.1)", color: "var(--ws-trend-volatile)", arrow: "⇅" };
      default:
        return { text: "Stable", bg: "rgba(148, 163, 184, 0.1)", color: "var(--ws-text-secondary)", arrow: "→" };
    }
  }

  return (
    <div>
      <Header />
      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Page summary intro */}
        <div className="ws-card ws-glow-blue" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "28px" }}>
          <div style={{ flex: 1, minWidth: "280px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--ws-text-primary)", marginBottom: "8px" }}>System Risk Matrix</h2>
            <p style={{ fontSize: "14px", color: "var(--ws-text-secondary)", lineHeight: 1.5, maxWidth: "720px" }}>
              WorldState continuously tracks, registers, and analyzes planetary-scale datasets to compile risk profiles across ten core categories. Metrics represent aggregate disruption index potential in real time.
            </p>
          </div>
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "var(--ws-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Average Global Risk</div>
              <div className="ws-mono" style={{ fontSize: "28px", fontWeight: 900, color: "var(--ws-text-primary)" }}>
                {loading ? "..." : Math.round(risks.reduce((acc, curr) => acc + curr.score, 0) / risks.length) || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div style={{ display: "grid", gridTemplateColumns: selectedRisk ? "1fr 440px" : "1fr", gap: "24px", transition: "all 0.3s ease" }}>
          
          {/* Main Risk List */}
          <div className="ws-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ borderBottom: "1px solid var(--ws-border)", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Index Disruption Potential</h3>
            </div>

            {loading ? (
              <div style={{ padding: "80px 0", textAlign: "center", color: "var(--ws-text-muted)" }}>
                <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "var(--ws-accent)", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite", marginBottom: "12px" }} />
                <div>Computing risk parameters...</div>
              </div>
            ) : risks.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ws-text-muted)", border: "1px dashed var(--ws-border)", borderRadius: "14px" }}>
                No risk scores compiled yet. Run the global analyzer to evaluate category indexes.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {risks.map((risk, i) => {
                  const isSelected = selectedRisk?.risk_type === risk.risk_type;
                  const sevInfo = getRiskSeverityName(risk.score);
                  const trendInfo = getTrendBadge(risk.trend);
                  return (
                    <div
                      key={risk.risk_type}
                      onClick={() => setSelectedRisk(risk)}
                      className="ws-animate-fade-in"
                      style={{
                        padding: "20px",
                        borderRadius: "14px",
                        background: isSelected ? "rgba(59, 130, 246, 0.04)" : "rgba(255, 255, 255, 0.01)",
                        border: isSelected ? "1px solid var(--ws-accent)" : "1px solid var(--ws-border)",
                        cursor: "pointer",
                        animationDelay: `${i * 40}ms`,
                        animationFillMode: "backwards",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)";
                          e.currentTarget.style.borderColor = "var(--ws-border)";
                        }
                      }}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontWeight: 700, fontSize: "16px", textTransform: "capitalize", color: "var(--ws-text-primary)" }}>
                          {risk.risk_type.replace(/_/g, " ")} Risk
                        </span>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span className="ws-badge" style={{ color: trendInfo.color, background: trendInfo.bg, border: `1px solid ${trendInfo.color}15`, fontSize: "10px" }}>
                            {trendInfo.arrow} {trendInfo.text}
                          </span>
                          <span className="ws-badge" style={{ color: sevInfo.color, background: `${sevInfo.color}15`, border: `1px solid ${sevInfo.color}25`, fontSize: "10px" }}>
                            {sevInfo.text}
                          </span>
                        </div>
                      </div>

                      {/* Score slider indicator */}
                      <RiskGauge
                        label=""
                        score={risk.score}
                        trend={risk.trend}
                        confidence={risk.confidence}
                      />

                      {risk.reasoning && (
                        <p style={{ fontSize: "12px", color: "var(--ws-text-secondary)", lineHeight: 1.4, marginTop: "4px", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {risk.reasoning}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Inspector Sidebar */}
          {selectedRisk && (
            <div className="ws-card ws-animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px", height: "fit-content", position: "sticky", top: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--ws-border)", paddingBottom: "14px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, textTransform: "capitalize" }}>{selectedRisk.risk_type.replace(/_/g, " ")} Analysis</h3>
                <button onClick={() => setSelectedRisk(null)} style={{ background: "transparent", border: "none", color: "var(--ws-text-muted)", cursor: "pointer", fontSize: "18px" }}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                
                {/* Scoring breakdown metrics */}
                <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--ws-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--ws-text-muted)", textTransform: "uppercase" }}>Index Score</div>
                    <div className="ws-mono" style={{ fontSize: "28px", fontWeight: 900, color: getRiskSeverityName(selectedRisk.score).color, marginTop: "4px" }}>
                      {selectedRisk.score}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "var(--ws-text-muted)", textTransform: "uppercase" }}>Trend Vector</div>
                    <span className="ws-badge" style={{
                      color: getTrendBadge(selectedRisk.trend).color,
                      background: getTrendBadge(selectedRisk.trend).bg,
                      border: `1px solid ${getTrendBadge(selectedRisk.trend).color}25`,
                      fontSize: "11px",
                      marginTop: "6px"
                    }}>
                      {getTrendBadge(selectedRisk.trend).arrow} {getTrendBadge(selectedRisk.trend).text}
                    </span>
                  </div>
                </div>

                {/* Grid metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.01)", border: "1px solid var(--ws-border)" }}>
                    <div style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Confidence Interval</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--ws-text-primary)", marginTop: "4px" }}>
                      {selectedRisk.confidence}% <span style={{ fontSize: "10px", color: "var(--ws-text-muted)", fontWeight: 400 }}>High</span>
                    </div>
                  </div>
                  
                  <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.01)", border: "1px solid var(--ws-border)" }}>
                    <div style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Measured State</div>
                    <div className="ws-mono" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ws-text-primary)", marginTop: "6px" }}>
                      Live Tracking
                    </div>
                  </div>
                </div>

                {/* Analytical Paragraph */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ws-text-muted)", textTransform: "uppercase" }}>Qualitative Briefing</span>
                  <p style={{ fontSize: "13px", color: "var(--ws-text-secondary)", lineHeight: 1.6, padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--ws-border)" }}>
                    {selectedRisk.reasoning}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--ws-border)", paddingTop: "14px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ws-text-muted)", textTransform: "uppercase" }}>System Advisory note</span>
                  <div style={{ fontSize: "12px", color: "var(--ws-text-muted)", lineHeight: 1.5 }}>
                    Risk indicators are synthesized from multiple event impact matrices. Changes represent direct mathematical shifts in structural dependencies, export/import strengths, and geopolitical oppositions.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
