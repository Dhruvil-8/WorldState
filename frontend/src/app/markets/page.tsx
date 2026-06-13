"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { fetchRisks, fetchWorldState, fetchEntities, fetchEntityPriceHistory } from "@/lib/api";
import type { RiskScore, WorldState, Entity, AssetPriceHistory } from "@/types";

interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  category: "equity" | "commodity" | "currency" | "bond";
  price: string;
  change: string;
  changePercent: number;
  linkedRiskType: string;
  correlationStrength: number; // 0-100
  marketStatus: "stable" | "elevated" | "stressed" | "critical";
}


export default function MarketsPage() {
  const [risks, setRisks] = useState<RiskScore[]>([]);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [marketAssets, setMarketAssets] = useState<MarketAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Expanded panel states
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null);
  const [priceHistory, setPriceHistory] = useState<AssetPriceHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const [riskResponse, wsResponse, entResponse] = await Promise.all([
          fetchRisks(),
          fetchWorldState(),
          fetchEntities()
        ]);
        if (riskResponse && riskResponse.data) {
          setRisks(riskResponse.data);
        }
        if (wsResponse) {
          setWorldState(wsResponse);
        }
        
        if (entResponse && entResponse.data) {
          const filtered = entResponse.data.filter(
            (ent) => ent.entity_type === "commodity" || ent.entity_type === "currency" || ent.entity_type === "financial_asset"
          );
          
          const mapped: MarketAsset[] = filtered.map((ent) => {
            const meta = ent.metadata || {};
            let cat: MarketAsset["category"] = "commodity";
            if (ent.entity_type === "currency") cat = "currency";
            else if (ent.entity_type === "financial_asset") {
              if (ent.name.includes("Yield") || ent.name.includes("Treasury")) cat = "bond";
              else cat = "equity";
            }
            
            let riskType = "geopolitical";
            if (ent.name.includes("Oil") || ent.name.includes("Gas") || ent.name.includes("Hydrocarbon")) riskType = "energy";
            else if (ent.name.includes("Copper") || ent.name.includes("Lithium") || ent.name.includes("Rare Earths")) riskType = "supply_chain";
            else if (ent.name.includes("Semiconductor") || ent.name === "TSMC" || ent.name === "ASML" || ent.name === "NVIDIA") riskType = "technology";
            else if (
              ent.name.includes("S&P 500") ||
              ent.name.includes("Yield") ||
              ent.name.includes("Nifty 50") ||
              ent.name.includes("DAX") ||
              ent.name.includes("Nikkei 225") ||
              ent.name.includes("Hang Seng") ||
              ent.name.includes("FTSE 100") ||
              ent.name.includes("Ibovespa")
            ) riskType = "economic";
            else if (ent.name === "EUR / USD" || ent.name.includes("EUR")) riskType = "trade";
            else if (ent.name === "Bitcoin" || ent.name === "Ethereum" || ent.name === "US Dollar Index") riskType = "financial";

            const corr = ent.importance ? Math.min(95, Math.max(50, ent.importance)) : 75;

            return {
              id: ent.id,
              symbol: (meta.ticker as string) || ent.name.toUpperCase().substring(0, 5),
              name: ent.name,
              category: cat,
              price: (meta.price as string) || "$0.00",
              change: (meta.change as string) || "0.00",
              changePercent: typeof meta.change_percent === "number" ? meta.change_percent : 0.0,
              linkedRiskType: riskType,
              correlationStrength: corr,
              marketStatus: (meta.status as MarketAsset["marketStatus"]) || "stable"
            };
          });
          
          if (mapped.length > 0) {
            setMarketAssets(mapped);
          } else {
            setMarketAssets([]);
          }
        } else {
          setMarketAssets([]);
        }
      } catch (err) {
        console.warn("Failed to load intelligence scores for markets correlation.", err);
        setMarketAssets([]);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Fetch price history details
  useEffect(() => {
    if (!selectedAsset || !selectedAsset.id || selectedAsset.id.startsWith("mock-")) {
      setPriceHistory([]);
      return;
    }
    const assetId = selectedAsset.id;
    async function loadHistory() {
      setLoadingHistory(true);
      try {
        const res = await fetchEntityPriceHistory(assetId, 20);
        if (res && res.history) {
          // Sort ascending (oldest to newest) for chart
          const sorted = [...res.history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setPriceHistory(sorted);
        }
      } catch (err) {
        console.warn("Failed to load price history", err);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, [selectedAsset]);

  function getRiskScore(riskType: string): number {
    const found = risks.find((r) => r.risk_type.toLowerCase() === riskType.toLowerCase());
    return found ? found.score : 50;
  }

  function getRiskTrend(riskType: string): string {
    const found = risks.find((r) => r.risk_type.toLowerCase() === riskType.toLowerCase());
    return found ? found.trend : "stable";
  }

  function getStatusColor(status: MarketAsset["marketStatus"]): string {
    switch (status) {
      case "critical":
        return "var(--ws-risk-critical)";
      case "stressed":
        return "var(--ws-risk-high)";
      case "elevated":
        return "var(--ws-risk-elevated)";
      default:
        return "var(--ws-risk-low)";
    }
  }

  const formatValue = (val: number) => {
    if (!selectedAsset) return val.toFixed(2);
    if (selectedAsset.category === "bond") {
      return `${val.toFixed(3)}%`;
    }
    if (selectedAsset.name === "EUR / USD") {
      return val.toFixed(4);
    }
    if (selectedAsset.name.includes("Index")) {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderSparkline = () => {
    if (priceHistory.length < 2) {
      return (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ws-text-muted)", fontSize: "12px" }}>
          Insufficient history points compiled yet (updates occur continuously).
        </div>
      );
    }
    const prices = priceHistory.map((h) => h.price);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = max - min || 1;
    
    const width = 340;
    const height = 140;
    const padding = 15;
    
    const points = priceHistory.map((h, index) => {
      const x = padding + (index * (width - 2 * padding)) / (priceHistory.length - 1);
      const y = height - padding - ((h.price - min) * (height - 2 * padding)) / range;
      return `${x},${y}`;
    });
    
    const pathData = `M ${points.join(" L ")}`;
    const fillPathData = `${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;
    
    const isUp = selectedAsset?.changePercent !== undefined && selectedAsset.changePercent >= 0;
    const strokeColor = isUp ? "#22c55e" : "#ef4444";
    const gradientId = `chart-gradient-${selectedAsset?.symbol}`;
    
    return (
      <div style={{ position: "relative", width: "100%", height: `${height}px`, background: "rgba(255,255,255,0.01)", border: "1px solid var(--ws-border)", borderRadius: "10px", padding: "8px", marginTop: "8px" }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={fillPathData} fill={`url(#${gradientId})`} />
          <path d={pathData} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={points[points.length - 1].split(",")[0]} cy={points[points.length - 1].split(",")[1]} r="3.5" fill={strokeColor} />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--ws-text-muted)", marginTop: "4px", padding: "0 4px" }}>
          <span>Min: {formatValue(min)}</span>
          <span>Max: {formatValue(max)}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Header />
      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Core Correlation Matrix Overview */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          
          <div className="ws-card">
            <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Financial Assets Correlation Principle</h2>
            <p style={{ fontSize: "13px", color: "var(--ws-text-secondary)", lineHeight: 1.6 }}>
              WorldState correlates global risk states with major financial indexes. Geopolitical and supply chain disruptions
              influence underlying commodity pricing, currency baskets, and equity valuations downstream. Below are registered
              market assets aligned to their primary real-time intelligence risk vectors.
            </p>
            <div style={{ marginTop: "16px", display: "flex", gap: "16px" }}>
              <div style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.01)", border: "1px solid var(--ws-border)" }}>
                <div style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Global Stability Score</div>
                <div className="ws-mono" style={{ fontSize: "24px", fontWeight: 800, marginTop: "4px", color: "var(--ws-accent)" }}>
                  {worldState ? worldState.global_stability : 74}
                </div>
              </div>
              <div style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.01)", border: "1px solid var(--ws-border)" }}>
                <div style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Evaluation Confidence</div>
                <div className="ws-mono" style={{ fontSize: "24px", fontWeight: 800, marginTop: "4px", color: "var(--ws-text-primary)" }}>
                  {worldState ? `${worldState.confidence}%` : "86%"}
                </div>
              </div>
            </div>
          </div>

          <div className="ws-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Market Intelligence Signal Status</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                  <span style={{ color: "var(--ws-text-secondary)" }}>System Risk Propagation Index</span>
                  <span className="ws-badge" style={{
                    background: (worldState?.metadata?.risk_propagation_index || 0) > 50 ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
                    border: (worldState?.metadata?.risk_propagation_index || 0) > 50 ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(34, 197, 94, 0.2)",
                    color: (worldState?.metadata?.risk_propagation_index || 0) > 50 ? "#ef4444" : "#22c55e",
                    fontSize: "11px"
                  }}>
                    {(worldState?.metadata?.risk_propagation_index || 25)} / 100
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                  <span style={{ color: "var(--ws-text-secondary)" }}>Narrative Stress Threshold</span>
                  <span className="ws-mono" style={{ color: "var(--ws-text-primary)", fontWeight: 600 }}>
                    {(worldState?.metadata?.narrative_stress_index || 30.0).toFixed(1)} / 100
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                  <span style={{ color: "var(--ws-text-secondary)" }}>Market Escalation Warnings</span>
                  <span className="ws-mono" style={{ color: "var(--ws-text-muted)" }}>None (Within Normal Variance)</span>
                </div>
              </div>
            </div>
            
            <div style={{ fontSize: "11px", color: "var(--ws-text-muted)", background: "rgba(255,255,255,0.01)", border: "1px solid var(--ws-border)", padding: "10px", borderRadius: "8px", marginTop: "14px" }}>
              Signals are evaluated continuously by correlating raw event aggregates to downstream asset class sensitivities.
            </div>
          </div>

        </div>

        {/* Main Split Layout */}
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
          
          {/* Left: Assets Grid */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Correlated Asset Portfolios</h2>
            
            {loading ? (
              <div style={{ padding: "80px 0", textAlign: "center", color: "var(--ws-text-muted)" }}>
                <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "var(--ws-accent)", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite", marginBottom: "12px" }} />
                <div>Analyzing Asset Correlations...</div>
              </div>
            ) : marketAssets.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ws-text-muted)", border: "1px dashed var(--ws-border)", borderRadius: "14px", width: "100%" }}>
                No active market assets tracked. Run the background pricing engine to populate real-time indicators.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                {marketAssets.map((asset) => {
                  const riskScore = getRiskScore(asset.linkedRiskType);
                  const riskTrend = getRiskTrend(asset.linkedRiskType);
                  const priceColor = asset.changePercent >= 0 ? "#22c55e" : "#ef4444";
                  const isSelected = selectedAsset?.id === asset.id;
                  
                  return (
                    <div
                      key={asset.id + "-" + asset.symbol}
                      onClick={() => setSelectedAsset(asset)}
                      style={{
                        padding: "20px",
                        borderRadius: "14px",
                        background: "rgba(255, 255, 255, 0.01)",
                        border: isSelected ? "1px solid var(--ws-accent)" : "1px solid var(--ws-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      className="ws-card-interactive"
                    >
                      {/* Header: Name + Symbol */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <span className="ws-mono" style={{ fontSize: "11px", color: "var(--ws-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                            {asset.category}
                          </span>
                          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ws-text-primary)", marginTop: "2px" }}>{asset.name}</h3>
                          <span className="ws-mono" style={{ fontSize: "12px", color: "var(--ws-text-muted)" }}>{asset.symbol}</span>
                        </div>
                        <span
                          className="ws-badge"
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            color: getStatusColor(asset.marketStatus),
                            background: `${getStatusColor(asset.marketStatus)}10`,
                            border: `1px solid ${getStatusColor(asset.marketStatus)}30`
                          }}
                        >
                          {asset.marketStatus}
                        </span>
                      </div>

                      {/* Price and Change */}
                      <div style={{ borderTop: "1px solid var(--ws-border)", borderBottom: "1px solid var(--ws-border)", padding: "12px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="ws-mono" style={{ fontSize: "20px", fontWeight: 700, color: "var(--ws-text-primary)" }}>{asset.price}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={priceColor} strokeWidth="3" style={{ transform: asset.changePercent >= 0 ? "rotate(0deg)" : "rotate(180deg)" }}>
                            <line x1="12" y1="19" x2="12" y2="5"></line>
                            <polyline points="5 12 12 5 19 12"></polyline>
                          </svg>
                          <span className="ws-mono" style={{ color: priceColor, fontWeight: 600, fontSize: "13px" }}>
                            {asset.change} ({asset.changePercent >= 0 ? "+" : ""}{asset.changePercent}%)
                          </span>
                        </div>
                      </div>

                      {/* Risk Linkages */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                          <span style={{ color: "var(--ws-text-muted)", textTransform: "capitalize" }}>Primary Linked Vector</span>
                          <span style={{ color: "var(--ws-text-primary)", fontWeight: 600, textTransform: "capitalize" }}>
                            {asset.linkedRiskType.replace(/_/g, " ")} Risk
                          </span>
                        </div>
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                          <span style={{ color: "var(--ws-text-muted)" }}>Current Vector Risk Level</span>
                          <span className="ws-mono" style={{ color: riskScore >= 75 ? "var(--ws-risk-critical)" : riskScore >= 60 ? "var(--ws-risk-high)" : riskScore >= 40 ? "var(--ws-risk-elevated)" : "var(--ws-risk-low)", fontWeight: 700 }}>
                            {riskScore} ({riskTrend})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Asset Detail History Sidebar */}
          {selectedAsset && (
            <div
              className="ws-card"
              style={{
                width: "380px",
                flexShrink: 0,
                position: "sticky",
                top: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                animation: "slideIn 0.3s ease-out"
              }}
            >
              {/* Sidebar Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span className="ws-mono" style={{ fontSize: "10px", color: "var(--ws-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    {selectedAsset.category} Analysis
                  </span>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, marginTop: "2px" }}>{selectedAsset.name}</h3>
                  <span className="ws-mono" style={{ fontSize: "12px", color: "var(--ws-text-muted)" }}>{selectedAsset.symbol}</span>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--ws-text-secondary)",
                    cursor: "pointer",
                    fontSize: "20px",
                    lineHeight: "20px",
                    padding: "4px"
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Spot Price Card */}
              <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--ws-border)", borderRadius: "10px", padding: "16px" }}>
                <div style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Latest Evaluated Price</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
                  <span className="ws-mono" style={{ fontSize: "24px", fontWeight: 800 }}>{selectedAsset.price}</span>
                  <span className="ws-mono" style={{
                    color: selectedAsset.changePercent >= 0 ? "#22c55e" : "#ef4444",
                    fontWeight: 600,
                    fontSize: "14px"
                  }}>
                    {selectedAsset.change} ({selectedAsset.changePercent >= 0 ? "+" : ""}{selectedAsset.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Sparkline Chart */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--ws-text-secondary)", marginBottom: "6px" }}>Price Analytics Trendline</h4>
                {loadingHistory ? (
                  <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ws-text-muted)", fontSize: "12px" }}>
                    Loading historical pricing...
                  </div>
                ) : (
                  renderSparkline()
                )}
              </div>

              {/* Detailed History Points List */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--ws-text-secondary)", marginBottom: "8px" }}>Historical Price Logs</h4>
                {loadingHistory ? (
                  <div style={{ color: "var(--ws-text-muted)", fontSize: "12px" }}>Querying history logs...</div>
                ) : priceHistory.length === 0 ? (
                  <div style={{ color: "var(--ws-text-muted)", fontSize: "12px" }}>No historical data logs recorded yet.</div>
                ) : (
                  <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid var(--ws-border)", borderRadius: "8px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.02)", textAlign: "left", borderBottom: "1px solid var(--ws-border)" }}>
                          <th style={{ padding: "6px 10px", color: "var(--ws-text-muted)" }}>Time (UTC)</th>
                          <th style={{ padding: "6px 10px", color: "var(--ws-text-muted)" }}>Price</th>
                          <th style={{ padding: "6px 10px", color: "var(--ws-text-muted)" }}>Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...priceHistory].reverse().slice(0, 5).map((h) => {
                          const isUp = h.change >= 0;
                          const formattedPrice = formatValue(h.price);
                          return (
                            <tr key={h.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                              <td className="ws-mono" style={{ padding: "6px 10px", color: "var(--ws-text-secondary)" }}>
                                {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </td>
                              <td className="ws-mono" style={{ padding: "6px 10px", fontWeight: 600 }}>{formattedPrice}</td>
                              <td className="ws-mono" style={{ padding: "6px 10px", color: isUp ? "#22c55e" : "#ef4444" }}>
                                {isUp ? "+" : ""}{h.change.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Correlation Sensitivity Info */}
              <div style={{ fontSize: "11px", color: "var(--ws-text-muted)", background: "rgba(255,255,255,0.01)", border: "1px solid var(--ws-border)", padding: "12px", borderRadius: "8px" }}>
                <span style={{ fontWeight: 600, color: "var(--ws-text-secondary)" }}>Sensitivity Profile: </span>
                This asset class has a high sensitivity coefficient ({selectedAsset.correlationStrength}%) to {selectedAsset.linkedRiskType.replace(/_/g, " ")} vector alerts. If stability index factors decline, pricing indices automatically adjust.
              </div>

            </div>
          )}

        </div>

      </div>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .ws-card-interactive:hover {
          background: rgba(255, 255, 255, 0.03) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
      `}</style>
    </div>
  );
}
