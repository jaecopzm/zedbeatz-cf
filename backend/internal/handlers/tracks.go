package handlers

import (
	"context"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"zedbeatz/backend/internal/models"
)

const trackColumns = `t.id, t.title, t.artist_id, a.name AS artist_name, t.album_id,
	t.spotify_id, t.isrc, t.deezer_id, t.cover_url, t.audio_key, t.cover_key,
	t.duration, t.genre, t.featured_artists, t.plays, t.slug, t.status, t.created_at`

func scanTrack(row interface{ Scan(...any) error }, cdnURL func(ak, isrc *string) *string) (models.Track, error) {
	var t models.Track
	var albumID *int
	err := row.Scan(&t.ID, &t.Title, &t.ArtistID, &t.ArtistName, &albumID,
		&t.SpotifyID, &t.ISRC, &t.DeezerID, &t.CoverURL, &t.AudioKey, &t.CoverKey,
		&t.Duration, &t.Genre, &t.FeaturedArtists, &t.Plays, &t.Slug, &t.Status, &t.CreatedAt)
	if err != nil {
		return t, err
	}
	t.AlbumID = albumID
	t.AudioURL = cdnURL(t.AudioKey, t.ISRC)
	if t.CoverURL == nil || *t.CoverURL == "" {
		// leave cover resolution to client via getCoverUrl parity
	}
	return t, nil
}

func (e *Env) ListTracks(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 24
	}
	search := r.URL.Query().Get("search")
	sort := r.URL.Query().Get("sort")

	query := `SELECT ` + trackColumns + ` FROM tracks t LEFT JOIN artists a ON a.id = t.artist_id WHERE t.status = 'active'`
	args := []any{}
	if search != "" {
		args = append(args, "%"+search+"%")
		query += ` AND (t.title ILIKE $1 OR a.name ILIKE $1)`
	}
	if sort == "trending" {
		query += ` ORDER BY t.plays DESC`
	} else {
		query += ` ORDER BY t.created_at DESC`
	}
	query += ` LIMIT ` + strconv.Itoa(limit)

	rows, err := e.DB.Query(ctx, query, args...)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []models.Track{}
	for rows.Next() {
		var t models.Track
		var albumID *int
		_ = rows.Scan(&t.ID, &t.Title, &t.ArtistID, &t.ArtistName, &albumID,
			&t.SpotifyID, &t.ISRC, &t.DeezerID, &t.CoverURL, &t.AudioKey, &t.CoverKey,
			&t.Duration, &t.Genre, &t.FeaturedArtists, &t.Plays, &t.Slug, &t.Status, &t.CreatedAt)
		t.AlbumID = albumID
		src := e.CDN.AudioURL(t.AudioKey, t.ISRC)
		if src.Type != "none" {
			t.AudioURL = &src.URL
		}
		out = append(out, t)
	}
	writeJSON(w, 200, map[string]any{"tracks": out})
}

func (e *Env) GetTrack(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	ctx := r.Context()
	var t models.Track
	var albumID *int
	q := `SELECT ` + trackColumns + ` FROM tracks t LEFT JOIN artists a ON a.id = t.artist_id WHERE t.id::text = $1 OR t.slug = $1 LIMIT 1`
	err := e.DB.QueryRow(ctx, q, id).Scan(&t.ID, &t.Title, &t.ArtistID, &t.ArtistName, &albumID,
		&t.SpotifyID, &t.ISRC, &t.DeezerID, &t.CoverURL, &t.AudioKey, &t.CoverKey,
		&t.Duration, &t.Genre, &t.FeaturedArtists, &t.Plays, &t.Slug, &t.Status, &t.CreatedAt)
	if err != nil {
		writeError(w, 404, "track not found")
		return
	}
	t.AlbumID = albumID
	src := e.CDN.AudioURL(t.AudioKey, t.ISRC)
	if src.Type != "none" {
		t.AudioURL = &src.URL
	}
	writeJSON(w, 200, t)
}

func (e *Env) PlayTrack(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ID int `json:"id"`
	}
	if err := decodeJSON(r, &body); err != nil || body.ID == 0 {
		writeError(w, 400, "id required")
		return
	}
	ctx := context.Background()
	_, _ = e.DB.Exec(ctx, `UPDATE tracks SET plays = plays + 1 WHERE id = $1`, body.ID)
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (e *Env) TrackLyrics(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var lyrics, synced, title, artist *string
	err := e.DB.QueryRow(r.Context(),
		`SELECT t.lyrics, t.synced_lyrics, t.title, a.name FROM tracks t LEFT JOIN artists a ON a.id=t.artist_id WHERE t.id::text=$1 LIMIT 1`, id).
		Scan(&lyrics, &synced, &title, &artist)
	if err != nil {
		writeError(w, 404, "not found")
		return
	}
	writeJSON(w, 200, map[string]any{"title": title, "artist": artist, "lyrics": lyrics, "synced_lyrics": synced})
}
