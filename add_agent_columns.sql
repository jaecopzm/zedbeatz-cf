-- Migration: Add genre and featured columns to tracks table
-- Safe to run multiple times (uses IF NOT EXISTS)

-- Add genre column if it doesn't exist
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS genre TEXT;

-- Add featured column if it doesn't exist (for featured artists)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS featured TEXT;

-- Optional: Add index for faster searches
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tracks'
AND column_name IN ('genre', 'featured')
ORDER BY column_name;
