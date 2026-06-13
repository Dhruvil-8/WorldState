package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/worldstate/worldstate/internal/config"
)

// PostgresDB wraps the pgx connection pool.
type PostgresDB struct {
	Pool *pgxpool.Pool
}

// NewPostgres creates a new PostgreSQL connection pool.
func NewPostgres(ctx context.Context, cfg config.PostgresConfig) (*PostgresDB, error) {
	poolCfg, err := pgxpool.ParseConfig(cfg.DSN())
	if err != nil {
		return nil, fmt.Errorf("parsing postgres config: %w", err)
	}

	// Conservative pool settings for 8GB RAM host
	poolCfg.MaxConns = 10
	poolCfg.MinConns = 2
	poolCfg.MaxConnLifetime = 30 * time.Minute
	poolCfg.MaxConnIdleTime = 5 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("creating postgres pool: %w", err)
	}

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("pinging postgres: %w", err)
	}

	log.Println("[postgres] connected successfully")
	return &PostgresDB{Pool: pool}, nil
}

// Close shuts down the connection pool.
func (db *PostgresDB) Close() {
	db.Pool.Close()
	log.Println("[postgres] connection pool closed")
}

// HealthCheck verifies the database is reachable.
func (db *PostgresDB) HealthCheck(ctx context.Context) error {
	return db.Pool.Ping(ctx)
}

// InitAGE ensures the Apache AGE extension is loaded for the session.
// Call this for connections that need graph queries.
func (db *PostgresDB) InitAGE(ctx context.Context) error {
	_, err := db.Pool.Exec(ctx, `
		SET search_path = ag_catalog, "$user", public;
	`)
	return err
}

// EnsureSchema runs safe DDL commands on startup to create newly registered tables/indexes.
func (db *PostgresDB) EnsureSchema(ctx context.Context) error {
	query := `
		CREATE EXTENSION IF NOT EXISTS vector;
		ALTER TABLE events ADD COLUMN IF NOT EXISTS embedding vector(768);
		CREATE INDEX IF NOT EXISTS idx_events_embedding ON events USING hnsw (embedding vector_cosine_ops);

		ALTER TABLE entities ADD COLUMN IF NOT EXISTS pagerank DOUBLE PRECISION DEFAULT 0.0;
		ALTER TABLE entities ADD COLUMN IF NOT EXISTS betweenness DOUBLE PRECISION DEFAULT 0.0;
		ALTER TABLE entities ADD COLUMN IF NOT EXISTS propagated_risk DOUBLE PRECISION DEFAULT 0.0;

		CREATE INDEX IF NOT EXISTS idx_entities_pagerank ON entities(pagerank DESC);
		CREATE INDEX IF NOT EXISTS idx_entities_betweenness ON entities(betweenness DESC);
		CREATE INDEX IF NOT EXISTS idx_entities_propagated_risk ON entities(propagated_risk DESC);

		CREATE TABLE IF NOT EXISTS asset_price_history (
			id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			entity_id       UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
			price           NUMERIC(18, 4) NOT NULL,
			change          NUMERIC(18, 4) NOT NULL,
			change_percent  NUMERIC(8, 4) NOT NULL,
			timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
		CREATE INDEX IF NOT EXISTS idx_asset_price_history_entity ON asset_price_history(entity_id);
		CREATE INDEX IF NOT EXISTS idx_asset_price_history_time ON asset_price_history(timestamp DESC);
	`
	_, err := db.Pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("ensuring table schema: %w", err)
	}
	log.Println("[postgres] schema migrations checked and verified")
	return nil
}
