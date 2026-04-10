-- Check if tracks table has required columns for agent upload
-- Run this in your Supabase SQL editor

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tracks'
ORDER BY ordinal_position;

-- If genre or featured columns are missing, add them:
-- ALTER TABLE tracks ADD COLUMN IF NOT EXISTS genre TEXT;
-- ALTER TABLE tracks ADD COLUMN IF NOT EXISTS featured TEXT;
