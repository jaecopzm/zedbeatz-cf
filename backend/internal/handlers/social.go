package handlers

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"zedbeatz/backend/internal/middleware"
)

// Likes: "Liked Songs" is a per-user auto playlist backed by playlists+playlist_tracks.
// Now keyed by device_id (X-Device-ID) instead of user_id.

func (e *Env) GetLikes(w http.ResponseWriter, r *http.Request) {
	uid := middleware.DeviceID(r)
	trackID := r.URL.Query().Get("track_id")
	if trackID != "" {
		if uid == "" {
			writeJSON(w, 200, map[string]any{"liked": false})
			return
		}
		var exists bool
		_ = e.DB.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM playlists p JOIN playlist_tracks pt ON pt.playlist_id=p.id WHERE p.user_id=$1 AND p.name='Liked Songs' AND pt.track_id::text=$2)`, uid, trackID).Scan(&exists)
		writeJSON(w, 200, map[string]any{"liked": exists})
		return
	}
	if uid == "" {
		writeJSON(w, 200, map[string]any{"tracks": []any{}})
		return
	}
	rows, err := e.DB.Query(r.Context(), `SELECT t.id, t.title, t.cover_url FROM playlists p JOIN playlist_tracks pt ON pt.playlist_id=p.id JOIN tracks t ON t.id=pt.track_id WHERE p.user_id=$1 AND p.name='Liked Songs' ORDER BY pt.position ASC`, uid)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int
		var title string
		var cover *string
		_ = rows.Scan(&id, &title, &cover)
		out = append(out, map[string]any{"id": id, "title": title, "cover_url": cover})
	}
	writeJSON(w, 200, map[string]any{"tracks": out})
}

func (e *Env) ToggleLike(w http.ResponseWriter, r *http.Request) {
	uid := middleware.DeviceID(r)
	if uid == "" {
		writeError(w, 400, "X-Device-ID required")
		return
	}
	if _, err := uuid.Parse(uid); err != nil {
		writeError(w, 400, "invalid X-Device-ID")
		return
	}
	var body struct {
		TrackID int `json:"track_id"`
	}
	if err := decodeJSON(r, &body); err != nil || body.TrackID == 0 {
		writeError(w, 400, "track_id required")
		return
	}
	ctx := r.Context()
	var pid int
	_ = e.DB.QueryRow(ctx, `SELECT id FROM playlists WHERE user_id=$1 AND name='Liked Songs' LIMIT 1`, uid).Scan(&pid)
	if pid == 0 {
		_ = e.DB.QueryRow(ctx, `INSERT INTO playlists(name, user_id) VALUES('Liked Songs',$1) RETURNING id`, uid).Scan(&pid)
	}
	var exists bool
	_ = e.DB.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM playlist_tracks WHERE playlist_id=$1 AND track_id=$2)`, pid, body.TrackID).Scan(&exists)
	if exists {
		_, _ = e.DB.Exec(ctx, `DELETE FROM playlist_tracks WHERE playlist_id=$1 AND track_id=$2`, pid, body.TrackID)
		writeJSON(w, 200, map[string]any{"liked": false})
		return
	}
	_, _ = e.DB.Exec(ctx, `INSERT INTO playlist_tracks(playlist_id, track_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, pid, body.TrackID)
	writeJSON(w, 200, map[string]any{"liked": true})
}

func (e *Env) ListPlaylists(w http.ResponseWriter, r *http.Request) {
	uid := middleware.DeviceID(r)
	// If device ID present, include user's own playlists alongside featured.
	// Else just featured. This keys playlists by device_id when available.
	if uid != "" {
		// Include device's playlists + featured
		qrows, err := e.DB.Query(r.Context(), `SELECT p.id, p.name, p.cover_url, p.is_featured, p.category, COUNT(pt.track_id) FROM playlists p LEFT JOIN playlist_tracks pt ON pt.playlist_id=p.id WHERE p.is_featured = true OR p.user_id=$1 GROUP BY p.id ORDER BY p.created_at DESC LIMIT 50`, uid)
		if err != nil {
			writeError(w, 500, err.Error())
			return
		}
		defer qrows.Close()
		out := []map[string]any{}
		for qrows.Next() {
			var id, count int
			var name string
			var cover, cat *string
			var feat bool
			_ = qrows.Scan(&id, &name, &cover, &feat, &cat, &count)
			out = append(out, map[string]any{"id": id, "name": name, "cover_url": cover, "category": cat, "track_count": count})
		}
		writeJSON(w, 200, map[string]any{"playlists": out})
		return
	}
	// Anonymous / no device ID: featured only (also works for ephemeral but fallback to empty local)
	qrows, err := e.DB.Query(r.Context(), `SELECT p.id, p.name, p.cover_url, p.is_featured, p.category, COUNT(pt.track_id) FROM playlists p LEFT JOIN playlist_tracks pt ON pt.playlist_id=p.id WHERE p.is_featured = true GROUP BY p.id ORDER BY p.created_at DESC LIMIT 50`)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	defer qrows.Close()
	out := []map[string]any{}
	for qrows.Next() {
		var id, count int
		var name string
		var cover, cat *string
		var feat bool
		_ = qrows.Scan(&id, &name, &cover, &feat, &cat, &count)
		out = append(out, map[string]any{"id": id, "name": name, "cover_url": cover, "category": cat, "track_count": count})
	}
	writeJSON(w, 200, map[string]any{"playlists": out})
}

// Comment moderation: rate limit, profanity filter, max length.

var (
	commentMu      sync.Mutex
	commentBuckets = map[string][]time.Time{}
)

var profanityList = []string{
	"fuck", "shit", "bitch", "asshole", "damn", "crap", "dick", "pussy", "slut",
	"bastard", "fucking", "motherfucker", "whore", "fag", "nigger", "cunt",
}

func containsProfanity(s string) bool {
	lower := strings.ToLower(s)
	for _, w := range profanityList {
		if strings.Contains(lower, w) {
			return true
		}
	}
	return false
}

func allowComment(deviceID string) bool {
	commentMu.Lock()
	defer commentMu.Unlock()
	now := time.Now()
	cutoff := now.Add(-time.Minute)
	// Clean old entries for this device
	times := commentBuckets[deviceID]
	filtered := times[:0]
	for _, t := range times {
		if t.After(cutoff) {
			filtered = append(filtered, t)
		}
	}
	if len(filtered) >= 5 {
		commentBuckets[deviceID] = filtered
		return false
	}
	filtered = append(filtered, now)
	commentBuckets[deviceID] = filtered
	// Opportunistic global cleanup to prevent unbounded growth (every 100th call)
	if len(commentBuckets) > 1000 {
		for k, v := range commentBuckets {
			// remove devices with no recent comments
			keep := v[:0]
			for _, t := range v {
				if t.After(cutoff) {
					keep = append(keep, t)
				}
			}
			if len(keep) == 0 {
				delete(commentBuckets, k)
			} else {
				commentBuckets[k] = keep
			}
		}
	}
	return true
}

func (e *Env) Comments(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		trackID := r.URL.Query().Get("track_id")
		rows, err := e.DB.Query(r.Context(), `SELECT id, track_id, user_id, user_name, content, created_at FROM comments WHERE track_id::text=$1 ORDER BY created_at DESC LIMIT 100`, trackID)
		if err != nil {
			writeError(w, 500, err.Error())
			return
		}
		defer rows.Close()
		out := []map[string]any{}
		for rows.Next() {
			var id int64
			var tid int
			var uid, uname, content string
			var created string
			_ = rows.Scan(&id, &tid, &uid, &uname, &content, &created)
			out = append(out, map[string]any{"id": id, "track_id": tid, "user_name": uname, "content": content, "created_at": created})
		}
		writeJSON(w, 200, map[string]any{"comments": out})
	case http.MethodPost:
		// Allow anonymous POST with X-Device-ID. Use device ID as user_id.
		deviceID := middleware.DeviceID(r)
		if deviceID == "" {
			// Fallback ephemeral for requests without middleware (tests)
			deviceID = uuid.NewString()
		}
		var body struct {
			TrackID  int    `json:"track_id"`
			Content  string `json:"content"`
			UserName string `json:"user_name"`
		}
		if err := decodeJSON(r, &body); err != nil || body.TrackID == 0 || strings.TrimSpace(body.Content) == "" {
			writeError(w, 400, "track_id and content required")
			return
		}
		content := strings.TrimSpace(body.Content)
		// Max length 500 characters
		if len([]rune(content)) > 500 {
			writeError(w, 400, "content too long (max 500 characters)")
			return
		}
		if containsProfanity(content) {
			writeError(w, 400, "profanity not allowed")
			return
		}
		if !allowComment(deviceID) {
			writeError(w, 429, "rate limit exceeded: max 5 comments per minute")
			return
		}
		userName := strings.TrimSpace(body.UserName)
		if userName == "" {
			userName = "Anonymous"
		}
		// Ensure user_name not too long
		if len([]rune(userName)) > 50 {
			userName = string([]rune(userName)[:50])
		}
		var id int64
		err := e.DB.QueryRow(r.Context(), `INSERT INTO comments(track_id, user_id, user_name, content) VALUES($1,$2,$3,$4) RETURNING id`, body.TrackID, deviceID, userName, content).Scan(&id)
		if err != nil {
			writeError(w, 500, err.Error())
			return
		}
		writeJSON(w, 201, map[string]any{"id": id})
	case http.MethodDelete:
		deviceID := middleware.DeviceID(r)
		if deviceID == "" {
			writeError(w, 400, "X-Device-ID required")
			return
		}
		var body struct {
			ID int64 `json:"id"`
		}
		if err := decodeJSON(r, &body); err != nil {
			writeError(w, 400, "id required")
			return
		}
		if body.ID == 0 {
			writeError(w, 400, "id required")
			return
		}
		_, _ = e.DB.Exec(r.Context(), `DELETE FROM comments WHERE id=$1 AND user_id=$2`, body.ID, deviceID)
		writeJSON(w, 200, map[string]any{"ok": true})
	default:
		writeError(w, 405, "method not allowed")
	}
}

func (e *Env) Follows(w http.ResponseWriter, r *http.Request) {
	uid := middleware.DeviceID(r)
	switch r.Method {
	case http.MethodGet:
		if r.URL.Query().Get("type") == "count" {
			var n int
			_ = e.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM follows WHERE artist_id::text=$1`, r.URL.Query().Get("artist_id")).Scan(&n)
			writeJSON(w, 200, map[string]any{"count": n})
			return
		}
		if uid == "" {
			writeJSON(w, 200, map[string]any{"follows": []int{}})
			return
		}
		rows, _ := e.DB.Query(r.Context(), `SELECT artist_id FROM follows WHERE user_id=$1`, uid)
		out := []int{}
		if rows != nil {
			defer rows.Close()
			for rows.Next() {
				var a int
				_ = rows.Scan(&a)
				out = append(out, a)
			}
		}
		writeJSON(w, 200, map[string]any{"follows": out})
	case http.MethodPost:
		if uid == "" {
			writeError(w, 400, "X-Device-ID required")
			return
		}
		if _, err := uuid.Parse(uid); err != nil {
			writeError(w, 400, "invalid X-Device-ID")
			return
		}
		var body struct {
			Action   string `json:"action"`
			ArtistID int    `json:"artist_id"`
		}
		if err := decodeJSON(r, &body); err != nil || body.ArtistID == 0 {
			writeError(w, 400, "artist_id required")
			return
		}
		if body.Action == "unfollow" {
			_, _ = e.DB.Exec(r.Context(), `DELETE FROM follows WHERE user_id=$1 AND artist_id=$2`, uid, body.ArtistID)
			writeJSON(w, 200, map[string]any{"following": false})
			return
		}
		_, _ = e.DB.Exec(r.Context(), `INSERT INTO follows(user_id, artist_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, uid, body.ArtistID)
		writeJSON(w, 200, map[string]any{"following": true})
	default:
		writeError(w, 405, "method not allowed")
	}
}

func (e *Env) LogPlay(w http.ResponseWriter, r *http.Request) {
	var body struct {
		TrackID int `json:"track_id"`
	}
	if err := decodeJSON(r, &body); err != nil || body.TrackID == 0 {
		writeError(w, 400, "track_id required")
		return
	}
	deviceID := middleware.DeviceID(r)
	// Allow anonymous but key by device_id if present
	if deviceID == "" {
		deviceID = ""
	}
	_, _ = e.DB.Exec(r.Context(), `INSERT INTO recently_played(track_id, user_id) VALUES($1,$2)`, body.TrackID, deviceID)
	// Broadcast now-playing to WebSocket subscribers (non-blocking).
	e.BroadcastNowPlaying(body.TrackID, deviceID)
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (e *Env) ListRecent(w http.ResponseWriter, r *http.Request) {
	uid := middleware.DeviceID(r)
	if uid == "" {
		writeJSON(w, 200, map[string]any{"tracks": []any{}})
		return
	}
	rows, err := e.DB.Query(r.Context(), `SELECT t.id, t.title, t.cover_url FROM recently_played rp JOIN tracks t ON t.id=rp.track_id WHERE rp.user_id=$1 ORDER BY rp.played_at DESC LIMIT 30`, uid)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int
		var title string
		var cover *string
		_ = rows.Scan(&id, &title, &cover)
		out = append(out, map[string]any{"id": id, "title": title, "cover_url": cover})
	}
	writeJSON(w, 200, map[string]any{"tracks": out})
}

func (e *Env) Stats(w http.ResponseWriter, r *http.Request) {
	uid := middleware.DeviceID(r)
	if uid == "" {
		writeJSON(w, 200, map[string]any{"plays": 0, "likes": 0, "follows": 0})
		return
	}
	var plays, likes, follows int
	_ = e.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM recently_played WHERE user_id=$1`, uid).Scan(&plays)
	_ = e.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM playlist_tracks pt JOIN playlists p ON p.id=pt.playlist_id WHERE p.user_id=$1 AND p.name='Liked Songs'`, uid).Scan(&likes)
	_ = e.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM follows WHERE user_id=$1`, uid).Scan(&follows)
	writeJSON(w, 200, map[string]any{"plays": plays, "likes": likes, "follows": follows})
}

func (e *Env) LyricsCheck(w http.ResponseWriter, r *http.Request) {
	var body struct {
		TrackIDs []int `json:"track_ids"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, 400, "track_ids required")
		return
	}
	out := map[int]bool{}
	for _, id := range body.TrackIDs {
		var has bool
		_ = e.DB.QueryRow(r.Context(), `SELECT lyrics IS NOT NULL AND lyrics <> '' FROM tracks WHERE id=$1`, id).Scan(&has)
		out[id] = has
	}
	writeJSON(w, 200, map[string]any{"has_lyrics": out})
}
