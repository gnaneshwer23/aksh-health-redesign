-- 048: Diabetes agent intelligence / AI orchestration (Phase 5).
-- Governed drafts: history summary, clinical documentation, missing-info,
-- evidence retrieval, follow-up drafts. Model/prompt version pins + HITL decisions.
-- Apply on simulation / local-dev Neon only. Never point agent workflows at production main.

CREATE SCHEMA IF NOT EXISTS aksh;

-- ---------------------------------------------------------------- orchestration runs

CREATE TABLE IF NOT EXISTS aksh.agent_intel_runs (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  patient_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'partial', 'failed')),
  agents_invoked JSONB NOT NULL DEFAULT '[]'::jsonb,
  draft_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  shared_context_built_at TIMESTAMPTZ NOT NULL,
  model_id TEXT NOT NULL,
  model_version TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  drafting_mode TEXT NOT NULL DEFAULT 'deterministic_synthetic'
    CHECK (drafting_mode IN ('deterministic_synthetic', 'llm_gated')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  llm_used BOOLEAN NOT NULL DEFAULT FALSE,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_intel_runs_patient
  ON aksh.agent_intel_runs (scope_key, patient_id, started_at DESC);

-- ---------------------------------------------------------------- drafts (AI-generated until HITL)

CREATE TABLE IF NOT EXISTS aksh.agent_intel_drafts (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  patient_label TEXT NOT NULL,
  kind TEXT NOT NULL
    CHECK (kind IN (
      'history_summary',
      'clinical_documentation',
      'missing_information',
      'evidence_retrieval',
      'follow_up_draft'
    )),
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'queued', 'accepted', 'edited', 'rejected', 'cancelled')),
  owner_role TEXT NOT NULL DEFAULT 'gp',
  owner_display TEXT,
  model_id TEXT NOT NULL,
  model_version TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  drafting_mode TEXT NOT NULL DEFAULT 'deterministic_synthetic',
  payload JSONB NOT NULL,
  validation JSONB NOT NULL DEFAULT '{}'::jsonb,
  provenance TEXT NOT NULL DEFAULT 'ai_generated'
    CHECK (provenance IN ('ai_generated', 'clinician_verified', 'source_system', 'synthetic_fixture')),
  verified_clinical BOOLEAN NOT NULL DEFAULT FALSE,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  hitl_required BOOLEAN NOT NULL DEFAULT TRUE,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  autonomous_clinical_action BOOLEAN NOT NULL DEFAULT FALSE,
  prescribe_or_treat BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_agent_intel_drafts_patient
  ON aksh.agent_intel_drafts (scope_key, patient_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_intel_drafts_open
  ON aksh.agent_intel_drafts (scope_key, status)
  WHERE status IN ('DRAFT', 'queued');

-- ---------------------------------------------------------------- HITL decisions (append-only)

CREATE TABLE IF NOT EXISTS aksh.agent_intel_decisions (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  draft_id TEXT NOT NULL REFERENCES aksh.agent_intel_drafts (id),
  action TEXT NOT NULL CHECK (action IN ('accept', 'edit', 'reject')),
  actor TEXT NOT NULL,
  reason TEXT,
  edited_payload JSONB,
  model_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_agent_intel_decisions_draft
  ON aksh.agent_intel_decisions (scope_key, draft_id, created_at DESC);

-- ---------------------------------------------------------------- audit history

CREATE TABLE IF NOT EXISTS aksh.agent_intel_history (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  patient_id TEXT NOT NULL,
  subject_kind TEXT NOT NULL
    CHECK (subject_kind IN ('draft', 'orchestration_run', 'eval', 'version_pin')),
  subject_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_agent_intel_history_patient
  ON aksh.agent_intel_history (scope_key, patient_id, created_at DESC);

-- ---------------------------------------------------------------- version registry (append-only pins)

CREATE TABLE IF NOT EXISTS aksh.agent_intel_version_pins (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL,
  model_version TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  drafting_mode TEXT NOT NULL DEFAULT 'deterministic_synthetic',
  active BOOLEAN NOT NULL DEFAULT FALSE,
  released_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_by TEXT,
  note TEXT,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_intel_version_unique
  ON aksh.agent_intel_version_pins (model_id, model_version, prompt_id, prompt_version);
