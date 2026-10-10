-- 020: Patient access — cancelled-slot fill with overdue-care matching (shadow mode first).
--
-- Every slot gets one workflow with an explicit state; every staff or service step is an append-only action with an
-- idempotency key, so replays and double clicks produce at most one logical action. A booking is never "booked"
-- until it is read back from the authoritative schedule; unknown outcomes stay PENDING_VERIFICATION.

CREATE TABLE IF NOT EXISTS aksh.access_slots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('manual', 'import', 'partner_api', 'simulation')),
  source_ref TEXT NOT NULL,                 -- the schedule's own slot id
  source_version INTEGER NOT NULL DEFAULT 1,
  appointment_type TEXT NOT NULL,           -- e.g. diabetes_review, hba1c_check, foot_check, eye_screening
  clinician_membership_id TEXT REFERENCES aksh.memberships(id) ON DELETE SET NULL,
  site TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL CHECK (duration_min BETWEEN 5 AND 240),
  offer_expires_at TIMESTAMPTZ NOT NULL,
  state TEXT NOT NULL DEFAULT 'available' CHECK (state IN ('available', 'offered', 'pending_verification', 'booked', 'expired', 'withdrawn')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, source, source_ref)
);
CREATE INDEX IF NOT EXISTS idx_access_slots_org_state ON aksh.access_slots (organisation_id, state, starts_at);

CREATE TABLE IF NOT EXISTS aksh.waitlist_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES aksh.network_patients(id) ON DELETE CASCADE,
  appointment_type TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('overdue_care', 'patient_request', 'clinician_request')),
  care_gap TEXT,
  earliest DATE,
  latest DATE,
  preferred_sites TEXT[] NOT NULL DEFAULT '{}',
  min_notice_hours INTEGER NOT NULL DEFAULT 2,
  accessibility_needs TEXT,
  contact_channel TEXT,                      -- null = no contact preference recorded (cannot be offered)
  opted_out BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'offered', 'booked', 'removed')),
  added_by TEXT REFERENCES aksh.users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_waitlist_org_status ON aksh.waitlist_entries (organisation_id, status, appointment_type);

CREATE TABLE IF NOT EXISTS aksh.access_workflows (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL UNIQUE REFERENCES aksh.access_slots(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (state IN (
    'RECEIVED', 'SOURCE_VALIDATED', 'ELIGIBILITY_CHECKED', 'CANDIDATES_RANKED', 'STAFF_REVIEW', 'OFFER_DRAFTED',
    'CONTACT_APPROVED', 'RESPONSE_CAPTURED', 'PENDING_VERIFICATION', 'CLOSED', 'HANDOFF', 'FAILED_SAFE'
  )),
  outcome TEXT CHECK (outcome IN ('booked', 'declined', 'no_response', 'expired', 'no_candidates', 'handed_off', 'withdrawn')),
  rule_version TEXT NOT NULL,
  template_version TEXT,
  selected_candidate_id TEXT,
  offer_text TEXT,
  environment TEXT NOT NULL,
  contact_mode TEXT NOT NULL DEFAULT 'shadow' CHECK (contact_mode IN ('shadow', 'staff_executed', 'adapter')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_access_workflows_org_state ON aksh.access_workflows (organisation_id, state);

CREATE TABLE IF NOT EXISTS aksh.access_candidates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workflow_id TEXT NOT NULL REFERENCES aksh.access_workflows(id) ON DELETE CASCADE,
  organisation_id TEXT NOT NULL,
  waitlist_entry_id TEXT NOT NULL REFERENCES aksh.waitlist_entries(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL,
  rank INTEGER,                             -- null = excluded
  rules_passed TEXT[] NOT NULL DEFAULT '{}',
  exclusion_codes TEXT[] NOT NULL DEFAULT '{}',
  missing_fields TEXT[] NOT NULL DEFAULT '{}',
  reasons TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE (workflow_id, waitlist_entry_id)
);

-- Append-only: who did what, under which rule/template version and environment, with an idempotency key.
CREATE TABLE IF NOT EXISTS aksh.access_actions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organisation_id TEXT NOT NULL,
  workflow_id TEXT NOT NULL REFERENCES aksh.access_workflows(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  actor_user_id TEXT,
  from_state TEXT,
  to_state TEXT,
  result_code TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  environment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_access_actions_workflow ON aksh.access_actions (workflow_id, created_at);

DROP TRIGGER IF EXISTS access_actions_append_only ON aksh.access_actions;
CREATE TRIGGER access_actions_append_only BEFORE UPDATE OR DELETE ON aksh.access_actions
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation();

CREATE TABLE IF NOT EXISTS aksh.handoff_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE CASCADE,
  workflow_id TEXT REFERENCES aksh.access_workflows(id) ON DELETE CASCADE,
  queue TEXT NOT NULL DEFAULT 'reception',
  reason TEXT NOT NULL,
  context TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'soon', 'urgent')),
  due_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  disposition TEXT,
  closed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_handoff_open ON aksh.handoff_tasks (organisation_id) WHERE closed_at IS NULL;

-- ---------------------------------------------------------------- row-level security (same tenant model as 017)

ALTER TABLE aksh.access_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.access_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.access_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.access_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.handoff_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS access_slots_org ON aksh.access_slots;
CREATE POLICY access_slots_org ON aksh.access_slots FOR ALL TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids())) WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()));
DROP POLICY IF EXISTS waitlist_org ON aksh.waitlist_entries;
CREATE POLICY waitlist_org ON aksh.waitlist_entries FOR ALL TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids())) WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()));
DROP POLICY IF EXISTS access_workflows_org ON aksh.access_workflows;
CREATE POLICY access_workflows_org ON aksh.access_workflows FOR ALL TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids())) WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()));
DROP POLICY IF EXISTS access_candidates_org ON aksh.access_candidates;
CREATE POLICY access_candidates_org ON aksh.access_candidates FOR ALL TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids())) WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()));
DROP POLICY IF EXISTS access_actions_read ON aksh.access_actions;
CREATE POLICY access_actions_read ON aksh.access_actions FOR SELECT TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids()));
DROP POLICY IF EXISTS access_actions_insert ON aksh.access_actions;
CREATE POLICY access_actions_insert ON aksh.access_actions FOR INSERT TO aksh_tenant
  WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()));
DROP POLICY IF EXISTS handoff_org ON aksh.handoff_tasks;
CREATE POLICY handoff_org ON aksh.handoff_tasks FOR ALL TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids())) WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()));

GRANT SELECT, INSERT, UPDATE ON aksh.access_slots, aksh.waitlist_entries, aksh.access_workflows, aksh.access_candidates,
  aksh.handoff_tasks TO aksh_tenant;
GRANT DELETE ON aksh.access_candidates TO aksh_tenant;
GRANT SELECT, INSERT ON aksh.access_actions TO aksh_tenant;
