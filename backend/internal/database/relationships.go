package database

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/worldstate/worldstate/internal/models"
)

var allowedRelationshipTypes = map[string]struct{}{
	"imports_from": {}, "exports_to": {}, "produces": {}, "consumes": {},
	"invests_in": {}, "owns": {}, "competes_with": {}, "allies_with": {},
	"opposes": {}, "sanctions": {}, "recognizes": {}, "supports": {},
	"supplies": {}, "depends_on": {}, "manufactures": {}, "ships_through": {},
	"stores": {}, "processes": {}, "correlates_with": {}, "impacts": {},
	"benefits": {}, "harms": {},
}

// CreateRelationship saves a semantic link in PostgreSQL and mirrors it into the Apache AGE graph.
func (db *PostgresDB) CreateRelationship(ctx context.Context, rel *models.Relationship) error {
	normalizeRelationshipForInsert(rel)

	if rel.ID == uuid.Nil {
		rel.ID = uuid.New()
	}
	now := time.Now().UTC()
	rel.CreatedAt = now
	rel.UpdatedAt = now

	// 1. Insert into relational table
	query := `
		INSERT INTO relationships (id, source_entity_id, target_entity_id, relationship_type, strength, confidence, metadata, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (source_entity_id, target_entity_id, relationship_type) DO UPDATE
		SET strength = EXCLUDED.strength, confidence = EXCLUDED.confidence, metadata = EXCLUDED.metadata, updated_at = NOW()
	`
	_, err := db.Pool.Exec(ctx, query,
		rel.ID, rel.SourceEntityID, rel.TargetEntityID, rel.RelationshipType, rel.Strength, rel.Confidence, rel.Metadata, rel.CreatedAt, rel.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("inserting relationship row: %w", err)
	}

	// 2. Mirror relationship as an edge in Apache AGE graph asynchronously/safely
	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := db.CreateGraphEdge(bgCtx, rel); err != nil {
			log.Printf("[warning] could not create graph edge in Apache AGE: %v", err)
		}
	}()

	return nil
}

func normalizeRelationshipForInsert(rel *models.Relationship) {
	rel.RelationshipType = strings.ToLower(strings.TrimSpace(rel.RelationshipType))
	rel.RelationshipType = strings.ReplaceAll(rel.RelationshipType, " ", "_")
	rel.RelationshipType = strings.ReplaceAll(rel.RelationshipType, "-", "_")
	if _, ok := allowedRelationshipTypes[rel.RelationshipType]; !ok {
		rel.RelationshipType = "impacts"
	}
	rel.Strength = clampFloat(rel.Strength, 0, 1)
	rel.Confidence = clampFloat(rel.Confidence, 0, 1)
}

// ListRelationships retrieves semantic links ordered by strength.
func (db *PostgresDB) ListRelationships(ctx context.Context, limit int) ([]models.Relationship, error) {
	if limit <= 0 {
		limit = 50
	}
	query := `
		SELECT id, source_entity_id, target_entity_id, relationship_type, strength, confidence, metadata, created_at, updated_at
		FROM relationships
		ORDER BY strength DESC, updated_at DESC
		LIMIT $1
	`
	rows, err := db.Pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("listing relationships: %w", err)
	}
	defer rows.Close()

	var rels []models.Relationship
	for rows.Next() {
		var r models.Relationship
		err := rows.Scan(
			&r.ID, &r.SourceEntityID, &r.TargetEntityID, &r.RelationshipType, &r.Strength, &r.Confidence, &r.Metadata, &r.CreatedAt, &r.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning relationship row: %w", err)
		}
		rels = append(rels, r)
	}
	return rels, nil
}

// GetEntityRelationships retrieves all semantic links connected to a specific entity.
func (db *PostgresDB) GetEntityRelationships(ctx context.Context, entityID uuid.UUID) ([]models.Relationship, error) {
	query := `
		SELECT id, source_entity_id, target_entity_id, relationship_type, strength, confidence, metadata, created_at, updated_at
		FROM relationships
		WHERE source_entity_id = $1 OR target_entity_id = $1
		ORDER BY strength DESC
	`
	rows, err := db.Pool.Query(ctx, query, entityID)
	if err != nil {
		return nil, fmt.Errorf("getting entity relationships: %w", err)
	}
	defer rows.Close()

	var rels []models.Relationship
	for rows.Next() {
		var r models.Relationship
		err := rows.Scan(
			&r.ID, &r.SourceEntityID, &r.TargetEntityID, &r.RelationshipType, &r.Strength, &r.Confidence, &r.Metadata, &r.CreatedAt, &r.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning relationship row: %w", err)
		}
		rels = append(rels, r)
	}
	return rels, nil
}

