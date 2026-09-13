package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"zedbeatz/backend/internal/cache"
)

// ── helpers: slugify / hashids / featured_artists ───────────────────────────

var (
	slugInvalidRe  = regexp.MustCompile(`[^\w\s-]`)
	slugHyphenRe   = regexp.MustCompile(`[\s_-]+`)
	slugTrimRe     = regexp.MustCompile(`^-+|-+$`)
	slugTrailingRe = regexp.MustCompile(`-\d+$`)
	// same as Next.js: split(/[,&]|feat\.|ft\./)
	featuredSplitRe = regexp.MustCompile(`(?i)(?:[,&]|feat\.|ft\.)`)
)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = slugInvalidRe.ReplaceAllString(s, "")
	s = slugHyphenRe.ReplaceAllString(s, "-")
	s = slugTrimRe.ReplaceAllString(s, "")
	s = slugTrailingRe.ReplaceAllString(s, "")
	return s
}

func generateTrackSlug(artist, title string) string {
	a := slugify(artist)
	t := slugify(title)
	if a == "" {
		return t
	}
	if t == "" {
		return a
	}
	return a + "-" + t
}

func generateArtistSlug(name string) string { return slugify(name) }

func sanitizeFeaturedArtists(v *string) *string {
	if v == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*v)
	if trimmed == "" || trimmed == "false" || trimmed == "null" {
		return nil
	}
	return &trimmed
}

// decodeID tries numeric parse first, then hashids if Env.IDs is configured.
func (e *Env) decodeID(s string) (int, bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0, false
	}
	if n, err := strconv.Atoi(s); err == nil {
		return n, true
	}
	if e.IDs != nil {
		if id, ok := e.IDs.Decode(s); ok {
			return id, true
		}
	}
	return 0, false
}

func (e *Env) encodeID(id int) string {
	if e.IDs != nil {
		return e.IDs.Encode(id)
	}
	return strconv.Itoa(id)
}

// parseIDParam resolves an ID string that may be numeric or hashid.
// Returns 0, false if unparseable.
func (e *Env) parseIDParam(s string) (int, bool) { return e.decodeID(s) }

// parseFeaturedNames splits featured_artists string using same pattern as Next.js.
func parseFeaturedNames(raw string) []string {
	parts := featuredSplitRe.Split(raw, -1)
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		t := strings.TrimSpace(p)
		if t != "" {
			out = append(out, t)
		}
	}
	return out
}

// ensureFeaturedArtists ensures each name in featured_artists exists as artist row (case-insensitive).
func (e *Env) ensureFeaturedArtists(r *http.Request, raw string) {
	names := parseFeaturedNames(raw)
	for _, name := range names {
		var existing int
		// ILIKE for case-insensitive exact match
		err := e.DB.QueryRow(r.Context(), `SELECT id FROM artists WHERE name ILIKE $1 LIMIT 1`, name).Scan(&existing)
		if err != nil {
			// not found -> create
			slug := generateArtistSlug(name)
			// insert with optional slug if column exists; tolerate duplicate on race
			_, _ = e.DB.Exec(r.Context(), `INSERT INTO artists(name, slug) VALUES($1,$2) ON CONFLICT DO NOTHING`, name, slug)
		}
	}
}

// ── tracks admin ────────────────────────────────────────────────────────────

const adminTrackSelect = `SELECT t.id, t.title, t.artist_id, t.album_id, t.spotify_id, t.isrc, t.deezer_id, t.cover_url, t.audio_key, t.cover_key, t.duration, t.genre, t.featured_artists, t.plays, t.slug, t.status, t.created_at, a.name AS artist_name, a.slug AS artist_slug
	FROM tracks t LEFT JOIN artists a ON a.id = t.artist_id`

