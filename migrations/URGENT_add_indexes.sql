-- URGENT: Add these indexes to fix Worker CPU timeout
-- Run in Supabase SQL Editor NOW

-- Most critical - playlist queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id);

-- Track queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracks_created_at ON tracks(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracks_plays ON tracks(plays DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);

-- Recently played
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recently_played_user_played ON recently_played(user_id, played_at DESC);

-- Playlists
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlists_user_name ON playlists(user_id, name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_playlists_featured ON playlists(is_featured) WHERE is_featured = true;

-- Verify
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;
