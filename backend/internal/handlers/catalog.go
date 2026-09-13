package handlers

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"zedbeatz/backend/internal/cache"
	"zedbeatz/backend/internal/models"
)

func (e *Env) ListArtists(w http.ResponseWriter, r *http.Request) {
	rows, err := e.DB.Query(r.Context(), `SELECT id, name, slug, bio, image_url, spotify_id, deezer_id, country, genre FROM artists ORDER BY name ASC LIMIT 200`)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []models.Artist{}
	for rows.Next() {
		var a models.Artist
		_ = rows.Scan(&a.ID, &a.Name, &a.Slug, &a.Bio, &a.ImageURL, &a.SpotifyID, &a.DeezerID, &a.Country, &a.Genre)
		out = append(out, a)
	}
	writeJSON(w, 200, map[string]any{"artists": out})
}

func (e *Env) GetArtist(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var a models.Artist
	err := e.DB.QueryRow(r.Context(), `SELECT id, name, slug, bio, image_url, spotify_id, deezer_id, country, genre FROM artists WHERE id::text=$1 OR slug=$1 LIMIT 1`, id).
		Scan(&a.ID, &a.Name, &a.Slug, &a.Bio, &a.ImageURL, &a.SpotifyID, &a.DeezerID, &a.Country, &a.Genre)
	if err != nil {
		writeError(w, 404, "artist not found")
		return
	}
	rows, _ := e.DB.Query(r.Context(), `SELECT id, title, plays, cover_url, audio_key, isrc FROM tracks WHERE artist_id=$1 AND status='active' ORDER BY plays DESC LIMIT 50`, a.ID)
	tracks := []map[string]any{}
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var tid int
			var title string
			var plays int
			var cover, akey, isrc *string
			_ = rows.Scan(&tid, &title, &plays, &cover, &akey, &isrc)
			src := e.CDN.AudioURL(akey, isrc)
			tracks = append(tracks, map[string]any{"id": tid, "title": title, "plays": plays, "cover_url": cover, "audio_url": src.URL})
		}
	}
	writeJSON(w, 200, map[string]any{"artist": a, "tracks": tracks})
}

func (e *Env) ListAlbums(w http.ResponseWriter, r *http.Request) {
	rows, err := e.DB.Query(r.Context(), `SELECT al.id, al.title, al.artist_id, a.name, al.slug, al.album_type, al.release_year, al.spotify_id, al.deezer_id, al.cover_url, al.is_featured FROM albums al LEFT JOIN artists a ON a.id=al.artist_id ORDER BY al.created_at DESC LIMIT 100`)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []models.Album{}
	for rows.Next() {
		var al models.Album
		_ = rows.Scan(&al.ID, &al.Title, &al.ArtistID, &al.ArtistName, &al.Slug, &al.AlbumType, &al.ReleaseYear, &al.SpotifyID, &al.DeezerID, &al.CoverURL, &al.IsFeatured)
		out = append(out, al)
	}
	writeJSON(w, 200, map[string]any{"albums": out})
}

func (e *Env) GetAlbum(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var al models.Album
	err := e.DB.QueryRow(r.Context(), `SELECT al.id, al.title, al.artist_id, a.name, al.slug, al.album_type, al.release_year, al.spotify_id, al.deezer_id, al.cover_url, al.is_featured FROM albums al LEFT JOIN artists a ON a.id=al.artist_id WHERE al.id::text=$1 OR al.slug=$1 LIMIT 1`, id).
		Scan(&al.ID, &al.Title, &al.ArtistID, &al.ArtistName, &al.Slug, &al.AlbumType, &al.ReleaseYear, &al.SpotifyID, &al.DeezerID, &al.CoverURL, &al.IsFeatured)
	if err != nil {
		writeError(w, 404, "album not found")
		return
	}
	writeJSON(w, 200, al)
}

func (e *Env) Search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		writeJSON(w, 200, map[string]any{"tracks": []any{}, "artists": []any{}, "albums": []any{}})
		return
	}
	like := "%" + q + "%"
	ctx := r.Context()
	trows, _ := e.DB.Query(ctx, `SELECT t.id, t.title, a.name, t.cover_url FROM tracks t LEFT JOIN artists a ON a.id=t.artist_id WHERE t.title ILIKE $1 OR a.name ILIKE $1 LIMIT 20`, like)
	tracks := []map[string]any{}
	if trows != nil {
		defer trows.Close()
		for trows.Next() {
			var id int
			var title string
			var aname *string
			var cover *string
			_ = trows.Scan(&id, &title, &aname, &cover)
			tracks = append(tracks, map[string]any{"id": id, "title": title, "artist": aname, "cover_url": cover})
		}
	}
	arows, _ := e.DB.Query(ctx, `SELECT id, name, image_url FROM artists WHERE name ILIKE $1 LIMIT 10`, like)
	artists := []map[string]any{}
	if arows != nil {
		defer arows.Close()
		for arows.Next() {
			var id int
			var name string
			var img *string
			_ = arows.Scan(&id, &name, &img)
			artists = append(artists, map[string]any{"id": id, "name": name, "image_url": img})
		}
	}
	alrows, _ := e.DB.Query(ctx, `SELECT id, title, cover_url FROM albums WHERE title ILIKE $1 LIMIT 10`, like)
	albums := []map[string]any{}
	if alrows != nil {
		defer alrows.Close()
		for alrows.Next() {
			var id int
			var title string
			var cover *string
			_ = alrows.Scan(&id, &title, &cover)
			albums = append(albums, map[string]any{"id": id, "title": title, "cover_url": cover})
		}
	}
	writeJSON(w, 200, map[string]any{"tracks": tracks, "artists": artists, "albums": albums})
}

