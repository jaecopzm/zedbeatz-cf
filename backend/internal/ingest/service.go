package ingest

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"zedbeatz/backend/internal/r2"
	"zedbeatz/backend/internal/spotify"
)

// Request mirrors POST /api/v1/admin/ingest payload.
type Request struct {
	SpotifyID  *string `json:"spotify_id"`
	YoutubeURL *string `json:"youtube_url"`
	FileKey    *string `json:"file_key"`
	ArtistID   *int    `json:"artist_id"`
	ArtistName *string `json:"artist_name"`
	Title      *string `json:"title"`
	Genre      *string `json:"genre"`
	CoverURL   *string `json:"cover_url"`
}

// JobStatus values persisted to ingest_jobs and returned to callers.
type JobStatus string

const (
	StatusQueued   JobStatus = "queued"
	StatusRunning  JobStatus = "running"
	StatusDone     JobStatus = "done"
	StatusFailed   JobStatus = "failed"
	StatusPending  JobStatus = "pending"
)

// Job persisted in memory and optionally in DB table ingest_jobs.
type Job struct {
	ID        string    `json:"job_id"`
	Status    JobStatus `json:"status"`
	Error     *string   `json:"error,omitempty"`
	TrackID   *int      `json:"track_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Payload   Request   `json:"-"`
}

// Service handles enqueue, workers, and processing.
type Service struct {
	DB         *pgxpool.Pool
	R2         *r2.Client
	Spotify    *spotify.Client
	StreamerURLs []string

	mu   sync.RWMutex
	jobs map[string]*Job
	queue chan string
	workers int
	httpClient *http.Client
}

var (
	slugInvalidRe  = regexp.MustCompile(`[^\w\s-]`)
	slugHyphenRe   = regexp.MustCompile(`[\s_-]+`)
	slugTrimRe     = regexp.MustCompile(`^-+|-+$`)
	slugTrailingRe = regexp.MustCompile(`-\d+$`)
)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = slugInvalidRe.ReplaceAllString(s, "")
	s = slugHyphenRe.ReplaceAllString(s, "-")
	s = slugTrimRe.ReplaceAllString(s, "")
	s = slugTrailingRe.ReplaceAllString(s, "")
	return s
}

func generateSlug(artist, title string) string {
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

// New creates Service and starts workers. streamerURLs may be empty -> defaults.
// It also ensures ingest_jobs table exists (best-effort, ignore errors).
func New(db *pgxpool.Pool, r2c *r2.Client, sp *spotify.Client, streamerURL string) *Service {
	if streamerURL == "" {
		streamerURL = "http://test.zedbeatz.com"
	}
	urls := []string{
		streamerURL,
		"http://localhost:8081",
	}
	// deduplicate preserving order
	seen := map[string]bool{}
	dedup := []string{}
	for _, u := range urls {
		if !seen[u] {
			seen[u] = true
			dedup = append(dedup, strings.TrimRight(u, "/"))
		}
	}
	s := &Service{
		DB:           db,
		R2:           r2c,
		Spotify:      sp,
		StreamerURLs: dedup,
		jobs:         make(map[string]*Job),
		queue:        make(chan string, 200),
		workers:      2,
		httpClient:   &http.Client{Timeout: 120 * time.Second},
	}
	// ensure ingest_jobs table
	if db != nil {
		_, _ = db.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS ingest_jobs (
			id TEXT PRIMARY KEY,
			status TEXT NOT NULL,
			payload JSONB,
			error TEXT,
			track_id INT,
			created_at TIMESTAMPTZ DEFAULT now(),
			updated_at TIMESTAMPTZ DEFAULT now()
		)`)
		// try to load pending jobs? not needed
	}
	for i := 0; i < s.workers; i++ {
		go s.worker()
	}
	return s
}

func (s *Service) worker() {
	for id := range s.queue {
		s.process(id)
	}
}

