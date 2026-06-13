"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { fetchRelationships, fetchEntities } from "@/lib/api";
import type { Relationship, Entity, RelationshipType } from "@/types";

interface Node {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Link {
  source: string;
  target: string;
  type: string;
  strength: number;
}

const ForceGraph: React.FC<{
  entities: Entity[];
  relationships: Relationship[];
  searchQuery: string;
  selectedType: string;
  minStrength: number;
}> = ({ entities, relationships, searchQuery, selectedType, minStrength }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Link[]>([]);
  
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const dragNodeRef = useRef<Node | null>(null);

  // Sync state variables
  useEffect(() => {
    // 1. Filter links
    const filteredRels = relationships.filter((rel) => {
      const matchesType = selectedType === "all" || rel.relationship_type === selectedType;
      const matchesStrength = rel.strength >= minStrength;
      return matchesType && matchesStrength;
    });

    const activeNodeIds = new Set<string>();
    filteredRels.forEach((r) => {
      activeNodeIds.add(r.source_entity_id);
      activeNodeIds.add(r.target_entity_id);
    });

    const query = searchQuery.toLowerCase();
    const filteredEntities = entities.filter((ent) => {
      if (activeNodeIds.has(ent.id)) return true;
      if (query && ent.name.toLowerCase().includes(query)) return true;
      return false;
    });

    const activeFilteredIds = new Set(filteredEntities.map((e) => e.id));
    
    const width = 800;
    const height = 460;
    const cx = width / 2;
    const cy = height / 2;

    const existingNodeMap = new Map<string, Node>();
    nodesRef.current.forEach((n) => existingNodeMap.set(n.id, n));

    const newNodes = filteredEntities.map((ent, i) => {
      const existing = existingNodeMap.get(ent.id);
      if (existing) return existing;
      
      const angle = (i / filteredEntities.length) * Math.PI * 2;
      const radius = 140 + Math.random() * 40;
      return {
        id: ent.id,
        name: ent.name,
        type: ent.entity_type,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: ent.entity_type === "country" ? 8 : ent.entity_type === "company" ? 6 : 5
      };
    });

    const newLinks = filteredRels
      .filter((r) => activeFilteredIds.has(r.source_entity_id) && activeFilteredIds.has(r.target_entity_id))
      .map((r) => ({
        source: r.source_entity_id,
        target: r.target_entity_id,
        type: r.relationship_type,
        strength: r.strength
      }));

    nodesRef.current = newNodes;
    linksRef.current = newLinks;
  }, [entities, relationships, searchQuery, selectedType, minStrength]);

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    const runSimulation = () => {
      const nodes = nodesRef.current;
      const links = linksRef.current;

      // Gravity force
      nodes.forEach((n) => {
        n.vx += (cx - n.x) * 0.003;
        n.vy += (cy - n.y) * 0.003;
      });

      // Node Repulsion
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          
          const minDist = n1.radius + n2.radius + 55;
          if (dist < minDist) {
            const force = (minDist - dist) * 0.06;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            if (dragNodeRef.current !== n1) {
              n1.x -= fx;
              n1.y -= fy;
            }
            if (dragNodeRef.current !== n2) {
              n2.x += fx;
              n2.y += fy;
            }
          }
        }
      }

      // Link Attraction
      links.forEach((link) => {
        const sourceNode = nodes.find((n) => n.id === link.source);
        const targetNode = nodes.find((n) => n.id === link.target);
        if (!sourceNode || !targetNode) return;

        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = (dist - 110) * 0.015 * link.strength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (dragNodeRef.current !== sourceNode) {
          sourceNode.x += fx;
          sourceNode.y += fy;
        }
        if (dragNodeRef.current !== targetNode) {
          targetNode.x -= fx;
          targetNode.y -= fy;
        }
      });

      // Update positions with friction
      nodes.forEach((n) => {
        if (dragNodeRef.current === n) return;
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.82;
        n.vy *= 0.82;

        n.x = Math.max(n.radius + 10, Math.min(width - n.radius - 10, n.x));
        n.y = Math.max(n.radius + 10, Math.min(height - n.radius - 10, n.y));
      });

      ctx.clearRect(0, 0, width, height);

