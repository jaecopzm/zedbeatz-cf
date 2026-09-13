package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"

	"zedbeatz/backend/internal/cache"
	"zedbeatz/backend/internal/cdn"
	"zedbeatz/backend/internal/config"
	"zedbeatz/backend/internal/db"
	"zedbeatz/backend/internal/handlers"
	"zedbeatz/backend/internal/hashids"
	"zedbeatz/backend/internal/ingest"
	"zedbeatz/backend/internal/r2"
	"zedbeatz/backend/internal/realtime"
	"zedbeatz/backend/internal/routes"
	"zedbeatz/backend/internal/spotify"
)

func main() {
	// Structured JSON logger to stdout for observability lane.
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	cfg := config.Load()
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	ctx := context.Background()
	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}
	defer pool.Close()

	hub := realtime.NewHub()
	go hub.Run()

	var cacheClient *cache.Client
	if cfg.RedisURL != "" {
		c, err := cache.New(cfg.RedisURL)
		if err != nil {
			slog.Warn("redis init failed — continuing without cache", "err", err)
		} else {
			cacheClient = c
			if cacheClient != nil {
				defer func() { _ = cacheClient.Close() }()
				slog.Info("redis cache enabled", "url", cfg.RedisURL)
			}
		}
	} else {
		slog.Info("REDIS_URL not set — cache disabled")
	}

	coder, err := hashids.New(cfg.HashidsSalt)
	if err != nil {
		slog.Warn("hashids init failed", "err", err)
	}
	r2Client := r2.New(cfg.R2AccountID, cfg.R2AccessKey, cfg.R2SecretKey, cfg.R2Bucket)
	spotifyClient := spotify.New(cfg.SpotifyClientID, cfg.SpotifyClientSecret, cfg.SpotifyMarket)
	ingestSvc := ingest.New(pool, r2Client, spotifyClient, cfg.StreamerURL)
	env := &handlers.Env{
		DB:      pool,
		CDN:     cdn.Resolver{R2PublicURL: cfg.R2PublicURL, LegacyCDN: cfg.LegacyMusicCDN},
		R2:      r2Client,
		Hub:     hub,
		Cache:   cacheClient,
		Spotify: spotifyClient,
		IDs:     coder,
		Ingest:  ingestSvc,
	}

	h := routes.New(env, cfg.FrontendURL, cfg.AdminSecret)
	slog.Info("zedbeatz-api listening", "port", cfg.Port)
	log.Printf("zedbeatz-api listening on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, h))
}
