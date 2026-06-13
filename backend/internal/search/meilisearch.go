package search

import (
	"fmt"
	"log"

	"github.com/meilisearch/meilisearch-go"
	"github.com/worldstate/worldstate/internal/config"
)

// MeiliClient wraps the Meilisearch client.
type MeiliClient struct {
	Client meilisearch.ServiceManager
}

// Index names used by WorldState.
const (
	IndexEvents       = "events"
	IndexEntities     = "entities"
	IndexDocuments    = "documents"
	IndexIntelligence = "intelligence"
)

// NewMeili creates a new Meilisearch client and initializes indexes.
func NewMeili(cfg config.MeiliConfig) (*MeiliClient, error) {
	client := meilisearch.New(cfg.URL(), meilisearch.WithAPIKey(cfg.MasterKey))

	mc := &MeiliClient{Client: client}

	// Initialize indexes
	if err := mc.initIndexes(); err != nil {
		return nil, fmt.Errorf("initializing meilisearch indexes: %w", err)
	}

	log.Println("[meilisearch] connected and indexes initialized")
	return mc, nil
}

// initIndexes creates all required indexes with their settings.
func (m *MeiliClient) initIndexes() error {
	indexes := []struct {
		uid        string
		primaryKey string
		searchable []string
		filterable []string
		sortable   []string
	}{
		{
			uid:        IndexEvents,
			primaryKey: "id",
			searchable: []string{"title", "description", "event_type", "category"},
			filterable: []string{"event_type", "category", "status", "severity"},
			sortable:   []string{"severity", "first_seen_at"},
		},
		{
			uid:        IndexEntities,
			primaryKey: "id",
			searchable: []string{"name", "canonical_name", "aliases", "description", "entity_type"},
			filterable: []string{"entity_type", "importance", "active"},
			sortable:   []string{"importance"},
		},
		{
			uid:        IndexDocuments,
			primaryKey: "id",
			searchable: []string{"title", "content", "summary"},
			filterable: []string{"source_id", "language", "processed"},
			sortable:   []string{"published_at", "ingested_at"},
		},
		{
			uid:        IndexIntelligence,
			primaryKey: "id",
			searchable: []string{"title", "summary"},
			filterable: []string{"snapshot_type", "confidence"},
			sortable:   []string{"generated_at"},
		},
	}

	for _, idx := range indexes {
		task, err := m.Client.CreateIndex(&meilisearch.IndexConfig{
			Uid:        idx.uid,
			PrimaryKey: idx.primaryKey,
		})
		if err != nil {
			log.Printf("[meilisearch] index %s may already exist: %v", idx.uid, err)
		} else {
			log.Printf("[meilisearch] creating index %s (task: %d)", idx.uid, task.TaskUID)
		}

		// Configure searchable attributes
		index := m.Client.Index(idx.uid)
		if _, err := index.UpdateSearchableAttributes(&idx.searchable); err != nil {
			log.Printf("[meilisearch] warning: setting searchable attrs for %s: %v", idx.uid, err)
		}
		if _, err := index.UpdateFilterableAttributes(&idx.filterable); err != nil {
			log.Printf("[meilisearch] warning: setting filterable attrs for %s: %v", idx.uid, err)
		}
		if _, err := index.UpdateSortableAttributes(&idx.sortable); err != nil {
			log.Printf("[meilisearch] warning: setting sortable attrs for %s: %v", idx.uid, err)
		}
	}

	return nil
}

// HealthCheck verifies Meilisearch is reachable.
func (m *MeiliClient) HealthCheck() bool {
	return m.Client.IsHealthy()
}

// AddDocument indexes a single raw document in Meilisearch.
func (m *MeiliClient) AddDocument(doc any) error {
	index := m.Client.Index(IndexDocuments)
	_, err := index.AddDocuments(doc)
	return err
}

// AddEvent indexes a single event in Meilisearch.
func (m *MeiliClient) AddEvent(evt any) error {
	index := m.Client.Index(IndexEvents)
	_, err := index.AddDocuments(evt)
	return err
}

// AddEntity indexes a single entity in Meilisearch.
func (m *MeiliClient) AddEntity(ent any) error {
	index := m.Client.Index(IndexEntities)
	_, err := index.AddDocuments(ent)
	return err
}


