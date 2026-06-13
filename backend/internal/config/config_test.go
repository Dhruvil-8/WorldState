package config

import (
	"os"
	"testing"
)

func TestLoadDefaults(t *testing.T) {
	// Ensure fresh state by removing potential overrides
	os.Unsetenv("BACKEND_ENV")
	os.Unsetenv("BACKEND_PORT")
	os.Unsetenv("POSTGRES_HOST")

	cfg := Load()

	if cfg.Env != "development" {
		t.Errorf("expected Env to be 'development', got %s", cfg.Env)
	}
	if cfg.Port != 8080 {
		t.Errorf("expected Port to be 8080, got %d", cfg.Port)
	}
	if cfg.Postgres.Host != "localhost" {
		t.Errorf("expected Postgres.Host to be 'localhost', got %s", cfg.Postgres.Host)
	}
}

func TestLoadOverrides(t *testing.T) {
	os.Setenv("BACKEND_ENV", "production")
	os.Setenv("BACKEND_PORT", "9090")
	os.Setenv("POSTGRES_HOST", "db.internal")
	defer func() {
		os.Unsetenv("BACKEND_ENV")
		os.Unsetenv("BACKEND_PORT")
		os.Unsetenv("POSTGRES_HOST")
	}()

	cfg := Load()

	if cfg.Env != "production" {
		t.Errorf("expected Env to be 'production', got %s", cfg.Env)
	}
	if cfg.Port != 9090 {
		t.Errorf("expected Port to be 9090, got %d", cfg.Port)
	}
	if cfg.Postgres.Host != "db.internal" {
		t.Errorf("expected Postgres.Host to be 'db.internal', got %s", cfg.Postgres.Host)
	}
}

func TestDSNGenerators(t *testing.T) {
	pgCfg := PostgresConfig{
		Host:     "localhost",
		Port:     5432,
		Database: "ws_test",
		User:     "user",
		Password: "password",
	}
	expectedDSN := "postgres://user:password@localhost:5432/ws_test?sslmode=disable"
	if pgCfg.DSN() != expectedDSN {
		t.Errorf("expected DSN to be %s, got %s", expectedDSN, pgCfg.DSN())
	}

	redisCfg := RedisConfig{
		Host: "localhost",
		Port: 6379,
	}
	expectedAddr := "localhost:6379"
	if redisCfg.Addr() != expectedAddr {
		t.Errorf("expected Addr to be %s, got %s", expectedAddr, redisCfg.Addr())
	}

	meiliCfg := MeiliConfig{
		Host: "localhost",
		Port: 7700,
	}
	expectedMeiliURL := "http://localhost:7700"
	if meiliCfg.URL() != expectedMeiliURL {
		t.Errorf("expected Meilisearch URL to be %s, got %s", expectedMeiliURL, meiliCfg.URL())
	}

	natsCfg := NATSConfig{
		Host: "localhost",
		Port: 4222,
	}
	expectedNatsURL := "nats://localhost:4222"
	if natsCfg.URL() != expectedNatsURL {
		t.Errorf("expected NATS URL to be %s, got %s", expectedNatsURL, natsCfg.URL())
	}
}
