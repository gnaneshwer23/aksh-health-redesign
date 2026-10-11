-- 024: Error monitoring without a third-party processor.
-- Server, client and cron errors are recorded here after scrubbing (no emails, identifiers, numbers or SQL key values),
-- and one alert per distinct error per hour is emailed to OPS_ALERT_EMAIL. Only the owner role reads this table:
-- RLS is on with no policies, so aksh_tenant sees nothing.
CREATE TABLE IF NOT EXISTS aksh.error_events (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  environment TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('server', 'client', 'cron')),
  fingerprint TEXT NOT NULL,
  route TEXT,
  name TEXT,
  message TEXT NOT NULL,
  stack TEXT,
  digest TEXT,
  user_id TEXT,
  release TEXT,
  alerted BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS error_events_recent ON aksh.error_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS error_events_fingerprint ON aksh.error_events (fingerprint, occurred_at DESC);
ALTER TABLE aksh.error_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aksh.error_events FROM aksh_tenant;
