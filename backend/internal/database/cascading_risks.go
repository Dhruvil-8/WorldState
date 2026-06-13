package database

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/worldstate/worldstate/internal/models"
)

// CreateCascadingRisk stores a newly generated cascading risk forecast.
func (db *PostgresDB) CreateCascadingRisk(ctx context.Context, risk *models.CascadingRisk) error {
	if risk.ID == uuid.Nil {
		risk.ID = uuid.New()
	}
	if risk.CreatedAt.IsZero() {
		risk.CreatedAt = time.Now().UTC()
	}

	query := `
		INSERT INTO cascading_risks (id, title, scenario, severity, confidence, impacted_entity_ids, trigger_event_ids, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := db.Pool.Exec(ctx, query,
		risk.ID, risk.Title, risk.Scenario, risk.Severity, risk.Confidence, risk.ImpactedEntityIDs, risk.TriggerEventIDs, risk.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("creating cascading risk: %w", err)
	}

	return nil
}

// ListCascadingRisks lists cascading risk scenarios.
func (db *PostgresDB) ListCascadingRisks(ctx context.Context, limit int) ([]models.CascadingRisk, error) {
	if limit <= 0 {
		limit = 20
	}

	query := `
		SELECT id, title, scenario, severity, confidence, impacted_entity_ids, trigger_event_ids, created_at
		FROM cascading_risks
		ORDER BY created_at DESC
		LIMIT $1
	`
	rows, err := db.Pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("listing cascading risks: %w", err)
	}
	defer rows.Close()

	var risks []models.CascadingRisk
	for rows.Next() {
		var r models.CascadingRisk
		err := rows.Scan(
			&r.ID, &r.Title, &r.Scenario, &r.Severity, &r.Confidence, &r.ImpactedEntityIDs, &r.TriggerEventIDs, &r.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning cascading risk row: %w", err)
		}
		risks = append(risks, r)
	}

	return risks, nil
}
