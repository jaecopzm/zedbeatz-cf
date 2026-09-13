CREATE TABLE IF NOT EXISTS ingest_jobs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    payload JSONB,
    error TEXT,
    track_id INT REFERENCES tracks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ingest_jobs_status ON ingest_jobs(status);
