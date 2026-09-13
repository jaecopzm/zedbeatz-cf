package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"zedbeatz/backend/internal/ingest"
)

// AdminIngest handles POST /api/v1/admin/ingest
func (e *Env) AdminIngest(w http.ResponseWriter, r *http.Request) {
	if e.Ingest == nil {
		writeError(w, http.StatusServiceUnavailable, "ingest not configured")
		return
	}
	var req ingest.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	// normalize empty strings to nil for validation
	if req.SpotifyID != nil && strings.TrimSpace(*req.SpotifyID) == "" {
		req.SpotifyID = nil
	}
	if req.YoutubeURL != nil && strings.TrimSpace(*req.YoutubeURL) == "" {
		req.YoutubeURL = nil
	}
	if req.FileKey != nil && strings.TrimSpace(*req.FileKey) == "" {
		req.FileKey = nil
	}
	// artist_id may be sent as string (hashid) or number; handle both via raw map fallback
	if req.ArtistID == nil {
		// peek raw body? try decode into generic map for string artist_id
		// we already consumed Body; so we need to handle earlier. Instead re-read? Simplify: if ArtistID nil try query param?
		// Alternative: client may send artist_id as string hashid — decode fallback via separate struct
		// Re-attempt by reading generic
		_ = strconv.Itoa(0)
	}
	job, err := e.Ingest.Enqueue(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]any{
		"job_id": job.ID,
		"status": job.Status,
	})
}

// AdminIngestWithStringID handles case where artist_id is sent as string hashid.
// This wrapper decodes raw map to support both int and string artist_id.
func (e *Env) AdminIngestFlex(w http.ResponseWriter, r *http.Request) {
	if e.Ingest == nil {
		writeError(w, http.StatusServiceUnavailable, "ingest not configured")
		return
	}
	var raw map[string]any
	if err := json.NewDecoder(r.Body).Decode(&raw); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	var req ingest.Request
	if v, ok := raw["spotify_id"]; ok {
		if s, ok2 := v.(string); ok2 && strings.TrimSpace(s) != "" {
			req.SpotifyID = &s
		}
	}
	if v, ok := raw["youtube_url"]; ok {
		if s, ok2 := v.(string); ok2 && strings.TrimSpace(s) != "" {
			req.YoutubeURL = &s
		}
	}
	if v, ok := raw["file_key"]; ok {
		if s, ok2 := v.(string); ok2 && strings.TrimSpace(s) != "" {
			req.FileKey = &s
		}
	}
	if v, ok := raw["artist_id"]; ok && v != nil {
		switch val := v.(type) {
		case float64:
			iv := int(val)
			req.ArtistID = &iv
		case string:
			if id, ok2 := e.decodeID(val); ok2 {
				req.ArtistID = &id
			} else if n, err := strconv.Atoi(strings.TrimSpace(val)); err == nil {
				req.ArtistID = &n
			}
		case int:
			iv := val
			req.ArtistID = &iv
		}
	}
	if v, ok := raw["artist_name"]; ok {
		if s, ok2 := v.(string); ok2 && strings.TrimSpace(s) != "" {
			req.ArtistName = &s
		}
	}
	if v, ok := raw["title"]; ok {
		if s, ok2 := v.(string); ok2 && strings.TrimSpace(s) != "" {
			req.Title = &s
		}
	}
	if v, ok := raw["genre"]; ok {
		if s, ok2 := v.(string); ok2 && strings.TrimSpace(s) != "" {
			req.Genre = &s
		}
	}
	if v, ok := raw["cover_url"]; ok {
		if s, ok2 := v.(string); ok2 && strings.TrimSpace(s) != "" {
			req.CoverURL = &s
		}
	}
	job, err := e.Ingest.Enqueue(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]any{
		"job_id": job.ID,
		"status": job.Status,
	})
}

// AdminJobStatus handles GET /api/v1/admin/jobs/{id}
func (e *Env) AdminJobStatus(w http.ResponseWriter, r *http.Request) {
	if e.Ingest == nil {
		writeError(w, http.StatusServiceUnavailable, "ingest not configured")
		return
	}
	id := chi.URLParam(r, "id")
	if id == "" {
		id = r.URL.Query().Get("id")
	}
	if strings.TrimSpace(id) == "" {
		writeError(w, http.StatusBadRequest, "id required")
		return
	}
	job, ok := e.Ingest.GetJob(r.Context(), id)
	if !ok {
		writeError(w, http.StatusNotFound, "job not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"job_id":     job.ID,
		"status":     job.Status,
		"error":      job.Error,
		"track_id":   job.TrackID,
		"created_at": job.CreatedAt,
		"updated_at": job.UpdatedAt,
	})
}
