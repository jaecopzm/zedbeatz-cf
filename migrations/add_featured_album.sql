ALTER TABLE albums ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS albums_is_featured_idx ON albums(is_featured) WHERE is_featured = true;
