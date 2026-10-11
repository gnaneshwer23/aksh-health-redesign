-- 028: Hardening from the review of 025–027.

-- 1. The tenant evidence guard (027) read organisation status without a lock, so it could pass against a status
--    that an approval was about to change. It now takes a share lock (serialises with the reviewer's FOR UPDATE).
--    Locking needs owner rights, so the lookup is a SECURITY DEFINER helper; the guard itself still runs as the caller.
CREATE OR REPLACE FUNCTION aksh.lock_org_status(p_org TEXT) RETURNS TEXT
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = aksh, pg_temp AS $$
  SELECT status FROM aksh.organisations WHERE id = p_org FOR SHARE;
$$;
REVOKE ALL ON FUNCTION aksh.lock_org_status(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aksh.lock_org_status(TEXT) TO aksh_tenant;

CREATE OR REPLACE FUNCTION aksh.guard_golive_submission() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE org_status TEXT; latest_baseline TEXT;
BEGIN
  IF current_user = 'aksh_tenant' THEN
    org_status := aksh.lock_org_status(NEW.organisation_id);
    IF org_status IS NULL OR org_status NOT IN ('sandbox', 'onboarding') THEN
      RAISE EXCEPTION 'GOLIVE_CLOSED: organisation is %', coalesce(org_status, 'unknown');
    END IF;
    IF NEW.item_key = 'baseline' THEN
      SELECT action INTO latest_baseline FROM aksh.golive_events
       WHERE organisation_id = NEW.organisation_id AND item_key = 'baseline' ORDER BY id DESC LIMIT 1;
      IF latest_baseline = 'accepted' THEN
        RAISE EXCEPTION 'BASELINE_LOCKED: the accepted baseline cannot be changed';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- 2. A registration check must be about a member of the organisation it is recorded under.
DROP POLICY IF EXISTS registration_checks_insert ON aksh.registration_checks;
CREATE POLICY registration_checks_insert ON aksh.registration_checks FOR INSERT TO aksh_tenant
  WITH CHECK (
    organisation_id = ANY (aksh.ctx_org_ids()) AND checked_by_kind = 'org_admin' AND checked_by = current_setting('app.user_id', true)
    AND EXISTS (SELECT 1 FROM aksh.memberships m WHERE m.id = membership_id AND m.organisation_id = registration_checks.organisation_id)
  );

-- 3. A tenant session cannot create a membership that is already verified or rejected (no check exists yet).
CREATE OR REPLACE FUNCTION aksh.guard_registration_status() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE latest TEXT;
BEGIN
  IF current_user <> 'aksh_tenant' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.registration_status IN ('verified', 'rejected') THEN
      RAISE EXCEPTION 'REGISTRATION_STATUS: record a registration check first';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.registration_status IS DISTINCT FROM OLD.registration_status AND NEW.registration_status <> 'unverified' THEN
    SELECT outcome INTO latest FROM aksh.registration_checks WHERE membership_id = NEW.id ORDER BY id DESC LIMIT 1;
    IF latest IS DISTINCT FROM NEW.registration_status THEN
      RAISE EXCEPTION 'REGISTRATION_STATUS: record a registration check first';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS memberships_registration_guard ON aksh.memberships;
CREATE TRIGGER memberships_registration_guard BEFORE INSERT OR UPDATE ON aksh.memberships
  FOR EACH ROW EXECUTE FUNCTION aksh.guard_registration_status();
