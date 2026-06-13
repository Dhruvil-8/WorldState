package database

import (
	"testing"

	"github.com/worldstate/worldstate/internal/models"
)

func TestNormalizeEventForInsert(t *testing.T) {
	evt := &models.Event{
		EventType:   "Cyber Attack",
		Category:    "bad-category",
		Status:      "",
		Title:       "",
		Severity:    12,
		Confidence:  -1,
		SourceCount: 0,
	}

	normalizeEventForInsert(evt)

	if evt.EventType != "cyber_attack" {
		t.Fatalf("expected normalized event type, got %q", evt.EventType)
	}
	if evt.Category != "other" {
		t.Fatalf("expected fallback category, got %q", evt.Category)
	}
	if evt.Status != "detected" {
		t.Fatalf("expected default status, got %q", evt.Status)
	}
	if evt.Title == "" {
		t.Fatal("expected default title")
	}
	if evt.Severity != 10 {
		t.Fatalf("expected clamped severity, got %v", evt.Severity)
	}
	if evt.Confidence != 0 {
		t.Fatalf("expected clamped confidence, got %v", evt.Confidence)
	}
	if evt.SourceCount != 1 {
		t.Fatalf("expected default source count, got %d", evt.SourceCount)
	}
}

func TestNormalizeEntityForInsert(t *testing.T) {
	ent := &models.Entity{
		EntityType:    "other",
		Name:          "",
		CanonicalName: "Example Entity",
		Importance:    120,
	}

	normalizeEntityForInsert(ent)

	if ent.EntityType != "organization" {
		t.Fatalf("expected fallback entity type, got %q", ent.EntityType)
	}
	if ent.Name != "Example Entity" {
		t.Fatalf("expected name from canonical name, got %q", ent.Name)
	}
	if ent.Importance != 100 {
		t.Fatalf("expected clamped importance, got %d", ent.Importance)
	}
}

func TestNormalizeRelationshipForInsert(t *testing.T) {
	rel := &models.Relationship{
		RelationshipType: "Allies With",
		Strength:         -0.5,
		Confidence:       1.5,
	}

	normalizeRelationshipForInsert(rel)

	if rel.RelationshipType != "allies_with" {
		t.Fatalf("expected normalized relationship type, got %q", rel.RelationshipType)
	}
	if rel.Strength != 0 {
		t.Fatalf("expected clamped strength, got %v", rel.Strength)
	}
	if rel.Confidence != 1 {
		t.Fatalf("expected clamped confidence, got %v", rel.Confidence)
	}
}

func TestCypherStringEscapesQuotesAndBackslashes(t *testing.T) {
	got := cypherString(`ACME \ 'Research'`)
	want := `ACME \\ \'Research\'`
	if got != want {
		t.Fatalf("expected %q, got %q", want, got)
	}
}
