-- 027: Go-live hardening (review findings on 025).
-- 1. Tenant sessions cannot add go-live evidence once the organisation is live, or replace an accepted baseline.
--    The application checks this under a lock; this is the database's own line.
CREATE OR REPLACE FUNCTION aksh.guard_golive_submission() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE org_status TEXT; latest_baseline TEXT;
BEGIN
  IF current_user = 'aksh_tenant' THEN
    SELECT status INTO org_status FROM aksh.organisations WHERE id = NEW.organisation_id;
    IF org_status NOT IN ('sandbox', 'onboarding') THEN
      RAISE EXCEPTION 'GOLIVE_CLOSED: organisation is %', org_status;
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
DROP TRIGGER IF EXISTS golive_events_submission_guard ON aksh.golive_events;
CREATE TRIGGER golive_events_submission_guard BEFORE INSERT ON aksh.golive_events
  FOR EACH ROW EXECUTE FUNCTION aksh.guard_golive_submission();

-- 2. Append-only history versus account deletion. Deleting a user cascades to memberships and from there to their
--    registration checks; the append-only trigger rejected that, so even test-account cleanup failed. History stays
--    append-only for every normal path; only an explicit purge (SET LOCAL aksh.purge_test_data = 'on', used by the
--    test-data cleanup script, which refuses to run in production) may delete. Tenants have no DELETE grant at all.
CREATE OR REPLACE FUNCTION aksh.reject_mutation_unless_purge() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND current_setting('aksh.purge_test_data', true) = 'on' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END $$;

DROP TRIGGER IF EXISTS golive_events_append_only ON aksh.golive_events;
CREATE TRIGGER golive_events_append_only BEFORE UPDATE OR DELETE ON aksh.golive_events
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation_unless_purge();
DROP TRIGGER IF EXISTS registration_checks_append_only ON aksh.registration_checks;
CREATE TRIGGER registration_checks_append_only BEFORE UPDATE OR DELETE ON aksh.registration_checks
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation_unless_purge();
DROP TRIGGER IF EXISTS connector_events_append_only ON aksh.connector_events;
CREATE TRIGGER connector_events_append_only BEFORE UPDATE OR DELETE ON aksh.connector_events
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation_unless_purge();
