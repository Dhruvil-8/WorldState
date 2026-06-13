package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all configuration for the application.
type Config struct {
	Env  string
	Port int

	Postgres PostgresConfig
	Redis    RedisConfig
	Meili    MeiliConfig
	NATS     NATSConfig
}

// PostgresConfig holds PostgreSQL connection settings.
type PostgresConfig struct {
	Host     string
	Port     int
	Database string
	User     string
	Password string
}

// DSN returns the PostgreSQL connection string.
func (p PostgresConfig) DSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=disable",
		p.User, p.Password, p.Host, p.Port, p.Database,
	)
}

// RedisConfig holds Redis connection settings.
type RedisConfig struct {
	Host     string
	Port     int
	Password string
}

// Addr returns the Redis address string.
func (r RedisConfig) Addr() string {
	return fmt.Sprintf("%s:%d", r.Host, r.Port)
}

// MeiliConfig holds Meilisearch connection settings.
type MeiliConfig struct {
	Host      string
	Port      int
	MasterKey string
}

// URL returns the Meilisearch URL.
func (m MeiliConfig) URL() string {
	return fmt.Sprintf("http://%s:%d", m.Host, m.Port)
}

// NATSConfig holds NATS connection settings.
type NATSConfig struct {
	Host string
	Port int
}

// URL returns the NATS connection URL.
func (n NATSConfig) URL() string {
	return fmt.Sprintf("nats://%s:%d", n.Host, n.Port)
}

// Load reads configuration from environment variables with sensible defaults.
func Load() *Config {
	return &Config{
		Env:  getEnv("BACKEND_ENV", "development"),
		Port: getEnvInt("BACKEND_PORT", 8080),

		Postgres: PostgresConfig{
			Host:     getEnv("POSTGRES_HOST", "localhost"),
			Port:     getEnvInt("POSTGRES_PORT", 5432),
			Database: getEnv("POSTGRES_DB", "worldstate"),
			User:     getEnv("POSTGRES_USER", "worldstate"),
			Password: getEnv("POSTGRES_PASSWORD", "changeme_postgres_password"),
		},

		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", "changeme_redis_password"),
		},

		Meili: MeiliConfig{
			Host:      getEnv("MEILI_HOST", "localhost"),
			Port:      getEnvInt("MEILI_PORT", 7700),
			MasterKey: getEnv("MEILI_MASTER_KEY", "changeme_meili_master_key"),
		},

		NATS: NATSConfig{
			Host: getEnv("NATS_HOST", "localhost"),
			Port: getEnvInt("NATS_PORT", 4222),
		},
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if val, ok := os.LookupEnv(key); ok {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return fallback
}
