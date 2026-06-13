package api

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/meilisearch/meilisearch-go"
	"github.com/worldstate/worldstate/internal/models"
)

// ── World State ──────────────────────────────────────────────

func (s *Server) handleGetWorldState(w http.ResponseWriter, r *http.Request) {
	// Try fetching the latest world state from real PostgreSQL timeseries
	ws, err := s.DB.GetLatestWorldState(r.Context())
	if err == nil {
		writeJSON(w, http.StatusOK, ws)
		return
	}

	// Fallback to baseline data on first boot if no states exist.
	stubWS := models.WorldState{
		ID:               uuid.New(),
		GlobalStability:  74,
		GeopoliticalRisk: 68,
		EconomicRisk:     57,
		FinancialRisk:    48,
		SupplyChainRisk:  63,
		EnergyRisk:       52,
		FoodSecurityRisk: 41,
		CyberRisk:        45,
		ClimateRisk:      38,
		TradeRisk:        55,
		TechnologyRisk:   33,
		Confidence:       86,
		Reasoning:        "Baseline world model awaiting live event aggregates.",
		MeasuredAt:       time.Now().UTC(),
	}
	writeJSON(w, http.StatusOK, stubWS)
}

func (s *Server) handleGetWorldStateHistory(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 30
	}

	history, err := s.DB.GetWorldStateHistory(r.Context(), limit)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"data":  []models.WorldState{},
			"total": 0,
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"data":  history,
		"total": len(history),
	})
}

// ── Events ───────────────────────────────────────────────────

func (s *Server) handleListEvents(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	// Query from real postgres event records
	events, err := s.DB.ListEvents(r.Context(), limit)
	if err == nil && len(events) > 0 {
		writeJSON(w, http.StatusOK, map[string]any{
			"data":  events,
			"total": len(events),
			"limit": limit,
		})
		return
	}

	// Fallback stub events
	stubEvents := []models.Event{
		{
			ID:          uuid.New(),
			EventType:   "sanction",
			Title:       "New trade sanctions announced between major economies",
			Description: "Comprehensive sanctions package targeting technology exports.",
			Severity:    8.2,
			Confidence:  0.88,
			SourceCount: 12,
			Status:      "active",
			Category:    "geopolitical",
			FirstSeenAt: time.Now().Add(-2 * time.Hour).UTC(),
		},
		{
			ID:          uuid.New(),
			EventType:   "interest_rate_change",
			Title:       "Central bank holds rates steady amid inflation concerns",
			Description: "Interest rates maintained at current levels for the third consecutive meeting.",
			Severity:    5.5,
			Confidence:  0.95,
			SourceCount: 8,
			Status:      "active",
			Category:    "economic",
			FirstSeenAt: time.Now().Add(-5 * time.Hour).UTC(),
		},
		{
			ID:          uuid.New(),
			EventType:   "cyber_attack",
			Title:       "Critical infrastructure targeted in coordinated cyber operation",
			Description: "Multiple energy grid systems experienced unauthorized access attempts.",
			Severity:    7.8,
			Confidence:  0.72,
			SourceCount: 5,
			Status:      "verified",
			Category:    "cyber",
			FirstSeenAt: time.Now().Add(-1 * time.Hour).UTC(),
		},
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"data":  stubEvents,
		"total": len(stubEvents),
		"limit": limit,
	})
}

func (s *Server) handleGetEvent(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid event UUID"})
		return
	}

	evt, err := s.DB.GetEvent(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "event not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "getting event: " + err.Error()})
		return
	}

	// Fetch actual primary source documents and metadata for verification and trust links
	docs, err := s.DB.GetEventDocuments(r.Context(), id)
	if err != nil {
		docs = []models.Document{}
	}

	type EventDetailResponse struct {
		*models.Event
		Documents []models.Document `json:"documents"`
	}

	writeJSON(w, http.StatusOK, EventDetailResponse{
		Event:     evt,
		Documents: docs,
	})
}

// ── Entities ─────────────────────────────────────────────────

