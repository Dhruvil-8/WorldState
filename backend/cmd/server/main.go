package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/worldstate/worldstate/internal/api"
	"github.com/worldstate/worldstate/internal/config"
	"github.com/worldstate/worldstate/internal/database"
	"github.com/worldstate/worldstate/internal/messaging"
	"github.com/worldstate/worldstate/internal/search"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("WorldState Backend v0.1.0 starting...")

	// Load configuration
	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// ── Connect to PostgreSQL ────────────────────────────────
	db, err := database.NewPostgres(ctx, cfg.Postgres)
	if err != nil {
		log.Fatalf("failed to connect to postgres: %v", err)
	}
	defer db.Close()

	// Ensure required tables and indexes exist (e.g. asset_price_history)
	if err := db.EnsureSchema(ctx); err != nil {
		log.Fatalf("failed to verify postgres database schema: %v", err)
	}

	// Initialize Apache AGE search path
	if err := db.InitAGE(ctx); err != nil {
		log.Printf("[warning] could not initialize AGE: %v", err)
	}

	// ── Connect to Redis ─────────────────────────────────────
	rdb, err := database.NewRedis(ctx, cfg.Redis)
	if err != nil {
		log.Fatalf("failed to connect to redis: %v", err)
	}
	defer rdb.Close()

	// ── Connect to Meilisearch ───────────────────────────────
	meili, err := search.NewMeili(cfg.Meili)
	if err != nil {
		log.Fatalf("failed to connect to meilisearch: %v", err)
	}

	// ── Connect to NATS ──────────────────────────────────────
	natsClient, err := messaging.NewNATS(cfg.NATS)
	if err != nil {
		log.Fatalf("failed to connect to nats: %v", err)
	}
	defer natsClient.Close()

	// ── Start NATS JetStream Consumers ────────────────────────
	if err := messaging.StartConsumers(context.Background(), natsClient, db, meili); err != nil {
		log.Printf("[warning] failed to start background NATS consumers: %v", err)
	}

	// ── Start Market Asset Price Updater (Phase 8) ─────────────
	go database.StartAssetPriceUpdater(context.Background(), db)

	// ── Create API Server ────────────────────────────────────
	server := api.NewServer(db, rdb, meili, natsClient)

	httpServer := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      server.Router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// ── Graceful Shutdown ────────────────────────────────────
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("WorldState API listening on :%d", cfg.Port)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-done
	log.Println("shutting down gracefully...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Printf("server shutdown error: %v", err)
	}

	log.Println("WorldState Backend stopped.")
}
