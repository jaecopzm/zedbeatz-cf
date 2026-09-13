package handlers

import (
	"context"
	"net/http"

	"zedbeatz/backend/internal/cache"
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

// InvalidateHome clears home/hero cache — call from admin write paths when
// expanding CRUD beyond stubs.
func (e *Env) InvalidateHome(ctx context.Context) {
	_ = e.Cache.Del(ctx, cache.AllHomeKeys()...)
}

func (e *Env) Health(w http.ResponseWriter, r *http.Request) {
	if err := e.DB.Ping(r.Context()); err != nil {
		writeError(w, 503, "db unreachable")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "service": "zedbeatz-api"})
}