      // Draw links
      links.forEach((link) => {
        const sourceNode = nodes.find((n) => n.id === link.source);
        const targetNode = nodes.find((n) => n.id === link.target);
        if (!sourceNode || !targetNode) return;

        const isHoveredLink = hoveredNode && (hoveredNode.id === link.source || hoveredNode.id === link.target);
        
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        
        if (isHoveredLink) {
          ctx.strokeStyle = "rgba(59, 130, 246, 0.7)";
          ctx.lineWidth = 2.0;
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
          ctx.lineWidth = 1.0;
        }
        ctx.stroke();

        const mx = (sourceNode.x + targetNode.x) / 2;
        const my = (sourceNode.y + targetNode.y) / 2;
        ctx.beginPath();
        ctx.fillStyle = isHoveredLink ? "rgba(59, 130, 246, 0.9)" : "rgba(255, 255, 255, 0.15)";
        ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw nodes
      nodes.forEach((n) => {
        const isHovered = hoveredNode?.id === n.id;
        const isSearched = searchQuery && n.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        let color = "#94a6b8";
        if (n.type === "country") color = "#3b82f6";
        else if (n.type === "company") color = "#8b5cf6";
        else if (n.type === "commodity") color = "#f59e0b";
        else if (n.type === "port" || n.type === "shipping_route") color = "#10b981";

        if (isHovered || isSearched) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = isSearched ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.font = isHovered ? "bold 11px Inter, sans-serif" : "10px Inter, sans-serif";
        ctx.fillStyle = isHovered ? "#ffffff" : isSearched ? "#f59e0b" : "#94a6b8";
        ctx.textAlign = "center";
        
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 4;
        ctx.fillText(n.name, n.x, n.y - n.radius - 6);
        ctx.shadowBlur = 0;
      });

      animationRef.current = requestAnimationFrame(runSimulation);
    };

    runSimulation();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [searchQuery, hoveredNode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (dragNodeRef.current) {
      dragNodeRef.current.x = mouseX;
      dragNodeRef.current.y = mouseY;
      return;
    }

    const found = nodesRef.current.find((n) => {
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) < n.radius + 10;
    });

    setHoveredNode(found || null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode) {
      dragNodeRef.current = hoveredNode;
    }
  };

  const handleMouseUp = () => {
    dragNodeRef.current = null;
  };

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={460}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: "block",
          margin: "0 auto",
          background: "rgba(0, 0, 0, 0.12)",
          borderRadius: "12px",
          border: "1px solid var(--ws-border)",
          cursor: hoveredNode ? "pointer" : "default",
          width: "100%",
          maxHeight: "460px"
        }}
      />
      <div style={{ textAlign: "center", fontSize: "11px", color: "var(--ws-text-muted)", marginTop: "12px", display: "flex", justifyContent: "center", gap: "20px" }}>
        <span>Drag nodes to organize</span>
        <span>•</span>
        <span>Hover nodes to trace immediate connection edges</span>
      </div>
    </div>
  );
};

