package main

import (
	"context"
	"log"
	"net/http"

	"zedbeatz/backend/internal/cdn"
	"zedbeatz/backend/internal/config"
	"zedbeatz/backend/internal/db"
	"zedbeatz/backend/internal/handlers"
	"zedbeatz/backend/internal/r2"
	"zedbeatz/backend/internal/routes"
)

func main() {
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

	env := &handlers.Env{
		DB:  pool,
		CDN: cdn.Resolver{R2PublicURL: cfg.R2PublicURL, LegacyCDN: cfg.LegacyMusicCDN},
		R2:  r2.New(cfg.R2AccountID, cfg.R2AccessKey, cfg.R2SecretKey, cfg.R2Bucket),
	}

	h := routes.New(env, cfg.FrontendURL, cfg.AdminSecret)
	log.Printf("zedbeatz-api listening on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, h))
}