// AdminListTracks mirrors app/api/admin/tracks GET.
// Query params: artist_id, title, artist_name, limit, offset, page, sort (optional)
func (e *Env) AdminListTracks(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query()
	artistName := strings.TrimSpace(q.Get("artist_name"))
	artistIDStr := strings.TrimSpace(q.Get("artist_id"))
	title := strings.TrimSpace(q.Get("title"))

	// Case 1: artist_name + title (ilike exact, returns single match with artistName)
	if artistName != "" && title != "" {
		rows, err := e.DB.Query(ctx, `SELECT id FROM artists WHERE name ILIKE $1 LIMIT 5`, artistName)
		if err != nil {
			writeError(w, 500, err.Error())
			return
		}
		defer rows.Close()
		var ids []int
		for rows.Next() {
			var id int
			_ = rows.Scan(&id)
			ids = append(ids, id)
		}
		if len(ids) == 0 {
			writeJSON(w, 200, []any{})
			return
		}
		// Build IN clause safely: use ANY($1::int[])
		row := e.DB.QueryRow(ctx, `SELECT t.id, t.title, a.name FROM tracks t LEFT JOIN artists a ON a.id=t.artist_id WHERE t.artist_id = ANY($1::int[]) AND t.title ILIKE $2 LIMIT 1`, ids, title)
		var tid int
		var ttitle string
		var aname *string
		if err := row.Scan(&tid, &ttitle, &aname); err != nil {
			// no match -> empty array per Next.js behavior
			writeJSON(w, 200, []any{})
			return
		}
		writeJSON(w, 200, []map[string]any{{"id": tid, "title": ttitle, "artistName": aname}})
		return
	}

	// Case 2: artist_id + title
	if artistIDStr != "" && title != "" {
		aid, ok := e.decodeID(artistIDStr)
		if !ok {
			writeError(w, 400, "invalid artist_id")
			return
		}
		row := e.DB.QueryRow(ctx, `SELECT t.id, t.title, t.artist_id, t.slug FROM tracks t WHERE t.artist_id=$1 AND t.title ILIKE $2 LIMIT 1`, aid, title)
		var tid, artistID int
		var ttitle string
		var slug *string
		if err := row.Scan(&tid, &ttitle, &artistID, &slug); err != nil {
			writeJSON(w, 200, []any{})
			return
		}
		// Return full track row similar to drizzle select(). Use generic map
		writeJSON(w, 200, []map[string]any{{"id": tid, "title": ttitle, "artist_id": artistID, "slug": slug}})
		return
	}

	// Case 3: paginated list (default)
	limit := 100
	if v := q.Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 500 {
			limit = n
		}
	}
	offset := 0
	if v := q.Get("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			offset = n
		}
	}
	// page overrides offset if present (1-indexed)
	if v := q.Get("page"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			offset = (n - 1) * limit
		}
	}

	rows, err := e.DB.Query(ctx, adminTrackSelect+` ORDER BY t.created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int
		var title string
		var artistID, albumID *int
		var spotifyID, isrc, deezerID, coverURL, audioKey, coverKey, genre, featured, slug, status *string
		var duration *float64
		var plays *int
		var createdAt *string
		var artistName, artistSlug *string
		// created_at is timestamp, scan as string then keep
		_ = rows.Scan(&id, &title, &artistID, &albumID, &spotifyID, &isrc, &deezerID, &coverURL, &audioKey, &coverKey, &duration, &genre, &featured, &plays, &slug, &status, &createdAt, &artistName, &artistSlug)
		// Plays may be null -> handled via *int? default 0 if nil
		m := map[string]any{
			"id": id, "title": title, "artist_id": artistID, "album_id": albumID,
			"spotify_id": spotifyID, "isrc": isrc, "deezer_id": deezerID,
			"cover_url": coverURL, "audio_key": audioKey, "cover_key": coverKey,
			"duration": duration, "genre": genre, "featured_artists": sanitizeFeaturedArtists(featured),
			"plays": plays, "slug": slug, "status": status, "created_at": createdAt,
			"artist_name": artistName, "artist_slug": artistSlug,
		}
		out = append(out, m)
	}
	if out == nil {
		out = []map[string]any{}
	}
	writeJSON(w, 200, out)
}

// AdminCreateTrack mirrors POST /api/admin/tracks
func (e *Env) AdminCreateTrack(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, 400, "invalid json")
		return
	}
	delete(body, "featured")

	// slug generation if missing and title + artist_id present
	if _, hasSlug := body["slug"]; !hasSlug {
		if t, ok := body["title"].(string); ok && t != "" {
			var aidStr string
			if v, ok := body["artist_id"]; ok {
				aidStr = fmt.Sprint(v)
			} else if v, ok := body["artistId"]; ok {
				aidStr = fmt.Sprint(v)
			}
			if aidStr != "" && aidStr != "<nil>" && aidStr != "0" {
				if aid, ok := e.decodeID(strings.TrimSpace(aidStr)); ok {
					var artistName string
					_ = e.DB.QueryRow(r.Context(), `SELECT name FROM artists WHERE id=$1 LIMIT 1`, aid).Scan(&artistName)
					if artistName != "" {
						body["slug"] = generateTrackSlug(artistName, t)
					}
				}
			}
		}
	}

	// Build dynamic insert
	cols := []string{}
	vals := []any{}
	ph := []string{}
	idx := 1
	// mapping json key -> db column
	colMap := map[string]string{
		"title": "title", "artist_id": "artist_id", "artistId": "artist_id",
		"album_id": "album_id", "albumId": "album_id",
		"spotify_id": "spotify_id", "spotifyId": "spotify_id",
		"isrc": "isrc", "deezer_id": "deezer_id", "deezerId": "deezer_id",
		"cover_url": "cover_url", "coverUrl": "cover_url",
		"audio_key": "audio_key", "audioKey": "audio_key",
		"cover_key": "cover_key", "coverKey": "cover_key",
		"duration": "duration", "genre": "genre", "tags": "tags",
		"featured_artists": "featured_artists", "featuredArtists": "featured_artists",
		"plays": "plays", "slug": "slug",
		"lyrics": "lyrics", "synced_lyrics": "synced_lyrics", "syncedLyrics": "synced_lyrics",
		"status": "status",
	}
	for k, v := range body {
		col, ok := colMap[k]
		if !ok {
			continue
		}
		cols = append(cols, col)
		vals = append(vals, v)
		ph = append(ph, fmt.Sprintf("$%d", idx))
		idx++
	}
	if len(cols) == 0 {
		writeError(w, 400, "no valid fields")
		return
	}
	// special handling for artist_id: ensure integer
	for i, c := range cols {
		if c == "artist_id" || c == "album_id" {
			// allow hashid strings
			if s, ok := vals[i].(string); ok {
				if nid, ok2 := e.decodeID(s); ok2 {
					vals[i] = nid
				}
			}
		}
		if c == "tags" {
			// ensure JSON marshalled
			if b, err := json.Marshal(vals[i]); err == nil {
				vals[i] = string(b)
			}
		}
	}
	query := fmt.Sprintf(`INSERT INTO tracks(%s) VALUES(%s) RETURNING id, title, artist_id, slug`,
		strings.Join(cols, ","), strings.Join(ph, ","))
	var nid int
	var ntitle string
	var nartistID *int
	var nslug *string
	if err := e.DB.QueryRow(r.Context(), query, vals...).Scan(&nid, &ntitle, &nartistID, &nslug); err != nil {
		writeError(w, 500, err.Error())
		return
	}
	_ = e.Cache.Del(r.Context(), cache.AllHomeKeys()...)
	_ = e.Cache.Del(r.Context(), cache.KeyTracksTrending(10), cache.KeyTracksTrending(24))
	writeJSON(w, 201, map[string]any{"id": nid, "title": ntitle, "artist_id": nartistID, "slug": nslug})
}

// AdminUpdateTrack mirrors PATCH /api/admin/tracks
func (e *Env) AdminUpdateTrack(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, 400, "invalid json")
		return
	}
	rawID, ok := body["id"]
	if !ok {
		writeError(w, 400, "id required")
		return
	}
	idStr := fmt.Sprint(rawID)
	trackID, ok := e.decodeID(idStr)
	if !ok {
		writeError(w, 400, "invalid id")
		return
	}
	// featured_artists auto-create artists
	if faRaw, has := body["featured_artists"]; has {
		if faStr, ok2 := faRaw.(string); ok2 && strings.TrimSpace(faStr) != "" {
			e.ensureFeaturedArtists(r, faStr)
		}
		delete(body, "featured_artists")
		// reinsert as featured_artists column value (may be empty string to clear)
		if faStr, ok2 := faRaw.(string); ok2 {
			body["featured_artists"] = faStr
		} else {
			body["featured_artists"] = faRaw
		}
	} else if faRaw, has := body["featuredArtists"]; has {
		if faStr, ok2 := faRaw.(string); ok2 && strings.TrimSpace(faStr) != "" {
			e.ensureFeaturedArtists(r, faStr)
		}
		body["featured_artists"] = faRaw
		delete(body, "featuredArtists")
	}
	// delete featured legacy key if present
	delete(body, "featured")
	delete(body, "id")

	if len(body) == 0 {
		writeJSON(w, 200, map[string]any{"ok": true})
		return
	}
	colMap := map[string]string{
		"title": "title", "artist_id": "artist_id", "artistId": "artist_id",
		"album_id": "album_id", "albumId": "album_id",
		"spotify_id": "spotify_id", "spotifyId": "spotify_id",
		"isrc": "isrc", "deezer_id": "deezer_id", "deezerId": "deezer_id",
		"cover_url": "cover_url", "coverUrl": "cover_url",
		"audio_key": "audio_key", "audioKey": "audio_key",
		"cover_key": "cover_key", "coverKey": "cover_key",
		"duration": "duration", "genre": "genre", "tags": "tags",
		"featured_artists": "featured_artists", "featuredArtists": "featured_artists",
		"plays": "plays", "slug": "slug",
		"lyrics": "lyrics", "synced_lyrics": "synced_lyrics", "syncedLyrics": "synced_lyrics",
		"status": "status",
	}
	sets := []string{}
	vals := []any{}
	idx := 1
	for k, v := range body {
		col, ok := colMap[k]
		if !ok {
			continue
		}
		sets = append(sets, fmt.Sprintf("%s=$%d", col, idx))
		if col == "artist_id" || col == "album_id" {
			if s, ok2 := v.(string); ok2 {
				if nid, ok3 := e.decodeID(s); ok3 {
					v = nid
				}
			}
		}
		if col == "tags" {
			if b, err := json.Marshal(v); err == nil {
				v = string(b)
			}
		}
		vals = append(vals, v)
		idx++
	}
	if len(sets) == 0 {
		writeJSON(w, 200, map[string]any{"ok": true})
		return
	}
	vals = append(vals, trackID)
	query := fmt.Sprintf(`UPDATE tracks SET %s WHERE id=$%d`, strings.Join(sets, ", "), idx)
	if _, err := e.DB.Exec(r.Context(), query, vals...); err != nil {
		writeError(w, 500, err.Error())
		return
	}
	_ = e.Cache.Del(r.Context(), cache.AllHomeKeys()...)
	writeJSON(w, 200, map[string]any{"ok": true})
}

// AdminDeleteTrack mirrors DELETE /api/admin/tracks
func (e *Env) AdminDeleteTrack(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ID any `json:"id"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, 400, "id required")
		return
	}
	if body.ID == nil {
		// also support query param ?id=
		if qid := r.URL.Query().Get("id"); qid != "" {
			body.ID = qid
		} else {
			writeError(w, 400, "id required")
			return
		}
	}
	idStr := fmt.Sprint(body.ID)
	trackID, ok := e.decodeID(idStr)
	if !ok {
		writeError(w, 400, "invalid id")
		return
	}
	if _, err := e.DB.Exec(r.Context(), `DELETE FROM tracks WHERE id=$1`, trackID); err != nil {
		writeError(w, 500, err.Error())
		return
	}
	_ = e.Cache.Del(r.Context(), cache.AllHomeKeys()...)
	writeJSON(w, 200, map[string]any{"ok": true})
}

