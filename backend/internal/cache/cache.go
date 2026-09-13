package cache

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
	"golang.org/x/sync/singleflight"
	"zedbeatz/backend/internal/metrics"
)

// Client wraps go-redis with JSON codec, singleflight and fail-open semantics.
type Client struct {
	rdb   *redis.Client
	group singleflight.Group
}

// New creates a Client from a redis URL. If url is empty it returns (nil, nil)
// so callers can treat cache as disabled (fail-open).
func New(redisURL string) (*Client, error) {
	if redisURL == "" {
		return nil, nil
	}
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}
	rdb := redis.NewClient(opts)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		slog.Warn("redis ping failed — continuing fail-open", "err", err)
	}
	return &Client{rdb: rdb}, nil
}

// NewFromClient is exposed for tests to inject a *redis.Client directly.
func NewFromClient(rdb *redis.Client) *Client {
	if rdb == nil {
		return nil
	}
	return &Client{rdb: rdb}
}

// Get tries to fetch key into dest (JSON). Returns (hit, error).
// On redis error it logs and returns miss (fail-open).
func (c *Client) Get(ctx context.Context, key string, dest any) (bool, error) {
	if c == nil || c.rdb == nil {
		return false, nil
	}
	val, err := c.rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		metrics.IncCacheHit("miss")
		return false, nil
	}
	if err != nil {
		slog.Warn("redis Get fail-open", "key", key, "err", err)
		metrics.IncCacheHit("miss")
		return false, nil
	}
	if err := json.Unmarshal([]byte(val), dest); err != nil {
		slog.Warn("redis unmarshal fail-open", "key", key, "err", err)
		metrics.IncCacheHit("miss")
		return false, nil
	}
	metrics.IncCacheHit("hit")
	return true, nil
}

// Set stores value as JSON with ttl. Fail-open on error.
func (c *Client) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	if c == nil || c.rdb == nil {
		return nil
	}
	b, err := json.Marshal(value)
	if err != nil {
		return err
	}
	if err := c.rdb.Set(ctx, key, b, ttl).Err(); err != nil {
		slog.Warn("redis Set fail-open", "key", key, "err", err)
		return nil
	}
	return nil
}

// Del deletes keys. Fail-open on error.
func (c *Client) Del(ctx context.Context, keys ...string) error {
	if c == nil || c.rdb == nil || len(keys) == 0 {
		return nil
	}
	if err := c.rdb.Del(ctx, keys...).Err(); err != nil {
		slog.Warn("redis Del fail-open", "keys", keys, "err", err)
		return nil
	}
	return nil
}

// Close closes the underlying redis client.
func (c *Client) Close() error {
	if c == nil || c.rdb == nil {
		return nil
	}
	return c.rdb.Close()
}

// Fetch is a generic helper that coalesces concurrent loads with singleflight,
// checks cache first, and fail-opens to fn on any redis error.
// If c is nil (cache disabled) it just calls fn.
func Fetch[T any](ctx context.Context, c *Client, key string, ttl time.Duration, fn func() (T, error)) (T, error) {
	var zero T
	if c == nil || c.rdb == nil {
		return fn()
	}
	var cached T
	if hit, _ := c.Get(ctx, key, &cached); hit {
		return cached, nil
	}
	v, err, _ := c.group.Do(key, func() (any, error) {
		data, err := fn()
		if err != nil {
			return data, err
		}
		_ = c.Set(ctx, key, data, ttl)
		return data, nil
	})
	if err != nil {
		return zero, err
	}
	typed, ok := v.(T)
	if !ok {
		// Should not happen; try JSON round-trip as fallback.
		b, _ := json.Marshal(v)
		var out T
		if jsonErr := json.Unmarshal(b, &out); jsonErr == nil {
			return out, nil
		}
		return zero, nil
	}
	return typed, nil
}
