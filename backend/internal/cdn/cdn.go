// Package cdn ports lib/cdn.ts URL resolution rules to Go so the
// API and the Next.js client agree on playback / cover URLs.
package cdn

import (
	"fmt"
	"net/url"
	"strings"
)

type Resolver struct {
	R2PublicURL string
	LegacyCDN   string
}

type AudioSource struct {
	Type string `json:"type"`
	URL  string `json:"url,omitempty"`
}

func (r Resolver) AudioURL(audioKey, isrc *string) *AudioSource {
	if audioKey != nil && strings.TrimSpace(*audioKey) != "" {
		key := strings.TrimSpace(*audioKey)
		return &AudioSource{Type: "r2", URL: fmt.Sprintf("%s/%s", strings.TrimRight(r.R2PublicURL, "/"), key)}
	}
	if isrc != nil && strings.TrimSpace(*isrc) != "" {
		id := strings.ToUpper(strings.TrimSpace(*isrc))
		return &AudioSource{Type: "cdn_isrc", URL: fmt.Sprintf("%s/isrc/%s", strings.TrimRight(r.LegacyCDN, "/"), url.PathEscape(id))}
	}
	return &AudioSource{Type: "none"}
}

func (r Resolver) CoverURL(coverURL, imageURL, coverKey, imageKey *string) *string {
	direct := firstNonEmpty(coverURL, imageURL)
	if direct != nil {
		return direct
	}
	key := firstNonEmpty(coverKey, imageKey)
	if key == nil {
		return nil
	}
	u := fmt.Sprintf("%s/%s", strings.TrimRight(r.R2PublicURL, "/"), strings.TrimSpace(*key))
	return &u
}

func firstNonEmpty(vals ...*string) *string {
	for _, v := range vals {
		if v != nil && strings.TrimSpace(*v) != "" {
			s := strings.TrimSpace(*v)
			return &s
		}
	}
	return nil
}

func StrPtr(s string) *string { return &s }
