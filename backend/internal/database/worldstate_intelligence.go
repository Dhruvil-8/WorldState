package database

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/worldstate/worldstate/internal/models"
)

// CreateWorldState appends a new state of the world to PostgreSQL time-series.
func (db *PostgresDB) CreateWorldState(ctx context.Context, ws *models.WorldState) error {
	if ws.ID == uuid.Nil {
		ws.ID = uuid.New()
	}
	if ws.MeasuredAt.IsZero() {
		ws.MeasuredAt = time.Now().UTC()
	}

	query := `
		INSERT INTO world_state (id, global_stability, geopolitical_risk, economic_risk, financial_risk, supply_chain_risk, energy_risk, food_security_risk, cyber_risk, climate_risk, trade_risk, technology_risk, confidence, reasoning, metadata, measured_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
	`
	_, err := db.Pool.Exec(ctx, query,
		ws.ID, ws.GlobalStability, ws.GeopoliticalRisk, ws.EconomicRisk, ws.FinancialRisk, ws.SupplyChainRisk, ws.EnergyRisk, ws.FoodSecurityRisk, ws.CyberRisk, ws.ClimateRisk, ws.TradeRisk, ws.TechnologyRisk, ws.Confidence, ws.Reasoning, ws.Metadata, ws.MeasuredAt,
	)
	if err != nil {
		return fmt.Errorf("inserting world state: %w", err)
	}
	return nil
}

// GetLatestWorldState retrieves the most recent world state estimation.
func (db *PostgresDB) GetLatestWorldState(ctx context.Context) (*models.WorldState, error) {
	query := `
		SELECT id, global_stability, geopolitical_risk, economic_risk, financial_risk, supply_chain_risk, energy_risk, food_security_risk, cyber_risk, climate_risk, trade_risk, technology_risk, confidence, reasoning, metadata, measured_at
		FROM world_state
		ORDER BY measured_at DESC
		LIMIT 1
	`
	var ws models.WorldState
	err := db.Pool.QueryRow(ctx, query).Scan(
		&ws.ID, &ws.GlobalStability, &ws.GeopoliticalRisk, &ws.EconomicRisk, &ws.FinancialRisk, &ws.SupplyChainRisk, &ws.EnergyRisk, &ws.FoodSecurityRisk, &ws.CyberRisk, &ws.ClimateRisk, &ws.TradeRisk, &ws.TechnologyRisk, &ws.Confidence, &ws.Reasoning, &ws.Metadata, &ws.MeasuredAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, fmt.Errorf("getting latest world state: %w", err)
	}
	return &ws, nil
}

// GetWorldStateHistory retrieves a time series list of world states.
func (db *PostgresDB) GetWorldStateHistory(ctx context.Context, limit int) ([]models.WorldState, error) {
	if limit <= 0 {
		limit = 30
	}
	query := `
		SELECT id, global_stability, geopolitical_risk, economic_risk, financial_risk, supply_chain_risk, energy_risk, food_security_risk, cyber_risk, climate_risk, trade_risk, technology_risk, confidence, reasoning, metadata, measured_at
		FROM world_state
		ORDER BY measured_at DESC
		LIMIT $1
	`
	rows, err := db.Pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("getting world state history: %w", err)
	}
	defer rows.Close()

	var history []models.WorldState
	for rows.Next() {
		var ws models.WorldState
		err := rows.Scan(
			&ws.ID, &ws.GlobalStability, &ws.GeopoliticalRisk, &ws.EconomicRisk, &ws.FinancialRisk, &ws.SupplyChainRisk, &ws.EnergyRisk, &ws.FoodSecurityRisk, &ws.CyberRisk, &ws.ClimateRisk, &ws.TradeRisk, &ws.TechnologyRisk, &ws.Confidence, &ws.Reasoning, &ws.Metadata, &ws.MeasuredAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning world state history row: %w", err)
		}
		history = append(history, ws)
	}
	return history, nil
}

