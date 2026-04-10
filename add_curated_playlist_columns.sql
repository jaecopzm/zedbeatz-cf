-- Add is_featured and category columns to playlists table for curated experiences
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS category TEXT;

-- Index for faster filtering on home page
CREATE INDEX IF NOT EXISTS idx_playlists_featured ON playlists(is_featured) WHERE is_featured = TRUE;
