package database

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/worldstate/worldstate/internal/models"
)

var allowedEntityTypes = map[string]struct{}{
	"country": {}, "region": {}, "city": {}, "organization": {}, "company": {},
	"industry": {}, "commodity": {}, "currency": {}, "person": {},
	"military_unit": {}, "infrastructure": {}, "technology": {},
	"financial_asset": {}, "policy": {}, "treaty": {}, "port": {},
	"shipping_route": {}, "energy_asset": {},
}

var allowedEventTypes = map[string]struct{}{
	"conflict": {}, "military_action": {}, "election": {}, "sanction": {},
	"diplomatic_action": {}, "border_dispute": {}, "government_change": {},
	"interest_rate_change": {}, "inflation_release": {}, "gdp_release": {},
	"pmi_release": {}, "employment_data": {}, "debt_event": {},
	"tariff": {}, "export_restriction": {}, "import_restriction": {},
	"trade_agreement": {}, "factory_shutdown": {}, "port_congestion": {},
	"logistics_disruption": {}, "oil_shock": {}, "gas_shock": {},
	"food_shock": {}, "metal_shock": {}, "earthquake": {}, "flood": {},
	"wildfire": {}, "drought": {}, "storm": {}, "cyber_attack": {},
	"data_breach": {}, "infrastructure_attack": {}, "policy_change": {},
	"other": {},
}

var allowedEventCategories = map[string]struct{}{
	"geopolitical": {}, "economic": {}, "trade": {}, "supply_chain": {},
	"commodity": {}, "environment": {}, "cyber": {}, "other": {},
}

var allowedEventStatuses = map[string]struct{}{
	"detected": {}, "verified": {}, "active": {}, "monitoring": {},
	"resolved": {}, "archived": {},
}

// CreateEvent inserts a new event and links it to its origin documents.
func (db *PostgresDB) CreateEvent(ctx context.Context, evt *models.Event) error {
	normalizeEventForInsert(evt)

	if evt.ID == uuid.Nil {
		evt.ID = uuid.New()
	}
	now := time.Now().UTC()
	if evt.FirstSeenAt.IsZero() {
		evt.FirstSeenAt = now
	}
	if evt.LastUpdatedAt.IsZero() {
		evt.LastUpdatedAt = now
	}

	var embParam *string
	if len(evt.Embedding) > 0 {
		s := formatEmbedding(evt.Embedding)
		embParam = &s
	}

	query := `
		INSERT INTO events (id, event_type, title, description, severity, confidence, source_count, status, category, location, metadata, first_seen_at, last_updated_at, resolved_at, embedding)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`
	_, err := db.Pool.Exec(ctx, query,
		evt.ID, evt.EventType, evt.Title, evt.Description, evt.Severity, evt.Confidence, evt.SourceCount, evt.Status, evt.Category, evt.Location, evt.Metadata, evt.FirstSeenAt, evt.LastUpdatedAt, evt.ResolvedAt, embParam,
	)
	if err != nil {
		return fmt.Errorf("inserting event: %w", err)
	}

	// Link contributing documents
	for _, docID := range evt.DocumentIDs {
		if err := db.LinkEventToDocument(ctx, evt.ID, docID); err != nil {
			return err
		}
	}

	return nil
}

// GetEvent retrieves a single event by UUID.
func (db *PostgresDB) GetEvent(ctx context.Context, id uuid.UUID) (*models.Event, error) {
	query := `
		SELECT id, event_type, title, description, severity, confidence, source_count, status, category, location, metadata, first_seen_at, last_updated_at, resolved_at, embedding::text
		FROM events
		WHERE id = $1
	`
	var evt models.Event
	var embStr sql.NullString
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&evt.ID, &evt.EventType, &evt.Title, &evt.Description, &evt.Severity, &evt.Confidence, &evt.SourceCount, &evt.Status, &evt.Category, &evt.Location, &evt.Metadata, &evt.FirstSeenAt, &evt.LastUpdatedAt, &evt.ResolvedAt, &embStr,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, fmt.Errorf("getting event: %w", err)
	}
	if embStr.Valid {
		evt.Embedding = parseEmbedding(embStr.String)
	}

	// Retrieve document associations
	docQuery := `SELECT document_id FROM event_documents WHERE event_id = $1`
	rows, err := db.Pool.Query(ctx, docQuery, id)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var docID uuid.UUID
			if err := rows.Scan(&docID); err == nil {
				evt.DocumentIDs = append(evt.DocumentIDs, docID)
			}
		}
	}

	// Retrieve entity associations
	entQuery := `SELECT entity_id FROM event_entities WHERE event_id = $1`
	rows2, err := db.Pool.Query(ctx, entQuery, id)
	if err == nil {
		defer rows2.Close()
		for rows2.Next() {
			var entID uuid.UUID
			if err := rows2.Scan(&entID); err == nil {
				evt.EntityIDs = append(evt.EntityIDs, entID)
			}
		}
	}

	return &evt, nil
}

