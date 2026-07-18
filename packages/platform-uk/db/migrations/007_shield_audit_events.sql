CREATE SCHEMA IF NOT EXISTS aksh;

-- Append-only SHIELD audit trail (durable Postgres). Application code must not UPDATE/DELETE rows.
CREATE TABLE IF NOT EXISTS aksh.shield_audit_events (
  id TEXT PRIMARY KEY,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  practice_id TEXT,
  case_id TEXT,
  queue_item_id TEXT,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  agent_label TEXT,
  category TEXT NOT NULL DEFAULT 'reviewer_decision',
  label TEXT NOT NULL,
  detail TEXT,
  resource_ref TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  prev_event_id TEXT,
  content_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shield_audit_recorded_at
  ON aksh.shield_audit_events (recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_shield_audit_case_id
  ON aksh.shield_audit_events (case_id);

CREATE INDEX IF NOT EXISTS idx_shield_audit_practice_id
  ON aksh.shield_audit_events (practice_id);

CREATE INDEX IF NOT EXISTS idx_shield_audit_actor
  ON aksh.shield_audit_events (actor);

-- Deny mutations other than INSERT for app roles when using RLS-style grants later.
-- Application repository only exposes insert + select.
COMMENT ON TABLE aksh.shield_audit_events IS
  'Append-only SHIELD clinical audit events. Synthetic-proof and pilot evidence; not a signed DCB0129 deliverable by itself.';
