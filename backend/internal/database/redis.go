package database

import (
	"context"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
	"github.com/worldstate/worldstate/internal/config"
)

// RedisDB wraps the Redis client.
type RedisDB struct {
	Client *redis.Client
}

// NewRedis creates a new Redis client connection.
func NewRedis(ctx context.Context, cfg config.RedisConfig) (*RedisDB, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.Addr(),
		Password: cfg.Password,
		DB:       0,
		PoolSize: 10,
	})

	// Verify connection
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("pinging redis: %w", err)
	}

	log.Println("[redis] connected successfully")
	return &RedisDB{Client: client}, nil
}

// Close shuts down the Redis client.
func (r *RedisDB) Close() error {
	log.Println("[redis] connection closed")
	return r.Client.Close()
}

// HealthCheck verifies Redis is reachable.
func (r *RedisDB) HealthCheck(ctx context.Context) error {
	return r.Client.Ping(ctx).Err()
}
