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

// CreateSource inserts a new source into the database.
func (db *PostgresDB) CreateSource(ctx context.Context, src *models.Source) error {
	if src.ID == uuid.Nil {
		src.ID = uuid.New()
	}
	now := time.Now().UTC()
	src.CreatedAt = now
	src.UpdatedAt = now

	query := `
		INSERT INTO sources (id, name, source_type, url, country, trust_score, active, config, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (name) DO UPDATE
		SET source_type = EXCLUDED.source_type, url = EXCLUDED.url, country = EXCLUDED.country, 
		    trust_score = EXCLUDED.trust_score, active = EXCLUDED.active, config = EXCLUDED.config, 
		    updated_at = NOW()
	`
	_, err := db.Pool.Exec(ctx, query,
		src.ID, src.Name, src.SourceType, src.URL, src.Country, src.TrustScore, src.Active, src.Config, src.CreatedAt, src.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("inserting source: %w", err)
	}
	return nil
}

// GetSourceByName retrieves a source by its unique name.
func (db *PostgresDB) GetSourceByName(ctx context.Context, name string) (*models.Source, error) {
	query := `
		SELECT id, name, source_type, url, country, trust_score, active, config, created_at, updated_at
		FROM sources
		WHERE name = $1
	`
	var src models.Source
	err := db.Pool.QueryRow(ctx, query, name).Scan(
		&src.ID, &src.Name, &src.SourceType, &src.URL, &src.Country, &src.TrustScore, &src.Active, &src.Config, &src.CreatedAt, &src.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, fmt.Errorf("getting source by name: %w", err)
	}
	return &src, nil
}

// GetSourceByID retrieves a source by its UUID.
func (db *PostgresDB) GetSourceByID(ctx context.Context, id uuid.UUID) (*models.Source, error) {
	query := `
		SELECT id, name, source_type, url, country, trust_score, active, config, created_at, updated_at
		FROM sources
		WHERE id = $1
	`
	var src models.Source
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&src.ID, &src.Name, &src.SourceType, &src.URL, &src.Country, &src.TrustScore, &src.Active, &src.Config, &src.CreatedAt, &src.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, fmt.Errorf("getting source by id: %w", err)
	}
	return &src, nil
}

// ListSources returns all registered sources.
func (db *PostgresDB) ListSources(ctx context.Context) ([]models.Source, error) {
	query := `
		SELECT id, name, source_type, url, country, trust_score, active, config, created_at, updated_at
		FROM sources
		ORDER BY trust_score DESC, name ASC
	`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listing sources: %w", err)
	}
	defer rows.Close()

	var sources []models.Source
	for rows.Next() {
		var src models.Source
		err := rows.Scan(
			&src.ID, &src.Name, &src.SourceType, &src.URL, &src.Country, &src.TrustScore, &src.Active, &src.Config, &src.CreatedAt, &src.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning source row: %w", err)
		}
		sources = append(sources, src)
	}
	return sources, nil
}

// CreateDocument inserts a raw document.
func (db *PostgresDB) CreateDocument(ctx context.Context, doc *models.Document) error {
	if doc.ID == uuid.Nil {
		doc.ID = uuid.New()
	}
	if doc.IngestedAt.IsZero() {
		doc.IngestedAt = time.Now().UTC()
	}

	query := `
		INSERT INTO documents (id, source_id, title, content, summary, url, language, published_at, ingested_at, content_hash, metadata, processed)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`
	_, err := db.Pool.Exec(ctx, query,
		doc.ID, doc.SourceID, doc.Title, doc.Content, doc.Summary, doc.URL, doc.Language, doc.PublishedAt, doc.IngestedAt, doc.ContentHash, doc.Metadata, doc.Processed,
	)
	if err != nil {
		return fmt.Errorf("inserting document: %w", err)
	}
	return nil
}

// GetDocument retrieves a document by UUID.
func (db *PostgresDB) GetDocument(ctx context.Context, id uuid.UUID) (*models.Document, error) {
	query := `
		SELECT id, source_id, title, content, summary, url, language, published_at, ingested_at, content_hash, metadata, processed
		FROM documents
		WHERE id = $1
	`
	var doc models.Document
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&doc.ID, &doc.SourceID, &doc.Title, &doc.Content, &doc.Summary, &doc.URL, &doc.Language, &doc.PublishedAt, &doc.IngestedAt, &doc.ContentHash, &doc.Metadata, &doc.Processed,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, fmt.Errorf("getting document: %w", err)
	}
	return &doc, nil
}

// DocumentExistsByHash checks if a document with the same hash exists.
func (db *PostgresDB) DocumentExistsByHash(ctx context.Context, hash string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM documents WHERE content_hash = $1)`
	var exists bool
	err := db.Pool.QueryRow(ctx, query, hash).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("checking document hash existence: %w", err)
	}
	return exists, nil
}

// ListDocuments returns a paginated list of ingested documents.
func (db *PostgresDB) ListDocuments(ctx context.Context, limit, offset int) ([]models.Document, error) {
	query := `
		SELECT id, source_id, title, content, summary, url, language, published_at, ingested_at, content_hash, metadata, processed
		FROM documents
		ORDER BY ingested_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := db.Pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("listing documents: %w", err)
	}
	defer rows.Close()

	var docs []models.Document
	for rows.Next() {
		var doc models.Document
		err := rows.Scan(
			&doc.ID, &doc.SourceID, &doc.Title, &doc.Content, &doc.Summary, &doc.URL, &doc.Language, &doc.PublishedAt, &doc.IngestedAt, &doc.ContentHash, &doc.Metadata, &doc.Processed,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning document row: %w", err)
		}
		docs = append(docs, doc)
	}
	return docs, nil
}

// MarkDocumentProcessed marks a document as analyzed.
func (db *PostgresDB) MarkDocumentProcessed(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE documents SET processed = true WHERE id = $1`
	_, err := db.Pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("marking document processed: %w", err)
	}
	return nil
}
