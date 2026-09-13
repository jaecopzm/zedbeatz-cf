package spotify

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

// Track is the simplified representation returned to the admin UI.
type Track struct {
	SpotifyID string `json:"spotifyId"`
	Title     string `json:"title"`
	Artist    string `json:"artist"`
	Album     string `json:"album"`
	CoverURL  string `json:"coverUrl"`
	Duration  int    `json:"duration"` // milliseconds
}

// Client handles Spotify client-credentials auth and track search.
type Client struct {
	clientID     string
	clientSecret string
	market       string
	httpClient   *http.Client

	mu     sync.Mutex
	token  string
	expiry time.Time
}

// New creates a Spotify client. market defaults to "ZM" if empty.
func New(clientID, clientSecret, market string) *Client {
	if market == "" {
		market = "ZM"
	}
	return &Client{
		clientID:     clientID,
		clientSecret: clientSecret,
		market:       market,
		httpClient:   &http.Client{Timeout: 10 * time.Second},
	}
}

// tokenResponse mirrors https://accounts.spotify.com/api/token JSON.
type tokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

// getToken returns a cached token or fetches a new one with Basic auth.
// Concurrency-safe via sync.Mutex; token is cached until expiry with 30s buffer.
func (c *Client) getToken(ctx context.Context) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.token != "" && time.Now().Add(30*time.Second).Before(c.expiry) {
		return c.token, nil
	}
	if c.clientID == "" || c.clientSecret == "" {
		return "", fmt.Errorf("spotify credentials not configured")
	}

	form := url.Values{}
	form.Set("grant_type", "client_credentials")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://accounts.spotify.com/api/token", strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	creds := base64.StdEncoding.EncodeToString([]byte(c.clientID + ":" + c.clientSecret))
	req.Header.Set("Authorization", "Basic "+creds)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("spotify token: status %d: %s", resp.StatusCode, string(body))
	}
	var tr tokenResponse
	if err := json.Unmarshal(body, &tr); err != nil {
		return "", err
	}
	if tr.AccessToken == "" {
		return "", fmt.Errorf("spotify token: empty access_token")
	}
	c.token = tr.AccessToken
	// expires_in is seconds; default 3600
	if tr.ExpiresIn <= 0 {
		tr.ExpiresIn = 3600
	}
	c.expiry = time.Now().Add(time.Duration(tr.ExpiresIn) * time.Second)
	return c.token, nil
}

// searchResponse mirrors the tracks subset of /v1/search.
type searchResponse struct {
	Tracks struct {
		Items []struct {
			ID         string `json:"id"`
			Name       string `json:"name"`
			Artists    []struct {
				Name string `json:"name"`
			} `json:"artists"`
			Album struct {
				Name   string `json:"name"`
				Images []struct {
					URL    string `json:"url"`
					Height int    `json:"height"`
					Width  int    `json:"width"`
				} `json:"images"`
			} `json:"album"`
			DurationMs   int               `json:"duration_ms"`
			Popularity   int               `json:"popularity"`
			ExternalURLs map[string]string `json:"external_urls"`
		} `json:"items"`
	} `json:"tracks"`
}

// Search queries Spotify for tracks matching q (limit 20, market from config).
// It handles token acquisition and a single retry on 401.
func (c *Client) Search(ctx context.Context, q string) ([]Track, error) {
	if strings.TrimSpace(q) == "" {
		return []Track{}, nil
	}
	token, err := c.getToken(ctx)
	if err != nil {
		return nil, err
	}

	tracks, status, err := c.doSearch(ctx, token, q)
	if err != nil {
		return nil, err
	}
	if status == http.StatusUnauthorized {
		// Token may have expired; force refresh and retry once.
		c.mu.Lock()
		c.token = ""
		c.expiry = time.Time{}
		c.mu.Unlock()
		token, err = c.getToken(ctx)
		if err != nil {
			return nil, err
		}
		tracks, status, err = c.doSearch(ctx, token, q)
		if err != nil {
			return nil, err
		}
		if status == http.StatusUnauthorized {
			return nil, fmt.Errorf("spotify search: unauthorized")
		}
	}
	_ = status
	return tracks, nil
}