func (e *Env) Home(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	data, err := cache.Fetch(ctx, e.Cache, cache.KeyHomeTrending10, 60*time.Second, func() (map[string]any, error) {
		trending := []map[string]any{}
		rows, _ := e.DB.Query(ctx, `SELECT t.id, t.title, a.name, t.cover_url, t.plays FROM tracks t LEFT JOIN artists a ON a.id=t.artist_id WHERE t.status='active' ORDER BY t.plays DESC LIMIT 10`)
		if rows != nil {
			defer rows.Close()
			for rows.Next() {
				var id, plays int
				var title string
				var aname, cover *string
				_ = rows.Scan(&id, &title, &aname, &cover, &plays)
				trending = append(trending, map[string]any{"id": id, "title": title, "artist": aname, "cover_url": cover, "plays": plays})
			}
		}
		return map[string]any{"trending": trending}, nil
	})
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, data)
}

func (e *Env) Hero(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	data, err := cache.Fetch(ctx, e.Cache, cache.KeyHero, 30*time.Minute, func() (map[string]any, error) {
		rows, err := e.DB.Query(ctx, `SELECT t.id, t.title, a.name, t.cover_url FROM featured_slots f JOIN tracks t ON t.id=f.track_id LEFT JOIN artists a ON a.id=t.artist_id WHERE f.slot_type='hero' AND f.is_active ORDER BY f.position ASC LIMIT 10`)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		out := []map[string]any{}
		for rows.Next() {
			var id int
			var title string
			var aname, cover *string
			_ = rows.Scan(&id, &title, &aname, &cover)
			out = append(out, map[string]any{"id": id, "title": title, "artist": aname, "cover_url": cover})
		}
		return map[string]any{"hero": out}, nil
	})
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, data)
}

func (e *Env) Radio(w http.ResponseWriter, r *http.Request) {
	trackID := r.URL.Query().Get("trackId")
	if trackID == "" {
		writeError(w, 400, "trackId required")
		return
	}
	// Radio v2 stub: filter by genre/artist similarity if genre param present.
	// Explicit ?genre= overrides DB seed genre. If genre is set, results are
	// filtered to same genre (or same artist as fallback) for better relevance.
	// ?queue= is passthrough — frontend handles queue share URLs, no server change.
	_ = r.URL.Query().Get("queue")
	genreParam := r.URL.Query().Get("genre")

	var seedGenre *string
	var seedArtistID *int
	_ = e.DB.QueryRow(r.Context(), `SELECT genre, artist_id FROM tracks WHERE id::text=$1`, trackID).Scan(&seedGenre, &seedArtistID)

	effectiveGenre := genreParam
	if effectiveGenre == "" && seedGenre != nil {
		effectiveGenre = *seedGenre
	}

	if effectiveGenre != "" {
		rows, err := e.DB.Query(r.Context(), `SELECT t.id, t.title, a.name, t.cover_url FROM tracks t LEFT JOIN artists a ON a.id=t.artist_id WHERE t.status='active' AND t.id::text <> $1 AND (t.genre = $2 OR t.artist_id = $3) ORDER BY RANDOM() LIMIT 20`, trackID, effectiveGenre, seedArtistID)
		if err != nil {
			writeError(w, 500, err.Error())
			return
		}
		defer rows.Close()
		out := []map[string]any{}
		for rows.Next() {
			var id int
			var title string
			var aname, cover *string
			_ = rows.Scan(&id, &title, &aname, &cover)
			out = append(out, map[string]any{"id": id, "title": title, "artist": aname, "cover_url": cover})
		}
		if len(out) > 0 {
			writeJSON(w, 200, map[string]any{"tracks": out, "seed_genre": effectiveGenre})
			return
		}
		// Fall through to random if genre filter returned nothing — rows closed via defer at return.
	}

	rows, err := e.DB.Query(r.Context(), `SELECT t.id, t.title, a.name, t.cover_url FROM tracks t LEFT JOIN artists a ON a.id=t.artist_id WHERE t.status='active' AND t.id::text <> $1 ORDER BY RANDOM() LIMIT 20`, trackID)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int
		var title string
		var aname, cover *string
		_ = rows.Scan(&id, &title, &aname, &cover)
		out = append(out, map[string]any{"id": id, "title": title, "artist": aname, "cover_url": cover})
	}
	writeJSON(w, 200, map[string]any{"tracks": out, "seed_genre": seedGenre})
}