// AdminTracks is a multiplex handler for /api/v1/admin/tracks wired via chi.Handle.
// Dispatches GET/POST/PATCH/DELETE to the specific handlers above.
func (e *Env) AdminTracks(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		e.AdminListTracks(w, r)
	case http.MethodPost:
		e.AdminCreateTrack(w, r)
	case http.MethodPatch, http.MethodPut:
		e.AdminUpdateTrack(w, r)
	case http.MethodDelete:
		e.AdminDeleteTrack(w, r)
	default:
		writeError(w, 405, "method not allowed")
	}
}

// ── artists admin ───────────────────────────────────────────────────────────

// AdminListArtists mirrors GET /api/admin/artists (ordered names asc)
func (e *Env) AdminListArtists(w http.ResponseWriter, r *http.Request) {
	rows, err := e.DB.Query(r.Context(), `SELECT id, name FROM artists ORDER BY name ASC`)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int
		var name string
		_ = rows.Scan(&id, &name)
		out = append(out, map[string]any{"id": id, "name": name})
	}
	if out == nil {
		out = []map[string]any{}
	}
	writeJSON(w, 200, out)
}

// AdminCreateArtist mirrors POST /api/admin/artists
func (e *Env) AdminCreateArtist(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name     string  `json:"name"`
		Bio      *string `json:"bio"`
		ImageKey *string `json:"image_key"`
		ImageURL *string `json:"image_url"`
	}
	if err := decodeJSON(r, &body); err != nil || strings.TrimSpace(body.Name) == "" {
		writeError(w, 400, "name required")
		return
	}
	name := strings.TrimSpace(body.Name)
	slug := generateArtistSlug(name)
	// Prefer image_url if given, else image_key legacy
	var coverVal *string
	var col string
	if body.ImageURL != nil && strings.TrimSpace(*body.ImageURL) != "" {
		coverVal = body.ImageURL
		col = "image_url"
	} else if body.ImageKey != nil && strings.TrimSpace(*body.ImageKey) != "" {
		coverVal = body.ImageKey
		// Try image_key column, fallback to image_url if image_key missing
		col = "image_key"
	}
	var id int
	var retName string
	var err error
	if col != "" {
		q := fmt.Sprintf(`INSERT INTO artists(name, slug, bio, %s) VALUES($1,$2,$3,$4) RETURNING id, name`, col)
		err = e.DB.QueryRow(r.Context(), q, name, slug, body.Bio, *coverVal).Scan(&id, &retName)
	} else {
		err = e.DB.QueryRow(r.Context(), `INSERT INTO artists(name, slug, bio) VALUES($1,$2,$3) RETURNING id, name`, name, slug, body.Bio).Scan(&id, &retName)
	}
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	_ = e.Cache.Del(r.Context(), cache.AllHomeKeys()...)
	writeJSON(w, 201, map[string]any{"id": id, "name": retName})
}

