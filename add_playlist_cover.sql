-- Add cover_key column to playlists table
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS cover_key TEXT;