func (s *Service) Enqueue(ctx context.Context, req Request) (*Job, error) {
	// validation: at least one source
	hasSource := (req.SpotifyID != nil && strings.TrimSpace(*req.SpotifyID) != "") ||
		(req.YoutubeURL != nil && strings.TrimSpace(*req.YoutubeURL) != "") ||
		(req.FileKey != nil && strings.TrimSpace(*req.FileKey) != "")
	if !hasSource {
		return nil, fmt.Errorf("one of spotify_id, youtube_url, file_key required")
	}
	id := uuid.New().String()
	now := time.Now().UTC()
	job := &Job{
		ID:        id,
		Status:    StatusQueued,
		CreatedAt: now,
		UpdatedAt: now,
		Payload:   req,
	}
	s.mu.Lock()
	s.jobs[id] = job
	s.mu.Unlock()
	if s.DB != nil {
		b, _ := json.Marshal(req)
		_, _ = s.DB.Exec(ctx, `INSERT INTO ingest_jobs(id, status, payload, created_at, updated_at) VALUES($1,$2,$3::jsonb,$4,$5) ON CONFLICT (id) DO NOTHING`,
			id, string(StatusQueued), string(b), now, now)
	}
	select {
	case s.queue <- id:
	default:
		// if queue full, process inline goroutine
		go s.process(id)
	}
	return job, nil
}

func (s *Service) GetJob(ctx context.Context, id string) (*Job, bool) {
	s.mu.RLock()
	j, ok := s.jobs[id]
	s.mu.RUnlock()
	if ok {
		return j, true
	}
	// fallback to DB
	if s.DB != nil {
		var status string
		var errMsg *string
		var trackID *int
		var created, updated time.Time
		err := s.DB.QueryRow(ctx, `SELECT status, error, track_id, created_at, updated_at FROM ingest_jobs WHERE id=$1 LIMIT 1`, id).Scan(&status, &errMsg, &trackID, &created, &updated)
		if err == nil {
			j2 := &Job{ID: id, Status: JobStatus(status), Error: errMsg, TrackID: trackID, CreatedAt: created, UpdatedAt: updated}
			s.mu.Lock()
			s.jobs[id] = j2
			s.mu.Unlock()
			return j2, true
		}
	}
	return nil, false
}

func (s *Service) updateStatus(ctx context.Context, id string, status JobStatus, errMsg *string, trackID *int) {
	now := time.Now().UTC()
	s.mu.Lock()
	if j, ok := s.jobs[id]; ok {
		j.Status = status
		j.Error = errMsg
		j.TrackID = trackID
		j.UpdatedAt = now
	}
	s.mu.Unlock()
	if s.DB != nil {
		_, _ = s.DB.Exec(ctx, `UPDATE ingest_jobs SET status=$2, error=$3, track_id=$4, updated_at=$5 WHERE id=$1`, id, string(status), errMsg, trackID, now)
	}
}

func (s *Service) process(id string) {
	ctx := context.Background()
	s.updateStatus(ctx, id, StatusRunning, nil, nil)
	s.mu.RLock()
	job, ok := s.jobs[id]
	s.mu.RUnlock()
	if !ok {
		s.updateStatus(ctx, id, StatusFailed, strPtr("job not found"), nil)
		return
	}
	req := job.Payload
	trackID, err := s.handleIngest(ctx, req)
	if err != nil {
		msg := err.Error()
		s.updateStatus(ctx, id, StatusFailed, &msg, nil)
		return
	}
	s.updateStatus(ctx, id, StatusDone, nil, trackID)
}

func strPtr(s string) *string { return &s }

