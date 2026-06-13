"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { fetchEntities, fetchEntityRelationships } from "@/lib/api";
import type { Entity, EntityType, Relationship } from "@/types";

// Rich fallback stub data for entities

const typeFilters: { key: EntityType | "all"; label: string; icon: string }[] = [
  { key: "all", label: "All Entities", icon: "▪" },
  { key: "country", label: "Countries", icon: "●" },
  { key: "company", label: "Companies", icon: "◆" },
  { key: "commodity", label: "Commodities", icon: "▲" },
  { key: "shipping_route", label: "Shipping Routes", icon: "▼" },
  { key: "port", label: "Ports", icon: "○" },
];

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<EntityType | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [entityRelationships, setEntityRelationships] = useState<Relationship[]>([]);
  const [loadingRelationships, setLoadingRelationships] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedEntity) {
      setEntityRelationships([]);
      return;
    }
    const entityId = selectedEntity.id;
    let cancelled = false;
    async function loadRelationships() {
      setLoadingRelationships(true);
      try {
        const res = await fetchEntityRelationships(entityId);
        if (!cancelled) {
          setEntityRelationships(res.relationships || []);
        }
      } catch (err) {
        console.warn("Failed to fetch entity relationships:", err);
        if (!cancelled) {
          setEntityRelationships([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingRelationships(false);
        }
      }
    }
    loadRelationships();
    return () => {
      cancelled = true;
    };
  }, [selectedEntity]);

  function resolveEntityName(id: string): string {
    const found = entities.find((ent) => ent.id === id);
    return found ? found.name : "Unknown Entity";
  }

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchEntities();
        if (response && response.data && response.data.length > 0) {
          setEntities(response.data);
        } else {
          setEntities([]);
        }
      } catch (err) {
        console.warn("Failed to fetch entities from backend.", err);
        setEntities([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredEntities = entities.filter((ent) => {
    const matchesType = selectedType === "all" || ent.entity_type === selectedType;
    const matchesSearch =
      ent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.canonical_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ent.description && ent.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ent.aliases && ent.aliases.some((alias) => alias.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesType && matchesSearch;
  });

  // Sort by importance descending
  const sortedEntities = [...filteredEntities].sort((a, b) => b.importance - a.importance);

  function getImportanceColor(score: number): string {
    if (score >= 90) return "var(--ws-risk-critical)";
    if (score >= 80) return "var(--ws-risk-high)";
    if (score >= 60) return "var(--ws-risk-elevated)";
    return "var(--ws-risk-low)";
  }

  function getTypeIcon(type: EntityType): string {
    const match = typeFilters.find((t) => t.key === type);
    return match ? match.icon : "▪";
  }

  return (
    <div>
      <Header />
      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Top Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center" }}>
          {/* Navigation/Filters */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            {typeFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedType(filter.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: selectedType === filter.key ? "1px solid var(--ws-accent)" : "1px solid var(--ws-border)",
                  background: selectedType === filter.key ? "var(--ws-accent-glow)" : "rgba(255, 255, 255, 0.02)",
                  color: selectedType === filter.key ? "var(--ws-text-primary)" : "var(--ws-text-secondary)",
                  fontSize: "13px",
                  fontWeight: selectedType === filter.key ? 600 : 400,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                }}
              >
                <span>{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
            <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", opacity: 0.4, width: "14px", height: "14px" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search by name, alias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 40px",
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
        <div style={{ display: "grid", gridTemplateColumns: selectedEntity ? "1fr 420px" : "1fr", gap: "24px", transition: "all 0.3s ease" }}>
          
          {/* Main List */}
          <div className="ws-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--ws-border)", paddingBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700 }}>System Tracked Entities</h2>
              <span className="ws-mono" style={{ fontSize: "13px", color: "var(--ws-text-muted)" }}>
                Showing {sortedEntities.length} of {entities.length} entities
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "80px 0", textAlign: "center", color: "var(--ws-text-muted)" }}>
                <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "var(--ws-accent)", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite", marginBottom: "12px" }} />
                <div>Accessing World Registry...</div>
              </div>
            ) : entities.length === 0 ? (
              <div style={{ padding: "80px 0", textAlign: "center", color: "var(--ws-text-muted)", border: "1px dashed var(--ws-border)", borderRadius: "14px" }}>
                <div>No entities seeded in the database. Run database seed files or start ingestion to populate actors.</div>
              </div>
            ) : sortedEntities.length === 0 ? (
              <div style={{ padding: "80px 0", textAlign: "center", color: "var(--ws-text-muted)" }}>
                <svg style={{ width: "32px", height: "32px", opacity: 0.4, marginBottom: "12px", display: "inline-block" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <div>No entities found. Try adjusting filter types or search text.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {sortedEntities.map((ent, i) => {
                  const isSelected = selectedEntity?.id === ent.id;
                  return (
                    <div
                      key={ent.id}
                      onClick={() => setSelectedEntity(ent)}
                      className="ws-animate-fade-in"
                      style={{
                        padding: "20px",
                        borderRadius: "14px",
                        background: isSelected ? "rgba(59, 130, 246, 0.04)" : "rgba(255, 255, 255, 0.01)",
                        border: isSelected ? "1px solid var(--ws-accent)" : "1px solid var(--ws-border)",
                        cursor: "pointer",
                        animationDelay: `${i * 30}ms`,
                        animationFillMode: "backwards",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <span style={{ fontSize: "20px" }}>{getTypeIcon(ent.entity_type)}</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--ws-text-primary)" }}>{ent.name}</div>
                            <span style={{ fontSize: "11px", color: "var(--ws-text-muted)", textTransform: "capitalize" }}>{ent.entity_type}</span>
                          </div>
                        </div>

                        {/* Importance Score badge */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                            <span style={{ fontSize: "10px", color: "var(--ws-text-muted)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>Importance</span>
                            <span className="ws-mono" style={{ fontSize: "15px", fontWeight: 800, color: getImportanceColor(ent.importance) }}>
                              {ent.importance}
                            </span>
                          </div>
                          {ent.betweenness && ent.betweenness > 0.05 && (
                            <span style={{ fontSize: "9px", padding: "1px 5px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "4px", color: "var(--ws-risk-critical)", fontWeight: 700 }}>
                              CHOKEPOINT
                            </span>
                          )}
                        </div>
                      </div>

                      {ent.description && (
                        <p style={{ fontSize: "12px", color: "var(--ws-text-secondary)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {ent.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Inspector Sidebar */}
          {selectedEntity && (
            <div className="ws-card ws-animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px", height: "fit-content", position: "sticky", top: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--ws-border)", paddingBottom: "14px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Entity Knowledge Card</h3>
                <button onClick={() => setSelectedEntity(null)} style={{ background: "transparent", border: "none", color: "var(--ws-text-muted)", cursor: "pointer", fontSize: "18px" }}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "36px" }}>{getTypeIcon(selectedEntity.entity_type)}</span>
                  <div>
                    <h4 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ws-text-primary)" }}>{selectedEntity.name}</h4>
                    <span className="ws-badge" style={{ textTransform: "capitalize", background: "rgba(255,255,255,0.03)", border: "1px solid var(--ws-border)", marginTop: "4px", fontSize: "11px" }}>
                      {selectedEntity.entity_type}
                    </span>
                  </div>
                </div>

                <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--ws-border)", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Canonical System Identifier</span>
                  <span className="ws-mono" style={{ fontSize: "13px", fontWeight: 500, color: "var(--ws-text-primary)" }}>{selectedEntity.canonical_name}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>System Description</span>
                  <p style={{ fontSize: "13px", color: "var(--ws-text-secondary)", lineHeight: 1.5 }}>{selectedEntity.description}</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--ws-border)", paddingTop: "14px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Importance Score Spectrum</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${selectedEntity.importance}%`, height: "100%", background: getImportanceColor(selectedEntity.importance) }} />
                    </div>
                    <span className="ws-mono" style={{ fontSize: "14px", fontWeight: 800, color: getImportanceColor(selectedEntity.importance) }}>{selectedEntity.importance}</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--ws-border)", paddingTop: "14px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Graph Centrality & Vulnerability</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    
                    {/* PageRank */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "var(--ws-text-secondary)" }}>Network Influence (PageRank)</span>
                      <span className="ws-mono" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ws-text-primary)" }}>
                        {selectedEntity.pagerank ? (selectedEntity.pagerank * 100).toFixed(2) : "0.00"}%
                      </span>
                    </div>

                    {/* Betweenness Centrality */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "13px", color: "var(--ws-text-secondary)" }}>Chokepoint Index (Betweenness)</span>
                        {selectedEntity.betweenness && selectedEntity.betweenness > 0.05 && (
                          <span style={{ fontSize: "9px", padding: "1px 5px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "4px", color: "var(--ws-risk-critical)", fontWeight: 700 }}>
                            CHOKEPOINT
                          </span>
                        )}
                      </div>
                      <span className="ws-mono" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ws-text-primary)" }}>
                        {selectedEntity.betweenness ? (selectedEntity.betweenness * 100).toFixed(2) : "0.00"}%
                      </span>
                    </div>

                    {/* Propagated Risk */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "var(--ws-text-secondary)" }}>Propagated Risk (Cascade Threat)</span>
                      <span className="ws-mono" style={{ fontSize: "13px", fontWeight: 600, color: selectedEntity.propagated_risk && selectedEntity.propagated_risk > 0.05 ? "var(--ws-risk-high)" : "var(--ws-text-primary)" }}>
                        {selectedEntity.propagated_risk ? (selectedEntity.propagated_risk * 100).toFixed(2) : "0.00"}%
                      </span>
                    </div>

                  </div>
                </div>

                {selectedEntity.aliases && selectedEntity.aliases.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--ws-border)", paddingTop: "14px" }}>
                    <span style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Aliases & Alternate Names</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {selectedEntity.aliases.map((alias) => (
                        <span key={alias} className="ws-mono" style={{ fontSize: "11px", padding: "4px 8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--ws-border)", borderRadius: "6px" }}>
                          {alias}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Entity Relationships Section (Apache AGE Graph) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--ws-border)", paddingTop: "14px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Semantic Graph Connections (Apache AGE)</span>
                  {loadingRelationships ? (
                    <div style={{ fontSize: "12px", color: "var(--ws-text-muted)" }}>Querying graph engine...</div>
                  ) : entityRelationships.length === 0 ? (
                    <div style={{ fontSize: "12px", color: "var(--ws-text-muted)" }}>No registered connections.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
                      {entityRelationships.map((rel) => {
                        const isSource = rel.source_entity_id === selectedEntity.id;
                        const partnerId = isSource ? rel.target_entity_id : rel.source_entity_id;
                        const partnerName = resolveEntityName(partnerId);
                        const relTypeLabel = rel.relationship_type.replace(/_/g, " ").toUpperCase();
                        
                        return (
                          <div
                            key={rel.id}
                            style={{
                              padding: "8px 10px",
                              borderRadius: "8px",
                              background: "rgba(255,255,255,0.01)",
                              border: "1px solid var(--ws-border)",
                              fontSize: "12px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <div>
                              <span style={{ color: "var(--ws-text-secondary)", fontWeight: 500 }}>
                                {isSource ? "→ " : "← "}
                              </span>
                              <span style={{ color: "var(--ws-text-primary)", fontWeight: 600 }}>{partnerName}</span>
                              <div style={{ fontSize: "10px", color: "var(--ws-text-muted)", marginTop: "2px" }}>
                                {isSource ? "Outgoing Link" : "Incoming Link"}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span
                                className="ws-mono"
                                style={{
                                  fontSize: "9px",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(59, 130, 246, 0.08)",
                                  border: "1px solid rgba(59, 130, 246, 0.15)",
                                  color: "var(--ws-accent)",
                                  fontWeight: 600
                                }}
                              >
                                {relTypeLabel}
                              </span>
                              <div style={{ fontSize: "10px", color: "var(--ws-text-muted)", marginTop: "2px" }}>
                                Strength: {Math.round(rel.strength * 100)}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--ws-border)", paddingTop: "14px" }}>
                  <span style={{ fontSize: "11px", color: "var(--ws-text-muted)" }}>Entity Status</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: selectedEntity.active ? "#22c55e" : "#64748b" }} />
                    {selectedEntity.active ? "Monitoring continuously" : "Archived / Inactive"}
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
