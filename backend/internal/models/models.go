package models

import "time"

type Track struct {
	ID              int     `json:"id"`
	Title           string  `json:"title"`
	ArtistID        *int    `json:"artist_id"`
	ArtistName      *string `json:"artist_name,omitempty"`
	AlbumID         *int    `json:"album_id"`
	SpotifyID       *string `json:"spotify_id"`
	ISRC            *string `json:"isrc"`
	DeezerID        *string `json:"deezer_id"`
	CoverURL        *string `json:"cover_url"`
	AudioKey        *string `json:"audio_key"`
	CoverKey        *string `json:"cover_key"`
	Duration        *float64 `json:"duration"`
	Genre           *string `json:"genre"`
	FeaturedArtists *string `json:"featured_artists"`
	Plays           int     `json:"plays"`
	Slug            *string `json:"slug"`
	Status          string  `json:"status"`
	AudioURL        *string `json:"audio_url,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

type Artist struct {
	ID        int     `json:"id"`
	Name      string  `json:"name"`
	Slug      *string `json:"slug"`
	Bio       *string `json:"bio"`
	ImageURL  *string `json:"image_url"`
	SpotifyID *string `json:"spotify_id"`
	DeezerID  *string `json:"deezer_id"`
	Country   string  `json:"country"`
	Genre     *string `json:"genre"`
}

type Album struct {
	ID          int     `json:"id"`
	Title       string  `json:"title"`
	ArtistID    *int    `json:"artist_id"`
	ArtistName  *string `json:"artist_name,omitempty"`
	Slug        *string `json:"slug"`
	AlbumType   *string `json:"album_type"`
	ReleaseYear *int    `json:"release_year"`
	SpotifyID   *string `json:"spotify_id"`
	DeezerID    *string `json:"deezer_id"`
	CoverURL    *string `json:"cover_url"`
	IsFeatured  bool    `json:"is_featured"`
}

type Playlist struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	UserID      *string `json:"user_id"`
	CoverURL    *string `json:"cover_url"`
	IsFeatured  bool    `json:"is_featured"`
	Category    *string `json:"category"`
	Description *string `json:"description"`
	TrackCount  int     `json:"track_count,omitempty"`
}

type Comment struct {
	ID        int64     `json:"id"`
	TrackID   int       `json:"track_id"`
	UserID    string    `json:"user_id"`
	UserName  *string   `json:"user_name"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}