func (s *Service) handleIngest(ctx context.Context, req Request) (*int, error) {
	// Resolve metadata: title, artistName, coverURL, spotify_id
	title := ""
	if req.Title != nil {
		title = strings.TrimSpace(*req.Title)
	}
	artistName := ""
	if req.ArtistName != nil {
		artistName = strings.TrimSpace(*req.ArtistName)
	}
	coverURL := ""
	if req.CoverURL != nil {
		coverURL = strings.TrimSpace(*req.CoverURL)
	}
	spotifyID := ""
	if req.SpotifyID != nil {
		spotifyID = strings.TrimSpace(*req.SpotifyID)
	}
	// If spotify_id provided and title/artist missing, fetch from Spotify
	var spotifyTrack *spotify.Track
	if spotifyID != "" && s.Spotify != nil {
		if title == "" || artistName == "" || coverURL == "" {
			if tr, err := s.Spotify.GetTrack(ctx, spotifyID); err == nil && tr != nil {
				spotifyTrack = tr
				if title == "" {
					title = tr.Title
				}
				if artistName == "" {
					artistName = tr.Artist
				}
				if coverURL == "" {
					coverURL = tr.CoverURL
				}
			}
		}
	}
	if title == "" {
		// fallback placeholder
		if spotifyID != "" {
			title = "track-" + spotifyID
		} else if req.FileKey != nil {
			title = strings.TrimSuffix(strings.TrimSpace(*req.FileKey), ".mp3")
		} else {
			title = fmt.Sprintf("track-%d", time.Now().UnixMilli())
		}
	}
	if artistName == "" {
		artistName = "Unknown Artist"
	}

	// Ensure artist exists -> get artistID
	artistID, err := s.ensureArtist(ctx, req.ArtistID, artistName)
	if err != nil {
		return nil, fmt.Errorf("artist: %w", err)
	}

	// Obtain audio bytes & key
	var audioKey string
	var audioContentType = "audio/mpeg"
	var durationSec *int
	if spotifyTrack != nil && spotifyTrack.Duration > 0 {
		sec := spotifyTrack.Duration / 1000
		durationSec = &sec
	}
	if req.FileKey != nil && strings.TrimSpace(*req.FileKey) != "" {
		// already in R2, just use key
		audioKey = strings.TrimSpace(*req.FileKey)
	} else if spotifyID != "" {
		data, ct, err := s.fetchAudioFromStreamer(ctx, spotifyID)
		if err != nil {
			return nil, fmt.Errorf("streamer download: %w", err)
		}
		if ct != "" {
			audioContentType = ct
		}
		// optional transcode placeholder: if not mp3, we keep raw; ffmpeg step skipped for now
		slug := generateSlug(artistName, title)
		if slug == "" {
			slug = fmt.Sprintf("track-%d", time.Now().UnixMilli())
		}
		// key like audio/178...-slug.mp3 — use unix milli for uniqueness
		audioKey = fmt.Sprintf("audio/%d-%s.mp3", time.Now().UnixMilli(), slug)
		if err := s.R2.Upload(ctx, audioKey, data, audioContentType); err != nil {
			return nil, fmt.Errorf("r2 upload: %w", err)
		}
	} else if req.YoutubeURL != nil && strings.TrimSpace(*req.YoutubeURL) != "" {
		data, ct, err := s.fetchAudioFromYoutube(ctx, strings.TrimSpace(*req.YoutubeURL))
		if err != nil {
			return nil, fmt.Errorf("youtube download: %w", err)
		}
		if ct != "" {
			audioContentType = ct
		}
		slug := generateSlug(artistName, title)
		if slug == "" {
			slug = fmt.Sprintf("track-%d", time.Now().UnixMilli())
		}
		audioKey = fmt.Sprintf("audio/%d-%s.mp3", time.Now().UnixMilli(), slug)
		if err := s.R2.Upload(ctx, audioKey, data, audioContentType); err != nil {
			return nil, fmt.Errorf("r2 upload: %w", err)
		}
	} else {
		return nil, fmt.Errorf("no audio source")
	}

	// Cover upload
	var coverKey *string
	if coverURL != "" {
		if ck, err := s.downloadAndUploadCover(ctx, coverURL, artistName, title); err == nil && ck != "" {
			coverKey = &ck
		} else {
			// non-fatal: keep cover_url as fallback later? but we set cover_url anyway
			_ = err
		}
	}

	// Insert track
	slug := generateSlug(artistName, title)
	// ensure slug unique: query and suffix if needed
	originalSlug := slug
	for i := 1; i < 10; i++ {
		var exists int
		err := s.DB.QueryRow(ctx, `SELECT 1 FROM tracks WHERE slug=$1 LIMIT 1`, slug).Scan(&exists)
		if err != nil {
			break // not found
		}
		slug = fmt.Sprintf("%s-%d", originalSlug, i)
	}
	genreVal := req.Genre
	if genreVal != nil && strings.TrimSpace(*genreVal) == "" {
		genreVal = nil
	}
	// cover_url persists if upload failed; keep original coverURL as cover_url
	var coverURLVal *string
	if coverURL != "" {
		coverURLVal = &coverURL
	}
	var dur *int
	if durationSec != nil {
		dur = durationSec
	}
	var newID int
	err = s.DB.QueryRow(ctx,
		`INSERT INTO tracks(title, artist_id, spotify_id, cover_url, audio_key, cover_key, genre, slug, duration, status)
		 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'active') RETURNING id`,
		title, artistID, nullable(spotifyID), coverURLVal, audioKey, coverKey, genreVal, slug, dur,
	).Scan(&newID)
	if err != nil {
		return nil, fmt.Errorf("insert track: %w", err)
	}
	return &newID, nil
}