// CreateGraphNode creates a node in the Apache AGE graph for an entity.
func (db *PostgresDB) CreateGraphNode(ctx context.Context, ent *models.Entity) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin graph node transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `SET search_path = ag_catalog, "$user", public`); err != nil {
		return fmt.Errorf("setting AGE search path: %w", err)
	}

	// Cypher query to create vertex
	query := fmt.Sprintf(`
		SELECT * FROM cypher('worldstate', $$
			MERGE (e:Entity {id: '%s'})
			SET e.name = '%s', e.type = '%s', e.importance = %d
		$$) as (v agtype);
	`, ent.ID.String(), cypherString(ent.Name), cypherString(ent.EntityType), ent.Importance)

	_, err = tx.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("cypher create node: %w", err)
	}
	return tx.Commit(ctx)
}

// CreateGraphEdge creates a directed edge in the Apache AGE graph representing a relationship.
func (db *PostgresDB) CreateGraphEdge(ctx context.Context, rel *models.Relationship) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin graph edge transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `SET search_path = ag_catalog, "$user", public`); err != nil {
		return fmt.Errorf("setting AGE search path: %w", err)
	}

	// Cypher query to match vertices and create edge
	query := fmt.Sprintf(`
		SELECT * FROM cypher('worldstate', $$
			MATCH (a:Entity {id: '%s'}), (b:Entity {id: '%s'})
			MERGE (a)-[r:%s {id: '%s'}]->(b)
			SET r.strength = %f, r.confidence = %f
		$$) as (v agtype);
	`, rel.SourceEntityID.String(), rel.TargetEntityID.String(), rel.RelationshipType, rel.ID.String(), rel.Strength, rel.Confidence)

	_, err = tx.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("cypher create edge: %w", err)
	}
	return tx.Commit(ctx)
}

func cypherString(value string) string {
	escaped := strings.ReplaceAll(value, `\`, `\\`)
	return strings.ReplaceAll(escaped, `'`, `\'`)
}

// PathRelation represents a step along a traversed path between two entities.
type PathRelation struct {
	SourceEntityName string  `json:"source_entity_name"`
	TargetEntityName string  `json:"target_entity_name"`
	RelationshipType string  `json:"relationship_type"`
	Strength         float64 `json:"strength"`
	Confidence       float64 `json:"confidence"`
	Depth            int     `json:"depth"`
}

// QueryGraphPaths executes a recursive CTE to traverse and return all relationship path steps between a source entity and target entity up to a maximum depth.
func (db *PostgresDB) QueryGraphPaths(ctx context.Context, sourceName, targetName string, maxDepth int) ([]PathRelation, error) {
	if maxDepth <= 0 || maxDepth > 5 {
		maxDepth = 3
	}

	query := `
		WITH RECURSIVE graph_path AS (
			-- Anchor member
			SELECT 
				id, source_entity_id, target_entity_id, relationship_type, strength, confidence,
				ARRAY[source_entity_id, target_entity_id] AS path_nodes,
				1 AS depth
			FROM relationships
			WHERE source_entity_id = (
				SELECT id FROM entities 
				WHERE LOWER(name) = LOWER($1) OR LOWER(canonical_name) = LOWER($1) 
				LIMIT 1
			)

			UNION ALL

			-- Recursive member
			SELECT 
				r.id, r.source_entity_id, r.target_entity_id, r.relationship_type, r.strength, r.confidence,
				gp.path_nodes || r.target_entity_id,
				gp.depth + 1
			FROM relationships r
			INNER JOIN graph_path gp ON r.source_entity_id = gp.target_entity_id
			WHERE gp.depth < $2
			  AND NOT (r.target_entity_id = ANY(gp.path_nodes)) -- prevent infinite cycles
		)
		SELECT 
			(SELECT name FROM entities WHERE id = gp.source_entity_id) AS source_name,
			(SELECT name FROM entities WHERE id = gp.target_entity_id) AS target_name,
			gp.relationship_type, gp.strength, gp.confidence, gp.depth
		FROM graph_path gp
		WHERE gp.target_entity_id = (
			SELECT id FROM entities 
			WHERE LOWER(name) = LOWER($3) OR LOWER(canonical_name) = LOWER($3) 
			LIMIT 1
		)
		ORDER BY gp.depth, gp.strength DESC;
	`

	rows, err := db.Pool.Query(ctx, query, sourceName, maxDepth, targetName)
	if err != nil {
		return nil, fmt.Errorf("querying recursive path: %w", err)
	}
	defer rows.Close()

	var paths []PathRelation
	for rows.Next() {
		var p PathRelation
		err := rows.Scan(
			&p.SourceEntityName, &p.TargetEntityName, &p.RelationshipType, &p.Strength, &p.Confidence, &p.Depth,
		)
		if err != nil {
			return nil, fmt.Errorf("scanning path row: %w", err)
		}
		paths = append(paths, p)
	}
	return paths, nil
}