export default function RelationshipsPage() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // View mode
  const [viewMode, setViewMode] = useState<"graph" | "table">("graph");

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [minStrength, setMinStrength] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [relResponse, entResponse] = await Promise.all([
          fetchRelationships(100),
          fetchEntities()
        ]);
        
        if (relResponse && relResponse.data) {
          setRelationships(relResponse.data);
        }
        if (entResponse && entResponse.data) {
          setEntities(entResponse.data);
        }
      } catch (err) {
        console.warn("Failed to load relationships data from backend.", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function resolveEntityName(id: string): string {
    const found = entities.find((ent) => ent.id === id);
    return found ? found.name : "Unknown Entity";
  }

  function resolveEntityType(id: string): string {
    const found = entities.find((ent) => ent.id === id);
    return found ? found.entity_type : "unknown";
  }

  const filteredRels = relationships.filter((rel) => {
    const srcName = resolveEntityName(rel.source_entity_id).toLowerCase();
    const tgtName = resolveEntityName(rel.target_entity_id).toLowerCase();
    const type = rel.relationship_type.toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = srcName.includes(query) || tgtName.includes(query) || type.includes(query);
    const matchesType = selectedType === "all" || rel.relationship_type === selectedType;
    const matchesStrength = rel.strength >= minStrength;

    return matchesSearch && matchesType && matchesStrength;
  });

  const uniqueTypes = Array.from(new Set(relationships.map((r) => r.relationship_type))).sort();

  return (
    <div>
      <Header />
      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Controls Panel */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px",
            borderRadius: "14px",
            background: "rgba(255, 255, 255, 0.01)",
            border: "1px solid var(--ws-border)"
          }}
        >
          {/* Left: Search & Type */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", flex: 1, minWidth: "320px" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", opacity: 0.4, width: "14px", height: "14px" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search entities or link type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 40px",
                  borderRadius: "10px",
                  border: "1px solid var(--ws-border)",
                  background: "rgba(255, 255, 255, 0.02)",
                  color: "var(--ws-text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--ws-border)",
                background: "rgba(255, 255, 255, 0.02)",
                color: "var(--ws-text-primary)",
                fontSize: "13px",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all" style={{ background: "var(--ws-bg-secondary)" }}>All Connection Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t} style={{ background: "var(--ws-bg-secondary)" }}>
                  {t.replace(/_/g, " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Strength slider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "240px" }}>
            <span style={{ fontSize: "12px", color: "var(--ws-text-muted)", whiteSpace: "nowrap" }}>
              Min Strength: {Math.round(minStrength * 100)}%
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={minStrength}
              onChange={(e) => setMinStrength(parseFloat(e.target.value))}
              style={{
                flex: 1,
                accentColor: "var(--ws-accent)",
                cursor: "pointer",
                height: "4px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "2px"
              }}
            />
          </div>
        </div>

        {/* Connections Card Container */}
        <div className="ws-card">
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", alignItems: "center", borderBottom: "1px solid var(--ws-border)", paddingBottom: "16px", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Apache AGE Knowledge Graph</h2>
              <span className="ws-mono" style={{ fontSize: "12px", color: "var(--ws-text-muted)" }}>
                {filteredRels.length} connections matched
              </span>
            </div>
            
            {/* View Mode Toggle */}
            <div style={{ display: "flex", gap: "4px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--ws-border)", borderRadius: "8px", padding: "3px" }}>
              <button
                onClick={() => setViewMode("graph")}
                style={{
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: viewMode === "graph" ? "var(--ws-accent)" : "transparent",
                  color: viewMode === "graph" ? "#ffffff" : "var(--ws-text-secondary)",
                  transition: "all 0.15s ease"
                }}
              >
                Network Graph
              </button>
              <button
                onClick={() => setViewMode("table")}
                style={{
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: viewMode === "table" ? "var(--ws-accent)" : "transparent",
                  color: viewMode === "table" ? "#ffffff" : "var(--ws-text-secondary)",
                  transition: "all 0.15s ease"
                }}
              >
                Data Table
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "80px 0", textAlign: "center", color: "var(--ws-text-muted)" }}>
              <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "var(--ws-accent)", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite", marginBottom: "12px" }} />
              <div>Traversing Knowledge Graph...</div>
            </div>
          ) : filteredRels.length === 0 ? (
            <div style={{ padding: "80px 0", textAlign: "center", color: "var(--ws-text-muted)" }}>
              <svg style={{ width: "32px", height: "32px", opacity: 0.4, marginBottom: "12px", display: "inline-block" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="19" r="3" />
                <line x1="9" y1="19" x2="15" y2="19" />
              </svg>
              <div>No relationships match the selected filters.</div>
            </div>
          ) : viewMode === "graph" ? (
            <ForceGraph
              entities={entities}
              relationships={relationships}
              searchQuery={searchQuery}
              selectedType={selectedType}
              minStrength={minStrength}
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--ws-border)", color: "var(--ws-text-muted)", fontWeight: 600 }}>
                    <th style={{ padding: "12px 16px" }}>Source Entity</th>
                    <th style={{ padding: "12px 16px", textAlign: "center" }}>Direction</th>
                    <th style={{ padding: "12px 16px" }}>Target Entity</th>
                    <th style={{ padding: "12px 16px" }}>Connection Type</th>
                    <th style={{ padding: "12px 16px" }}>Strength</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRels.map((rel, i) => {
                    const srcName = resolveEntityName(rel.source_entity_id);
                    const srcType = resolveEntityType(rel.source_entity_id);
                    const tgtName = resolveEntityName(rel.target_entity_id);
                    const tgtType = resolveEntityType(rel.target_entity_id);
                    
                    return (
                      <tr
                        key={rel.id}
                        className="ws-animate-fade-in"
                        style={{
                          borderBottom: "1px solid var(--ws-border)",
                          background: "transparent",
                          transition: "background 0.2s ease",
                          animationDelay: `${i * 15}ms`,
                          animationFillMode: "backwards",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "16px" }}>
                          <span style={{ fontWeight: 600, color: "var(--ws-text-primary)" }}>{srcName}</span>
                          <div style={{ fontSize: "11px", color: "var(--ws-text-muted)", textTransform: "capitalize", marginTop: "2px" }}>
                            {srcType}
                          </div>
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          <span style={{ color: "var(--ws-accent)", fontSize: "14px", fontWeight: 700 }}>→</span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ fontWeight: 600, color: "var(--ws-text-primary)" }}>{tgtName}</span>
                          <div style={{ fontSize: "11px", color: "var(--ws-text-muted)", textTransform: "capitalize", marginTop: "2px" }}>
                            {tgtType}
                          </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span
                            className="ws-mono"
                            style={{
                              fontSize: "10px",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              background: "rgba(59, 130, 246, 0.05)",
                              border: "1px solid rgba(59, 130, 246, 0.15)",
                              color: "var(--ws-accent)",
                              fontWeight: 600
                            }}
                          >
                            {rel.relationship_type.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "60px", height: "4px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "2px", overflow: "hidden" }}>
                              <div style={{ width: `${rel.strength * 100}%`, height: "100%", background: "var(--ws-accent)" }} />
                            </div>
                            <span className="ws-mono" style={{ fontSize: "12px", fontWeight: 600 }}>{Math.round(rel.strength * 100)}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "16px", textAlign: "right" }} className="ws-mono">
                          {Math.round(rel.confidence * 100)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
