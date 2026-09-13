package handlers

import (
	"net/http"
	"strings"
	"time"

	"zedbeatz/backend/internal/cache"
	"zedbeatz/backend/internal/spotify"
)

// SearchSpotify handles GET /api/v1/admin/spotify/search?q=...
// Admin-only; reads q, checks cache (zed:spotify:search:{hash(q)} TTL 1h), calls Spotify client, returns {tracks:[]}.
func (e *Env) SearchSpotify(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if q == "" {
		writeError(w, http.StatusBadRequest, "q required")
		return
	}

	// Try cache first (fail-open).
	key := cache.SpotifySearchKey(q)
	if e.Cache != nil {
		var cached []spotify.Track
		if hit, _ := e.Cache.Get(r.Context(), key, &cached); hit {
			writeJSON(w, http.StatusOK, map[string]any{"tracks": cached})
			return
		}
	}

	if e.Spotify == nil {
		writeError(w, http.StatusServiceUnavailable, "spotify not configured")
		return
	}

	tracks, err := e.Spotify.Search(r.Context(), q)
	if err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	if tracks == nil {
		tracks = []spotify.Track{}
	}

	// Populate cache 1h (fail-open).
	if e.Cache != nil {
		_ = e.Cache.Set(r.Context(), key, tracks, time.Hour)
	}

	writeJSON(w, http.StatusOK, map[string]any{"tracks": tracks})
}
