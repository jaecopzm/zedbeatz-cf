-- Create default Favourites playlist
INSERT INTO playlists (name, created_at)
VALUES ('Favourites', NOW())
ON CONFLICT DO NOTHING;