// CreateIntelligenceSnapshot archives a generated AI executive briefing.
func (db *PostgresDB) CreateIntelligenceSnapshot(ctx context.Context, intel *models.IntelligenceSnapshot) error {
	if intel.ID == uuid.Nil {
		intel.ID = uuid.New()
	}
	if intel.GeneratedAt.IsZero() {
		intel.GeneratedAt = time.Now().UTC()
	}

	query := `
		INSERT INTO intelligence_snapshots (id, snapshot_type, title, summary, top_risks, top_opportunities, regions_to_watch, critical_events, emerging_signals, second_order_effects, third_order_effects, world_state_id, confidence, metadata, generated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`
	_, err := db.Pool.Exec(ctx, query,
		intel.ID, intel.SnapshotType, intel.Title, intel.Summary, intel.TopRisks, intel.TopOpportunities, intel.RegionsToWatch, intel.CriticalEvents, intel.EmergingSignals, intel.SecondOrderEffects, intel.ThirdOrderEffects, intel.WorldStateID, intel.Confidence, intel.Metadata, intel.GeneratedAt,
	)
	if err != nil {
		return fmt.Errorf("inserting intelligence snapshot: %w", err)
	}
	return nil
}

// GetLatestIntelligenceSnapshot retrieves the latest strategic executive brief by type.
func (db *PostgresDB) GetLatestIntelligenceSnapshot(ctx context.Context, snapshotType string) (*models.IntelligenceSnapshot, error) {
	query := `
		SELECT id, snapshot_type, title, summary, top_risks, top_opportunities, regions_to_watch, critical_events, emerging_signals, second_order_effects, third_order_effects, world_state_id, confidence, metadata, generated_at
		FROM intelligence_snapshots
		WHERE snapshot_type = $1
		ORDER BY generated_at DESC
		LIMIT 1
	`
	var intel models.IntelligenceSnapshot
	err := db.Pool.QueryRow(ctx, query, snapshotType).Scan(
		&intel.ID, &intel.SnapshotType, &intel.Title, &intel.Summary, &intel.TopRisks, &intel.TopOpportunities, &intel.RegionsToWatch, &intel.CriticalEvents, &intel.EmergingSignals, &intel.SecondOrderEffects, &intel.ThirdOrderEffects, &intel.WorldStateID, &intel.Confidence, &intel.Metadata, &intel.GeneratedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, fmt.Errorf("getting latest intelligence snapshot: %w", err)
	}
	return &intel, nil
}

// GetIntelligenceSnapshot retrieves a single intelligence snapshot by UUID.
func (db *PostgresDB) GetIntelligenceSnapshot(ctx context.Context, id uuid.UUID) (*models.IntelligenceSnapshot, error) {
	query := `
		SELECT id, snapshot_type, title, summary, top_risks, top_opportunities, regions_to_watch, critical_events, emerging_signals, second_order_effects, third_order_effects, world_state_id, confidence, metadata, generated_at
		FROM intelligence_snapshots
		WHERE id = $1
	`
	var intel models.IntelligenceSnapshot
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&intel.ID, &intel.SnapshotType, &intel.Title, &intel.Summary, &intel.TopRisks, &intel.TopOpportunities, &intel.RegionsToWatch, &intel.CriticalEvents, &intel.EmergingSignals, &intel.SecondOrderEffects, &intel.ThirdOrderEffects, &intel.WorldStateID, &intel.Confidence, &intel.Metadata, &intel.GeneratedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, fmt.Errorf("getting intelligence snapshot: %w", err)
	}
	return &intel, nil
}

// ListIntelligenceSnapshots lists past executive briefings paginated.
func (db *PostgresDB) ListIntelligenceSnapshots(ctx context.Context, limit int) ([]models.IntelligenceSnapshot, error) {
	if limit <= 0 {
		limit = 20
	}
	query := `
		SELECT id, snapshot_type, title, summary, top_risks, top_opportunities, regions_to_watch, critical_events, emerging_signals, second_order_effects, third_order_effects, world_state_id, confidence, metadata, generated_at
		FROM intelligence_snapshots
		ORDER BY generated_at DESC
		LIMIT $1
	`
	rows, err := db.Pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("listing intelligence snapshots: %w", err)
	}
	defer rows.Close()

	var snapshots []models.IntelligenceSnapshot
	for rows.Next() {
		var intel models.IntelligenceSnapshot
		err := rows.Scan(
			&intel.ID, &intel.SnapshotType, &intel.Title, &intel.Summary, &intel.TopRisks, &intel.TopOpportunities, &intel.RegionsToWatch, &intel.CriticalEvents, &intel.EmergingSignals, &intel.SecondOrderEffects, &intel.ThirdOrderEffects, &intel.WorldStateID, &intel.Confidence, &intel.Metadata, &intel.GeneratedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning intelligence snapshot row: %w", err)
		}
		snapshots = append(snapshots, intel)
	}
	return snapshots, nil
}
