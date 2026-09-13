package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"zedbeatz/backend/internal/cache"
	"zedbeatz/backend/internal/cdn"
	"zedbeatz/backend/internal/hashids"
	"zedbeatz/backend/internal/ingest"
	"zedbeatz/backend/internal/r2"
	"zedbeatz/backend/internal/realtime"
	"zedbeatz/backend/internal/spotify"
)

type Env struct {
	DB      *pgxpool.Pool
	CDN     cdn.Resolver
	R2      *r2.Client
	Hub     *realtime.Hub
	Cache   *cache.Client
	Spotify *spotify.Client
	IDs     *hashids.Coder
	Ingest  *ingest.Service
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}

func decodeJSON(r *http.Request, v any) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}
