package handlers

import (
	"net/http"
)

func (e *Env) PresignUpload(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("Content-Type") == "application/json" || r.Method == http.MethodPost {
		var body struct {
			Filename    string `json:"filename"`
			ContentType string `json:"contentType"`
		}
		_ = decodeJSON(r, &body)
		if body.Filename == "" {
			writeError(w, 400, "filename required")
			return
		}
		ct := body.ContentType
		if ct == "" {
			ct = "application/octet-stream"
		}
		url, err := e.R2.PresignPUT(r.Context(), body.Filename, ct)
		if err != nil {
			writeError(w, 500, err.Error())
			return
		}
		writeJSON(w, 200, map[string]any{"uploadUrl": url, "key": body.Filename})
		return
	}
	writeError(w, 400, "unsupported upload")
}

func (e *Env) DeleteUpload(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Key string `json:"key"`
	}
	if err := decodeJSON(r, &body); err != nil || body.Key == "" {
		writeError(w, 400, "key required")
		return
	}
	if err := e.R2.Delete(r.Context(), body.Key); err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

// Admin stubs: full CRUD mirrors /api/admin/* — expand per-table as needed.
func (e *Env) AdminTracks(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		e.ListTracks(w, r)
	default:
		writeJSON(w, 200, map[string]any{"ok": true, "todo": "admin write path — port from app/api/admin/tracks/route.ts"})
	}
}

func (e *Env) AdminArtists(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		e.ListArtists(w, r)
	default:
		writeJSON(w, 200, map[string]any{"ok": true, "todo": "admin write path"})
	}
}

func (e *Env) Health(w http.ResponseWriter, r *http.Request) {
	if err := e.DB.Ping(r.Context()); err != nil {
		writeError(w, 503, "db unreachable")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "service": "zedbeatz-api"})
}
