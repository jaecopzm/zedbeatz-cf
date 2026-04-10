-- Check if featured_artists column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tracks' 
AND column_name IN ('featured', 'featured_artists');

-- Check if there's any data in featured_artists
SELECT COUNT(*) as total_tracks,
       COUNT(featured_artists) as tracks_with_featured,
       COUNT(CASE WHEN featured_artists IS NOT NULL AND featured_artists != '' THEN 1 END) as tracks_with_featured_data
FROM tracks;

-- Show sample tracks with featured artists
SELECT id, title, featured_artists
FROM tracks
WHERE featured_artists IS NOT NULL 
  AND featured_artists != ''
LIMIT 10;
