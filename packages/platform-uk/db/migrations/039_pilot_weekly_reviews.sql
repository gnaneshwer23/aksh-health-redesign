-- Week 12 pilot: weekly review sign-off. An organisation admin reviews the week's slot-fill report with the clinic
-- and signs it off. The figures are frozen in `snapshot` at the moment of sign-off, so the signed record does not
-- change when later events (a late read-back, an expiry) alter the live report. Append-only: a correction is a new
-- row (an addendum), never an edit.

CREATE TABLE IF NOT EXISTS aksh.pilot_weekly_reviews (
  id BIGSERIAL PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  report_version TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 4000),
  actions_agreed TEXT CHECK (actions_agreed IS NULL OR length(actions_agreed) <= 4000),
  attendees TEXT CHECK (attendees IS NULL OR length(attendees) <= 1000),
  reviewed_by TEXT NOT NULL,
  environment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (EXTRACT(ISODOW FROM week_start) = 1)
);
CREATE INDEX IF NOT EXISTS pilot_weekly_reviews_org_week ON aksh.pilot_weekly_reviews (organisation_id, week_start, id);

DROP TRIGGER IF EXISTS pilot_weekly_reviews_append_only ON aksh.pilot_weekly_reviews;
CREATE TRIGGER pilot_weekly_reviews_append_only BEFORE UPDATE OR DELETE ON aksh.pilot_weekly_reviews
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation_unless_purge();

ALTER TABLE aksh.pilot_weekly_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pilot_reviews_read ON aksh.pilot_weekly_reviews;
CREATE POLICY pilot_reviews_read ON aksh.pilot_weekly_reviews FOR SELECT TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids()));
-- Signed by the person in the session, for an organisation they belong to. Admin-only is enforced in the service.
DROP POLICY IF EXISTS pilot_reviews_sign ON aksh.pilot_weekly_reviews;
CREATE POLICY pilot_reviews_sign ON aksh.pilot_weekly_reviews FOR INSERT TO aksh_tenant
  WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()) AND reviewed_by = current_setting('app.user_id', true));

GRANT SELECT, INSERT ON aksh.pilot_weekly_reviews TO aksh_tenant;
GRANT USAGE ON SEQUENCE aksh.pilot_weekly_reviews_id_seq TO aksh_tenant;
