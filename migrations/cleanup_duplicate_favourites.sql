-- Clean up duplicate Favourites playlists, keeping the oldest one per user
WITH duplicates AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id, name ORDER BY created_at ASC) as rn
  FROM playlists
  WHERE name = 'Favourites'
)
DELETE FROM playlists
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Verify cleanup
SELECT user_id, COUNT(*) as favourites_count
FROM playlists
WHERE name = 'Favourites'
GROUP BY user_id
HAVING COUNT(*) > 1;
