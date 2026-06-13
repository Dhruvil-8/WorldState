package models

import (
	"time"

	"github.com/google/uuid"
)

// Source represents where information originates.
type Source struct {
	ID         uuid.UUID      `json:"id"`
	Name       string         `json:"name"`
	SourceType string         `json:"source_type"`
	URL        string         `json:"url,omitempty"`
	Country    string         `json:"country"`
	TrustScore float64        `json:"trust_score"`
	Active     bool           `json:"active"`
	Config     map[string]any `json:"config,omitempty"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
}

// Document represents raw immutable information from a source.
type Document struct {
	ID          uuid.UUID      `json:"id"`
	SourceID    uuid.UUID      `json:"source_id"`
	Title       string         `json:"title"`
	Content     string         `json:"content"`
	Summary     string         `json:"summary,omitempty"`
	URL         string         `json:"url,omitempty"`
	Language    string         `json:"language"`
	PublishedAt *time.Time     `json:"published_at,omitempty"`
	IngestedAt  time.Time      `json:"ingested_at"`
	ContentHash string         `json:"content_hash"`
	Metadata    map[string]any `json:"metadata,omitempty"`
	Processed   bool           `json:"processed"`
}

// Event represents a meaningful occurrence extracted from documents.
type Event struct {
	ID            uuid.UUID      `json:"id"`
	EventType     string         `json:"event_type"`
	Title         string         `json:"title"`
	Description   string         `json:"description,omitempty"`
	Severity      float64        `json:"severity"`
	Confidence    float64        `json:"confidence"`
	SourceCount   int            `json:"source_count"`
	Status        string         `json:"status"`
	Category      string         `json:"category"`
	Location      map[string]any `json:"location,omitempty"`
	Metadata      map[string]any `json:"metadata,omitempty"`
	FirstSeenAt   time.Time      `json:"first_seen_at"`
	LastUpdatedAt time.Time      `json:"last_updated_at"`
	ResolvedAt    *time.Time     `json:"resolved_at,omitempty"`
	EntityIDs     []uuid.UUID    `json:"entity_ids,omitempty"`
	DocumentIDs   []uuid.UUID    `json:"document_ids,omitempty"`
	Embedding     []float32      `json:"embedding,omitempty"`
}

// Entity represents any meaningful object in the world.
type Entity struct {
	ID            uuid.UUID      `json:"id"`
	EntityType    string         `json:"entity_type"`
	Name          string         `json:"name"`
	CanonicalName string         `json:"canonical_name"`
	Aliases       []string       `json:"aliases,omitempty"`
	Description   string         `json:"description,omitempty"`
	Importance    int            `json:"importance"`
	Active        bool           `json:"active"`
	Metadata      map[string]any `json:"metadata,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	PageRank       float64        `json:"pagerank"`
	Betweenness    float64        `json:"betweenness"`
	PropagatedRisk float64        `json:"propagated_risk"`
}

// Relationship represents a connection between two entities.
type Relationship struct {
	ID               uuid.UUID      `json:"id"`
	SourceEntityID   uuid.UUID      `json:"source_entity_id"`
	TargetEntityID   uuid.UUID      `json:"target_entity_id"`
	RelationshipType string         `json:"relationship_type"`
	Strength         float64        `json:"strength"`
	Confidence       float64        `json:"confidence"`
	Metadata         map[string]any `json:"metadata,omitempty"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
}

// RiskScore represents a point-in-time risk measurement.
type RiskScore struct {
	ID                 uuid.UUID   `json:"id"`
	RiskType           string      `json:"risk_type"`
	Score              int         `json:"score"`
	Trend              string      `json:"trend"`
	Confidence         int         `json:"confidence"`
	ContributingEvents []uuid.UUID `json:"contributing_events,omitempty"`
	Reasoning          string      `json:"reasoning,omitempty"`
	MeasuredAt         time.Time   `json:"measured_at"`
}

// EventImpact represents how an event affects an entity.
type EventImpact struct {
	ID          uuid.UUID `json:"id"`
	EventID     uuid.UUID `json:"event_id"`
	EntityID    uuid.UUID `json:"entity_id"`
	ImpactType  string    `json:"impact_type"`
	ImpactScore float64   `json:"impact_score"`
	Confidence  float64   `json:"confidence"`
	Description string    `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// WorldState represents the current estimated state of the world.
type WorldState struct {
	ID               uuid.UUID      `json:"id"`
	GlobalStability  int            `json:"global_stability"`
	GeopoliticalRisk int            `json:"geopolitical_risk"`
	EconomicRisk     int            `json:"economic_risk"`
	FinancialRisk    int            `json:"financial_risk"`
	SupplyChainRisk  int            `json:"supply_chain_risk"`
	EnergyRisk       int            `json:"energy_risk"`
	FoodSecurityRisk int            `json:"food_security_risk"`
	CyberRisk        int            `json:"cyber_risk"`
	ClimateRisk      int            `json:"climate_risk"`
	TradeRisk        int            `json:"trade_risk"`
	TechnologyRisk   int            `json:"technology_risk"`
	Confidence       int            `json:"confidence"`
	Reasoning        string         `json:"reasoning,omitempty"`
	Metadata         map[string]any `json:"metadata,omitempty"`
	MeasuredAt       time.Time      `json:"measured_at"`
}

// IntelligenceSnapshot represents generated intelligence output.
type IntelligenceSnapshot struct {
	ID                 uuid.UUID      `json:"id"`
	SnapshotType       string         `json:"snapshot_type"`
	Title              string         `json:"title"`
	Summary            string         `json:"summary"`
	TopRisks           []any          `json:"top_risks"`
	TopOpportunities   []any          `json:"top_opportunities"`
	RegionsToWatch     []any          `json:"regions_to_watch"`
	CriticalEvents     []any          `json:"critical_events"`
	EmergingSignals    []any          `json:"emerging_signals"`
	SecondOrderEffects []any          `json:"second_order_effects"`
	ThirdOrderEffects  []any          `json:"third_order_effects"`
	WorldStateID       *uuid.UUID     `json:"world_state_id,omitempty"`
	Confidence         int            `json:"confidence"`
	Metadata           map[string]any `json:"metadata,omitempty"`
	GeneratedAt        time.Time      `json:"generated_at"`
}

// AssetPriceHistory represents a historical price point for commodities/indices.
type AssetPriceHistory struct {
	ID            uuid.UUID `json:"id"`
	EntityID      uuid.UUID `json:"entity_id"`
	Price         float64   `json:"price"`
	Change        float64   `json:"change"`
	ChangePercent float64   `json:"change_percent"`
	Timestamp     time.Time `json:"timestamp"`
}
