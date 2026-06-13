package messaging

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/nats-io/nats.go"
	"github.com/worldstate/worldstate/internal/database"
	"github.com/worldstate/worldstate/internal/models"
	"github.com/worldstate/worldstate/internal/search"
)

// StartConsumers registers JetStream subscription queues to persist extracted events/entities.
func StartConsumers(ctx context.Context, natsClient *NATSClient, db *database.PostgresDB, meili *search.MeiliClient) error {
	js := natsClient.JS

	// ── Event Extracted Consumer ──────────────────────────────
	_, err := js.QueueSubscribe(
		SubjectEventExtracted,
		"ws-backend-event-consumer",
		func(msg *nats.Msg) {
			var evt models.Event
			if err := json.Unmarshal(msg.Data, &evt); err != nil {
				log.Printf("[nats-consumer] error unmarshaling event: %v", err)
				msg.Nak()
				return
			}

			dbCtx := context.Background()

			// Check if a similar event already exists within last 48 hours via pgvector
			if len(evt.Embedding) > 0 {
				matchedID, err := db.FindSimilarEvent(dbCtx, evt.Embedding, 0.85)
				if err != nil {
					log.Printf("[nats-consumer] error checking similarity: %v", err)
				}
				if matchedID != uuid.Nil {
					log.Printf("[nats-consumer] event collision detected: publishing collision message for LLM consensus resolution")
					existingEvt, err := db.GetEvent(dbCtx, matchedID)
					if err != nil {
						log.Printf("[nats-consumer] error fetching existing event: %v", err)
						msg.Nak()
						return
					}

					docIDs := make([]string, len(evt.DocumentIDs))
					for i, id := range evt.DocumentIDs {
						docIDs[i] = id.String()
					}

					payload := models.EventCollisionPayload{
						ExistingEventID:     existingEvt.ID,
						ExistingTitle:       existingEvt.Title,
						ExistingDescription: existingEvt.Description,
						ExistingSeverity:    existingEvt.Severity,
						ExistingConfidence:  existingEvt.Confidence,
						NewTitle:            evt.Title,
						NewDescription:      evt.Description,
						NewSeverity:         evt.Severity,
						NewConfidence:       evt.Confidence,
						DocumentIDs:         docIDs,
					}

					payloadBytes, err := json.Marshal(payload)
					if err != nil {
						log.Printf("[nats-consumer] error marshaling collision payload: %v", err)
						msg.Nak()
						return
					}

					if err := natsClient.Publish(SubjectEventCollision, payloadBytes); err != nil {
						log.Printf("[nats-consumer] error publishing collision message: %v", err)
						msg.Nak()
						return
					}

					msg.Ack()
					return
				}
			}

			// Write to Postgres
			if err := db.CreateEvent(dbCtx, &evt); err != nil {
				log.Printf("[nats-consumer] error saving event to postgres: %v", err)
				msg.Nak()
				return
			}

			// Index in Meilisearch
			if err := meili.AddEvent(&evt); err != nil {
				log.Printf("[nats-consumer] error indexing event to meilisearch: %v", err)
			}

			msg.Ack()
			log.Printf("[nats-consumer] persisted event: %s (%s)", evt.Title, evt.EventType)
		},
		nats.ManualAck(),
		nats.Durable("ws-backend-event-durable"),
	)
	if err != nil {
		return err
	}

	// ── Event Resolved (Consensus) Consumer ───────────────────
	_, err = js.QueueSubscribe(
		SubjectEventResolved,
		"ws-backend-event-resolved-consumer",
		func(msg *nats.Msg) {
			var res models.ConsensusEventResponse
			if err := json.Unmarshal(msg.Data, &res); err != nil {
				log.Printf("[nats-consumer] error unmarshaling resolved event: %v", err)
				msg.Nak()
				return
			}

			dbCtx := context.Background()

			// Fetch existing event
			existingEvt, err := db.GetEvent(dbCtx, res.ExistingEventID)
			if err != nil {
				log.Printf("[nats-consumer] error fetching existing event to resolve: %v", err)
				msg.Nak()
				return
			}

			// Update fields
			existingEvt.Title = res.ResolvedTitle
			existingEvt.Description = res.ResolvedDescription
			existingEvt.Severity = res.ResolvedSeverity
			existingEvt.Confidence = res.ResolvedConfidence
			existingEvt.SourceCount++

			// Append timeline entry to metadata
			if existingEvt.Metadata == nil {
				existingEvt.Metadata = make(map[string]any)
			}
			var timeline []any
			if rawTimeline, ok := existingEvt.Metadata["timeline"]; ok {
				if tList, ok := rawTimeline.([]any); ok {
					timeline = tList
				}
			}
			newEntry := map[string]any{
				"timestamp": time.Now().UTC().Format(time.RFC3339),
				"update":    res.TimelineEntry,
			}
			timeline = append(timeline, newEntry)
			existingEvt.Metadata["timeline"] = timeline

			// Save updates to database
			updateQuery := `
				UPDATE events
				SET title = $2,
					description = $3,
					severity = $4,
					confidence = $5,
					source_count = source_count + 1,
					metadata = $6,
					last_updated_at = NOW()
				WHERE id = $1
			`
			_, err = db.Pool.Exec(dbCtx, updateQuery,
				existingEvt.ID, existingEvt.Title, existingEvt.Description,
				existingEvt.Severity, existingEvt.Confidence, existingEvt.Metadata,
			)
			if err != nil {
				log.Printf("[nats-consumer] error updating resolved event: %v", err)
				msg.Nak()
				return
			}

			// Link new documents
			for _, docStr := range res.DocumentIDs {
				docID, err := uuid.Parse(docStr)
				if err == nil {
					if err := db.LinkEventToDocument(dbCtx, existingEvt.ID, docID); err != nil {
						log.Printf("[nats-consumer] error linking resolved doc: %v", err)
					}
				}
			}

			// Refresh Meilisearch
			if err := meili.AddEvent(existingEvt); err != nil {
				log.Printf("[nats-consumer] error updating meilisearch for resolved event: %v", err)
			}

			msg.Ack()
			log.Printf("[nats-consumer] consensus resolution applied to event: %s", existingEvt.Title)
		},
		nats.ManualAck(),
		nats.Durable("ws-backend-resolved-durable"),
	)
	if err != nil {
		return err
	}

	// ── Entity Extracted Consumer ─────────────────────────────
	_, err = js.QueueSubscribe(
		SubjectEntityExtracted,
		"ws-backend-entity-consumer",
		func(msg *nats.Msg) {
			var ent models.Entity
			if err := json.Unmarshal(msg.Data, &ent); err != nil {
				log.Printf("[nats-consumer] error unmarshaling entity: %v", err)
				msg.Nak()
				return
			}

			// Write to Postgres (Get or Create)
			dbCtx := context.Background()
			saved, err := db.GetOrCreateEntity(dbCtx, &ent)
			if err != nil {
				log.Printf("[nats-consumer] error saving entity to postgres: %v", err)
				msg.Nak()
				return
			}

			// Index in Meilisearch
			if err := meili.AddEntity(saved); err != nil {
				log.Printf("[nats-consumer] error indexing entity to meilisearch: %v", err)
			}

			msg.Ack()
			log.Printf("[nats-consumer] persisted entity: %s (%s)", saved.Name, saved.EntityType)
		},
		nats.ManualAck(),
		nats.Durable("ws-backend-entity-durable"),
	)
	if err != nil {
		return err
	}

	// ── Relationship Extracted Consumer ───────────────────────
	_, err = js.QueueSubscribe(
		SubjectRelationshipExtracted,
		"ws-backend-relationship-consumer",
		func(msg *nats.Msg) {
			type ExtractedRelationshipMsg struct {
				SourceEntity     string         `json:"source_entity"`
				TargetEntity     string         `json:"target_entity"`
				RelationshipType string         `json:"relationship_type"`
				Strength         float64        `json:"strength"`
				Confidence       float64        `json:"confidence"`
				Metadata         map[string]any `json:"metadata,omitempty"`
			}

			var payload ExtractedRelationshipMsg
			if err := json.Unmarshal(msg.Data, &payload); err != nil {
				log.Printf("[nats-consumer] error unmarshaling relationship: %v", err)
				msg.Nak()
				return
			}

			dbCtx := context.Background()

			// Resolve or create source entity
			sourceUUID, err := resolveOrCreateEntity(dbCtx, db, payload.SourceEntity)
			if err != nil {
				log.Printf("[nats-consumer] error resolving source entity '%s': %v", payload.SourceEntity, err)
				msg.Nak()
				return
			}

			// Resolve or create target entity
			targetUUID, err := resolveOrCreateEntity(dbCtx, db, payload.TargetEntity)
			if err != nil {
				log.Printf("[nats-consumer] error resolving target entity '%s': %v", payload.TargetEntity, err)
				msg.Nak()
				return
			}

			// Save to Postgres & Apache AGE
			rel := models.Relationship{
				ID:               uuid.New(),
				SourceEntityID:   sourceUUID,
				TargetEntityID:   targetUUID,
				RelationshipType: payload.RelationshipType,
				Strength:         payload.Strength,
				Confidence:       payload.Confidence,
				Metadata:         payload.Metadata,
			}

			if err := db.CreateRelationship(dbCtx, &rel); err != nil {
				log.Printf("[nats-consumer] error creating relationship: %v", err)
				msg.Nak()
				return
			}

			msg.Ack()
			log.Printf("[nats-consumer] persisted relationship: %s -> %s -> %s", payload.SourceEntity, payload.RelationshipType, payload.TargetEntity)
		},
		nats.ManualAck(),
		nats.Durable("ws-backend-relationship-durable"),
	)
	if err != nil {
		return err
	}

	log.Println("[nats-consumer] background JetStream event/entity/relationship consumers started")
	return nil
}

// resolveOrCreateEntity resolves an entity by name/canonical_name or creates it as a placeholder.
func resolveOrCreateEntity(ctx context.Context, db *database.PostgresDB, name string) (uuid.UUID, error) {
	// 1. Try to find existing entity by name or canonical_name
	query := `
		SELECT id 
		FROM entities 
		WHERE LOWER(name) = LOWER($1) OR LOWER(canonical_name) = LOWER($1)
		LIMIT 1
	`
	var id uuid.UUID
	err := db.Pool.QueryRow(ctx, query, name).Scan(&id)
	if err == nil {
		return id, nil
	}

	// 2. If not found, create a new one using GetOrCreateEntity
	ent := &models.Entity{
		ID:            uuid.New(),
		EntityType:    "organization",
		Name:          name,
		CanonicalName: name,
		Active:        true,
		Importance:    50,
	}
	saved, err := db.GetOrCreateEntity(ctx, ent)
	if err != nil {
		return uuid.Nil, err
	}
	return saved.ID, nil
}