func nullable(s string) *string {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return &s
}

func (s *Service) ensureArtist(ctx context.Context, artistID *int, artistName string) (int, error) {
	if artistID != nil && *artistID != 0 {
		var id int
		err := s.DB.QueryRow(ctx, `SELECT id FROM artists WHERE id=$1 LIMIT 1`, *artistID).Scan(&id)
		if err == nil {
			return id, nil
		}
		// fallback to name
	}
	name := strings.TrimSpace(artistName)
	if name == "" {
		name = "Unknown Artist"
	}
	var existing int
	err := s.DB.QueryRow(ctx, `SELECT id FROM artists WHERE name ILIKE $1 LIMIT 1`, name).Scan(&existing)
	if err == nil {
		return existing, nil
	}
	slug := slugify(name)
	original := slug
	for i := 1; i < 10; i++ {
		var ex int
		e2 := s.DB.QueryRow(ctx, `SELECT 1 FROM artists WHERE slug=$1 LIMIT 1`, slug).Scan(&ex)
		if e2 != nil {
			break
		}
		slug = fmt.Sprintf("%s-%d", original, i)
	}
	var nid int
	err = s.DB.QueryRow(ctx, `INSERT INTO artists(name, slug) VALUES($1,$2) RETURNING id`, name, slug).Scan(&nid)
	if err != nil {
		// race: retry select
		if e2 := s.DB.QueryRow(ctx, `SELECT id FROM artists WHERE name ILIKE $1 LIMIT 1`, name).Scan(&existing); e2 == nil {
			return existing, nil
		}
		return 0, err
	}
	return nid, nil
}

func (s *Service) fetchAudioFromStreamer(ctx context.Context, spotifyID string) ([]byte, string, error) {
	var lastErr error
	for _, base := range s.StreamerURLs {
		u := fmt.Sprintf("%s/api/download?spotify=%s", strings.TrimRight(base, "/"), url.QueryEscape(spotifyID))
		data, ct, err := s.fetchWithRedirect(ctx, u)
		if err == nil && len(data) > 0 {
			return data, ct, nil
		}
		if err != nil {
			lastErr = err
		} else {
			lastErr = fmt.Errorf("empty response from %s", base)
		}
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("all streamer urls failed")
	}
	return nil, "", lastErr
}

func (s *Service) fetchWithRedirect(ctx context.Context, initialURL string) ([]byte, string, error) {
	// Use custom client without auto-redirect to capture Location, then fetch target
	client := &http.Client{
		Timeout: 60 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, initialURL, nil)
	if err != nil {
		return nil, "", err
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()
	// Follow redirect manually if 3xx
	if resp.StatusCode >= 300 && resp.StatusCode < 400 {
		loc := resp.Header.Get("Location")
		if loc == "" {
			return nil, "", fmt.Errorf("redirect without location: %d", resp.StatusCode)
		}
		// Resolve relative
		if !strings.HasPrefix(loc, "http") {
			base, _ := url.Parse(initialURL)
			rel, _ := url.Parse(loc)
			loc = base.ResolveReference(rel).String()
		}
		return s.downloadURL(ctx, loc)
	}
	// Some streamer returns 200 with audio bytes directly (maybe JSON with url?)
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		// Try parse JSON {url: "..."} fallback
		var js map[string]any
		if err2 := json.Unmarshal(b, &js); err2 == nil {
			if u, ok := js["url"].(string); ok && u != "" {
				return s.downloadURL(ctx, u)
			}
			if u, ok := js["download_url"].(string); ok && u != "" {
				return s.downloadURL(ctx, u)
			}
		}
		return nil, "", fmt.Errorf("streamer status %d: %s", resp.StatusCode, string(b[:500]))
	}
	// Check if body is JSON with url
	ct := resp.Header.Get("Content-Type")
	if strings.Contains(ct, "application/json") {
		b, _ := io.ReadAll(resp.Body)
		var js map[string]any
		if err2 := json.Unmarshal(b, &js); err2 == nil {
			if u, ok := js["url"].(string); ok && u != "" {
				return s.downloadURL(ctx, u)
			}
		}
		// No url, but maybe raw bytes that are json? fallback error
		return nil, "", fmt.Errorf("unexpected json response without url")
	}
	// Assume audio bytes
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}
	if ct == "" {
		ct = "audio/mpeg"
	}
	// Heuristic: if body is small and looks like HTML error, fail
	if len(b) < 1024 && bytes.Contains(bytes.ToLower(b), []byte("<html")) {
		return nil, "", fmt.Errorf("streamer returned html error")
	}
	return b, ct, nil
}

