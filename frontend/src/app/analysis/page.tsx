"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
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


interface CascadingRisk {
  id: string;
  title: string;
  scenario: string;
  severity: number;
  confidence: number;
  impacted_entity_ids: string[];
  trigger_event_ids: string[];
  created_at: string;
}

interface EventUpdate {
  timestamp: string;
  update: string;
}

interface IntelligenceEvent {
  id: string;
  title: string;
  description: string;
  severity: number;
  confidence: number;
  source_count: number;
  status: string;
  category: string;
  last_updated_at: string;
  metadata?: {
    timeline?: EventUpdate[];
  };
}

export default function AnalysisPage() {
  const [risks, setRisks] = useState<CascadingRisk[]>([]);
  const [resolvedEvents, setResolvedEvents] = useState<IntelligenceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRisk, setActiveRisk] = useState<CascadingRisk | null>(null);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      // Fetch Cascading Risks
      const riskResponse = await fetch("http://localhost:8080/api/v1/intelligence/cascading-risks");
      const riskData = await riskResponse.json();
      const riskList = riskData.data || [];
      setRisks(riskList);
      if (riskList.length > 0) {
        setActiveRisk(riskList[0]);
      }

      // Fetch Events to find those with consensus timelines
      const eventResponse = await fetch("http://localhost:8080/api/v1/events?limit=50");
      const eventData = await eventResponse.json();
      const events: IntelligenceEvent[] = eventData.data || [];
      
      // Filter events that have timeline entry updates
      const resolved = events.filter(e => e.metadata?.timeline && e.metadata.timeline.length > 0);
      setResolvedEvents(resolved);
    } catch (err) {
      console.error("Error fetching analysis data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  const getSeverityColor = (score: number) => {
    if (score >= 8.0) return "text-[var(--ws-risk-critical)] border-[var(--ws-risk-critical)] bg-[rgba(244,63,94,0.05)]";
    if (score >= 6.0) return "text-[var(--ws-risk-high)] border-[var(--ws-risk-high)] bg-[rgba(249,115,22,0.05)]";
    return "text-[var(--ws-risk-low)] border-[var(--ws-risk-low)] bg-[rgba(6,182,212,0.05)]";
  };

  return (
    <div className="min-h-screen bg-black text-[#fafafa] font-sans">
      <Header 
        title="Deep Geopolitical Analysis"
        subtitle="Autonomous Graph Reasoning Walks & Epistemic Consensus Timelines"
      />

      <div className="p-6 bg-terminal-grid min-h-[calc(100vh-69px)]">
        {/* Top bar controls */}
        <div className="flex justify-between items-center mb-6 border-b border-neutral-900 pb-4">
          <div className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
            // SEGMENT: COGNITIVE_REASONING_PIPELINE
          </div>
          <button 
            onClick={fetchAnalysisData}
            className="px-4 py-2 font-mono text-xs font-bold border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 transition-colors"
          >
            REFRESH_ANALYSIS_RELOAD
          </button>
        </div>

        {loading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-neutral-800 border-t-white animate-spin" />
              <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider">Loading System Projections...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left/Middle Column: Cascading Risks */}
            <div className="xl:col-span-2 space-y-6">
              <div>
                <h2 className="font-mono text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  // SYSTEMIC_CASCADING_RISK_FORECASTS
                </h2>
                <div className="h-px bg-neutral-900 w-full" />
              </div>

              {risks.length === 0 ? (
                <div className="p-8 border border-dashed border-neutral-800 text-center bg-neutral-950/40">
                  <p className="font-mono text-xs text-neutral-500">
                    NO CASCADING RISKS IDENTIFIED. INGEST DOCUMENTS TO TRIGGER GRAPH PATH-WALKS.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {risks.map((risk) => (
                    <div 
                      key={risk.id}
                      onClick={() => setActiveRisk(risk)}
                      className={`p-5 border cursor-pointer transition-all ${
                        activeRisk?.id === risk.id 
                          ? "bg-neutral-900/60 border-neutral-500 shadow-md" 
                          : "bg-[#0c0c0e] border-neutral-900 hover:border-neutral-700 hover:bg-neutral-900/20"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 border ${getSeverityColor(risk.severity)}`}>
                          SEV: {risk.severity.toFixed(1)}
                        </span>
                        <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest">
                          {formatRelativeTime(risk.created_at)}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-neutral-200 line-clamp-2 hover:text-white transition-colors">
                        {risk.title}
                      </h3>
                      <p className="font-mono text-xs text-neutral-400 mt-2 line-clamp-3 leading-relaxed">
                        {risk.scenario.replace(/[\#\*]/g, "")}
                      </p>
                      <div className="mt-4 flex items-center justify-between font-mono text-[10px] text-neutral-500 pt-3 border-t border-neutral-900/80">
                        <span>CONFIDENCE: {(risk.confidence * 100).toFixed(0)}%</span>
                        <span>IMPACT_NODES: {risk.impacted_entity_ids.length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Active Risk Detail Panel */}
              {activeRisk && (
                <div className="p-6 bg-[#0c0c0e] border border-neutral-900">
                  <div className="flex items-center gap-4 mb-4 border-b border-neutral-900 pb-3">
                    <span className={`font-mono text-xs font-bold px-3 py-1 border ${getSeverityColor(activeRisk.severity)}`}>
                      SEVERITY INDEX: {activeRisk.severity.toFixed(1)}
                    </span>
                    <div className="font-mono text-xs text-neutral-400">
                      CONFIDENCE: <span className="text-white font-bold">{(activeRisk.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-4 leading-snug font-mono">
                    // REPORT: {activeRisk.title}
                  </h3>

                  <div className="font-mono text-xs text-neutral-300 leading-relaxed border-t border-neutral-900/60 pt-4 space-y-4">
                    {activeRisk.scenario.split("\n\n").map((para, i) => (
                      <p key={i}>{para.replace(/[\#\*]/g, "")}</p>
                    ))}
                  </div>

                  {/* Pathway mapping ASCII visualization */}
                  <div className="mt-6 p-4 bg-black border border-neutral-900 font-mono text-[11px] text-neutral-400">
                    <div className="text-neutral-500 uppercase font-bold mb-2">VULNERABILITY_PATHWAY:</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-rose-500 font-bold">TRIGGER_EVENT</span>
                      <span>-&gt;</span>
                      <span className="text-neutral-300">GRAPH_WALK_RELATIONS</span>
                      <span>-&gt;</span>
                      <span className="text-neutral-100 font-bold">{activeRisk.impacted_entity_ids.length} IMPACTED_NODES</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-neutral-900 text-xs font-mono">
                    <div>
                      <span className="text-neutral-500 block mb-1 uppercase tracking-wider text-[10px]">TRIGGER_EVENT_ID:</span>
                      <span className="text-neutral-300 font-semibold">{activeRisk.trigger_event_ids[0] || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block mb-1 uppercase tracking-wider text-[10px]">AFFECTED_ENTITIES_COUNT:</span>
                      <span className="text-neutral-300 font-semibold">{activeRisk.impacted_entity_ids.length} Nodes</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Consensus updates */}
            <div className="space-y-6">
              <div>
                <h2 className="font-mono text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  // EPISTEMIC_CONSENSUS_TIMELINE
                </h2>
                <div className="h-px bg-neutral-900 w-full" />
              </div>

              {resolvedEvents.length === 0 ? (
                <div className="p-8 border border-dashed border-neutral-800 text-center bg-neutral-950/40">
                  <p className="font-mono text-xs text-neutral-500">
                    NO CONFLICTS RESOLVED BY LLM CONSENSUS AGENTS YET.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {resolvedEvents.map((evt) => (
                    <div 
                      key={evt.id}
                      className="p-5 bg-[#0c0c0e] border border-neutral-900"
                    >
                      <div className="flex justify-between items-start mb-3 border-b border-neutral-900/60 pb-2">
                        <span className="font-mono text-xs font-bold text-neutral-200 uppercase tracking-tight">
                          {evt.title}
                        </span>
                        <span className="font-mono text-[9px] px-2 py-0.5 border border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                          {evt.source_count} SOURCES
                        </span>
                      </div>

                      <p className="font-mono text-xs text-neutral-400 mb-4 leading-relaxed">
                        {evt.description}
                      </p>

                      {/* Timeline logs */}
                      <div className="border-t border-neutral-900 pt-4 space-y-3">
                        <h4 className="font-mono text-[9px] uppercase tracking-widest font-bold text-neutral-500">CONFLICT_RESOLUTION_AUDIT_LOGS</h4>
                        <div className="relative pl-3 border-l border-neutral-800 space-y-3 font-mono text-[11px]">
                          {evt.metadata?.timeline?.map((item, idx) => (
                            <div key={idx} className="relative">
                              {/* Simple dash bullet */}
                              <div className="absolute -left-[16px] top-1.5 w-1.5 h-px bg-neutral-500" />
                              <div className="text-[9px] text-neutral-500 mb-0.5">
                                {new Date(item.timestamp).toISOString().replace("T", " ").replace("Z", "")} UTC
                              </div>
                              <div className="text-neutral-300 leading-normal">
                                {item.update}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
