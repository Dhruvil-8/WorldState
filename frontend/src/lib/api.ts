// ============================================================
// WorldState — API Client (TanStack Query + fetch wrappers)
// ============================================================

import type {
  WorldState,
  WorldEvent,
  Entity,
  Relationship,
  RiskScore,
  IntelligenceSnapshot,
  PaginatedResponse,
  HealthResponse,
  AssetPriceHistory,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const AI_BASE = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8000";

// ── Generic Fetch ────────────────────────────────────────────

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ── Health ───────────────────────────────────────────────────

export function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>(`${API_BASE}/api/health`);
}

export function fetchReady(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>(`${API_BASE}/api/ready`);
}

// ── World State ──────────────────────────────────────────────

export function fetchWorldState(): Promise<WorldState> {
  return apiFetch<WorldState>(`${API_BASE}/api/v1/world-state`);
}

export function fetchWorldStateHistory(): Promise<PaginatedResponse<WorldState>> {
  return apiFetch<PaginatedResponse<WorldState>>(
    `${API_BASE}/api/v1/world-state/history`
  );
}

// ── Events ───────────────────────────────────────────────────

export function fetchEvents(
  limit: number = 20
): Promise<PaginatedResponse<WorldEvent>> {
  return apiFetch<PaginatedResponse<WorldEvent>>(
    `${API_BASE}/api/v1/events?limit=${limit}`
  );
}

export function fetchEvent(id: string): Promise<WorldEvent> {
  return apiFetch<WorldEvent>(`${API_BASE}/api/v1/events/${id}`);
}

// ── Entities ─────────────────────────────────────────────────

export function fetchEntities(): Promise<PaginatedResponse<Entity>> {
  return apiFetch<PaginatedResponse<Entity>>(`${API_BASE}/api/v1/entities`);
}

export function fetchEntity(id: string): Promise<Entity> {
  return apiFetch<Entity>(`${API_BASE}/api/v1/entities/${id}`);
}

// ── Risks ────────────────────────────────────────────────────

export function fetchRisks(): Promise<PaginatedResponse<RiskScore>> {
  return apiFetch<PaginatedResponse<RiskScore>>(`${API_BASE}/api/v1/risks`);
}

export function fetchRiskByType(type: string): Promise<RiskScore> {
  return apiFetch<RiskScore>(`${API_BASE}/api/v1/risks/${type}`);
}

// ── Intelligence ─────────────────────────────────────────────

export function fetchLatestIntelligence(): Promise<IntelligenceSnapshot> {
  return apiFetch<IntelligenceSnapshot>(
    `${API_BASE}/api/v1/intelligence/latest`
  );
}

export function fetchIntelligenceList(): Promise<
  PaginatedResponse<IntelligenceSnapshot>
> {
  return apiFetch<PaginatedResponse<IntelligenceSnapshot>>(
    `${API_BASE}/api/v1/intelligence`
  );
}

// ── AI Layer ─────────────────────────────────────────────────

export function fetchAIHealth(): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(`${AI_BASE}/health`);
}

// ── Relationships (Apache AGE / Graph) ──────────────────────────

export function fetchRelationships(limit: number = 50): Promise<PaginatedResponse<Relationship>> {
  return apiFetch<PaginatedResponse<Relationship>>(`${API_BASE}/api/v1/relationships?limit=${limit}`);
}

export function fetchEntityRelationships(
  entityId: string
): Promise<{ entity_id: string; relationships: Relationship[] }> {
  return apiFetch<{ entity_id: string; relationships: Relationship[] }>(
    `${API_BASE}/api/v1/relationships/entity/${entityId}`
  );
}

export function fetchGraphPaths(
  source: string,
  target: string,
  depth: number = 3
): Promise<{ source: string; target: string; depth: number; paths: any[] }> {
  return apiFetch<{ source: string; target: string; depth: number; paths: any[] }>(
    `${API_BASE}/api/v1/relationships/paths?source=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}&depth=${depth}`
  );
}

export function fetchEntityPriceHistory(
  entityId: string,
  limit: number = 30
): Promise<{ entity_id: string; history: AssetPriceHistory[] }> {
  return apiFetch<{ entity_id: string; history: AssetPriceHistory[] }>(
    `${API_BASE}/api/v1/entities/${entityId}/prices?limit=${limit}`
  );
}
