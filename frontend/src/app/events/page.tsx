"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { fetchEvents } from "@/lib/api";
import type { WorldEvent, EventCategory } from "@/types";

// Rich fallback stub data for events
const stubEvents: WorldEvent[] = [
  {
    id: "evt_1",
    event_type: "sanction",
    title: "Coordinated Technology Export Controls Enacted",
    description: "A coalition of major western economies announced a sweeping update to semiconductor export restrictions, targeting advanced photolithography machinery and next-gen lithography components.",
    severity: 8.4,
    confidence: 0.92,
    source_count: 15,
    status: "active",
    category: "geopolitical",
    first_seen_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    last_updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: "evt_2",
    event_type: "cyber_attack",
    title: "Critical Port Logistics Systems Hit by Ransomware",
    description: "Two major European shipping terminals suffered massive delays as automated container sorting software went offline following a cyber-intrusion linked to advanced persistent threats.",
    severity: 7.9,
    confidence: 0.81,
    source_count: 9,
    status: "verified",
    category: "cyber",
    first_seen_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    last_updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "evt_3",
    event_type: "interest_rate_change",
    title: "Federal Reserve Holds Benchmark Rate, Hints at 50bps Cut",
    description: "The Federal Open Market Committee voted unanimously to keep the federal funds rate stable while expressing growing confidence in soft-landing trajectories for inflation indicators.",
    severity: 5.8,
    confidence: 0.98,
    source_count: 24,
    status: "active",
    category: "economic",
    first_seen_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    last_updated_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  },
  {
    id: "evt_4",
    event_type: "port_congestion",
    title: "Panama Canal Transits Reduced due to Severe Drought",
    description: "The Canal Authority announced a further reduction in daily booking slots for Neo-Panamax vessels, forcing shippers to seek alternate routing around the Cape of Good Hope.",
    severity: 6.7,
    confidence: 0.95,
    source_count: 18,
    status: "monitoring",
    category: "supply_chain",
    first_seen_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    last_updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: "evt_5",
    event_type: "oil_shock",
    title: "Crude Spikes 4% Following Red Sea Drone Incidents",
    description: "Brent Crude futures crossed $84 per barrel as multiple commercial vessels reported close-proximity drone strikes along key maritime lanes, triggering immediate maritime premium hikes.",
    severity: 7.2,
    confidence: 0.89,
    source_count: 11,
    status: "active",
    category: "commodity",
    first_seen_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    last_updated_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: "evt_6",
    event_type: "tariff",
    title: "New 15% Bilateral Carbon Border Levies Announced",
    description: "A major trading bloc introduced the first active phase of its Carbon Border Adjustment Mechanism, placing import tariffs on high-carbon steel, aluminum, and electricity from regions without matching emissions limits.",
    severity: 6.2,
    confidence: 0.90,
    source_count: 13,
    status: "active",
    category: "trade",
    first_seen_at: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    last_updated_at: new Date(Date.now() - 15 * 3600 * 1000).toISOString(),
  },
  {
    id: "evt_7",
    event_type: "flood",
    title: "Billion-Dollar Floods Halt Industrial Belt Operations",
    description: "Catastrophic monsoon rainfall led to a collapse of key drainage channels, completely flooding industrial districts and disrupting automotive and electronics parts manufacturing facilities.",
    severity: 8.1,
    confidence: 0.94,
    source_count: 22,
    status: "verified",
    category: "environment",
    first_seen_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    last_updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  }
];

const categories: { key: EventCategory | "all"; label: string; icon: string }[] = [
  { key: "all", label: "All Events", icon: "▪" },
  { key: "geopolitical", label: "Geopolitical", icon: "●" },
  { key: "economic", label: "Economic", icon: "■" },
  { key: "trade", label: "Trade", icon: "▼" },
  { key: "supply_chain", label: "Supply Chain", icon: "▲" },
  { key: "commodity", label: "Commodity", icon: "⬢" },
  { key: "cyber", label: "Cyber", icon: "◆" },
  { key: "environment", label: "Environment", icon: "◆" },
];

