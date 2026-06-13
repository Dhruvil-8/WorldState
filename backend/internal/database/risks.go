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

// CreateRiskScore appends a new risk score snapshot into PostgreSQL time-series table.
func (db *PostgresDB) CreateRiskScore(ctx context.Context, risk *models.RiskScore) error {
	if risk.ID == uuid.Nil {
		risk.ID = uuid.New()
	}
	if risk.MeasuredAt.IsZero() {
		risk.MeasuredAt = time.Now().UTC()
	}

	query := `
		INSERT INTO risk_scores (id, risk_type, score, trend, confidence, contributing_events, reasoning, measured_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := db.Pool.Exec(ctx, query,
		risk.ID, risk.RiskType, risk.Score, risk.Trend, risk.Confidence, risk.ContributingEvents, risk.Reasoning, risk.MeasuredAt,
	)
	if err != nil {
		return fmt.Errorf("inserting risk score: %w", err)
	}
	return nil
}

// GetLatestRiskScore retrieves the most recent risk score for a category.
func (db *PostgresDB) GetLatestRiskScore(ctx context.Context, riskType string) (*models.RiskScore, error) {
	query := `
		SELECT id, risk_type, score, trend, confidence, contributing_events, reasoning, measured_at
		FROM risk_scores
		WHERE risk_type = $1
		ORDER BY measured_at DESC
		LIMIT 1
	`
	var r models.RiskScore
	err := db.Pool.QueryRow(ctx, query, riskType).Scan(
		&r.ID, &r.RiskType, &r.Score, &r.Trend, &r.Confidence, &r.ContributingEvents, &r.Reasoning, &r.MeasuredAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, fmt.Errorf("getting latest risk score: %w", err)
	}
	return &r, nil
}

// ListLatestRiskScores retrieves the latest risk scores for all 10 categories.
func (db *PostgresDB) ListLatestRiskScores(ctx context.Context) ([]models.RiskScore, error) {
	query := `
		SELECT DISTINCT ON (risk_type) id, risk_type, score, trend, confidence, contributing_events, reasoning, measured_at
		FROM risk_scores
		ORDER BY risk_type, measured_at DESC
	`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listing latest risk scores: %w", err)
	}
	defer rows.Close()

	var risks []models.RiskScore
	for rows.Next() {
		var r models.RiskScore
		err := rows.Scan(
			&r.ID, &r.RiskType, &r.Score, &r.Trend, &r.Confidence, &r.ContributingEvents, &r.Reasoning, &r.MeasuredAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning risk row: %w", err)
		}
		risks = append(risks, r)
	}
	return risks, nil
}

// GetRiskHistory retrieves historical scores for a specific risk type.
func (db *PostgresDB) GetRiskHistory(ctx context.Context, riskType string, limit int) ([]models.RiskScore, error) {
	if limit <= 0 {
		limit = 30
	}
	query := `
		SELECT id, risk_type, score, trend, confidence, contributing_events, reasoning, measured_at
		FROM risk_scores
		WHERE risk_type = $1
		ORDER BY measured_at DESC
		LIMIT $2
	`
	rows, err := db.Pool.Query(ctx, query, riskType, limit)
	if err != nil {
		return nil, fmt.Errorf("getting risk history: %w", err)
	}
	defer rows.Close()

	var history []models.RiskScore
	for rows.Next() {
		var r models.RiskScore
		err := rows.Scan(
			&r.ID, &r.RiskType, &r.Score, &r.Trend, &r.Confidence, &r.ContributingEvents, &r.Reasoning, &r.MeasuredAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning risk history row: %w", err)
		}
		history = append(history, r)
	}
	return history, nil
}

// CreateEventImpact logs how an event specifically affects a single world entity.
func (db *PostgresDB) CreateEventImpact(ctx context.Context, impact *models.EventImpact) error {
	if impact.ID == uuid.Nil {
		impact.ID = uuid.New()
	}
	if impact.CreatedAt.IsZero() {
		impact.CreatedAt = time.Now().UTC()
	}

	query := `
		INSERT INTO event_impacts (id, event_id, entity_id, impact_type, impact_score, confidence, description, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := db.Pool.Exec(ctx, query,
		impact.ID, impact.EventID, impact.EntityID, impact.ImpactType, impact.ImpactScore, impact.Confidence, impact.Description, impact.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("inserting event impact: %w", err)
	}
	return nil
}