// LinkEventToDocument registers a contributing document to an event.
func (db *PostgresDB) LinkEventToDocument(ctx context.Context, eventID, documentID uuid.UUID) error {
	query := `
		INSERT INTO event_documents (event_id, document_id)
		VALUES ($1, $2)
		ON CONFLICT (event_id, document_id) DO NOTHING
	`
	_, err := db.Pool.Exec(ctx, query, eventID, documentID)
	if err != nil {
		return fmt.Errorf("linking event to document: %w", err)
	}
	return nil
}

// GetOrCreateEntity fetches an entity if it matches canonical_name + type, or creates a new one.
func (db *PostgresDB) GetOrCreateEntity(ctx context.Context, ent *models.Entity) (*models.Entity, error) {
	normalizeEntityForInsert(ent)

	// 1. Check if entity already exists
	querySelect := `
		SELECT id, entity_type, name, canonical_name, aliases, description, importance, active, metadata, created_at, updated_at, pagerank, betweenness, propagated_risk
		FROM entities
		WHERE canonical_name = $1 AND entity_type = $2
	`
	var existing models.Entity
	err := db.Pool.QueryRow(ctx, querySelect, ent.CanonicalName, ent.EntityType).Scan(
		&existing.ID, &existing.EntityType, &existing.Name, &existing.CanonicalName, &existing.Aliases, &existing.Description, &existing.Importance, &existing.Active, &existing.Metadata, &existing.CreatedAt, &existing.UpdatedAt, &existing.PageRank, &existing.Betweenness, &existing.PropagatedRisk,
	)
	if err == nil {
		return &existing, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("checking entity existence: %w", err)
	}

	// 2. Create the entity if missing
	if ent.ID == uuid.Nil {
		ent.ID = uuid.New()
	}
	now := time.Now().UTC()
	ent.CreatedAt = now
	ent.UpdatedAt = now

	queryInsert := `
		INSERT INTO entities (id, entity_type, name, canonical_name, aliases, description, importance, active, metadata, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err = db.Pool.Exec(ctx, queryInsert,
		ent.ID, ent.EntityType, ent.Name, ent.CanonicalName, ent.Aliases, ent.Description, ent.Importance, ent.Active, ent.Metadata, ent.CreatedAt, ent.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("creating entity: %w", err)
	}

	// Mirror entity as a node in Apache AGE safely
	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := db.CreateGraphNode(bgCtx, ent); err != nil {
			log.Printf("[warning] could not create graph node in Apache AGE: %v", err)
		}
	}()

	return ent, nil
}

func normalizeEventForInsert(evt *models.Event) {
	evt.EventType = normalizeAllowed(evt.EventType, allowedEventTypes, "other")
	evt.Category = normalizeAllowed(evt.Category, allowedEventCategories, "other")
	evt.Status = normalizeAllowed(evt.Status, allowedEventStatuses, "detected")
	if strings.TrimSpace(evt.Title) == "" {
		evt.Title = "Untitled event"
	}
	if evt.SourceCount <= 0 {
		evt.SourceCount = 1
	}
	evt.Severity = clampFloat(evt.Severity, 0, 10)
	evt.Confidence = clampFloat(evt.Confidence, 0, 1)
}

func normalizeEntityForInsert(ent *models.Entity) {
	ent.EntityType = normalizeAllowed(ent.EntityType, allowedEntityTypes, "organization")
	if strings.TrimSpace(ent.Name) == "" {
		ent.Name = strings.TrimSpace(ent.CanonicalName)
	}
	if strings.TrimSpace(ent.Name) == "" {
		ent.Name = "Unknown Entity"
	}
	if strings.TrimSpace(ent.CanonicalName) == "" {
		ent.CanonicalName = ent.Name
	}
	if ent.Importance < 0 {
		ent.Importance = 0
	}
	if ent.Importance > 100 {
		ent.Importance = 100
	}
}

func normalizeAllowed(value string, allowed map[string]struct{}, fallback string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	normalized = strings.ReplaceAll(normalized, " ", "_")
	normalized = strings.ReplaceAll(normalized, "-", "_")
	if _, ok := allowed[normalized]; ok {
		return normalized
	}
	return fallback
}

func clampFloat(value, minValue, maxValue float64) float64 {
	if value < minValue {
		return minValue
	}
	if value > maxValue {
		return maxValue
	}
	return value
}

// LinkEventToEntity associates an entity with an event in a specific role.
func (db *PostgresDB) LinkEventToEntity(ctx context.Context, eventID, entityID uuid.UUID, role string) error {
	if role == "" {
		role = "involved"
	}
	query := `
		INSERT INTO event_entities (event_id, entity_id, role)
		VALUES ($1, $2, $3)
		ON CONFLICT (event_id, entity_id) DO NOTHING
	`
	_, err := db.Pool.Exec(ctx, query, eventID, entityID, role)
	if err != nil {
		return fmt.Errorf("linking event to entity: %w", err)
	}
	return nil
}

// ListEvents retrieves all active/monitored events in the database.
func (db *PostgresDB) ListEvents(ctx context.Context, limit int) ([]models.Event, error) {
	if limit <= 0 {
		limit = 50
	}
	query := `
		SELECT id, event_type, title, description, severity, confidence, source_count, status, category, location, metadata, first_seen_at, last_updated_at, resolved_at
		FROM events
		ORDER BY first_seen_at DESC
		LIMIT $1
	`
	rows, err := db.Pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("listing events: %w", err)
	}
	defer rows.Close()

	var events []models.Event
	for rows.Next() {
		var evt models.Event
		err := rows.Scan(
			&evt.ID, &evt.EventType, &evt.Title, &evt.Description, &evt.Severity, &evt.Confidence, &evt.SourceCount, &evt.Status, &evt.Category, &evt.Location, &evt.Metadata, &evt.FirstSeenAt, &evt.LastUpdatedAt, &evt.ResolvedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning event row: %w", err)
		}
		events = append(events, evt)
	}
	return events, nil
}

// ListEntities retrieves all tracked entities.
func (db *PostgresDB) ListEntities(ctx context.Context) ([]models.Entity, error) {
	query := `
		SELECT id, entity_type, name, canonical_name, aliases, description, importance, active, metadata, created_at, updated_at, pagerank, betweenness, propagated_risk
		FROM entities
		ORDER BY importance DESC, name ASC
	`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listing entities: %w", err)
	}
	defer rows.Close()

	var entities []models.Entity
	for rows.Next() {
		var ent models.Entity
		err := rows.Scan(
			&ent.ID, &ent.EntityType, &ent.Name, &ent.CanonicalName, &ent.Aliases, &ent.Description, &ent.Importance, &ent.Active, &ent.Metadata, &ent.CreatedAt, &ent.UpdatedAt, &ent.PageRank, &ent.Betweenness, &ent.PropagatedRisk,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning entity row: %w", err)
		}
		entities = append(entities, ent)
	}
	return entities, nil
}

// GetEntity retrieves a single entity by UUID.
func (db *PostgresDB) GetEntity(ctx context.Context, id uuid.UUID) (*models.Entity, error) {
	query := `
		SELECT id, entity_type, name, canonical_name, aliases, description, importance, active, metadata, created_at, updated_at, pagerank, betweenness, propagated_risk
		FROM entities
		WHERE id = $1
	`
	var ent models.Entity
	err := db.Pool.QueryRow(ctx, query, id).Scan(
		&ent.ID, &ent.EntityType, &ent.Name, &ent.CanonicalName, &ent.Aliases, &ent.Description, &ent.Importance, &ent.Active, &ent.Metadata, &ent.CreatedAt, &ent.UpdatedAt, &ent.PageRank, &ent.Betweenness, &ent.PropagatedRisk,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, fmt.Errorf("getting entity: %w", err)
	}
	return &ent, nil
}

// GetEventDocuments retrieves all documents associated with a specific event.
func (db *PostgresDB) GetEventDocuments(ctx context.Context, eventID uuid.UUID) ([]models.Document, error) {
	query := `
		SELECT d.id, d.source_id, s.name AS source_name, d.title, d.content, d.summary, d.url, d.language, d.published_at, d.ingested_at, d.content_hash, d.metadata, d.processed
		FROM documents d
		JOIN event_documents ed ON d.id = ed.document_id
		LEFT JOIN sources s ON d.source_id = s.id
		WHERE ed.event_id = $1
		ORDER BY d.published_at DESC NULLS LAST, d.ingested_at DESC
	`
	rows, err := db.Pool.Query(ctx, query, eventID)
	if err != nil {
		return nil, fmt.Errorf("getting event documents: %w", err)
	}
	defer rows.Close()

	var docs []models.Document
	for rows.Next() {
		var doc models.Document
		var sourceName sql.NullString
		err := rows.Scan(
			&doc.ID, &doc.SourceID, &sourceName, &doc.Title, &doc.Content, &doc.Summary, &doc.URL, &doc.Language, &doc.PublishedAt, &doc.IngestedAt, &doc.ContentHash, &doc.Metadata, &doc.Processed,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning document row: %w", err)
		}
		if doc.Metadata == nil {
			doc.Metadata = make(map[string]any)
		}
		if sourceName.Valid {
			doc.Metadata["source_name"] = sourceName.String
		} else {
			doc.Metadata["source_name"] = "Unknown Source"
		}
		docs = append(docs, doc)
	}
	return docs, nil
}

// GetEntityPriceHistory retrieves historical price points for a given entity.
func (db *PostgresDB) GetEntityPriceHistory(ctx context.Context, entityID uuid.UUID, limit int) ([]models.AssetPriceHistory, error) {
	if limit <= 0 {
		limit = 30
	}
	query := `
		SELECT id, entity_id, price, change, change_percent, timestamp
		FROM asset_price_history
		WHERE entity_id = $1
		ORDER BY timestamp DESC
		LIMIT $2
	`
	rows, err := db.Pool.Query(ctx, query, entityID, limit)
	if err != nil {
		return nil, fmt.Errorf("getting entity price history: %w", err)
	}
	defer rows.Close()

	var history []models.AssetPriceHistory
	for rows.Next() {
		var pt models.AssetPriceHistory
		err := rows.Scan(&pt.ID, &pt.EntityID, &pt.Price, &pt.Change, &pt.ChangePercent, &pt.Timestamp)
		if err != nil {
			return nil, fmt.Errorf("scanning price history row: %w", err)
		}
		history = append(history, pt)
	}
	return history, nil
}

// FindSimilarEvent queries the database for a recent event (last 48 hours) with cosine similarity above the threshold.
func (db *PostgresDB) FindSimilarEvent(ctx context.Context, emb []float32, threshold float64) (uuid.UUID, error) {
	if len(emb) == 0 {
		return uuid.Nil, nil
	}
	embStr := formatEmbedding(emb)
	query := `
		SELECT id
		FROM events
		WHERE first_seen_at > NOW() - INTERVAL '48 hours'
		  AND embedding IS NOT NULL
		  AND 1 - (embedding <=> $1::vector) >= $2
		ORDER BY embedding <=> $1::vector ASC
		LIMIT 1
	`
	var id uuid.UUID
	err := db.Pool.QueryRow(ctx, query, embStr, threshold).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return uuid.Nil, nil
		}
		return uuid.Nil, fmt.Errorf("finding similar event: %w", err)
	}
	return id, nil
}

func formatEmbedding(emb []float32) string {
	var sb strings.Builder
	sb.WriteByte('[')
	for i, val := range emb {
		if i > 0 {
			sb.WriteByte(',')
		}
		sb.WriteString(fmt.Sprintf("%f", val))
	}
	sb.WriteByte(']')
	return sb.String()
}

func parseEmbedding(embStr string) []float32 {
	if embStr == "" {
		return nil
	}
	// PgVector string format is "[val1,val2,...]"
	embStr = strings.Trim(embStr, "[] ")
	if embStr == "" {
		return nil
	}
	parts := strings.Split(embStr, ",")
	res := make([]float32, len(parts))
	for i, p := range parts {
		var val float32
		fmt.Sscanf(strings.TrimSpace(p), "%f", &val)
		res[i] = val
	}
	return res
}

