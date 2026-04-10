-- Rename 'featured' column to 'featured_artists' for consistency
-- Run this in your Supabase SQL editor

ALTER TABLE tracks RENAME COLUMN featured TO featured_artists;

-- Verify the rename
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tracks'
AND column_name = 'featured_artists';