// AdminUpdateArtist mirrors PATCH /api/admin/artists/[id]
func (e *Env) AdminUpdateArtist(w http.ResponseWriter, r *http.Request) {
	paramID := chi.URLParam(r, "id")
	if paramID == "" {
		paramID = r.URL.Query().Get("id")
	}
	if paramID == "" {
		var body map[string]any
		_ = decodeJSON(r, &body)
		if v, ok := body["id"]; ok {
			paramID = fmt.Sprint(v)
		}
		// body already consumed; re-decode for fields below will fail, so handle separately
		// Instead read again via raw map already read
		// Simplify: if we already read body, use it for updates
		if paramID == "" {
			writeError(w, 400, "id required")
			return
		}
		// we consumed body, proceed with that map
		artistID, ok := e.parseIDParam(paramID)
		if !ok {
			writeError(w, 400, "invalid id")
			return
		}
		var fields map[string]any = body
		delete(fields, "id")
		if len(fields) == 0 {
			writeJSON(w, 200, map[string]any{"ok": true})
			return
		}
		sets := []string{}
		vals := []any{}
		idx := 1
		for k, v := range fields {
			var col string
			switch k {
			case "name":
				col = "name"
			case "bio":
				col = "bio"
			case "image_key":
				col = "image_key"
			case "image_url":
				col = "image_url"
			case "slug":
				col = "slug"
			default:
				continue
			}
			sets = append(sets, fmt.Sprintf("%s=$%d", col, idx))
			vals = append(vals, v)
			idx++
		}
		if len(sets) == 0 {
			writeJSON(w, 200, map[string]any{"ok": true})
			return
		}
		vals = append(vals, artistID)
		q := fmt.Sprintf(`UPDATE artists SET %s WHERE id=$%d`, strings.Join(sets, ", "), idx)
		_, _ = e.DB.Exec(r.Context(), q, vals...)
		_ = e.Cache.Del(r.Context(), cache.AllHomeKeys()...)
		writeJSON(w, 200, map[string]any{"ok": true})
		return
	}
	artistID, ok := e.parseIDParam(paramID)
	if !ok {
		writeError(w, 400, "invalid id")
		return
	}
	var body struct {
		Name     *string `json:"name"`
		Bio      *string `json:"bio"`
		ImageKey *string `json:"image_key"`
		ImageURL *string `json:"image_url"`
		Slug     *string `json:"slug"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, 400, "invalid json")
		return
	}
	sets := []string{}
	vals := []any{}
	idx := 1
	if body.Name != nil {
		sets = append(sets, fmt.Sprintf("name=$%d", idx))
		vals = append(vals, *body.Name)
		idx++
		// also update slug if name changed and slug not provided
		if body.Slug == nil {
			sets = append(sets, fmt.Sprintf("slug=$%d", idx))
			vals = append(vals, generateArtistSlug(*body.Name))
			idx++
		}
	}
	if body.Slug != nil {
		sets = append(sets, fmt.Sprintf("slug=$%d", idx))
		vals = append(vals, *body.Slug)
		idx++
	}
	if body.Bio != nil {
		sets = append(sets, fmt.Sprintf("bio=$%d", idx))
		vals = append(vals, *body.Bio)
		idx++
	}
	if body.ImageURL != nil {
		sets = append(sets, fmt.Sprintf("image_url=$%d", idx))
		vals = append(vals, *body.ImageURL)
		idx++
	} else if body.ImageKey != nil {
		sets = append(sets, fmt.Sprintf("image_key=$%d", idx))
		vals = append(vals, *body.ImageKey)
		idx++
	}
	if len(sets) == 0 {
		writeJSON(w, 200, map[string]any{"ok": true})
		return
	}
	vals = append(vals, artistID)
	query := fmt.Sprintf(`UPDATE artists SET %s WHERE id=$%d`, strings.Join(sets, ", "), idx)
	if _, err := e.DB.Exec(r.Context(), query, vals...); err != nil {
		writeError(w, 500, err.Error())
		return
	}
	_ = e.Cache.Del(r.Context(), cache.AllHomeKeys()...)
	writeJSON(w, 200, map[string]any{"ok": true})
}

// AdminDeleteArtist mirrors DELETE /api/admin/artists/[id]
func (e *Env) AdminDeleteArtist(w http.ResponseWriter, r *http.Request) {
	paramID := chi.URLParam(r, "id")
	if paramID == "" {
		paramID = r.URL.Query().Get("id")
	}
	if paramID == "" {
		var body struct {
			ID any `json:"id"`
		}
		if err := decodeJSON(r, &body); err == nil && body.ID != nil {
			paramID = fmt.Sprint(body.ID)
		}
	}
	if paramID == "" {
		writeError(w, 400, "id required")
		return
	}
	aid, ok := e.parseIDParam(paramID)
	if !ok {
		writeError(w, 400, "invalid id")
		return
	}
	if _, err := e.DB.Exec(r.Context(), `DELETE FROM artists WHERE id=$1`, aid); err != nil {
		writeError(w, 500, err.Error())
		return
	}
	_ = e.Cache.Del(r.Context(), cache.AllHomeKeys()...)
	writeJSON(w, 200, map[string]any{"ok": true})
}

// AdminArtists multiplex for /api/v1/admin/artists and /api/v1/admin/artists/{id}
func (e *Env) AdminArtists(w http.ResponseWriter, r *http.Request) {
	// chi route with {id} will have param
	if chi.URLParam(r, "id") != "" {
		switch r.Method {
		case http.MethodPatch, http.MethodPut:
			e.AdminUpdateArtist(w, r)
		case http.MethodDelete:
			e.AdminDeleteArtist(w, r)
		case http.MethodGet:
			// fallback to single artist? return list for now
			e.AdminListArtists(w, r)
		default:
			writeError(w, 405, "method not allowed")
		}
		return
	}
	switch r.Method {
	case http.MethodGet:
		e.AdminListArtists(w, r)
	case http.MethodPost:
		e.AdminCreateArtist(w, r)
	case http.MethodPatch, http.MethodPut:
		e.AdminUpdateArtist(w, r)
	case http.MethodDelete:
		e.AdminDeleteArtist(w, r)
	default:
		writeError(w, 405, "method not allowed")
	}
}

// ── albums admin ────────────────────────────────────────────────────────────

// AdminListAlbums mirrors GET /api/admin/albums
func (e *Env) AdminListAlbums(w http.ResponseWriter, r *http.Request) {
	rows, err := e.DB.Query(r.Context(), `SELECT al.id, al.title, al.artist_id, al.release_year, a.name FROM albums al LEFT JOIN artists a ON a.id=al.artist_id ORDER BY al.created_at DESC`)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int
		var title string
		var artistID *int
		var releaseYear *int
		var artistName *string
		_ = rows.Scan(&id, &title, &artistID, &releaseYear, &artistName)
		out = append(out, map[string]any{"id": id, "title": title, "artistId": artistID, "artist_id": artistID, "releaseYear": releaseYear, "release_year": releaseYear, "artistName": artistName})
	}
	if out == nil {
		out = []map[string]any{}
	}
	writeJSON(w, 200, out)
}

// AdminCreateAlbum mirrors POST /api/admin/albums
func (e *Env) AdminCreateAlbum(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, 400, "invalid json")
		return
	}
	colMap := map[string]string{
		"title": "title", "artist_id": "artist_id", "artistId": "artist_id",
		"slug": "slug", "album_type": "album_type", "albumType": "album_type",
		"release_year": "release_year", "releaseYear": "release_year",
		"release_date": "release_date", "releaseDate": "release_date",
		"spotify_id": "spotify_id", "spotifyId": "spotify_id",
		"deezer_id": "deezer_id", "deezerId": "deezer_id",
		"cover_url": "cover_url", "coverUrl": "cover_url", "cover_key": "cover_key", "coverKey": "cover_key",
		"is_featured": "is_featured", "isFeatured": "is_featured",
	}
	cols := []string{}
	vals := []any{}
	ph := []string{}
	idx := 1
	for k, v := range body {
		col, ok := colMap[k]
		if !ok {
			continue
		}
		cols = append(cols, col)
		if (col == "artist_id") {
			if s, ok2 := v.(string); ok2 {
				if nid, ok3 := e.decodeID(s); ok3 {
					v = nid
				}
			}
		}
		vals = append(vals, v)
		ph = append(ph, fmt.Sprintf("$%d", idx))
		idx++
	}
	if len(cols) == 0 {
		writeError(w, 400, "no valid fields")
		return
	}
	// generate slug if missing
	hasSlug := false
	for _, c := range cols {
		if c == "slug" {
			hasSlug = true
			break
		}
	}
	if !hasSlug {
		if t, ok := body["title"].(string); ok && t != "" {
			var aidAny any
			if v, ok := body["artist_id"]; ok {
				aidAny = v
			} else if v, ok := body["artistId"]; ok {
				aidAny = v
			}
			if aidAny != nil {
				aidStr := fmt.Sprint(aidAny)
				if aid, ok2 := e.decodeID(aidStr); ok2 {
					var artistName string
					_ = e.DB.QueryRow(r.Context(), `SELECT name FROM artists WHERE id=$1`, aid).Scan(&artistName)
					if artistName != "" {
						albumSlug := slugify(artistName) + "-" + slugify(t)
						cols = append(cols, "slug")
						vals = append(vals, albumSlug)
						ph = append(ph, fmt.Sprintf("$%d", idx))
						idx++
					}
				}
			}
		}
	}
	query := fmt.Sprintf(`INSERT INTO albums(%s) VALUES(%s) RETURNING id, title, artist_id`, strings.Join(cols, ","), strings.Join(ph, ","))
	var nid int
	var ntitle string
	var nartistID *int
	if err := e.DB.QueryRow(r.Context(), query, vals...).Scan(&nid, &ntitle, &nartistID); err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 201, map[string]any{"id": nid, "title": ntitle, "artist_id": nartistID})
}

// AdminUpdateAlbum handles PATCH /api/v1/admin/albums
func (e *Env) AdminUpdateAlbum(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, 400, "invalid json")
		return
	}
	rawID, ok := body["id"]
	if !ok {
		// try chi param
		rawID = chi.URLParam(r, "id")
		if rawID == "" {
			writeError(w, 400, "id required")
			return
		}
	}
	aid, ok := e.decodeID(fmt.Sprint(rawID))
	if !ok {
		writeError(w, 400, "invalid id")
		return
	}
	delete(body, "id")
	colMap := map[string]string{
		"title": "title", "artist_id": "artist_id", "artistId": "artist_id",
		"slug": "slug", "album_type": "album_type", "albumType": "album_type",
		"release_year": "release_year", "releaseYear": "release_year",
		"release_date": "release_date", "releaseDate": "release_date",
		"spotify_id": "spotify_id", "spotifyId": "spotify_id",
		"deezer_id": "deezer_id", "deezerId": "deezer_id",
		"cover_url": "cover_url", "coverUrl": "cover_url", "cover_key": "cover_key", "coverKey": "cover_key",
		"is_featured": "is_featured", "isFeatured": "is_featured",
	}
	sets := []string{}
	vals := []any{}
	idx := 1
	for k, v := range body {
		col, ok := colMap[k]
		if !ok {
			continue
		}
		if col == "artist_id" {
			if s, ok2 := v.(string); ok2 {
				if nid, ok3 := e.decodeID(s); ok3 {
					v = nid
				}
			}
		}
		sets = append(sets, fmt.Sprintf("%s=$%d", col, idx))
		vals = append(vals, v)
		idx++
	}
	if len(sets) == 0 {
		writeJSON(w, 200, map[string]any{"ok": true})
		return
	}
	vals = append(vals, aid)
	query := fmt.Sprintf(`UPDATE albums SET %s WHERE id=$%d`, strings.Join(sets, ", "), idx)
	if _, err := e.DB.Exec(r.Context(), query, vals...); err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

// AdminDeleteAlbum handles DELETE /api/v1/admin/albums
func (e *Env) AdminDeleteAlbum(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ID any `json:"id"`
	}
	_ = decodeJSON(r, &body)
	idStr := ""
	if body.ID != nil {
		idStr = fmt.Sprint(body.ID)
	} else {
		idStr = chi.URLParam(r, "id")
		if idStr == "" {
			idStr = r.URL.Query().Get("id")
		}
	}
	if idStr == "" {
		writeError(w, 400, "id required")
		return
	}
	aid, ok := e.decodeID(idStr)
	if !ok {
		writeError(w, 400, "invalid id")
		return
	}
	if _, err := e.DB.Exec(r.Context(), `DELETE FROM albums WHERE id=$1`, aid); err != nil {
		writeError(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

// AdminAlbums multiplex
func (e *Env) AdminAlbums(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		e.AdminListAlbums(w, r)
	case http.MethodPost:
		e.AdminCreateAlbum(w, r)
	case http.MethodPatch, http.MethodPut:
		e.AdminUpdateAlbum(w, r)
	case http.MethodDelete:
		e.AdminDeleteAlbum(w, r)
	default:
		writeError(w, 405, "method not allowed")
	}
}

// ── hero / featured_slots admin ────────────────────────────────────────────

// heroRow mirrors Next.js mapTrack output via featured_slots join
func (e *Env) AdminListHero(w http.ResponseWriter, r *http.Request) {
	rows, err := e.DB.Query(r.Context(), `
		SELECT f.track_id, f.position, f.slot_type, f.is_active,
		       t.id, t.title, t.audio_key, t.cover_key, t.cover_url, t.duration, t.slug, t.featured_artists,
		       t.artist_id, a.name, a.slug
		FROM featured_slots f
		LEFT JOIN tracks t ON t.id = f.track_id
		LEFT JOIN artists a ON a.id = t.artist_id
		WHERE f.slot_type='hero'
		ORDER BY f.position ASC`)
	if err != nil {
		writeError(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var fTrackID, fPos *int
		var slotType *string
		var isActive *bool
		var tID *int
		var title, audioKey, coverKey, coverURL, duration, slug, feat *string
		var artistID *int
		var artistName, artistSlug *string
		_ = rows.Scan(&fTrackID, &fPos, &slotType, &isActive, &tID, &title, &audioKey, &coverKey, &coverURL, &duration, &slug, &feat, &artistID, &artistName, &artistSlug)
		// Build audio/cover URLs via CDN resolver parity
		var audioURL string
		if audioKey != nil && strings.TrimSpace(*audioKey) != "" {
			// Use CDN resolver
			src := e.CDN.AudioURL(audioKey, nil)
			if src != nil {
				audioURL = src.URL
			}
		}
		// sanitize featured
		sanitizedFeat := sanitizeFeaturedArtists(feat)
		// cover URL
		var cv *string
		if coverURL != nil && strings.TrimSpace(*coverURL) != "" {
			cv = coverURL
		} else if coverKey != nil && strings.TrimSpace(*coverKey) != "" {
			u := fmt.Sprintf("%s/%s", strings.TrimRight(e.CDN.R2PublicURL, "/"), strings.TrimSpace(*coverKey))
			cv = &u
		}
		m := map[string]any{
			"track_id": fTrackID, "position": fPos, "slot_type": slotType, "is_active": isActive,
			"id": tID, "title": title, "artistId": artistID, "artist_id": artistID,
			"artist": artistName, "artistName": artistName, "artistSlug": artistSlug,
			"featuredArtists": sanitizedFeat, "featured_artists": sanitizedFeat,
			"audioUrl": audioURL, "coverUrl": cv, "duration": duration, "slug": slug,
		}
		out = append(out, m)
	}
	if out == nil {
		out = []map[string]any{}
	}
	writeJSON(w, 200, out)
}

// AdminCreateHero adds a track to hero slot (featured_slots track_id unique per slot_type)
func (e *Env) AdminCreateHero(w http.ResponseWriter, r *http.Request) {
	var body struct {
		TrackID any `json:"track_id"`
		TrackId any `json:"trackId"`
	}
	if err := decodeJSON(r, &body); err != nil {
		writeError(w, 400, "track_id required")
		return
	}
	raw := body.TrackID
	if raw == nil {
		raw = body.TrackId
	}
	if raw == nil {
		writeError(w, 400, "track_id required")
		return
	}
	tid, ok := e.decodeID(fmt.Sprint(raw))
	if !ok {
		writeError(w, 400, "invalid track_id")
		return
	}
	var count int
	_ = e.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM featured_slots WHERE slot_type='hero'`).Scan(&count)
	_, err := e.DB.Exec(r.Context(), `INSERT INTO featured_slots(track_id, slot_type, position) VALUES($1,'hero',$2) ON CONFLICT DO NOTHING`, tid, count)
	if err != nil {
		// fallback: if unique violation on (slot_type, position) try next position
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			_, _ = e.DB.Exec(r.Context(), `INSERT INTO featured_slots(track_id, slot_type, position) VALUES($1,'hero',$2) ON CONFLICT DO NOTHING`, tid, count+1)
		} else {
			writeError(w, 500, err.Error())
			return
		}
	}
	// Also keep hero_tracks in sync for legacy reads
	_, _ = e.DB.Exec(r.Context(), `INSERT INTO hero_tracks(track_id, position) VALUES($1,$2) ON CONFLICT DO NOTHING`, tid, count)
	_ = e.Cache.Del(r.Context(), cache.KeyHero, cache.KeyHome)
	writeJSON(w, 200, map[string]any{"ok": true})
}

