-- 043: Connected Diabetes Intelligence — durable care plans, follow-ups, journey audit.
-- Apply on simulation / local-dev Neon only. Never point agent workflows at production main.
-- Extends aksh.*; does not alter network_observations or patient_state_facts.

CREATE SCHEMA IF NOT EXISTS aksh;

CREATE TABLE IF NOT EXISTS aksh.care_plan_records (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  patient_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'APPROVED', 'REJECTED', 'SUPERSEDED')),
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  safety_notes TEXT[] NOT NULL DEFAULT '{}',
  missing_data JSONB NOT NULL DEFAULT '[]'::jsonb,
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

CREATE INDEX IF NOT EXISTS idx_care_plan_records_patient
  ON aksh.care_plan_records (scope_key, patient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS aksh.care_plan_decisions (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES aksh.care_plan_records(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('accept', 'edit', 'reject')),
  actor TEXT NOT NULL,
  reason TEXT,
  edited_sections JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS care_plan_decisions_append_only ON aksh.care_plan_decisions;
CREATE TRIGGER care_plan_decisions_append_only
  BEFORE UPDATE OR DELETE ON aksh.care_plan_decisions
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation();

CREATE INDEX IF NOT EXISTS idx_care_plan_decisions_plan
  ON aksh.care_plan_decisions (plan_id, created_at);

CREATE TABLE IF NOT EXISTS aksh.care_follow_up_tasks (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  organisation_id TEXT,
  patient_id TEXT NOT NULL,
  plan_id TEXT REFERENCES aksh.care_plan_records(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  owner TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'acknowledged', 'completed', 'cancelled')),
  due_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  note TEXT,
  synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_care_follow_up_open
  ON aksh.care_follow_up_tasks (scope_key, patient_id)
  WHERE status IN ('open', 'acknowledged');

CREATE TABLE IF NOT EXISTS aksh.care_journey_events (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL DEFAULT 'shared',
  patient_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ehr_write BOOLEAN NOT NULL DEFAULT FALSE
);

DROP TRIGGER IF EXISTS care_journey_events_append_only ON aksh.care_journey_events;
CREATE TRIGGER care_journey_events_append_only
  BEFORE UPDATE OR DELETE ON aksh.care_journey_events
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation();

CREATE INDEX IF NOT EXISTS idx_care_journey_events_patient
  ON aksh.care_journey_events (scope_key, patient_id, occurred_at DESC);

-- RLS: org-scoped rows when organisation_id set; simulation rows use scope_key in app layer.
ALTER TABLE aksh.care_plan_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.care_plan_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.care_follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.care_journey_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS care_plan_records_org ON aksh.care_plan_records;
CREATE POLICY care_plan_records_org ON aksh.care_plan_records FOR ALL TO aksh_tenant
  USING (
    organisation_id IS NULL OR organisation_id = ANY (aksh.ctx_org_ids())
  )
  WITH CHECK (
    organisation_id IS NULL OR organisation_id = ANY (aksh.ctx_org_ids())
  );

DROP POLICY IF EXISTS care_plan_decisions_via_plan ON aksh.care_plan_decisions;
CREATE POLICY care_plan_decisions_via_plan ON aksh.care_plan_decisions FOR ALL TO aksh_tenant
  USING (
    EXISTS (
      SELECT 1 FROM aksh.care_plan_records p
      WHERE p.id = plan_id
        AND (p.organisation_id IS NULL OR p.organisation_id = ANY (aksh.ctx_org_ids()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM aksh.care_plan_records p
      WHERE p.id = plan_id
        AND (p.organisation_id IS NULL OR p.organisation_id = ANY (aksh.ctx_org_ids()))
    )
  );

DROP POLICY IF EXISTS care_follow_up_org ON aksh.care_follow_up_tasks;
CREATE POLICY care_follow_up_org ON aksh.care_follow_up_tasks FOR ALL TO aksh_tenant
  USING (
    organisation_id IS NULL OR organisation_id = ANY (aksh.ctx_org_ids())
  )
  WITH CHECK (
    organisation_id IS NULL OR organisation_id = ANY (aksh.ctx_org_ids())
  );

DROP POLICY IF EXISTS care_journey_events_read ON aksh.care_journey_events;
CREATE POLICY care_journey_events_read ON aksh.care_journey_events FOR SELECT TO aksh_tenant
  USING (true);
DROP POLICY IF EXISTS care_journey_events_insert ON aksh.care_journey_events;
CREATE POLICY care_journey_events_insert ON aksh.care_journey_events FOR INSERT TO aksh_tenant
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON aksh.care_plan_records, aksh.care_follow_up_tasks TO aksh_tenant;
GRANT SELECT, INSERT ON aksh.care_plan_decisions, aksh.care_journey_events TO aksh_tenant;
