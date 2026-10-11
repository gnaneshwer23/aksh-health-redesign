-- 025: Go-live checklist, Aksh platform admins, and staff registration checks.
-- Every step is an append-only event: the current state is derived from the history, never overwritten.

-- Aksh staff who review go-live requests. Granted only by scripts/platform-admin.ts (owner role); invisible to tenants.
CREATE TABLE IF NOT EXISTS aksh.platform_admins (
  user_id TEXT PRIMARY KEY REFERENCES aksh.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by TEXT NOT NULL,
  note TEXT
);
ALTER TABLE aksh.platform_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aksh.platform_admins FROM aksh_tenant;

-- Go-live history for an organisation. item_key is null for whole-organisation actions (request, approve, return).
CREATE TABLE IF NOT EXISTS aksh.golive_events (
  id BIGSERIAL PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE CASCADE,
  item_key TEXT,
  action TEXT NOT NULL CHECK (action IN ('submitted', 'accepted', 'rejected', 'requested', 'approved', 'returned')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  note TEXT,
  actor_user_id TEXT NOT NULL,
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('org_admin', 'platform_admin')),
  environment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((action IN ('submitted', 'accepted', 'rejected')) = (item_key IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS golive_events_org ON aksh.golive_events (organisation_id, id);
DROP TRIGGER IF EXISTS golive_events_append_only ON aksh.golive_events;
CREATE TRIGGER golive_events_append_only BEFORE UPDATE OR DELETE ON aksh.golive_events
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation();
ALTER TABLE aksh.golive_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS golive_read_own_org ON aksh.golive_events;
CREATE POLICY golive_read_own_org ON aksh.golive_events FOR SELECT TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids()));
-- Organisations can only submit evidence and request review; accept/reject/approve/return are platform-admin actions.
DROP POLICY IF EXISTS golive_org_submit ON aksh.golive_events;
CREATE POLICY golive_org_submit ON aksh.golive_events FOR INSERT TO aksh_tenant
  WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()) AND actor_kind = 'org_admin' AND action IN ('submitted', 'requested')
              AND actor_user_id = current_setting('app.user_id', true));
GRANT SELECT, INSERT ON aksh.golive_events TO aksh_tenant;
GRANT USAGE ON SEQUENCE aksh.golive_events_id_seq TO aksh_tenant;

-- Registration checks against the official register for the clinician's profession and country.
CREATE TABLE IF NOT EXISTS aksh.registration_checks (
  id BIGSERIAL PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE CASCADE,
  membership_id TEXT NOT NULL REFERENCES aksh.memberships(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (outcome IN ('verified', 'rejected', 'not_applicable')),
  registry TEXT,
  registration_number TEXT,
  checked_on DATE NOT NULL,
  evidence_ref TEXT,
  note TEXT,
  checked_by TEXT NOT NULL,
  checked_by_kind TEXT NOT NULL CHECK (checked_by_kind IN ('org_admin', 'platform_admin')),
  environment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (outcome <> 'verified' OR (registry IS NOT NULL AND registration_number IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS registration_checks_member ON aksh.registration_checks (membership_id, id);
DROP TRIGGER IF EXISTS registration_checks_append_only ON aksh.registration_checks;
CREATE TRIGGER registration_checks_append_only BEFORE UPDATE OR DELETE ON aksh.registration_checks
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation();

-- Nobody records a check on their own registration.
CREATE OR REPLACE FUNCTION aksh.reject_self_registration_check() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM aksh.memberships m WHERE m.id = NEW.membership_id AND m.user_id = NEW.checked_by) THEN
    RAISE EXCEPTION 'SELF_CHECK: a registration must be checked by someone else';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS registration_checks_not_self ON aksh.registration_checks;
CREATE TRIGGER registration_checks_not_self BEFORE INSERT ON aksh.registration_checks
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_self_registration_check();

ALTER TABLE aksh.registration_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS registration_checks_own_org ON aksh.registration_checks;
CREATE POLICY registration_checks_own_org ON aksh.registration_checks FOR SELECT TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids()));
DROP POLICY IF EXISTS registration_checks_insert ON aksh.registration_checks;
CREATE POLICY registration_checks_insert ON aksh.registration_checks FOR INSERT TO aksh_tenant
  WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()) AND checked_by_kind = 'org_admin' AND checked_by = current_setting('app.user_id', true));
GRANT SELECT, INSERT ON aksh.registration_checks TO aksh_tenant;
GRANT USAGE ON SEQUENCE aksh.registration_checks_id_seq TO aksh_tenant;

-- Organisation status and verification only change through go-live review (owner role), never from a tenant session.
CREATE OR REPLACE FUNCTION aksh.guard_org_status() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_user = 'aksh_tenant' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.verified_at IS DISTINCT FROM OLD.verified_at) THEN
    RAISE EXCEPTION 'STATUS_CHANGE: organisation status changes only through go-live review';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS organisations_status_guard ON aksh.organisations;
CREATE TRIGGER organisations_status_guard BEFORE UPDATE ON aksh.organisations
  FOR EACH ROW EXECUTE FUNCTION aksh.guard_org_status();

-- From a tenant session, a registration status can only move to the outcome of its latest recorded check
-- (or back to unverified when the registration details change).
CREATE OR REPLACE FUNCTION aksh.guard_registration_status() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE latest TEXT;
BEGIN
  IF current_user = 'aksh_tenant' AND NEW.registration_status IS DISTINCT FROM OLD.registration_status AND NEW.registration_status <> 'unverified' THEN
    SELECT outcome INTO latest FROM aksh.registration_checks WHERE membership_id = NEW.id ORDER BY id DESC LIMIT 1;
    IF latest IS DISTINCT FROM NEW.registration_status THEN
      RAISE EXCEPTION 'REGISTRATION_STATUS: record a registration check first';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS memberships_registration_guard ON aksh.memberships;
CREATE TRIGGER memberships_registration_guard BEFORE UPDATE ON aksh.memberships
  FOR EACH ROW EXECUTE FUNCTION aksh.guard_registration_status();
