-- 046: Medication and personalised care (Phase 3).
-- Medication safety flags (HITL), personalised care-plan drafts, patient goals,
-- assigned tasks, care-team handoffs, approval history.
-- Interaction flags are application-layer synthetic stubs — this migration does not
-- claim a licensed drug-interaction database.
-- Apply on simulation / local-dev Neon only. Never point agent workflows at production main.

CREATE SCHEMA IF NOT EXISTS aksh;

-- ---------------------------------------------------------------- medication safety flags

CREATE TABLE IF NOT EXISTS aksh.medcare_safety_flags (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  code TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low', 'info')),
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  related_medications JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'accepted', 'edited', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  decision_note TEXT,
  hitl_required BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  autonomous_prescribe BOOLEAN NOT NULL DEFAULT FALSE,
  autonomous_adjust BOOLEAN NOT NULL DEFAULT FALSE,
  validated_cds BOOLEAN NOT NULL DEFAULT FALSE,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_medcare_flags_patient
  ON aksh.medcare_safety_flags (scope_key, patient_id, status, created_at DESC);

-- ---------------------------------------------------------------- safety reviews (HITL bundle)

CREATE TABLE IF NOT EXISTS aksh.medcare_safety_reviews (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  patient_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'APPROVED', 'REJECTED', 'SUPERSEDED')),
  summary_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  flag_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  decision_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  hitl_required BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_medcare_reviews_patient
  ON aksh.medcare_safety_reviews (scope_key, patient_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS aksh.medcare_safety_review_decisions (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  review_id TEXT NOT NULL REFERENCES aksh.medcare_safety_reviews(id),
  action TEXT NOT NULL CHECK (action IN ('accept', 'edit', 'reject')),
  actor TEXT NOT NULL,
  reason TEXT,
  edited_sections JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS medcare_safety_review_decisions_append_only
  ON aksh.medcare_safety_review_decisions;
CREATE TRIGGER medcare_safety_review_decisions_append_only
  BEFORE UPDATE OR DELETE ON aksh.medcare_safety_review_decisions
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation();

CREATE INDEX IF NOT EXISTS idx_medcare_review_decisions
  ON aksh.medcare_safety_review_decisions (scope_key, review_id, created_at);

-- ---------------------------------------------------------------- personalised care plans

CREATE TABLE IF NOT EXISTS aksh.medcare_care_plans (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  patient_label TEXT NOT NULL,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'APPROVED', 'REJECTED', 'SUPERSEDED')),
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  goals_linked JSONB NOT NULL DEFAULT '[]'::jsonb,
  education_linked JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  decision_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  hitl_required BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  autonomous_prescribe BOOLEAN NOT NULL DEFAULT FALSE,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_medcare_plans_patient
  ON aksh.medcare_care_plans (scope_key, patient_id, status, created_at DESC);

-- ---------------------------------------------------------------- patient goals

CREATE TABLE IF NOT EXISTS aksh.medcare_patient_goals (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('glycaemia', 'lifestyle', 'medication_adherence', 'education', 'safety', 'other')),
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'active', 'achieved', 'paused', 'cancelled')),
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_medcare_goals_patient
  ON aksh.medcare_patient_goals (scope_key, patient_id, status);

-- ---------------------------------------------------------------- assigned tasks + handoffs

CREATE TABLE IF NOT EXISTS aksh.medcare_assigned_tasks (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  owner_role TEXT NOT NULL,
  owner_display TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'handed_off', 'completed', 'cancelled')),
  due_at TIMESTAMPTZ,
  related_plan_id TEXT,
  related_flag_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  note TEXT,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_medcare_tasks_patient
  ON aksh.medcare_assigned_tasks (scope_key, patient_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS aksh.medcare_handoffs (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  from_role TEXT NOT NULL,
  to_role TEXT NOT NULL,
  to_member_display TEXT,
  summary TEXT NOT NULL,
  related_task_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_medcare_handoffs_patient
  ON aksh.medcare_handoffs (scope_key, patient_id, created_at DESC);

-- ---------------------------------------------------------------- approval / review history (append-oriented)

CREATE TABLE IF NOT EXISTS aksh.medcare_approval_history (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  subject_kind TEXT NOT NULL
    CHECK (subject_kind IN ('medication_safety_flag', 'personalised_care_plan', 'medication_reconciliation')),
  subject_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB
);

DROP TRIGGER IF EXISTS medcare_approval_history_append_only
  ON aksh.medcare_approval_history;
CREATE TRIGGER medcare_approval_history_append_only
  BEFORE UPDATE OR DELETE ON aksh.medcare_approval_history
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation();

CREATE INDEX IF NOT EXISTS idx_medcare_history_patient
  ON aksh.medcare_approval_history (scope_key, patient_id, created_at DESC);

-- ---------------------------------------------------------------- RLS

ALTER TABLE aksh.medcare_safety_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.medcare_safety_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.medcare_safety_review_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.medcare_care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.medcare_patient_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.medcare_assigned_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.medcare_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.medcare_approval_history ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'medcare_safety_flags',
    'medcare_safety_reviews',
    'medcare_care_plans',
    'medcare_patient_goals',
    'medcare_assigned_tasks',
    'medcare_handoffs',
    'medcare_approval_history'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_org ON aksh.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_org ON aksh.%I FOR ALL TO aksh_tenant
         USING (organisation_id IS NULL OR organisation_id = ANY (aksh.ctx_org_ids()))
         WITH CHECK (organisation_id IS NULL OR organisation_id = ANY (aksh.ctx_org_ids()))',
      t, t
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS medcare_safety_review_decisions_via_review
  ON aksh.medcare_safety_review_decisions;
CREATE POLICY medcare_safety_review_decisions_via_review
  ON aksh.medcare_safety_review_decisions FOR ALL TO aksh_tenant
  USING (
    EXISTS (
      SELECT 1 FROM aksh.medcare_safety_reviews r
      WHERE r.id = review_id
        AND (r.organisation_id IS NULL OR r.organisation_id = ANY (aksh.ctx_org_ids()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM aksh.medcare_safety_reviews r
      WHERE r.id = review_id
        AND (r.organisation_id IS NULL OR r.organisation_id = ANY (aksh.ctx_org_ids()))
    )
  );

GRANT SELECT, INSERT, UPDATE ON
  aksh.medcare_safety_flags,
  aksh.medcare_safety_reviews,
  aksh.medcare_care_plans,
  aksh.medcare_patient_goals,
  aksh.medcare_assigned_tasks,
  aksh.medcare_handoffs
  TO aksh_tenant;

GRANT SELECT, INSERT ON
  aksh.medcare_safety_review_decisions,
  aksh.medcare_approval_history
  TO aksh_tenant;
