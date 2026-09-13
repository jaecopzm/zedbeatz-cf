package routes

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"zedbeatz/backend/internal/handlers"
	"zedbeatz/backend/internal/middleware"
)

func New(e *handlers.Env, frontendURL, adminSecret string) http.Handler {
	// Allow comma-separated FRONTEND_URL for multiple origins (prod + preview)
	origins := []string{}
	for _, o := range splitCSV(frontendURL) {
		if o != "" {
			origins = append(origins, o)
		}
	}
	if len(origins) == 0 {
		origins = []string{"https://zedbeatz.com"}
	}
	r := chi.NewRouter()
	r.Use(middleware.OptionalAuth)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "x-admin-secret"},
		AllowCredentials: true,
	}))

	r.Get("/health", e.Health)

	// Public — no auth
	r.Get("/api/v1/tracks", e.ListTracks)
	r.Get("/api/v1/tracks/{id}", e.GetTrack)
	r.Post("/api/v1/tracks/play", e.PlayTrack)
	r.Get("/api/v1/tracks/{id}/lyrics", e.TrackLyrics)
	r.Get("/api/v1/artists", e.ListArtists)
	r.Get("/api/v1/artists/{id}", e.GetArtist)
	r.Get("/api/v1/albums", e.ListAlbums)
	r.Get("/api/v1/albums/{id}", e.GetAlbum)
	r.Get("/api/v1/search", e.Search)
	r.Get("/api/v1/home", e.Home)
	r.Get("/api/v1/hero", e.Hero)
	r.Get("/api/v1/radio", e.Radio)
	r.Post("/api/v1/lyrics/check", e.LyricsCheck)
	r.Get("/api/v1/playlists", e.ListPlaylists)
	r.Get("/api/v1/comments", e.Comments)
	r.Get("/api/v1/follows", e.Follows)
	r.Post("/api/v1/recently-played", e.LogPlay)
	r.Get("/api/v1/recently-played/list", e.ListRecent)
	r.Get("/api/v1/stats", e.Stats)
	r.Get("/api/v1/follows/releases", func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"releases":[]}`))
	})
	// Public stubs — likes/comments follow/follows are local-only now
	r.Get("/api/v1/likes", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"liked":false,"tracks":[]}`))
	})

	// Upload — admin only (presign + delete)
	r.Group(func(ar chi.Router) {
		ar.Use(middleware.RequireAdmin(adminSecret))
		ar.Post("/api/v1/upload", e.PresignUpload)
		ar.Delete("/api/v1/upload/delete", e.DeleteUpload)
		ar.Handle("/api/v1/admin/tracks", http.HandlerFunc(e.AdminTracks))
		ar.Handle("/api/v1/admin/artists", http.HandlerFunc(e.AdminArtists))
		ar.Handle("/api/v1/admin/artists/{id}", http.HandlerFunc(e.AdminArtists))
	})

	return r
}

func splitCSV(s string) []string {
	out := []string{}
	cur := ""
	for _, c := range s {
		if c == ',' {
			out = append(out, trim(cur))
			cur = ""
		} else {
			cur += string(c)
		}
	}
	out = append(out, trim(cur))
	return out
}

func trim(s string) string {
	for len(s) > 0 && (s[0] == ' ' || s[0] == '\t') {
		s = s[1:]
	}
	for len(s) > 0 && (s[len(s)-1] == ' ' || s[len(s)-1] == '\t') {
		s = s[:len(s)-1]
	}
	return s
}