func (c *Client) doSearch(ctx context.Context, token, q string) ([]Track, int, error) {
	u := fmt.Sprintf("https://api.spotify.com/v1/search?q=%s&type=track&limit=20&market=%s",
		url.QueryEscape(q), url.QueryEscape(c.market))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusUnauthorized {
			return nil, resp.StatusCode, nil
		}
		return nil, resp.StatusCode, fmt.Errorf("spotify search: status %d: %s", resp.StatusCode, string(body))
	}
	var sr searchResponse
	if err := json.Unmarshal(body, &sr); err != nil {
		return nil, resp.StatusCode, err
	}
	out := make([]Track, 0, len(sr.Tracks.Items))
	for _, it := range sr.Tracks.Items {
		artistNames := make([]string, 0, len(it.Artists))
		for _, a := range it.Artists {
			artistNames = append(artistNames, a.Name)
		}
		cover := ""
		if len(it.Album.Images) > 0 {
			cover = it.Album.Images[0].URL
		}
		out = append(out, Track{
			SpotifyID: it.ID,
			Title:     it.Name,
			Artist:    strings.Join(artistNames, ", "),
			Album:     it.Album.Name,
			CoverURL:  cover,
			Duration:  it.DurationMs,
		})
	}
	return out, resp.StatusCode, nil
}

// GetTrack fetches a single track by Spotify ID, returning simplified Track with cover/duration.
// Handles token refresh once on 401.
func (c *Client) GetTrack(ctx context.Context, id string) (*Track, error) {
	if strings.TrimSpace(id) == "" {
		return nil, fmt.Errorf("spotify id required")
	}
	token, err := c.getToken(ctx)
	if err != nil {
		return nil, err
	}
	tr, status, err := c.doGetTrack(ctx, token, id)
	if err != nil {
		return nil, err
	}
	if status == http.StatusUnauthorized {
		c.mu.Lock()
		c.token = ""
		c.expiry = time.Time{}
		c.mu.Unlock()
		token, err = c.getToken(ctx)
		if err != nil {
			return nil, err
		}
		tr, status, err = c.doGetTrack(ctx, token, id)
		if err != nil {
			return nil, err
		}
		if status == http.StatusUnauthorized {
			return nil, fmt.Errorf("spotify get track: unauthorized")
		}
	}
	if status != http.StatusOK || tr == nil {
		return nil, fmt.Errorf("spotify get track: status %d", status)
	}
	return tr, nil
}

func (c *Client) doGetTrack(ctx context.Context, token, id string) (*Track, int, error) {
	u := fmt.Sprintf("https://api.spotify.com/v1/tracks/%s?market=%s", url.PathEscape(id), url.QueryEscape(c.market))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == http.StatusUnauthorized {
		return nil, resp.StatusCode, nil
	}
	if resp.StatusCode != http.StatusOK {
		return nil, resp.StatusCode, fmt.Errorf("spotify get track: status %d: %s", resp.StatusCode, string(body))
	}
	var raw struct {
		ID         string `json:"id"`
		Name       string `json:"name"`
		Artists    []struct{ Name string `json:"name"` } `json:"artists"`
		Album      struct {
			Name   string `json:"name"`
			Images []struct{ URL string `json:"url"` } `json:"images"`
		} `json:"album"`
		DurationMs int `json:"duration_ms"`
	}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, resp.StatusCode, err
	}
	artists := make([]string, 0, len(raw.Artists))
	for _, a := range raw.Artists {
		artists = append(artists, a.Name)
	}
	cover := ""
	if len(raw.Album.Images) > 0 {
		cover = raw.Album.Images[0].URL
	}
	return &Track{
		SpotifyID: raw.ID,
		Title:     raw.Name,
		Artist:    strings.Join(artists, ", "),
		Album:     raw.Album.Name,
		CoverURL:  cover,
		Duration:  raw.DurationMs,
	}, resp.StatusCode, nil
}
