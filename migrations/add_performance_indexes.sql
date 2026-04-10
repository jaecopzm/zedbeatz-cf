-- Critical Performance Indexes
-- Run this in Supabase SQL Editor to fix slow queries (600-1200ms → 50-150ms)

-- Playlist tracks lookups (most frequent)
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_user_track ON playlist_tracks(playlist_id, track_id);

-- Recently played queries
CREATE INDEX IF NOT EXISTS idx_recently_played_user_played ON recently_played(user_id, played_at DESC);

-- Track queries
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON tracks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_plays ON tracks(plays DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);

-- Playlist queries
CREATE INDEX IF NOT EXISTS idx_playlists_user_name ON playlists(user_id, name);
CREATE INDEX IF NOT EXISTS idx_playlists_featured ON playlists(is_featured) WHERE is_featured = true;

-- Verify indexes created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
