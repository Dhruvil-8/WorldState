package api

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/worldstate/worldstate/internal/database"
	"github.com/worldstate/worldstate/internal/messaging"
	"github.com/worldstate/worldstate/internal/search"
)

// Server holds all dependencies for the HTTP API.
type Server struct {
	Router *chi.Mux
	DB     *database.PostgresDB
	Redis  *database.RedisDB
	Meili  *search.MeiliClient
	NATS   *messaging.NATSClient
}

// NewServer creates a new API server with all routes configured.
func NewServer(
	db *database.PostgresDB,
	rdb *database.RedisDB,
	meili *search.MeiliClient,
	natsClient *messaging.NATSClient,
) *Server {
	s := &Server{
		Router: chi.NewRouter(),
		DB:     db,
		Redis:  rdb,
		Meili:  meili,
		NATS:   natsClient,
	}

	s.setupMiddleware()
	s.setupRoutes()
	return s
}

func (s *Server) setupMiddleware() {
	s.Router.Use(middleware.RequestID)
	s.Router.Use(middleware.RealIP)
	s.Router.Use(middleware.Logger)
	s.Router.Use(middleware.Recoverer)
	s.Router.Use(middleware.Timeout(30 * time.Second))

	s.Router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link", "X-Total-Count"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
}

func (s *Server) setupRoutes() {
	r := s.Router

	// Health & readiness
	r.Get("/api/health", s.handleHealth)
	r.Get("/api/ready", s.handleReady)

	// API v1
	r.Route("/api/v1", func(r chi.Router) {
		// Sources & Ingestion (Phase 1)
		r.Get("/sources", s.handleListSources)
		r.Post("/sources", s.handleCreateSource)
		r.Get("/documents", s.handleListDocuments)
		r.Get("/documents/{id}", s.handleGetDocument)
		r.Post("/documents", s.handleCreateDocument)

		// World State
		r.Get("/world-state", s.handleGetWorldState)
		r.Get("/world-state/history", s.handleGetWorldStateHistory)

		// Events
		r.Get("/events", s.handleListEvents)
		r.Get("/events/{id}", s.handleGetEvent)

		// Entities
		r.Get("/entities", s.handleListEntities)
		r.Get("/entities/search", s.handleSearchEntities)
		r.Get("/entities/{id}", s.handleGetEntity)
		r.Get("/entities/{id}/prices", s.handleGetEntityPriceHistory)

		// Risks
		r.Get("/risks", s.handleListRisks)
		r.Get("/risks/{type}/history", s.handleGetRiskHistory)
		r.Get("/risks/{type}", s.handleGetRiskByType)

		// Intelligence
		r.Get("/intelligence", s.handleListIntelligence)
		r.Get("/intelligence/latest", s.handleGetLatestIntelligence)
		r.Get("/intelligence/cascading-risks", s.handleListCascadingRisks)
		r.Get("/intelligence/{id}", s.handleGetIntelligence)

		// Relationships
		r.Get("/relationships", s.handleListRelationships)
		r.Get("/relationships/entity/{id}", s.handleGetEntityRelationships)
		r.Get("/relationships/paths", s.handleGetGraphPaths)
	})

	// Fallback
	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "endpoint not found",
		})
	})
}
