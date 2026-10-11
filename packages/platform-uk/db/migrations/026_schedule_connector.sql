-- 026: Schedule connector. An organisation issues API keys to its scheduling system, which reports freed slots and
-- bookings (FHIR R4 Slot/Appointment or plain JSON). Keys are stored hashed; every inbound message is logged.
CREATE TABLE IF NOT EXISTS aksh.connector_keys (
  id TEXT PRIMARY KEY DEFAULT replace(gen_random_uuid()::text, '-', ''),
  organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,                 -- first characters, for recognising a key; never enough to use it
  key_hash TEXT NOT NULL UNIQUE,            -- sha256 of the full key
  -- typeMap: { "<their appointment code or text>": "<our appointment type>" }, offerCloseHours, site
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT
);
CREATE INDEX IF NOT EXISTS connector_keys_org ON aksh.connector_keys (organisation_id);
ALTER TABLE aksh.connector_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS connector_keys_org ON aksh.connector_keys;
CREATE POLICY connector_keys_org ON aksh.connector_keys FOR ALL TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids())) WITH CHECK (organisation_id = ANY (aksh.ctx_org_ids()));
GRANT SELECT, INSERT, UPDATE ON aksh.connector_keys TO aksh_tenant;

CREATE TABLE IF NOT EXISTS aksh.connector_events (
  id BIGSERIAL PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES aksh.organisations(id) ON DELETE CASCADE,
  key_id TEXT NOT NULL REFERENCES aksh.connector_keys(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('slot', 'appointment')),
  format TEXT NOT NULL CHECK (format IN ('fhir', 'json')),
  external_ref TEXT,
  result_code TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  workflow_id TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS connector_events_org ON aksh.connector_events (organisation_id, received_at DESC);
DROP TRIGGER IF EXISTS connector_events_append_only ON aksh.connector_events;
CREATE TRIGGER connector_events_append_only BEFORE UPDATE OR DELETE ON aksh.connector_events
  FOR EACH ROW EXECUTE FUNCTION aksh.reject_mutation();
ALTER TABLE aksh.connector_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS connector_events_org ON aksh.connector_events;
CREATE POLICY connector_events_org ON aksh.connector_events FOR SELECT TO aksh_tenant
  USING (organisation_id = ANY (aksh.ctx_org_ids()));
GRANT SELECT ON aksh.connector_events TO aksh_tenant;
