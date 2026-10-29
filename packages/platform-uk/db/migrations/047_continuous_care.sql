-- 047: Continuous care / longitudinal operations (Phase 4).
-- Follow-up worklists, appointment coordination, patient-reported updates,
-- notification preferences, staff escalation queues, completed-action tracking,
-- care-plan progress monitoring. Ops/safety analytics are derived in application layer.
-- Every clinical workflow row carries owner, status, timestamps; decisions append-only.
-- Apply on simulation / local-dev Neon only. Never point agent workflows at production main.

CREATE SCHEMA IF NOT EXISTS aksh;

-- ---------------------------------------------------------------- follow-up worklist items

CREATE TABLE IF NOT EXISTS aksh.ccare_follow_up_items (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  patient_label TEXT NOT NULL,
  title TEXT NOT NULL,
  source_kind TEXT NOT NULL
    CHECK (source_kind IN ('journey_follow_up', 'medcare_task', 'continuous_care', 'handoff')),
  source_ref_id TEXT,
  owner_role TEXT NOT NULL,
  owner_display TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'acknowledged', 'escalated', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'routine'
    CHECK (priority IN ('emergency', 'urgent', 'soon', 'routine')),
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  measurable_outcome JSONB NOT NULL DEFAULT '{}'::jsonb,
  note TEXT,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  autonomous_clinical_action BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ccare_followups_scope
  ON aksh.ccare_follow_up_items (scope_key, status, priority, due_at NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_ccare_followups_patient
  ON aksh.ccare_follow_up_items (scope_key, patient_id, created_at DESC);

-- ---------------------------------------------------------------- appointment coordination

CREATE TABLE IF NOT EXISTS aksh.ccare_appointments (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  patient_label TEXT NOT NULL,
  title TEXT NOT NULL,
  modality TEXT NOT NULL
    CHECK (modality IN ('in_person', 'telephone', 'video', 'async_message')),
  owner_role TEXT NOT NULL,
  owner_display TEXT,
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'offered', 'confirmed', 'completed', 'cancelled', 'no_show')),
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  related_follow_up_id TEXT,
  measurable_outcome JSONB NOT NULL DEFAULT '{}'::jsonb,
  note TEXT,
  hitl_required BOOLEAN NOT NULL DEFAULT TRUE,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  autonomous_clinical_action BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ccare_appointments_patient
  ON aksh.ccare_appointments (scope_key, patient_id, status, scheduled_at NULLS LAST);

-- ---------------------------------------------------------------- patient-reported updates

CREATE TABLE IF NOT EXISTS aksh.ccare_patient_updates (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  patient_label TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('symptoms', 'adherence', 'lifestyle', 'device', 'concern', 'other')),
  summary TEXT NOT NULL,
  owner_role TEXT NOT NULL DEFAULT 'patient',
  owner_display TEXT,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'triaged', 'acknowledged', 'escalated', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  measurable_outcome JSONB NOT NULL DEFAULT '{}'::jsonb,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by_clinician BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ccare_updates_patient
  ON aksh.ccare_patient_updates (scope_key, patient_id, status, created_at DESC);

-- ---------------------------------------------------------------- notification preferences

CREATE TABLE IF NOT EXISTS aksh.ccare_notification_prefs (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  owner_role TEXT NOT NULL DEFAULT 'patient',
  owner_display TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'withdrawn')),
  channels JSONB NOT NULL DEFAULT '{"email":false,"sms":false,"in_app":true,"push":false}'::jsonb,
  quiet_hours JSONB,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  measurable_outcome JSONB NOT NULL DEFAULT '{}'::jsonb,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (scope_key, patient_id)
);

-- ---------------------------------------------------------------- staff escalation queue

CREATE TABLE IF NOT EXISTS aksh.ccare_escalations (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  patient_label TEXT NOT NULL,
  title TEXT NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL
    CHECK (severity IN ('high', 'medium', 'low')),
  owner_role TEXT NOT NULL,
  owner_display TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'queued', 'in_review', 'accepted', 'edited', 'rejected', 'resolved', 'cancelled')),
  related_follow_up_id TEXT,
  related_update_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  measurable_outcome JSONB NOT NULL DEFAULT '{}'::jsonb,
  hitl_required BOOLEAN NOT NULL DEFAULT TRUE,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  autonomous_clinical_action BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ccare_escalations_queue
  ON aksh.ccare_escalations (scope_key, status, severity, created_at ASC);

