-- 052: Canonical Care Episode (Phase 1 foundation).
-- Durable spine: Patient → Intake → Appointment → Encounter → Context → Review →
-- Lab → Med → Care plan → Follow-up → Outcome.
-- Links existing review cases / encounters / journeys without duplicating them.
-- Apply on simulation / local-dev Neon only. Never point agent workflows at production main.

CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.care_episodes (
  id TEXT NOT NULL,
  public_id TEXT NOT NULL,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  practice_id TEXT,
  patient_id TEXT NOT NULL,
  patient_label TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft','intake','scheduled','encounter_active','context_assembled',
      'in_review','lab_pending','med_review','care_plan_draft','follow_up',
      'outcome_recorded','closed','cancelled'
    )),
  pathway TEXT,
  links JSONB NOT NULL DEFAULT '[]'::jsonb,
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (id, scope_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_care_episodes_idempotency
  ON aksh.care_episodes (scope_key, patient_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_care_episodes_patient
  ON aksh.care_episodes (scope_key, patient_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_care_episodes_status
  ON aksh.care_episodes (scope_key, status);

CREATE TABLE IF NOT EXISTS aksh.care_episode_events (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  kind TEXT NOT NULL
    CHECK (kind IN (
      'created','status_transition','link_attached','task_created',
      'notification_queued','agent_invoked','hitl_decision','audit',
      'outbox_enqueued','error'
    )),
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  detail TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key TEXT,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_care_episode_events_episode
  ON aksh.care_episode_events (scope_key, episode_id, at ASC);

CREATE INDEX IF NOT EXISTS idx_care_episode_events_outbox
  ON aksh.care_episode_events (scope_key, kind, processed)
  WHERE kind = 'outbox_enqueued' AND processed = FALSE;

COMMENT ON TABLE aksh.care_episodes IS
  'Canonical care episode spine. synthetic=true / ehr_write=false until live clinical enablement approved.';
COMMENT ON TABLE aksh.care_episode_events IS
  'Append-only care episode audit + outbox_enqueued rows for durable consumers (Workflow reserved for Phase 2+).';
