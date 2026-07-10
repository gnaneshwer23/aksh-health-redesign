CREATE TABLE IF NOT EXISTS ingestion_events (
    event_id TEXT PRIMARY KEY,
    patient_key TEXT NOT NULL,
    source_type TEXT NOT NULL,
    payload_type TEXT NOT NULL,
    quality_score DOUBLE PRECISION NOT NULL,
    payload_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