export default function EventsPage() {
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<WorldEvent | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchEvents(50);
        if (response && response.data && response.data.length > 0) {
          setEvents(response.data);
        } else {
          setEvents(stubEvents);
        }
      } catch (err) {
        console.warn("Failed to fetch events from backend, using stub data instead.", err);
        setEvents(stubEvents);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredEvents = events.filter((evt) => {
    const matchesCategory = selectedCategory === "all" || evt.category === selectedCategory;
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.description && evt.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      evt.event_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function getSeverityLabel(severity: number): { text: string; color: string } {
    if (severity >= 8.0) return { text: "Critical", color: "var(--ws-risk-critical)" };
    if (severity >= 6.5) return { text: "High", color: "var(--ws-risk-high)" };
    if (severity >= 5.0) return { text: "Elevated", color: "var(--ws-risk-elevated)" };
    if (severity >= 3.0) return { text: "Moderate", color: "var(--ws-risk-moderate)" };
    return { text: "Low", color: "var(--ws-risk-low)" };
  }

  function getCategoryIcon(cat: EventCategory): string {
    const match = categories.find((c) => c.key === cat);
    return match ? match.icon : "▪";
  }

  return (
    <div>
      <Header title="Critical Threat Registry" subtitle="Operational News Events Feed & Threat Timelines" />
      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Top Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center" }}>
          {/* Navigation/Filters */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: selectedCategory === cat.key ? "1px solid var(--ws-accent)" : "1px solid var(--ws-border)",
                  background: selectedCategory === cat.key ? "var(--ws-accent-glow)" : "rgba(255, 255, 255, 0.02)",
                  color: selectedCategory === cat.key ? "var(--ws-text-primary)" : "var(--ws-text-secondary)",
                  fontSize: "13px",
                  fontWeight: selectedCategory === cat.key ? 600 : 400,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                }}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", opacity: 0.4, fontFamily: "monospace", fontSize: "10px" }}>[SRCH]</span>
            <input
              type="text"
              placeholder="Search events, sectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 55px",
                borderRadius: "12px",
                border: "1px solid var(--ws-border)",
                background: "rgba(255, 255, 255, 0.02)",
                color: "var(--ws-text-primary)",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--ws-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--ws-border)")}
            />
          </div>
        </div>

        {/* Content Layout */}
        <div style={{ display: "grid", gridTemplateColumns: selectedEvent ? "1fr 400px" : "1fr", gap: "24px", transition: "all 0.3s ease" }}>
          
          {/* Main Feed */}
          <div className="ws-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--ws-border)", paddingBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700 }}>World Intelligence Feed</h2>
              <span className="ws-mono" style={{ fontSize: "13px", color: "var(--ws-text-muted)" }}>
                Showing {filteredEvents.length} of {events.length} events
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "80px 0", textAlign: "center", color: "var(--ws-text-muted)" }}>
                <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "var(--ws-accent)", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite", marginBottom: "12px" }} />
                <div>Analyzing incoming signals...</div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div style={{ padding: "80px 0", textAlign: "center", color: "var(--ws-text-muted)" }}>
                <span style={{ fontSize: "12px", display: "block", marginBottom: "12px", fontFamily: "monospace" }}>[NO_RECORDS_FOUND]</span>
                <div>No events matched your filters. Try adjusting search queries.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredEvents.map((evt, i) => {
                  const sevInfo = getSeverityLabel(evt.severity);
                  const isSelected = selectedEvent?.id === evt.id;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="ws-animate-slide-in"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "16px",
                        borderRadius: "14px",
                        background: isSelected ? "rgba(59, 130, 246, 0.04)" : "rgba(255, 255, 255, 0.01)",
                        border: isSelected ? "1px solid var(--ws-accent)" : "1px solid var(--ws-border)",
                        cursor: "pointer",
                        animationDelay: `${i * 50}ms`,
                        animationFillMode: "backwards",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
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
                      <span style={{ fontSize: "24px" }}>{getCategoryIcon(evt.category)}</span>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 600, fontSize: "15px", color: "var(--ws-text-primary)" }}>{evt.title}</span>
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--ws-text-secondary)", lineHeight: 1.4, marginBottom: "8px", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {evt.description}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--ws-text-muted)" }}>
                          <span className="ws-badge" style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--ws-border)", textTransform: "capitalize", fontSize: "11px", color: "var(--ws-text-secondary)" }}>
                            {evt.category}
                          </span>
                          <span className="ws-badge" style={{ color: sevInfo.color, background: `${sevInfo.color}15`, border: `1px solid ${sevInfo.color}25`, fontSize: "11px" }}>
                            SEV {evt.severity}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            Time: {new Date(evt.first_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span>Sources: {evt.source_count} outlets</span>
                        </div>
                      </div>

                      <span className="ws-badge" style={{
                        color: evt.status === "active" ? "#22c55e" : "#eab308",
                        background: evt.status === "active" ? "rgba(34, 197, 94, 0.1)" : "rgba(234, 179, 8, 0.1)",
                        border: evt.status === "active" ? "1px solid rgba(34, 197, 94, 0.2)" : "1px solid rgba(234, 179, 8, 0.2)",
                        fontSize: "10px",
                      }}>
                        {evt.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Inspector Sidebar */}
          {selectedEvent && (
            <div className="ws-card ws-animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px", height: "fit-content", position: "sticky", top: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--ws-border)", paddingBottom: "14px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Event Inspector</h3>
                <button onClick={() => setSelectedEvent(null)} style={{ background: "transparent", border: "none", color: "var(--ws-text-muted)", cursor: "pointer", fontSize: "18px" }}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "36px" }}>{getCategoryIcon(selectedEvent.category)}</span>
                  <div>
                    <span className="ws-badge" style={{ textTransform: "capitalize", background: "rgba(255,255,255,0.03)", border: "1px solid var(--ws-border)", marginBottom: "4px", fontSize: "11px" }}>
                      {selectedEvent.category}
                    </span>
                    <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ws-text-primary)", lineHeight: 1.3 }}>{selectedEvent.title}</h4>
                  </div>
                </div>

                <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--ws-border)" }}>
                  <div style={{ fontSize: "12px", color: "var(--ws-text-muted)", marginBottom: "4px" }}>Extracted Intelligence Briefing</div>
                  <p style={{ fontSize: "13px", color: "var(--ws-text-secondary)", lineHeight: 1.5 }}>{selectedEvent.description}</p>
                </div>

                {/* Grid metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.01)", border: "1px solid var(--ws-border)" }}>
                    <div style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Impact Severity</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: getSeverityLabel(selectedEvent.severity).color, marginTop: "4px" }}>
                      {selectedEvent.severity} <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--ws-text-secondary)" }}>/ 10</span>
                    </div>
                  </div>
                  
                  <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.01)", border: "1px solid var(--ws-border)" }}>
                    <div style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Engine Confidence</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--ws-text-primary)", marginTop: "4px" }}>
                      {Math.round(selectedEvent.confidence * 100)}%
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--ws-border)", paddingTop: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ws-text-muted)" }}>Event Status:</span>
                    <span style={{ fontWeight: 600, color: selectedEvent.status === "active" ? "#22c55e" : "#eab308", textTransform: "uppercase" }}>{selectedEvent.status}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ws-text-muted)" }}>First Detected:</span>
                    <span className="ws-mono">{new Date(selectedEvent.first_seen_at).toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ws-text-muted)" }}>Sources Aggregated:</span>
                    <span>{selectedEvent.source_count} trusted news outlets</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--ws-text-muted)" }}>System ID:</span>
                    <span className="ws-mono" style={{ fontSize: "10px" }}>{selectedEvent.id}</span>
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
