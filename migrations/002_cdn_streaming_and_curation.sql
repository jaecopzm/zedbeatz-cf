-- ============================================================
-- Migration: CDN streaming + content management overhaul
-- Run in Supabase SQL Editor
-- Safe to run multiple times (all statements use IF NOT EXISTS / IF EXISTS)
-- ============================================================

-- ------------------------------------------------------------
-- TRACKS: add CDN identifiers, coverUrl, tags, status
-- Make R2 keys nullable (backward compatible)
-- ------------------------------------------------------------

ALTER TABLE tracks
  ADD COLUMN IF NOT EXISTS spotify_id    VARCHAR(50),
  ADD COLUMN IF NOT EXISTS isrc          VARCHAR(20),
  ADD COLUMN IF NOT EXISTS deezer_id     VARCHAR(30),
  ADD COLUMN IF NOT EXISTS cover_url     TEXT,
  ADD COLUMN IF NOT EXISTS tags          JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS status        VARCHAR(20) DEFAULT 'active';

-- Make audio_key nullable — existing rows keep their value, new CDN tracks won't have one
ALTER TABLE tracks ALTER COLUMN audio_key DROP NOT NULL;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_tracks_spotify_id  ON tracks(spotify_id) WHERE spotify_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tracks_isrc         ON tracks(isrc)       WHERE isrc IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tracks_deezer_id    ON tracks(deezer_id)  WHERE deezer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tracks_status       ON tracks(status);
CREATE INDEX IF NOT EXISTS idx_tracks_tags         ON tracks USING GIN(tags);

-- ------------------------------------------------------------
-- ARTISTS: add imageUrl, spotifyId, deezerId, country, genre
-- ------------------------------------------------------------

ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS image_url  TEXT,
  ADD COLUMN IF NOT EXISTS spotify_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS deezer_id  VARCHAR(30),
  ADD COLUMN IF NOT EXISTS country    VARCHAR(5) DEFAULT 'ZM',
  ADD COLUMN IF NOT EXISTS genre      VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id) WHERE spotify_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artists_country    ON artists(country);

-- ------------------------------------------------------------
-- ALBUMS: add albumType, releaseDate, spotifyId, deezerId, coverUrl
-- ------------------------------------------------------------

ALTER TABLE albums
  ADD COLUMN IF NOT EXISTS album_type   VARCHAR(20) DEFAULT 'album',
  ADD COLUMN IF NOT EXISTS release_date VARCHAR(10),
  ADD COLUMN IF NOT EXISTS spotify_id   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS deezer_id    VARCHAR(30),
  ADD COLUMN IF NOT EXISTS cover_url    TEXT;

CREATE INDEX IF NOT EXISTS idx_albums_spotify_id ON albums(spotify_id) WHERE spotify_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_albums_album_type ON albums(album_type);

-- ------------------------------------------------------------
-- PLAYLISTS: add coverUrl, description
-- ------------------------------------------------------------

ALTER TABLE playlists
  ADD COLUMN IF NOT EXISTS cover_url   TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- ------------------------------------------------------------
-- FEATURED_SLOTS: new central curation table
-- Replaces hero_tracks + scattered is_featured booleans
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS featured_slots (
  id          SERIAL PRIMARY KEY,
  slot_type   VARCHAR(50)  NOT NULL,
  track_id    INTEGER      REFERENCES tracks(id) ON DELETE CASCADE,
  position    INTEGER      NOT NULL DEFAULT 0,
  is_active   BOOLEAN      DEFAULT true,
  label       VARCHAR(100),
  created_at  TIMESTAMP    DEFAULT NOW(),
  updated_at  TIMESTAMP    DEFAULT NOW(),
  UNIQUE(slot_type, position)
);

CREATE INDEX IF NOT EXISTS idx_featured_slots_type_active
  ON featured_slots(slot_type, position)
  WHERE is_active = true;

-- Seed: migrate existing hero_tracks into featured_slots
INSERT INTO featured_slots (slot_type, track_id, position, is_active, created_at)
  SELECT 'hero', track_id, position, true, created_at
  FROM hero_tracks
ON CONFLICT (slot_type, position) DO NOTHING;

-- ============================================================
-- Verification — run after migration to confirm
-- ============================================================
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name IN ('tracks', 'artists', 'albums', 'playlists', 'featured_slots')
--   AND table_schema = 'public'
-- ORDER BY table_name, ordinal_position;
