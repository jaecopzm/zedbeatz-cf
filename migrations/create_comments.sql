-- Run this in the Supabase SQL Editor
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_track_id ON comments(track_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "Public read" ON comments FOR SELECT USING (true);

-- Only the comment owner can delete their comment
CREATE POLICY "Owner delete" ON comments FOR DELETE USING (auth.uid()::text = user_id);