func (s *Service) downloadURL(ctx context.Context, u string) ([]byte, string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, "", err
	}
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return nil, "", fmt.Errorf("download url status %d: %s", resp.StatusCode, string(b[:500]))
	}
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}
	ct := resp.Header.Get("Content-Type")
	if ct == "" {
		ct = "audio/mpeg"
	}
	return b, ct, nil
}

func (s *Service) downloadAndUploadCover(ctx context.Context, coverURL, artistName, title string) (string, error) {
	data, ct, err := s.downloadURL(ctx, coverURL)
	if err != nil {
		return "", err
	}
	if ct == "" || strings.Contains(ct, "octet-stream") {
		ct = "image/jpeg"
	}
	if !strings.HasPrefix(ct, "image/") {
		ct = "image/jpeg"
	}
	slug := generateSlug(artistName, title)
	if slug == "" {
		slug = fmt.Sprintf("cover-%d", time.Now().UnixMilli())
	}
	ext := ".jpg"
	if strings.Contains(ct, "png") {
		ext = ".png"
	} else if strings.Contains(ct, "webp") {
		ext = ".webp"
	}
	key := fmt.Sprintf("covers/%d-%s%s", time.Now().UnixMilli(), slug, ext)
	if err := s.R2.Upload(ctx, key, data, ct); err != nil {
		return "", err
	}
	return key, nil
}

func (s *Service) fetchAudioFromYoutube(ctx context.Context, youtubeURL string) ([]byte, string, error) {
	// Prefer yt-dlp if available
	if _, err := exec.LookPath("yt-dlp"); err == nil {
		return s.fetchViaYtDlp(ctx, youtubeURL)
	}
	// fallback: try to fetch via http if youtubeURL is direct audio URL
	if strings.HasPrefix(youtubeURL, "http") && (strings.Contains(youtubeURL, ".mp3") || strings.Contains(youtubeURL, ".m4a")) {
		return s.downloadURL(ctx, youtubeURL)
	}
	return nil, "", fmt.Errorf("yt-dlp not found and youtube_url is not a direct audio url")
}

func (s *Service) fetchViaYtDlp(ctx context.Context, youtubeURL string) ([]byte, string, error) {
	// Use yt-dlp to print direct audio URL then download it
	// Step 1: get URL via yt-dlp --get-url -f bestaudio
	cmd := exec.CommandContext(ctx, "yt-dlp", "--no-playlist", "-f", "bestaudio", "--get-url", youtubeURL)
	out, err := cmd.CombinedOutput()
	if err == nil {
		u := strings.TrimSpace(string(out))
		// may return multiple lines; take first
		if idx := strings.Index(u, "\n"); idx >= 0 {
			u = strings.TrimSpace(u[:idx])
		}
		if u != "" && strings.HasPrefix(u, "http") {
			return s.downloadURL(ctx, u)
		}
	}
	// Fallback: download to temp file via yt-dlp -x --audio-format mp3
	tmpDir := os.TempDir()
	tmpFile := fmt.Sprintf("%s/yt-%d.%%(ext)s", tmpDir, time.Now().UnixNano())
	cmd2 := exec.CommandContext(ctx, "yt-dlp", "--no-playlist", "-x", "--audio-format", "mp3", "-o", tmpFile, youtubeURL)
	out2, err2 := cmd2.CombinedOutput()
	if err2 != nil {
		return nil, "", fmt.Errorf("yt-dlp get-url failed: %v (%s); download also failed: %v (%s)", err, string(out), err2, string(out2))
	}
	// find created file
	// yt-dlp replaces %(ext)s with mp3
	expected := strings.ReplaceAll(tmpFile, "%(ext)s", "mp3")
	data, err := os.ReadFile(expected)
	if err != nil {
		// try any file matching prefix
		return nil, "", fmt.Errorf("yt-dlp download succeeded but file not found %s: %w", expected, err)
	}
	_ = os.Remove(expected)
	return data, "audio/mpeg", nil
}
