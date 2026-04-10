-- Add slug columns to tables
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE albums ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create indexes for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_tracks_slug ON tracks(slug);
CREATE INDEX IF NOT EXISTS idx_artists_slug ON artists(slug);
CREATE INDEX IF NOT EXISTS idx_albums_slug ON albums(slug);

-- Generate slugs for existing data
UPDATE tracks SET slug = 
  lower(regexp_replace(
    regexp_replace(
      (SELECT name FROM artists WHERE id = tracks.artist_id) || '-' || tracks.title,
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '[\s_-]+', '-', 'g'
  ))
WHERE slug IS NULL;

UPDATE artists SET slug = 
  lower(regexp_replace(
    regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '[\s_-]+', '-', 'g'
  ))
WHERE slug IS NULL;

UPDATE albums SET slug = 
  lower(regexp_replace(
    regexp_replace(
      (SELECT name FROM artists WHERE id = albums.artist_id) || '-' || albums.title,
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '[\s_-]+', '-', 'g'
  ))
WHERE slug IS NULL;
