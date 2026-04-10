-- Add unique constraint to prevent duplicate Favourites playlists per user
ALTER TABLE playlists 
ADD CONSTRAINT unique_user_favourites 
UNIQUE (user_id, name);
