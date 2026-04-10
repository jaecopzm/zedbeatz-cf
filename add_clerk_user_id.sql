-- Add Clerk user_id to playlists so each playlist belongs to a user
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