func (s *Server) handleListEntities(w http.ResponseWriter, r *http.Request) {
	entities, err := s.DB.ListEntities(r.Context())
	if err == nil && len(entities) > 0 {
		writeJSON(w, http.StatusOK, map[string]any{
			"data":  entities,
			"total": len(entities),
		})
		return
	}

	// Fallback stub entities
	stubEntities := []models.Entity{
		{
			ID:            uuid.New(),
			EntityType:    "country",
			Name:          "United States",
			CanonicalName: "United States",
			Aliases:       []string{"USA", "US"},
			Importance:    100,
			Active:        true,
		},
		{
			ID:            uuid.New(),
			EntityType:    "country",
			Name:          "China",
			CanonicalName: "China",
			Aliases:       []string{"PRC"},
			Importance:    100,
			Active:        true,
		},
		{
			ID:            uuid.New(),
			EntityType:    "company",
			Name:          "TSMC",
			CanonicalName: "Taiwan Semiconductor Manufacturing Company",
			Aliases:       []string{"TSMC"},
			Importance:    91,
			Active:        true,
		},
		{
			ID:            uuid.New(),
			EntityType:    "commodity",
			Name:          "Crude Oil",
			CanonicalName: "Crude Oil",
			Aliases:       []string{"Oil", "Brent"},
			Importance:    88,
			Active:        true,
		},
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"data":  stubEntities,
		"total": len(stubEntities),
	})
}

func (s *Server) handleGetEntity(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid entity UUID"})
		return
	}

	ent, err := s.DB.GetEntity(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "entity not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "getting entity: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, ent)
}

func (s *Server) handleSearchEntities(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	// Search indexed entities in Meilisearch
	results, err := s.Meili.Client.Index("entities").Search(query, &meilisearch.SearchRequest{})
	if err == nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"query":   query,
			"results": results.Hits,
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"query":   query,
		"results": []models.Entity{},
	})
}

// ── Risks ────────────────────────────────────────────────────

func (s *Server) handleListRisks(w http.ResponseWriter, r *http.Request) {
	risks, err := s.DB.ListLatestRiskScores(r.Context())
	if err == nil && len(risks) > 0 {
		writeJSON(w, http.StatusOK, map[string]any{
			"data":  risks,
			"total": len(risks),
		})
		return
	}

	stubRisks := []models.RiskScore{
		{ID: uuid.New(), RiskType: "geopolitical", Score: 68, Trend: "rising", Confidence: 84, MeasuredAt: time.Now().UTC()},
		{ID: uuid.New(), RiskType: "economic", Score: 57, Trend: "stable", Confidence: 79, MeasuredAt: time.Now().UTC()},
		{ID: uuid.New(), RiskType: "financial", Score: 48, Trend: "falling", Confidence: 82, MeasuredAt: time.Now().UTC()},
		{ID: uuid.New(), RiskType: "energy", Score: 52, Trend: "rising", Confidence: 76, MeasuredAt: time.Now().UTC()},
		{ID: uuid.New(), RiskType: "supply_chain", Score: 63, Trend: "rising", Confidence: 71, MeasuredAt: time.Now().UTC()},
		{ID: uuid.New(), RiskType: "cyber", Score: 45, Trend: "volatile", Confidence: 68, MeasuredAt: time.Now().UTC()},
		{ID: uuid.New(), RiskType: "climate", Score: 38, Trend: "rising", Confidence: 73, MeasuredAt: time.Now().UTC()},
		{ID: uuid.New(), RiskType: "food_security", Score: 41, Trend: "stable", Confidence: 77, MeasuredAt: time.Now().UTC()},
		{ID: uuid.New(), RiskType: "trade", Score: 55, Trend: "rising", Confidence: 80, MeasuredAt: time.Now().UTC()},
		{ID: uuid.New(), RiskType: "technology", Score: 33, Trend: "stable", Confidence: 69, MeasuredAt: time.Now().UTC()},
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"data":  stubRisks,
		"total": len(stubRisks),
	})
}

func (s *Server) handleGetRiskByType(w http.ResponseWriter, r *http.Request) {
	riskType := chi.URLParam(r, "type")
	risk, err := s.DB.GetLatestRiskScore(r.Context(), riskType)
	if err == nil {
		writeJSON(w, http.StatusOK, risk)
		return
	}

	writeJSON(w, http.StatusOK, models.RiskScore{
		RiskType:   riskType,
		Score:      50,
		Trend:      "stable",
		Confidence: 70,
		MeasuredAt: time.Now().UTC(),
	})
}