// AdminDeleteHero removes from hero
func (e *Env) AdminDeleteHero(w http.ResponseWriter, r *http.Request) {
	var body struct {
		TrackID any `json:"track_id"`
		TrackId any `json:"trackId"`
	}
	// allow body or query param
	if err := decodeJSON(r, &body); err != nil {
		// try query param fallback
		if q := r.URL.Query().Get("track_id"); q != "" {
			tid, ok := e.decodeID(q)
			if !ok {
				writeError(w, 400, "invalid track_id")
				return
			}
			_, _ = e.DB.Exec(r.Context(), `DELETE FROM featured_slots WHERE track_id=$1 AND slot_type='hero'`, tid)
			_, _ = e.DB.Exec(r.Context(), `DELETE FROM hero_tracks WHERE track_id=$1`, tid)
			_ = e.Cache.Del(r.Context(), cache.KeyHero, cache.KeyHome)
			writeJSON(w, 200, map[string]any{"ok": true})
			return
		}
		writeError(w, 400, "track_id required")
		return
	}
	raw := body.TrackID
	if raw == nil {
		raw = body.TrackId
	}
	if raw == nil {
		if q := r.URL.Query().Get("track_id"); q != "" {
			raw = q
		} else {
			writeError(w, 400, "track_id required")
			return
		}
	}
	tid, ok := e.decodeID(fmt.Sprint(raw))
	if !ok {
		writeError(w, 400, "invalid track_id")
		return
	}
	_, _ = e.DB.Exec(r.Context(), `DELETE FROM featured_slots WHERE track_id=$1 AND slot_type='hero'`, tid)
	_, _ = e.DB.Exec(r.Context(), `DELETE FROM hero_tracks WHERE track_id=$1`, tid)
	_ = e.Cache.Del(r.Context(), cache.KeyHero, cache.KeyHome)
	writeJSON(w, 200, map[string]any{"ok": true})
}

