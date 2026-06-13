// ============================================================
// WorldState — TypeScript Types (matches DATA_MODEL.md)
// ============================================================

// ── Source ────────────────────────────────────────────────────

export type SourceType =
  | "news"
  | "government"
  | "central_bank"
  | "research"
  | "rss"
  | "economic_calendar"
  | "commodity_feed"
  | "weather"
  | "disaster"
  | "social"
  | "other";

export interface Source {
  id: string;
  name: string;
  source_type: SourceType;
  url?: string;
  country: string;
  trust_score: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Event ────────────────────────────────────────────────────

export type EventCategory =
  | "geopolitical"
  | "economic"
  | "trade"
  | "supply_chain"
  | "commodity"
  | "environment"
  | "cyber"
  | "other";

export type EventStatus =
  | "detected"
  | "verified"
  | "active"
  | "monitoring"
  | "resolved"
  | "archived";

export type EventType =
  | "conflict"
  | "military_action"
  | "election"
  | "sanction"
  | "diplomatic_action"
  | "border_dispute"
  | "government_change"
  | "interest_rate_change"
  | "inflation_release"
  | "gdp_release"
  | "pmi_release"
  | "employment_data"
  | "debt_event"
  | "tariff"
  | "export_restriction"
  | "import_restriction"
  | "trade_agreement"
  | "factory_shutdown"
  | "port_congestion"
  | "logistics_disruption"
  | "oil_shock"
  | "gas_shock"
  | "food_shock"
  | "metal_shock"
  | "earthquake"
  | "flood"
  | "wildfire"
  | "drought"
  | "storm"
  | "cyber_attack"
  | "data_breach"
  | "infrastructure_attack"
  | "policy_change"
  | "other";

export interface WorldEvent {
  id: string;
  event_type: EventType;
  title: string;
  description?: string;
  severity: number;
  confidence: number;
  source_count: number;
  status: EventStatus;
  category: EventCategory;
  location?: Record<string, unknown>;
  first_seen_at: string;
  last_updated_at: string;
  resolved_at?: string;
  entity_ids?: string[];
  document_ids?: string[];
}

// ── Entity ───────────────────────────────────────────────────

export type EntityType =
  | "country"
  | "region"
  | "city"
  | "organization"
  | "company"
  | "industry"
  | "commodity"
  | "currency"
  | "person"
  | "military_unit"
  | "infrastructure"
  | "technology"
  | "financial_asset"
  | "policy"
  | "treaty"
  | "port"
  | "shipping_route"
  | "energy_asset";

export interface Entity {
  id: string;
  entity_type: EntityType;
  name: string;
  canonical_name: string;
  aliases?: string[];
  description?: string;
  importance: number;
  active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  pagerank?: number;
  betweenness?: number;
  propagated_risk?: number;
}

// ── Relationship ─────────────────────────────────────────────

export type RelationshipType =
  | "imports_from"
  | "exports_to"
  | "produces"
  | "consumes"
  | "invests_in"
  | "owns"
  | "competes_with"
  | "allies_with"
  | "opposes"
  | "sanctions"
  | "recognizes"
  | "supports"
  | "supplies"
  | "depends_on"
  | "manufactures"
  | "ships_through"
  | "stores"
  | "processes"
  | "correlates_with"
  | "impacts"
  | "benefits"
  | "harms";

export interface Relationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: RelationshipType;
  strength: number;
  confidence: number;
  created_at: string;
  updated_at: string;
}

// ── Risk ─────────────────────────────────────────────────────

export type RiskType =
  | "geopolitical"
  | "economic"
  | "financial"
  | "energy"
  | "supply_chain"
  | "cyber"
  | "climate"
  | "food_security"
  | "trade"
  | "technology";

export type RiskTrend = "rising" | "falling" | "stable" | "volatile";

export interface RiskScore {
  id: string;
  risk_type: RiskType;
  score: number;
  trend: RiskTrend;
  confidence: number;
  reasoning?: string;
  measured_at: string;
}

// ── World State ──────────────────────────────────────────────

export interface WorldState {
  id: string;
  global_stability: number;
  geopolitical_risk: number;
  economic_risk: number;
  financial_risk: number;
  supply_chain_risk: number;
  energy_risk: number;
  food_security_risk: number;
  cyber_risk: number;
  climate_risk: number;
  trade_risk: number;
  technology_risk: number;
  confidence: number;
  reasoning?: string;
  metadata?: Record<string, any>;
  measured_at: string;
}

// ── Intelligence ─────────────────────────────────────────────

export type SnapshotType = "hourly" | "daily" | "weekly" | "alert" | "custom";

export interface IntelligenceSnapshot {
  id: string;
  snapshot_type: SnapshotType;
  title: string;
  summary: string;
  top_risks: Array<{ risk: string; score: number; trend?: string }>;
  top_opportunities: Array<{ opportunity: string; score: number }>;
  regions_to_watch: Array<{ region: string; risk_level: string }>;
  critical_events: Array<Record<string, unknown>>;
  emerging_signals: Array<{ signal: string; confidence: number }>;
  second_order_effects?: Array<{ trigger: string; effect: string; impact_level?: string }>;
  third_order_effects?: Array<{ trigger: string; effect: string; impact_level?: string }>;
  confidence: number;
  generated_at: string;
}

// ── API Response Wrappers ────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit?: number;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  services: Record<string, string>;
}

export interface AssetPriceHistory {
  id: string;
  entity_id: string;
  price: number;
  change: number;
  change_percent: number;
  timestamp: string;
}