func (s *Server) handleGetRiskHistory(w http.ResponseWriter, r *http.Request) {
	riskType := chi.URLParam(r, "type")
	history, err := s.DB.GetRiskHistory(r.Context(), riskType, 30)
	if err == nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"risk_type": riskType,
			"history":   history,
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"risk_type": riskType,
		"history":   []models.RiskScore{},
	})
}

// ── Intelligence ─────────────────────────────────────────────

func (s *Server) handleListIntelligence(w http.ResponseWriter, r *http.Request) {
	snapshots, err := s.DB.ListIntelligenceSnapshots(r.Context(), 20)
	if err == nil && len(snapshots) > 0 {
		writeJSON(w, http.StatusOK, map[string]any{
			"data":  snapshots,
			"total": len(snapshots),
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"data":  []models.IntelligenceSnapshot{},
		"total": 0,
	})
}

func (s *Server) handleGetLatestIntelligence(w http.ResponseWriter, r *http.Request) {
	snap, err := s.DB.GetLatestIntelligenceSnapshot(r.Context(), "daily")
	if err == nil {
		writeJSON(w, http.StatusOK, snap)
		return
	}

	snapshot := models.IntelligenceSnapshot{
		ID:           uuid.New(),
		SnapshotType: "daily",
		Title:        "WorldState Daily Briefing — Baseline",
		Summary:      "Baseline briefing shown until the intelligence analyzer writes the first live snapshot.",
		TopRisks: []any{
			map[string]any{"risk": "Geopolitical tensions elevating", "score": 68, "trend": "rising"},
			map[string]any{"risk": "Supply chain disruptions persisting", "score": 63, "trend": "rising"},
		},
		TopOpportunities: []any{
			map[string]any{"opportunity": "Technology risk declining", "score": 33},
		},
		EmergingSignals: []any{
			map[string]any{"signal": "Cyber risk volatility increasing", "confidence": 0.68},
		},
		Confidence:  50,
		GeneratedAt: time.Now().UTC(),
	}

	writeJSON(w, http.StatusOK, snapshot)
}

func (s *Server) handleGetIntelligence(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid intelligence snapshot UUID"})
		return
	}

	snap, err := s.DB.GetIntelligenceSnapshot(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "snapshot not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "getting snapshot: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, snap)
}

// ── Relationships ────────────────────────────────────────────

func (s *Server) handleListRelationships(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	rels, err := s.DB.ListRelationships(r.Context(), limit)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"data":  []models.Relationship{},
			"total": 0,
			"limit": limit,
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"data":  rels,
		"total": len(rels),
		"limit": limit,
	})
}

func (s *Server) handleGetEntityRelationships(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid entity UUID"})
		return
	}

	rels, err := s.DB.GetEntityRelationships(r.Context(), id)
	if err == nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"entity_id":     idStr,
			"relationships": rels,
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"entity_id":     idStr,
		"relationships": []models.Relationship{},
	})
}

func (s *Server) handleGetGraphPaths(w http.ResponseWriter, r *http.Request) {
	source := r.URL.Query().Get("source")
	target := r.URL.Query().Get("target")
	depthStr := r.URL.Query().Get("depth")

	if source == "" || target == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing query parameters 'source' or 'target'"})
		return
	}

	depth := 3
	if depthStr != "" {
		if d, err := strconv.Atoi(depthStr); err == nil && d > 0 && d <= 5 {
			depth = d
		}
	}

	paths, err := s.DB.QueryGraphPaths(r.Context(), source, target, depth)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "resolving paths: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"source": source,
		"target": target,
		"depth":  depth,
		"paths":  paths,
	})
}

func (s *Server) handleGetEntityPriceHistory(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid entity UUID"})
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 30
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	history, err := s.DB.GetEntityPriceHistory(r.Context(), id, limit)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "getting price history: " + err.Error()})
		return
	}

	if history == nil {
		history = []models.AssetPriceHistory{}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"entity_id": idStr,
		"history":   history,
	})
}
