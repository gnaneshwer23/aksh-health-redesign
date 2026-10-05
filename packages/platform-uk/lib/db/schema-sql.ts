// Auth schema DDL, embedded as string constants rather than read from disk at
// runtime. Vercel's serverless bundler traces static imports, not dynamic
// `fs.readFile(path.join(process.cwd(), ...))` calls, so the previous
// approach (reading db/migrations/*.sql at request time) worked locally but
// threw ENOENT in production because the .sql files were never bundled into
// the Lambda.
//
// These strings MUST stay in sync with the corresponding files under
// db/migrations/, which remain the canonical, human-run source (via
// `psql -f`) and the historical record of each phase's schema change.

export const USERS_PROFILES_SQL = `
CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON aksh.users (email);

CREATE TABLE IF NOT EXISTS aksh.profiles (
  user_id TEXT PRIMARY KEY REFERENCES aksh.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'gp',
  full_name TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  practice_ods TEXT,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON aksh.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON aksh.profiles (onboarding_complete);
`;

export const PASSWORD_RESET_SQL = `
CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES aksh.users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
  ON aksh.password_reset_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at
  ON aksh.password_reset_tokens (expires_at);
`;

export const EMAIL_VERIFICATION_SQL = `
CREATE SCHEMA IF NOT EXISTS aksh;

ALTER TABLE aksh.users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS aksh.email_verification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES aksh.users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id
  ON aksh.email_verification_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at
  ON aksh.email_verification_tokens (expires_at);
`;

export const SHIELD_AUDIT_EVENTS_SQL = `
CREATE SCHEMA IF NOT EXISTS aksh;

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
`;

export const LEARNING_EVENTS_SQL = `
CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.learning_events (
  id TEXT PRIMARY KEY,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scope_key TEXT NOT NULL DEFAULT 'shared',
  practice_id TEXT,
  case_id TEXT,
  queue_item_id TEXT,
  patient_id TEXT,
  agent_label TEXT NOT NULL,
  prediction_id TEXT NOT NULL,
  prediction_summary TEXT,
  model_version TEXT,
  decision TEXT NOT NULL,
  decision_actor TEXT NOT NULL,
  decision_notes TEXT,
  outcome_kind TEXT NOT NULL,
  outcome_summary TEXT,
  outcome_metric JSONB,
  auto_retrain_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  model_updated BOOLEAN NOT NULL DEFAULT FALSE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  hitl_required BOOLEAN NOT NULL DEFAULT TRUE,
  governance_note TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Backfill for tables created before scope_key existed (OQ-TEN-1: learning events must be
-- scoped per caller like consent_grants/other aksh tables, not readable cross-tenant).
ALTER TABLE aksh.learning_events ADD COLUMN IF NOT EXISTS scope_key TEXT NOT NULL DEFAULT 'shared';

CREATE INDEX IF NOT EXISTS idx_learning_events_recorded_at
  ON aksh.learning_events (recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_events_case_id
  ON aksh.learning_events (case_id);

CREATE INDEX IF NOT EXISTS idx_learning_events_prediction_id
  ON aksh.learning_events (prediction_id);

CREATE INDEX IF NOT EXISTS idx_learning_events_agent_label
  ON aksh.learning_events (agent_label);

CREATE INDEX IF NOT EXISTS idx_learning_events_scope_key
  ON aksh.learning_events (scope_key);
`;

// Keep in sync with db/migrations/010_consent_grants.sql
export const CONSENT_GRANTS_SQL = `
CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.consent_grants (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  patient_id TEXT NOT NULL,
  purpose_code TEXT NOT NULL,
  modalities TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  granted_by TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT,
  notes TEXT,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  hitl_required BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_consent_grants_patient ON aksh.consent_grants (patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_grants_scope ON aksh.consent_grants (scope_key);
CREATE INDEX IF NOT EXISTS idx_consent_grants_status ON aksh.consent_grants (status);
`;

// Keep in sync with db/migrations/011_fhir_staging_bundles.sql
export const FHIR_STAGING_BUNDLES_SQL = `
CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.fhir_staging_bundles (
  id TEXT PRIMARY KEY,
  staged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  case_id TEXT,
  practice_id TEXT,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  accepted_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'preliminary'
    CHECK (status IN ('preliminary', 'staging', 'superseded')),
  synthetic_only BOOLEAN NOT NULL DEFAULT TRUE,
  live_emis BOOLEAN NOT NULL DEFAULT FALSE,
  medplum_required BOOLEAN NOT NULL DEFAULT FALSE,
  bundle_summary TEXT NOT NULL,
  bundle JSONB NOT NULL,
  note TEXT NOT NULL DEFAULT 'BRIDGE in-app FHIR staging · not live EMIS · liveEmis:false'
);

CREATE INDEX IF NOT EXISTS idx_fhir_staging_staged_at
  ON aksh.fhir_staging_bundles (staged_at DESC);

CREATE INDEX IF NOT EXISTS idx_fhir_staging_case_id
  ON aksh.fhir_staging_bundles (case_id);

CREATE INDEX IF NOT EXISTS idx_fhir_staging_scope
  ON aksh.fhir_staging_bundles (scope_key);

CREATE INDEX IF NOT EXISTS idx_fhir_staging_practice
  ON aksh.fhir_staging_bundles (practice_id);
`;

// Keep in sync with db/migrations/013_patient_state.sql
export const PATIENT_STATE_FACTS_SQL = `
CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.patient_state_facts (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  fact_type TEXT NOT NULL,
  value JSONB NOT NULL,
  source_system TEXT NOT NULL,
  source_reference TEXT,
  confidence REAL NOT NULL DEFAULT 1.0,
  consent_scope_id TEXT,
  effective_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  superseded_by TEXT REFERENCES aksh.patient_state_facts (id)
);

CREATE INDEX IF NOT EXISTS idx_patient_state_facts_patient_id
  ON aksh.patient_state_facts (patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_state_facts_patient_fact_type
  ON aksh.patient_state_facts (patient_id, fact_type, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_patient_state_facts_current
  ON aksh.patient_state_facts (patient_id, fact_type)
  WHERE superseded_by IS NULL;
`;

// Keep in sync with db/migrations/014_e2e_batches.sql
export const E2E_BATCHES_SQL = `
CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.e2e_batches (
  batch_id TEXT PRIMARY KEY,
  seed INTEGER NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL DEFAULT 'AKSH_E2E_TEST',
  patient_count INTEGER NOT NULL DEFAULT 0,
  user_count INTEGER NOT NULL DEFAULT 0,
  scenario_distribution JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  cleaned_up_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_e2e_batches_generated_at
  ON aksh.e2e_batches (generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_e2e_batches_active
  ON aksh.e2e_batches (batch_id)
  WHERE cleaned_up_at IS NULL;
`;

// Keep in sync with db/migrations/015_model_registry.sql
export const MODEL_REGISTRY_SQL = `
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
`;
