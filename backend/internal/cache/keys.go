package cache

import "fmt"

// Canonical Redis keys. Keep prefix "zed:" consistent.
const (
	// Hero carousel
	KeyHero = "zed:hero"
	HeroKey = "zed:hero"

	// Home aggregated payloads
	KeyHome           = "zed:home"
	HomeKey           = "zed:home"
	KeyHomeTrending10 = "zed:home:trending:10"
	HomeTrending10Key = "zed:home:trending:10"

	// Legacy / generic trending
	KeyTracksTrending10 = "zed:tracks:trending:10"
)

// KeyTracksTrending returns zed:tracks:trending:{limit}.
func KeyTracksTrending(limit int) string {
	return fmt.Sprintf("zed:tracks:trending:%d", limit)
}

// TracksTrendingKey is an alias for KeyTracksTrending.
func TracksTrendingKey(limit int) string {
	return KeyTracksTrending(limit)
}

// TrendingTracksKey alias.
func TrendingTracksKey(limit int) string {
	return KeyTracksTrending(limit)
}

// KeyHomeTrending returns zed:home:trending:{limit}.
func KeyHomeTrending(limit int) string {
	return fmt.Sprintf("zed:home:trending:%d", limit)
}

// HomeTrendingKey alias.
func HomeTrendingKey(limit int) string {
	return KeyHomeTrending(limit)
}

// AllHomeKeys returns keys that should be invalidated on home/hero writes.
// Stub for admin invalidation path.
func AllHomeKeys() []string {
	return []string{KeyHero, KeyHome, KeyHomeTrending10}
}

// AllTrendingKeys returns trending keys for a set of limits.
func AllTrendingKeys(limits ...int) []string {
	out := make([]string, 0, len(limits))
	for _, l := range limits {
		out = append(out, KeyTracksTrending(l))
	}
	return out
}
