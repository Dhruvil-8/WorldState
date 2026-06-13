package api

import (
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/worldstate/worldstate/internal/messaging"
	"github.com/worldstate/worldstate/internal/models"
)

var allowedSourceTypes = map[string]struct{}{
	"news": {}, "government": {}, "central_bank": {}, "research": {},
	"rss": {}, "economic_calendar": {}, "commodity_feed": {},
	"weather": {}, "disaster": {}, "social": {}, "other": {},
}

// ── Sources Handlers ──────────────────────────────────────────

func (s *Server) handleListSources(w http.ResponseWriter, r *http.Request) {
	sources, err := s.DB.ListSources(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list sources: " + err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"data":  sources,
		"total": len(sources),
	})
}

type CreateSourceRequest struct {
	Name       string         `json:"name"`
	SourceType string         `json:"source_type"`
	URL        string         `json:"url"`
	Country    string         `json:"country"`
	TrustScore float64        `json:"trust_score"`
	Active     *bool          `json:"active"`
	Config     map[string]any `json:"config"`
}

func (s *Server) handleCreateSource(w http.ResponseWriter, r *http.Request) {
	var req CreateSourceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body: " + err.Error()})
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.SourceType = strings.ToLower(strings.TrimSpace(req.SourceType))
	if req.Name == "" || req.SourceType == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name and source_type are required"})
		return
	}
	if _, ok := allowedSourceTypes[req.SourceType]; !ok {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid source_type"})
		return
	}
	if req.TrustScore < 0 || req.TrustScore > 1 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "trust_score must be between 0 and 1"})
		return
	}

	active := true
	if req.Active != nil {
		active = *req.Active
	}

	trustScore := 0.50
	if req.TrustScore > 0 {
		trustScore = req.TrustScore
	}

	src := &models.Source{
		ID:         uuid.New(),
		Name:       req.Name,
		SourceType: req.SourceType,
		URL:        req.URL,
		Country:    req.Country,
		TrustScore: trustScore,
		Active:     active,
		Config:     req.Config,
	}

	if err := s.DB.CreateSource(r.Context(), src); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create source: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, src)
}

// ── Documents Handlers ────────────────────────────────────────

func (s *Server) handleListDocuments(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if offset < 0 {
		offset = 0
	}

	docs, err := s.DB.ListDocuments(r.Context(), limit, offset)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list documents: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"data":   docs,
		"total":  len(docs),
		"limit":  limit,
		"offset": offset,
	})
}

func (s *Server) handleGetDocument(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid document uuid"})
		return
	}

	doc, err := s.DB.GetDocument(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "document not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to retrieve document: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, doc)
}

type CreateDocumentRequest struct {
	SourceID    uuid.UUID      `json:"source_id"`
	SourceName  string         `json:"source_name"`
	Title       string         `json:"title"`
	Content     string         `json:"content"`
	Summary     string         `json:"summary"`
	URL         string         `json:"url"`
	Language    string         `json:"language"`
	PublishedAt *time.Time     `json:"published_at"`
	Metadata    map[string]any `json:"metadata"`
}

func (s *Server) handleCreateDocument(w http.ResponseWriter, r *http.Request) {
	var req CreateDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body: " + err.Error()})
		return
	}

	if req.Title == "" || req.Content == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "title and content are required"})
		return
	}

	// Resolve Source ID
	var sourceID uuid.UUID
	if req.SourceID != uuid.Nil {
		sourceID = req.SourceID
	} else if req.SourceName != "" {
		src, err := s.DB.GetSourceByName(r.Context(), req.SourceName)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				// Create the source on-the-fly to support automated scraper ingestion easily
				src = &models.Source{
					ID:         uuid.New(),
					Name:       req.SourceName,
					SourceType: "news",
					Active:     true,
					TrustScore: 0.50,
				}
				if err := s.DB.CreateSource(r.Context(), src); err != nil {
					writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to auto-create source: " + err.Error()})
					return
				}
			} else {
				writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "querying source name: " + err.Error()})
				return
			}
		}
		sourceID = src.ID
	} else {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "either source_id or source_name must be provided"})
		return
	}

	// Compute Cryptographic Content Hash to Prevent Duplicates
	h := sha256.New()
	h.Write([]byte(req.Content))
	contentHash := fmt.Sprintf("%x", h.Sum(nil))

	// Check if already exists (idempotency check)
	exists, err := s.DB.DocumentExistsByHash(r.Context(), contentHash)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to check document existence: " + err.Error()})
		return
	}
	if exists {
		// Document already ingested. Return HTTP 409 Conflict with informative error.
		writeJSON(w, http.StatusConflict, map[string]string{
			"error":        "document has already been ingested",
			"content_hash": contentHash,
		})
		return
	}

	language := req.Language
	if language == "" {
		language = "en"
	}

	doc := &models.Document{
		ID:          uuid.New(),
		SourceID:    sourceID,
		Title:       req.Title,
		Content:     req.Content,
		Summary:     req.Summary,
		URL:         req.URL,
		Language:    language,
		PublishedAt: req.PublishedAt,
		IngestedAt:  time.Now().UTC(),
		ContentHash: contentHash,
		Metadata:    req.Metadata,
		Processed:   false,
	}

	// 1. Save to PostgreSQL relational database
	if err := s.DB.CreateDocument(r.Context(), doc); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to write document: " + err.Error()})
		return
	}

	// 2. Index in Meilisearch full-text search engine
	if err := s.Meili.AddDocument(doc); err != nil {
		// Log but do not fail the request, allowing graceful degradation of search indexing
		fmt.Printf("[warning] Meilisearch document indexing failed: %v\n", err)
	}

	// 3. Publish to NATS message broker JetStream to trigger asynchronous extraction agents
	docJSON, err := json.Marshal(doc)
	if err == nil {
		if err := s.NATS.Publish(messaging.SubjectDocumentIngested, docJSON); err != nil {
			fmt.Printf("[warning] NATS document ingestion publish failed: %v\n", err)
		}
	}

	writeJSON(w, http.StatusCreated, doc)
}
