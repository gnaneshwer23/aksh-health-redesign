-- Layer 2 (build instructions, adapted to Neon): practice / organisation lookup.
-- Synthetic seed rows only — no real NHS organisation data claims.
-- Run: psql "$DATABASE_URL" -f db/migrations/009_practices.sql

CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.practices (
  ods_code TEXT PRIMARY KEY,
  practice_name TEXT NOT NULL,
  address TEXT,
  postcode TEXT,
  ics TEXT,
  ehr_system TEXT,
  list_size INTEGER,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practices_ics ON aksh.practices (ics);

INSERT INTO aksh.practices (ods_code, practice_name, address, postcode, ics, ehr_system, list_size, synthetic) VALUES
  ('E81001', 'The Oakfield Surgery', 'Oakfield Road, London', 'SE15 4NX', 'South East London', 'EMIS Web', 5800, TRUE),
  ('B82005', 'Harrogate Medical Centre', 'Kings Road, Harrogate', 'HG1 2RD', 'West Yorkshire', 'SystmOne', 4200, TRUE),
  ('RRK', 'University Hospitals Birmingham NHS Trust', 'Mindelsohn Way, Birmingham', 'B15 2TH', 'Birmingham & Solihull', 'Epic', NULL, TRUE)
ON CONFLICT (ods_code) DO NOTHING;