// AdminReorderHero handles PATCH with {order: [{track_id, position}]}
func (e *Env) AdminReorderHero(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Order []struct {
			TrackID  any `json:"track_id"`
			TrackId  any `json:"trackId"`
			Position int `json:"position"`
		} `json:"order"`
	}
	if err := decodeJSON(r, &body); err != nil || body.Order == nil {
		writeError(w, 400, "order required")
		return
	}
	for _, o := range body.Order {
		raw := o.TrackID
		if raw == nil {
			raw = o.TrackId
		}
		if raw == nil {
			continue
		}
		tid, ok := e.decodeID(fmt.Sprint(raw))
		if !ok {
			continue
		}
		// featured_slots may have unique slot_type+position, so do two-phase: update to temp then final?
		// Simple: update directly; if conflict, delete conflicting row first
		_, _ = e.DB.Exec(r.Context(), `UPDATE featured_slots SET position=$1 WHERE track_id=$2 AND slot_type='hero'`, o.Position, tid)
		_, _ = e.DB.Exec(r.Context(), `UPDATE hero_tracks SET position=$1 WHERE track_id=$2`, o.Position, tid)
	}
	_ = e.Cache.Del(r.Context(), cache.KeyHero, cache.KeyHome)
	writeJSON(w, 200, map[string]any{"ok": true})
}

// AdminHero multiplex GET/POST/PATCH/DELETE for /api/v1/admin/hero
func (e *Env) AdminHero(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		e.AdminListHero(w, r)
	case http.MethodPost:
		e.AdminCreateHero(w, r)
	case http.MethodPatch, http.MethodPut:
		e.AdminReorderHero(w, r)
	case http.MethodDelete:
		e.AdminDeleteHero(w, r)
	default:
		writeError(w, 405, "method not allowed")
	}
}
