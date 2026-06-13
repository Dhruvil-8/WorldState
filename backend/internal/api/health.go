package api

import (
	"context"
	"encoding/json"
	"net/http"
	"time"
)

// HealthResponse represents the health check response.
type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Version   string            `json:"version"`
	Services  map[string]string `json:"services"`
}

// handleHealth returns basic service health.
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, HealthResponse{
		Status:    "ok",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Version:   "0.1.0",
		Services:  map[string]string{},
	})
}

// handleReady checks all downstream dependencies.
func (s *Server) handleReady(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	services := make(map[string]string)
	allHealthy := true

	// PostgreSQL
	if err := s.DB.HealthCheck(ctx); err != nil {
		services["postgres"] = "unhealthy: " + err.Error()
		allHealthy = false
	} else {
		services["postgres"] = "healthy"
	}

	// Redis
	if err := s.Redis.HealthCheck(ctx); err != nil {
		services["redis"] = "unhealthy: " + err.Error()
		allHealthy = false
	} else {
		services["redis"] = "healthy"
	}

	// Meilisearch
	if s.Meili.HealthCheck() {
		services["meilisearch"] = "healthy"
	} else {
		services["meilisearch"] = "unhealthy"
		allHealthy = false
	}

	// NATS
	if s.NATS.HealthCheck() {
		services["nats"] = "healthy"
	} else {
		services["nats"] = "unhealthy"
		allHealthy = false
	}

	status := "ok"
	code := http.StatusOK
	if !allHealthy {
		status = "degraded"
		code = http.StatusServiceUnavailable
	}

	writeJSON(w, code, HealthResponse{
		Status:    status,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Version:   "0.1.0",
		Services:  services,
	})
}

// writeJSON is a helper to send JSON responses.
func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}
