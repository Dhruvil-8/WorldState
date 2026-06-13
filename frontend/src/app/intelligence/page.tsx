"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { fetchLatestIntelligence } from "@/lib/api";
import type { IntelligenceSnapshot } from "@/types";

type TopRisk = IntelligenceSnapshot["top_risks"][number];
type TopOpportunity = IntelligenceSnapshot["top_opportunities"][number];
type RegionWatch = IntelligenceSnapshot["regions_to_watch"][number];
type EmergingSignal = IntelligenceSnapshot["emerging_signals"][number];


export default function IntelligencePage() {
  const [intel, setIntel] = useState<IntelligenceSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchLatestIntelligence();
        if (data && data.title) {
          setIntel(data);
        } else {
          setIntel(null);
        }
      } catch (err) {
        console.warn("Failed to fetch intelligence briefing.", err);
        setIntel(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function getRiskLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case "critical": return "var(--ws-risk-critical)";
      case "high": return "var(--ws-risk-high)";
      case "elevated": return "var(--ws-risk-elevated)";
      default: return "var(--ws-risk-low)";
    }
  }

  function formatConfidence(confidence: number): string {
    const percent = confidence <= 1 ? confidence * 100 : confidence;
    return `${Math.round(percent)}%`;
  }

  return (
    <div>
      <Header />
      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {loading ? (
          <div style={{ padding: "120px 0", textAlign: "center", color: "var(--ws-text-muted)" }}>
            <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "var(--ws-accent)", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite", marginBottom: "12px" }} />
            <div>Generating intelligence snapshot...</div>
          </div>
        ) : !intel ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "var(--ws-text-muted)", border: "1px dashed var(--ws-border)", borderRadius: "14px" }}>
            <div>No intelligence snapshot has been generated yet. Run the global analyzer to synthesize executive briefings.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px" }}>
            
            {/* Left Column: Daily Executive Summary & Risks/Opportunities */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Daily Executive Briefing */}
              <div className="ws-card ws-glow-blue" style={{ padding: "28px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", borderBottom: "1px solid var(--ws-border)", paddingBottom: "18px", marginBottom: "18px" }}>
                  <div>
                    <span className="ws-badge" style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", color: "var(--ws-accent)", fontSize: "10px", marginBottom: "6px" }}>
                      Executive Intelligence Briefing
                    </span>
                    <h2 style={{ fontSize: "20px", fontWeight: 800 }}>{intel.title}</h2>
                  </div>
                  
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "10px", color: "var(--ws-text-muted)", textTransform: "uppercase" }}>Generated At</div>
                    <div className="ws-mono" style={{ fontSize: "12px", fontWeight: 500, color: "var(--ws-text-primary)", marginTop: "4px" }}>
                      {new Date(intel.generated_at).toLocaleDateString(undefined, { dateStyle: "long" })}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: "15px", color: "var(--ws-text-primary)", lineHeight: 1.7, letterSpacing: "0.01em" }}>
                  {intel.summary}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "24px", borderTop: "1px solid var(--ws-border)", paddingTop: "16px" }}>
                  <div style={{ fontSize: "11px", color: "var(--ws-text-muted)", textTransform: "uppercase" }}>Intelligence Integrity Score:</div>
                  <div className="ws-mono" style={{ fontSize: "14px", fontWeight: 700, color: "var(--ws-text-primary)" }}>{intel.confidence}%</div>
                  <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: `${intel.confidence}%`, height: "100%", background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" }} />
                  </div>
                </div>
              </div>

              {/* Two-Column split for Risks and Opportunities */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                
                {/* Strategic Risk Vectors */}
                <div className="ws-card">
                  <h3 style={{ fontSize: "15px", fontWeight: 700, borderBottom: "1px solid var(--ws-border)", paddingBottom: "12px", marginBottom: "16px", color: "var(--ws-text-primary)" }}>
                    Top Risk Vectors
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {intel.top_risks?.map((item: TopRisk, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 500 }}>
                          <span style={{ color: "var(--ws-text-secondary)", lineHeight: 1.4, marginRight: "8px" }}>{item.risk}</span>
                          <span className="ws-mono" style={{ color: "var(--ws-risk-high)", fontWeight: 700 }}>{item.score}</span>
                        </div>
                        <div style={{ height: "4px", background: "rgba(255,255,255,0.03)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ width: `${item.score}%`, height: "100%", background: "var(--ws-risk-high)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic Opportunity Vectors */}
                <div className="ws-card">
                  <h3 style={{ fontSize: "15px", fontWeight: 700, borderBottom: "1px solid var(--ws-border)", paddingBottom: "12px", marginBottom: "16px", color: "var(--ws-text-primary)" }}>
                    Top Opportunity Vectors
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {intel.top_opportunities?.map((item: TopOpportunity, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 500 }}>
                          <span style={{ color: "var(--ws-text-secondary)", lineHeight: 1.4, marginRight: "8px" }}>{item.opportunity}</span>
                          <span className="ws-mono" style={{ color: "var(--ws-risk-low)", fontWeight: 700 }}>{item.score}</span>
                        </div>
                        <div style={{ height: "4px", background: "rgba(255,255,255,0.03)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ width: `${item.score}%`, height: "100%", background: "var(--ws-risk-low)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Emerging Signals & Regions to Watch */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Regions to Watch */}
              <div className="ws-card">
                <h3 style={{ fontSize: "15px", fontWeight: 700, borderBottom: "1px solid var(--ws-border)", paddingBottom: "12px", marginBottom: "16px" }}>
                  Regions to Watch
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {intel.regions_to_watch?.map((item: RegionWatch, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.01)",
                        border: "1px solid var(--ws-border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ws-text-primary)" }}>{item.region}</span>
                      <span className="ws-badge" style={{
                        color: getRiskLevelColor(item.risk_level),
                        background: `${getRiskLevelColor(item.risk_level)}12`,
                        border: `1px solid ${getRiskLevelColor(item.risk_level)}25`,
                        fontSize: "9px"
                      }}>
                        {item.risk_level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emerging Signals */}
              <div className="ws-card">
                <h3 style={{ fontSize: "15px", fontWeight: 700, borderBottom: "1px solid var(--ws-border)", paddingBottom: "12px", marginBottom: "16px" }}>
                  Intelligence Signals
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {intel.emerging_signals?.map((sig: EmergingSignal, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <p style={{ fontSize: "12px", color: "var(--ws-text-secondary)", lineHeight: 1.5 }}>
                        {sig.signal}
                      </p>
                      <div className="ws-mono" style={{ fontSize: "10px", color: "var(--ws-text-muted)" }}>
                        Aggregate Signal Confidence: {formatConfidence(sig.confidence)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
