package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	DatabaseURL    string
	FrontendURL    string
	R2AccountID    string
	R2AccessKey    string
	R2SecretKey    string
	R2Bucket       string
	R2PublicURL    string
	LegacyMusicCDN string
	AdminSecret    string
	HashidsSalt    string
	RedisURL       string
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func Load() Config {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env.local")
	_ = godotenv.Load(".env")

	return Config{
		Port:           getenv("PORT", "8080"),
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		FrontendURL:    getenv("FRONTEND_URL", "http://localhost:3000"),
		R2AccountID:    os.Getenv("R2_ACCOUNT_ID"),
		R2AccessKey:    os.Getenv("R2_ACCESS_KEY_ID"),
		R2SecretKey:    os.Getenv("R2_SECRET_ACCESS_KEY"),
		R2Bucket:       os.Getenv("R2_BUCKET_NAME"),
		R2PublicURL:    getenv("R2_PUBLIC_URL", "https://cdn.zedbeatz.com"),
		LegacyMusicCDN: getenv("LEGACY_MUSIC_CDN", "https://cdn-spotify-247.zm.io.vn/download"),
		AdminSecret:    os.Getenv("ADMIN_SECRET"),
		HashidsSalt:    getenv("HASHIDS_SALT", "zedbeatz-2026-salt"),
		RedisURL:       os.Getenv("REDIS_URL"),
	}
}
