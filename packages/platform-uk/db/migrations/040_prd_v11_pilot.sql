-- Commercial Execution PRD v1.1: pilot stages (§10.3), approved offer templates (PA-04 / PA-108), and the
-- complaint and staff-time guardrails (§10.2).

-- §10.3 Each pilot stage is a deliberate permission increase. Organisations go live in shadow mode; only an Aksh
-- reviewer (owner role) moves one to staff-assisted, and the change is recorded append-only.
ALTER TABLE aksh.organisations ADD COLUMN IF NOT EXISTS pilot_stage TEXT NOT NULL DEFAULT 'shadow'
  CHECK (pilot_stage IN ('shadow', 'staff_assisted'));

CREATE OR REPLACE FUNCTION aksh.guard_org_status() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_user = 'aksh_tenant' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
      OR NEW.pilot_stage IS DISTINCT FROM OLD.pilot_stage) THEN
    RAISE EXCEPTION 'STATUS_CHANGE: organisation status and pilot stage change only through Aksh review';
  END IF;
  RETURN NEW;
END $$;

CREATE TABLE IF NOT EXISTS aksh.pilot_stage_events (
  id BIGSERIAL PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE CASCADE,
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL CHECK (to_stage IN ('shadow', 'staff_assisted')),
  note TEXT NOT NULL CHECK (length(note) BETWEEN 3 AND 2000),
  actor_user_id TEXT NOT NULL,
  environment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pilot_stage_events_org ON aksh.pilot_stage_events (organisation_id, id);
DROP TRIGGER IF EXISTS pilot_stage_events_append_only ON aksh.pilot_stage_events;
CREATE TRIGGER pilot_stage_events_append_only BEFORE UPDATE OR DELETE ON aksh.pilot_stage_events
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation_unless_purge();
ALTER TABLE aksh.pilot_stage_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pilot_stage_events_read ON aksh.pilot_stage_events;
CREATE POLICY pilot_stage_events_read ON aksh.pilot_stage_events FOR SELECT TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids()));
GRANT SELECT ON aksh.pilot_stage_events TO aksh_tenant;

-- PA-04 / PA-108 Offer templates approved by the organisation: versioned, append-only (a new version supersedes).
-- Drafts record the version they used. Without an approved template, the built-in default applies.
CREATE TABLE IF NOT EXISTS aksh.offer_templates (
  id BIGSERIAL PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version >= 1),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 40 AND 640),
  note TEXT CHECK (note IS NULL OR length(note) <= 500),
  created_by TEXT NOT NULL,
  environment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, version)
);
DROP TRIGGER IF EXISTS offer_templates_append_only ON aksh.offer_templates;
CREATE TRIGGER offer_templates_append_only BEFORE UPDATE OR DELETE ON aksh.offer_templates
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation_unless_purge();
ALTER TABLE aksh.offer_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS offer_templates_read ON aksh.offer_templates;
CREATE POLICY offer_templates_read ON aksh.offer_templates FOR SELECT TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids()));
-- Approved by the person in the session, for an organisation they belong to. Admin-only is enforced in the service.
DROP POLICY IF EXISTS offer_templates_approve ON aksh.offer_templates;
CREATE POLICY offer_templates_approve ON aksh.offer_templates FOR INSERT TO aksh_tenant
  WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()) AND created_by = current_setting('app.user_id', true));
GRANT SELECT, INSERT ON aksh.offer_templates TO aksh_tenant;
GRANT USAGE ON SEQUENCE aksh.offer_templates_id_seq TO aksh_tenant;
