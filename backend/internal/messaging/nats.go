package messaging

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/worldstate/worldstate/internal/config"
)

// Subjects used by WorldState services.
const (
	SubjectDocumentIngested      = "worldstate.document.ingested"
	SubjectEventExtracted        = "worldstate.event.extracted"
	SubjectEntityExtracted       = "worldstate.entity.extracted"
	SubjectRelationshipExtracted = "worldstate.relationship.extracted"
	SubjectRiskUpdated           = "worldstate.risk.updated"
	SubjectWorldStateUpdate      = "worldstate.worldstate.updated"
	SubjectIntelGenerated        = "worldstate.intelligence.generated"
	SubjectEventCollision        = "worldstate.event.collision"
	SubjectEventResolved         = "worldstate.event.resolved"
)

// NATSClient wraps the NATS connection.
type NATSClient struct {
	Conn *nats.Conn
	JS   nats.JetStreamContext
}

// NewNATS creates a new NATS connection with JetStream.
func NewNATS(cfg config.NATSConfig) (*NATSClient, error) {
	nc, err := nats.Connect(cfg.URL(),
		nats.Name("worldstate-backend"),
		nats.RetryOnFailedConnect(true),
		nats.MaxReconnects(10),
	)
	if err != nil {
		return nil, fmt.Errorf("connecting to nats: %w", err)
	}

	// Enable JetStream
	js, err := nc.JetStream()
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("enabling jetstream: %w", err)
	}

	// Create the WorldState stream if it doesn't exist.
	if _, err := js.StreamInfo("WORLDSTATE"); err != nil {
		if !errors.Is(err, nats.ErrStreamNotFound) {
			nc.Close()
			return nil, fmt.Errorf("checking WORLDSTATE stream: %w", err)
		}

		_, err = js.AddStream(&nats.StreamConfig{
			Name:     "WORLDSTATE",
			Subjects: []string{"worldstate.>"},
			Storage:  nats.FileStorage,
			MaxAge:   7 * 24 * time.Hour,
		})
		if err != nil {
			nc.Close()
			return nil, fmt.Errorf("creating WORLDSTATE stream: %w", err)
		}
	}

	log.Println("[nats] connected with JetStream")
	return &NATSClient{Conn: nc, JS: js}, nil
}

// Publish sends a message to a subject.
func (n *NATSClient) Publish(subject string, data []byte) error {
	_, err := n.JS.Publish(subject, data)
	return err
}

// Close shuts down the NATS connection.
func (n *NATSClient) Close() {
	n.Conn.Close()
	log.Println("[nats] connection closed")
}

// HealthCheck verifies NATS is connected.
func (n *NATSClient) HealthCheck() bool {
	return n.Conn.IsConnected()
}
