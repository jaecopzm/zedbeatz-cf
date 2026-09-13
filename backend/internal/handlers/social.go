package handlers

import (
	"net/http"

	"zedbeatz/backend/internal/middleware"
)

// Likes: "Liked Songs" is a per-user auto playlist backed by playlists+playlist_tracks.
func (e *Env) GetLikes(w http.ResponseWriter, r *http.Request) {
	uid := middleware.UserID(r)
	trackID := r.URL.Query().Get("track_id")
	if trackID != "" && uid == "" {
		writeJSON(w, 200, map[string]any{"liked": false})
		return
	}
	if trackID != "" {
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
	uid := middleware.UserID(r)
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
	rows, err := e.DB.Query(r.Context(), `SELECT p.id, p.name, p.cover_url, p.is_featured, p.category, COUNT(pt.track_id) FROM playlists p LEFT JOIN playlist_tracks pt ON pt.playlist_id=p.id WHERE p.is_featured = true GROUP BY p.id ORDER BY p.created_at DESC LIMIT 50`)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id, count int
		var name string
		var cover, cat *string
		var feat bool
		_ = rows.Scan(&id, &name, &cover, &feat, &cat, &count)
		out = append(out, map[string]any{"id": id, "name": name, "cover_url": cover, "category": cat, "track_count": count})
	}
	writeJSON(w, 200, map[string]any{"playlists": out})
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
		uid := middleware.UserID(r)
		var body struct {
			TrackID int    `json:"track_id"`
			Content string `json:"content"`
		}
		if err := decodeJSON(r, &body); err != nil || body.TrackID == 0 || body.Content == "" {
			writeError(w, 400, "track_id and content required")
			return
		}
		var id int64
		err := e.DB.QueryRow(r.Context(), `INSERT INTO comments(track_id, user_id, content) VALUES($1,$2,$3) RETURNING id`, body.TrackID, uid, body.Content).Scan(&id)
		if err != nil {
			writeError(w, 500, err.Error())
			return
		}
		writeJSON(w, 201, map[string]any{"id": id})
	case http.MethodDelete:
		var body struct {
			ID int64 `json:"id"`
		}
		if err := decodeJSON(r, &body); err != nil {
			writeError(w, 400, "id required")
			return
		}
		_, _ = e.DB.Exec(r.Context(), `DELETE FROM comments WHERE id=$1 AND user_id=$2`, body.ID, middleware.UserID(r))
		writeJSON(w, 200, map[string]any{"ok": true})
	}
}

func (e *Env) Follows(w http.ResponseWriter, r *http.Request) {
	uid := middleware.UserID(r)
	switch r.Method {
	case http.MethodGet:
		if r.URL.Query().Get("type") == "count" {
			var n int
			_ = e.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM follows WHERE artist_id::text=$1`, r.URL.Query().Get("artist_id")).Scan(&n)
			writeJSON(w, 200, map[string]any{"count": n})
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
	_, _ = e.DB.Exec(r.Context(), `INSERT INTO recently_played(track_id, user_id) VALUES($1,$2)`, body.TrackID, middleware.UserID(r))
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (e *Env) ListRecent(w http.ResponseWriter, r *http.Request) {
	uid := middleware.UserID(r)
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
	uid := middleware.UserID(r)
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
