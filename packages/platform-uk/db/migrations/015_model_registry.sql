-- Aksh 2.0 model registry (Document-07). Runtime seed remains in lib/model-registry.
CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.model_registry (
  model_id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  intended_use TEXT NOT NULL,
  population TEXT NOT NULL,
  inputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  outputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval TEXT NOT NULL,
  approver TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL,
  next_review_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_registry_approval
  ON aksh.model_registry (approval);
