"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { fetchEvents } from "@/lib/api";
import type { WorldEvent, EventCategory } from "@/types";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

// Public GeoJSON world map URL
const WORLD_GEOJSON_URL = "https://raw.githubusercontent.com/apache/echarts/master/test/data/map/json/world.json";

const categoryColors: Record<EventCategory, string> = {
  geopolitical: "#ef4444", // Red
  economic: "#3b82f6",     // Blue
  trade: "#10b981",        // Green
  supply_chain: "#f59e0b", // Yellow/Orange
  commodity: "#8b5cf6",    // Purple
  environment: "#06b6d4",  // Cyan
  cyber: "#ec4899",        // Pink
  other: "#64748b",        // Gray
};

export default function MapPage() {
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mapGeoJson, setMapGeoJson] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "all">("all");
  const [minSeverity, setMinSeverity] = useState<number>(0);
  const [selectedEvent, setSelectedEvent] = useState<WorldEvent | null>(null);
  
  const echartsRef = useRef<any>(null);

  // 1. Fetch GeoJSON world map
  useEffect(() => {
    async function loadMapGeoJson() {
      try {
        const res = await fetch(WORLD_GEOJSON_URL);
        const data = await res.json();
        echarts.registerMap("world", data);
        setMapGeoJson(data);
      } catch (err) {
        console.error("Failed to load world GeoJSON:", err);
      }
    }
    loadMapGeoJson();
  }, []);

  // 2. Fetch events from Go backend
  useEffect(() => {
    async function loadEventsData() {
      try {
        const res = await fetchEvents(200); // load up to 200 events
        if (res && res.data) {
          setEvents(res.data);
        }
      } catch (err) {
        console.warn("Failed to fetch events for map:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEventsData();
  }, []);

  // Filter events by selected category and minimum severity
  const filteredEvents = events.filter((evt) => {
    const matchesCategory = selectedCategory === "all" || evt.category === selectedCategory;
    const matchesSeverity = evt.severity >= minSeverity;
    
    // Check if location has valid latitude and longitude
    const loc = evt.location as any;
    const hasCoordinates = loc && typeof loc.latitude === "number" && typeof loc.longitude === "number";
    
    return matchesCategory && matchesSeverity && hasCoordinates;
  });

  // Format events as ECharts scatter dataset
  const scatterData = filteredEvents.map((evt) => {
    const loc = evt.location as any;
    return {
      name: evt.title,
      value: [loc.longitude, loc.latitude, evt.severity], // [lng, lat, severity]
      eventData: evt,
    };
  });

  // Configure ECharts Option
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      borderColor: "var(--ws-border)",
      borderWidth: 1,
      textStyle: {
        color: "var(--ws-text-primary)",
        fontSize: 12,
        fontFamily: "var(--font-geist-mono), monospace",
      },
      formatter: (params: any) => {
        const evt = params.data.eventData as WorldEvent;
        return `
          <div style="padding: 4px 8px;">
            <div style="font-weight: 700; color: #fff; margin-bottom: 4px;">${evt.title}</div>
            <div style="font-size: 11px; color: var(--ws-text-secondary); margin-bottom: 2px;">
              Category: <span style="text-transform: capitalize; color: ${categoryColors[evt.category]}">${evt.category}</span>
            </div>
            <div style="font-size: 11px; color: var(--ws-text-secondary);">
              Severity Index: <span style="font-weight: 700; color: #f59e0b;">${evt.severity}/10</span>
            </div>
          </div>
        `;
      },
    },
    geo: {
      map: "world",
      roam: true,
      zoom: 1.2,
      label: {
        show: false,
      },
      itemStyle: {
        areaColor: "rgba(255, 255, 255, 0.02)",
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
      },
      emphasis: {
        itemStyle: {
          areaColor: "rgba(255, 255, 255, 0.05)",
        },
        label: {
          show: false,
        },
      },
    },
    series: [
      {
        name: "Events",
        type: "scatter",
        coordinateSystem: "geo",
        data: scatterData,
        symbolSize: (val: any) => {
          // Calculate diameter based on severity (between 10 and 24 pixels)
          return 10 + val[2] * 1.4;
        },
        itemStyle: {
          color: (params: any) => {
            const evt = params.data.eventData as WorldEvent;
            return categoryColors[evt.category] || "#64748b";
          },
          shadowBlur: 10,
          shadowColor: "rgba(0, 0, 0, 0.5)",
          opacity: 0.85,
        },
        emphasis: {
          itemStyle: {
            borderColor: "#fff",
            borderWidth: 1.5,
            opacity: 1,
          },
        },
      },
    ],
  };

  // Click handler on ECharts components
  const onChartClick = (params: any) => {
    if (params.data && params.data.eventData) {
      setSelectedEvent(params.data.eventData);
    }
  };

  const onEvents = {
    click: onChartClick,
  };

  const categories: { key: EventCategory | "all"; label: string }[] = [
    { key: "all", label: "All Categories" },
    { key: "geopolitical", label: "Geopolitical" },
    { key: "economic", label: "Economic" },
    { key: "trade", label: "Trade" },
    { key: "supply_chain", label: "Supply Chain" },
    { key: "commodity", label: "Commodity" },
    { key: "environment", label: "Environment" },
    { key: "cyber", label: "Cyber" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--ws-bg-primary)" }}>
      <Header title="Global Threat Map" subtitle="Geolocated Event Registry & Spatial Threat Analysis" />
      
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 32px", gap: "20px" }}>
        
        {/* Controls Panel */}
        <div className="ws-card" style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "center", justifyContent: "space-between", padding: "16px 24px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: selectedCategory === cat.key ? "1px solid var(--ws-accent)" : "1px solid var(--ws-border)",
                  background: selectedCategory === cat.key ? "var(--ws-accent-glow)" : "rgba(255, 255, 255, 0.02)",
                  color: selectedCategory === cat.key ? "var(--ws-text-primary)" : "var(--ws-text-secondary)",
                  fontSize: "12px",
                  fontWeight: selectedCategory === cat.key ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "var(--ws-text-secondary)" }}>Min Severity:</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={minSeverity}
              onChange={(e) => setMinSeverity(parseFloat(e.target.value))}
              style={{ accentColor: "var(--ws-accent)", width: "120px", cursor: "pointer" }}
            />
            <span className="ws-mono" style={{ fontSize: "13px", fontWeight: 700, minWidth: "24px", color: "var(--ws-accent)" }}>
              {minSeverity.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Map Workspace layout */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: selectedEvent ? "1fr 400px" : "1fr", gap: "24px", minHeight: "500px" }}>
          
          {/* World Vector Visualizer */}
          <div className="ws-card" style={{ position: "relative", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", minHeight: "450px" }}>
            <div style={{ position: "absolute", left: "24px", top: "24px", zIndex: 10 }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Global Threat Intelligence Map</h2>
              <p style={{ fontSize: "12px", color: "var(--ws-text-muted)", marginTop: "4px" }}>
                Plotting {scatterData.length} events matching filters
              </p>
            </div>

            {loading || !mapGeoJson ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--ws-text-muted)" }}>
                <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "var(--ws-accent)", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite", marginBottom: "12px" }} />
                <div>Loading GeoJSON world projections...</div>
              </div>
            ) : (
              <ReactECharts
                ref={echartsRef}
                option={option}
                style={{ height: "100%", width: "100%" }}
                onEvents={onEvents}
              />
            )}
          </div>

          {/* Event Inspector Drawer */}
          {selectedEvent && (
            <div className="ws-card ws-animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--ws-border)", paddingBottom: "14px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ws-text-secondary)" }}>Event Inspector</h3>
                <button onClick={() => setSelectedEvent(null)} style={{ background: "transparent", border: "none", color: "var(--ws-text-muted)", cursor: "pointer", fontSize: "18px" }}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <span
                    className="ws-badge"
                    style={{
                      background: `rgba(${selectedEvent.category === "geopolitical" ? "239, 68, 68" : "59, 130, 246"}, 0.08)`,
                      borderColor: categoryColors[selectedEvent.category],
                      color: categoryColors[selectedEvent.category],
                      textTransform: "capitalize",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {selectedEvent.category} — {selectedEvent.event_type.replace(/_/g, " ")}
                  </span>
                  <h4 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ws-text-primary)", marginTop: "12px", lineHeight: 1.3 }}>
                    {selectedEvent.title}
                  </h4>
                </div>

                <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--ws-border)", display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--ws-text-muted)" }}>SEVERITY LEVEL</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                      <span className="ws-mono" style={{ fontSize: "18px", fontWeight: 800, color: "#f59e0b" }}>{selectedEvent.severity}</span>
                      <span style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>/10</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "10px", color: "var(--ws-text-muted)" }}>CONFIDENCE RATE</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", justifyContent: "flex-end" }}>
                      <span className="ws-mono" style={{ fontSize: "18px", fontWeight: 800, color: "var(--ws-accent)" }}>{Math.round(selectedEvent.confidence * 100)}%</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "10px", color: "var(--ws-text-muted)" }}>SOURCE DENSITY</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", justifyContent: "flex-end" }}>
                      <span className="ws-mono" style={{ fontSize: "18px", fontWeight: 800, color: "var(--ws-text-primary)" }}>{selectedEvent.source_count}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Geographical Anchor</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ws-text-primary)" }}>
                    {(selectedEvent.location as any)?.name || "Unknown Location"}
                  </span>
                  <span className="ws-mono" style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>
                    Lat: {(selectedEvent.location as any)?.latitude.toFixed(4)}, Lng: {(selectedEvent.location as any)?.longitude.toFixed(4)}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Brief Summary</span>
                  <p style={{ fontSize: "13px", color: "var(--ws-text-secondary)", lineHeight: 1.5 }}>
                    {selectedEvent.description || "No description provided."}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid var(--ws-border)", paddingTop: "14px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Timeline Logs</span>
                  <div style={{ fontSize: "12px", color: "var(--ws-text-secondary)" }}>
                    Detected: {new Date(selectedEvent.first_seen_at).toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--ws-text-secondary)" }}>
                    Last Logged: {new Date(selectedEvent.last_updated_at).toLocaleString()}
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