CREATE TABLE IF NOT EXISTS aksh.ccare_escalation_decisions (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  escalation_id TEXT NOT NULL REFERENCES aksh.ccare_escalations(id),
  action TEXT NOT NULL CHECK (action IN ('accept', 'edit', 'reject', 'resolve', 'queue')),
  actor TEXT NOT NULL,
  reason TEXT,
  edited_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS ccare_escalation_decisions_append_only
  ON aksh.ccare_escalation_decisions;
CREATE TRIGGER ccare_escalation_decisions_append_only
  BEFORE UPDATE OR DELETE ON aksh.ccare_escalation_decisions
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation();

CREATE INDEX IF NOT EXISTS idx_ccare_escalation_decisions
  ON aksh.ccare_escalation_decisions (scope_key, escalation_id, created_at);

-- ---------------------------------------------------------------- completed actions

CREATE TABLE IF NOT EXISTS aksh.ccare_completed_actions (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  patient_label TEXT NOT NULL,
  action_kind TEXT NOT NULL,
  title TEXT NOT NULL,
  owner_role TEXT NOT NULL,
  owner_display TEXT,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'voided')),
  source_kind TEXT NOT NULL,
  source_ref_id TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  measurable_outcome JSONB NOT NULL DEFAULT '{}'::jsonb,
  note TEXT,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ccare_completed_patient
  ON aksh.ccare_completed_actions (scope_key, patient_id, completed_at DESC);

-- ---------------------------------------------------------------- care-plan progress

CREATE TABLE IF NOT EXISTS aksh.ccare_plan_progress (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  patient_label TEXT NOT NULL,
  plan_ref_kind TEXT NOT NULL
    CHECK (plan_ref_kind IN ('journey_care_plan', 'medcare_care_plan', 'synthetic_plan')),
  plan_ref_id TEXT NOT NULL,
  title TEXT NOT NULL,
  owner_role TEXT NOT NULL,
  owner_display TEXT,
  status TEXT NOT NULL DEFAULT 'monitoring'
    CHECK (status IN ('monitoring', 'on_track', 'at_risk', 'completed', 'paused')),
  progress_pct INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  measurable_outcome JSONB NOT NULL DEFAULT '{}'::jsonb,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ccare_progress_patient
  ON aksh.ccare_plan_progress (scope_key, patient_id, status, updated_at DESC);

-- ---------------------------------------------------------------- decision / workflow history (append-oriented)

CREATE TABLE IF NOT EXISTS aksh.ccare_decision_history (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  subject_kind TEXT NOT NULL
    CHECK (subject_kind IN (
      'follow_up', 'appointment', 'patient_update', 'notification_pref',
      'escalation', 'completed_action', 'plan_progress'
    )),
  subject_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  measurable_outcome JSONB,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB
);

DROP TRIGGER IF EXISTS ccare_decision_history_append_only
  ON aksh.ccare_decision_history;
CREATE TRIGGER ccare_decision_history_append_only
  BEFORE UPDATE OR DELETE ON aksh.ccare_decision_history
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation();

CREATE INDEX IF NOT EXISTS idx_ccare_history_patient
  ON aksh.ccare_decision_history (scope_key, patient_id, created_at DESC);

-- ---------------------------------------------------------------- RLS

ALTER TABLE aksh.ccare_follow_up_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.ccare_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.ccare_patient_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.ccare_notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.ccare_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.ccare_escalation_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.ccare_completed_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.ccare_plan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.ccare_decision_history ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ccare_follow_up_items',
    'ccare_appointments',
    'ccare_patient_updates',
    'ccare_notification_prefs',
    'ccare_escalations',
    'ccare_completed_actions',
    'ccare_plan_progress',
    'ccare_decision_history'
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

DROP POLICY IF EXISTS ccare_escalation_decisions_via_esc
  ON aksh.ccare_escalation_decisions;
CREATE POLICY ccare_escalation_decisions_via_esc
  ON aksh.ccare_escalation_decisions FOR ALL TO aksh_tenant
  USING (
    EXISTS (
      SELECT 1 FROM aksh.ccare_escalations e
      WHERE e.id = escalation_id
        AND (e.organisation_id IS NULL OR e.organisation_id = ANY (aksh.ctx_org_ids()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM aksh.ccare_escalations e
      WHERE e.id = escalation_id
        AND (e.organisation_id IS NULL OR e.organisation_id = ANY (aksh.ctx_org_ids()))
    )
  );

GRANT SELECT, INSERT, UPDATE ON
  aksh.ccare_follow_up_items,
  aksh.ccare_appointments,
  aksh.ccare_patient_updates,
  aksh.ccare_notification_prefs,
  aksh.ccare_escalations,
  aksh.ccare_completed_actions,
  aksh.ccare_plan_progress
  TO aksh_tenant;

GRANT SELECT, INSERT ON
  aksh.ccare_escalation_decisions,
  aksh.ccare_decision_history
  TO aksh_tenant;
