-- Private research investigations. Product DB only; no patient or clinical tables.
CREATE SCHEMA IF NOT EXISTS aksh;
CREATE TABLE IF NOT EXISTS aksh.hsi_investigations (
 owner_id text NOT NULL, investigation_key text NOT NULL,
 revision integer NOT NULL CHECK (revision>0),
 state text NOT NULL CHECK (state IN ('pending','running','failed','awaiting_human_review','partial','completed')),
 data_class text NOT NULL CHECK (data_class IN ('synthetic','public_real','licensed_real')),
 question text NOT NULL CHECK (length(question) BETWEEN 1 AND 4000),
 snapshot jsonb NOT NULL CHECK (octet_length(snapshot::text)<=4000000),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(owner_id,investigation_key),
 CHECK (snapshot @> '{"version":"hsi-investigation-1","bundle":{"containsPhi":false,"clinicalAdvice":false,"kgWrite":false}}'::jsonb),
 CHECK (snapshot ? 'revision' AND snapshot->>'revision'=revision::text)
);
CREATE INDEX IF NOT EXISTS hsi_investigations_owner_page ON aksh.hsi_investigations(owner_id,created_at DESC,investigation_key DESC);
CREATE TABLE IF NOT EXISTS aksh.hsi_investigation_audit (
 owner_id text NOT NULL, investigation_key text NOT NULL, revision integer NOT NULL,
 actor_id text NOT NULL, operation text NOT NULL, run_state text NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(owner_id,investigation_key,revision),
 FOREIGN KEY(owner_id,investigation_key) REFERENCES aksh.hsi_investigations(owner_id,investigation_key)
);
CREATE TABLE IF NOT EXISTS aksh.hsi_investigation_limits (
 owner_id text PRIMARY KEY, bucket timestamptz NOT NULL, requests integer NOT NULL CHECK(requests BETWEEN 1 AND 60)
);
-- Provisioned by an operator, never by onboarding or a client-supplied role.
CREATE TABLE IF NOT EXISTS aksh.hsi_research_members (
 owner_id text PRIMARY KEY, role text NOT NULL CHECK(role IN ('researcher','reviewer','admin')),
 provisioned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE aksh.hsi_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.hsi_investigations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hsi_private_owner ON aksh.hsi_investigations;
CREATE POLICY hsi_private_owner ON aksh.hsi_investigations
 USING(owner_id=current_setting('app.hsi_research_owner',true))
 WITH CHECK(owner_id=current_setting('app.hsi_research_owner',true));
ALTER TABLE aksh.hsi_investigation_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.hsi_investigation_audit FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hsi_private_owner ON aksh.hsi_investigation_audit;
CREATE POLICY hsi_private_owner ON aksh.hsi_investigation_audit
 USING(owner_id=current_setting('app.hsi_research_owner',true))
 WITH CHECK(owner_id=current_setting('app.hsi_research_owner',true));
ALTER TABLE aksh.hsi_investigation_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.hsi_investigation_limits FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hsi_private_owner ON aksh.hsi_investigation_limits;
CREATE POLICY hsi_private_owner ON aksh.hsi_investigation_limits
 USING(owner_id=current_setting('app.hsi_research_owner',true))
 WITH CHECK(owner_id=current_setting('app.hsi_research_owner',true));
ALTER TABLE aksh.hsi_research_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE aksh.hsi_research_members FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hsi_private_owner ON aksh.hsi_research_members;
CREATE POLICY hsi_private_owner ON aksh.hsi_research_members
 USING(owner_id=current_setting('app.hsi_research_owner',true))
 WITH CHECK(owner_id=current_setting('app.hsi_research_owner',true));
-- aksh_tenant is the pre-existing restricted role from migration 009.
GRANT SELECT,INSERT,UPDATE ON aksh.hsi_investigations,aksh.hsi_investigation_limits TO aksh_tenant;
GRANT SELECT,INSERT ON aksh.hsi_investigation_audit TO aksh_tenant;
GRANT SELECT ON aksh.hsi_research_members TO aksh_tenant;
