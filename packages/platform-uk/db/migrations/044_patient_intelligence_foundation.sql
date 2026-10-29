-- 044: Unified patient intelligence foundation (Phase 1).
-- Structured clinical spine for Patient 360: conditions, allergies, family history,
-- diabetes classification, encounters, medication reconciliation scaffolding,
-- care-team assignments, consent preferences, observation provenance markers.
-- Apply on simulation / local-dev Neon only. Never point agent workflows at production main.
-- Extends aksh.*; does not drop network_* or patient_state_facts.

CREATE SCHEMA IF NOT EXISTS aksh;

-- ---------------------------------------------------------------- conditions / comorbidities

CREATE TABLE IF NOT EXISTS aksh.patient_conditions (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  display TEXT NOT NULL,
  code TEXT,
  code_system TEXT,
  clinical_status TEXT NOT NULL DEFAULT 'active'
    CHECK (clinical_status IN ('active', 'inactive', 'resolved', 'unknown')),
  category TEXT NOT NULL DEFAULT 'problem'
    CHECK (category IN ('problem', 'comorbidity', 'diabetes', 'other')),
  onset_date DATE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_system TEXT NOT NULL DEFAULT 'synthetic_seed',
  source_reference TEXT,
  confidence REAL NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_patient_conditions_patient
  ON aksh.patient_conditions (scope_key, patient_id, clinical_status);

-- ---------------------------------------------------------------- allergies

CREATE TABLE IF NOT EXISTS aksh.patient_allergies (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  substance TEXT NOT NULL,
  code TEXT,
  code_system TEXT,
  criticality TEXT NOT NULL DEFAULT 'unknown'
    CHECK (criticality IN ('low', 'high', 'unable_to_assess', 'unknown')),
  reaction TEXT,
  clinical_status TEXT NOT NULL DEFAULT 'active'
    CHECK (clinical_status IN ('active', 'inactive', 'resolved', 'unknown')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_system TEXT NOT NULL DEFAULT 'synthetic_seed',
  source_reference TEXT,
  confidence REAL NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient
  ON aksh.patient_allergies (scope_key, patient_id, clinical_status);

-- ---------------------------------------------------------------- family history

CREATE TABLE IF NOT EXISTS aksh.patient_family_history (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  relationship TEXT NOT NULL,
  condition_display TEXT NOT NULL,
  condition_code TEXT,
  code_system TEXT,
  onset_age_years INTEGER,
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_system TEXT NOT NULL DEFAULT 'synthetic_seed',
  confidence REAL NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_patient_family_history_patient
  ON aksh.patient_family_history (scope_key, patient_id);

-- ---------------------------------------------------------------- diabetes diagnosis / classification

CREATE TABLE IF NOT EXISTS aksh.patient_diabetes_profiles (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  diabetes_type TEXT NOT NULL
    CHECK (diabetes_type IN (
      'type_1', 'type_2', 'gestational', 'modynam', 'secondary', 'prediabetes', 'unspecified', 'none'
    )),
  classification_note TEXT,
  diagnosed_on DATE,
  snomed_code TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'resolved', 'in_remission', 'unknown')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_system TEXT NOT NULL DEFAULT 'synthetic_seed',
  confidence REAL NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (scope_key, patient_id)
);

-- ---------------------------------------------------------------- clinical encounters

CREATE TABLE IF NOT EXISTS aksh.patient_encounters (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  class_name TEXT NOT NULL DEFAULT 'primary-care',
  reason TEXT,
  clinician_summary TEXT,
  status TEXT NOT NULL DEFAULT 'finished'
    CHECK (status IN ('planned', 'in_progress', 'finished', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_system TEXT NOT NULL DEFAULT 'synthetic_seed',
  source_reference TEXT,
  confidence REAL NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_patient_encounters_patient
  ON aksh.patient_encounters (scope_key, patient_id, started_at DESC);

-- ---------------------------------------------------------------- observation ledger (labs / vitals for Patient 360 spine)

CREATE TABLE IF NOT EXISTS aksh.patient_observation_items (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  display TEXT NOT NULL,
  value_numeric NUMERIC,
  value_text TEXT,
  unit TEXT,
  code TEXT,
  code_system TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  source_system TEXT NOT NULL DEFAULT 'synthetic_seed',
  source_channel TEXT
    CHECK (source_channel IS NULL OR source_channel IN (
      'lab', 'clinic', 'device', 'patient_reported', 'synthetic_seed'
    )),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  quality_flag TEXT NOT NULL DEFAULT 'unassessed'
    CHECK (quality_flag IN ('ok', 'stale', 'unverified', 'conflict', 'missing', 'unassessed')),
  confidence REAL NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_patient_observation_items_patient
  ON aksh.patient_observation_items (scope_key, patient_id, kind, observed_at DESC);

-- ---------------------------------------------------------------- medication reconciliation scaffolding (no prescribe)

CREATE TABLE IF NOT EXISTS aksh.medication_reconciliation_runs (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_progress', 'pending_clinician', 'completed', 'cancelled')),
  source_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  reconciled_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  discrepancies JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  note TEXT,
  hitl_required BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  autonomous_prescribe BOOLEAN NOT NULL DEFAULT FALSE,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_med_recon_patient
  ON aksh.medication_reconciliation_runs (scope_key, patient_id, created_at DESC);

-- ---------------------------------------------------------------- care-team assignments (simulation spine; network care_team remains org-scoped)

CREATE TABLE IF NOT EXISTS aksh.patient_care_assignments (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  member_display TEXT NOT NULL,
  care_role TEXT NOT NULL,
  member_email TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'ended')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  source_system TEXT NOT NULL DEFAULT 'synthetic_seed',
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_patient_care_assignments_patient
  ON aksh.patient_care_assignments (scope_key, patient_id)
  WHERE status = 'active';

-- ---------------------------------------------------------------- consent / data-sharing preferences (simulation spine)

CREATE TABLE IF NOT EXISTS aksh.patient_sharing_preferences (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  purpose TEXT NOT NULL
    CHECK (purpose IN (
      'direct_care', 'care_coordination', 'contact', 'research', 'data_sharing', 'device_data'
    )),
  status TEXT NOT NULL CHECK (status IN ('granted', 'withdrawn', 'denied')),
  basis TEXT,
  recorded_by TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

DROP TRIGGER IF EXISTS patient_sharing_preferences_append_only ON aksh.patient_sharing_preferences;
CREATE TRIGGER patient_sharing_preferences_append_only
  BEFORE UPDATE OR DELETE ON aksh.patient_sharing_preferences
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation();

CREATE INDEX IF NOT EXISTS idx_patient_sharing_prefs_current
  ON aksh.patient_sharing_preferences (scope_key, patient_id, purpose, recorded_at DESC);

-- ---------------------------------------------------------------- RLS (org-scoped when organisation_id set; simulation uses scope_key in app)

ALTER TABLE aksh.patient_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.patient_family_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.patient_diabetes_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.patient_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.patient_observation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.medication_reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.patient_care_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.patient_sharing_preferences ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patient_conditions',
    'patient_allergies',
    'patient_family_history',
    'patient_diabetes_profiles',
    'patient_encounters',
    'patient_observation_items',
    'medication_reconciliation_runs',
    'patient_care_assignments',
    'patient_sharing_preferences'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_org ON aksh.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_org ON aksh.%I FOR ALL TO aksh_tenant
         USING (organisation_id IS NULL OR organisation_id = ANY (aksh.ctx_org_ids()))
         WITH CHECK (organisation_id IS NULL OR organisation_id = ANY (aksh.ctx_org_ids()))',
      t, t
    );
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE ON aksh.%I TO aksh_tenant',
      t
    );
  END LOOP;
END $$;

-- Sharing preferences are append-only: grant INSERT + SELECT only (UPDATE already blocked by trigger).
REVOKE UPDATE ON aksh.patient_sharing_preferences FROM aksh_tenant;
GRANT SELECT, INSERT ON aksh.patient_sharing_preferences TO aksh_tenant;
