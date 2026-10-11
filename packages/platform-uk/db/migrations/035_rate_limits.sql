-- 035: Rate limits shared by every server instance (the in-memory limiter only counted per instance, which on
-- serverless hosting barely limits anything). Keys are stored hashed: they contain network addresses and account ids.
CREATE TABLE IF NOT EXISTS aksh.rate_limits (
  key_hash TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (key_hash, window_start)
);
CREATE INDEX IF NOT EXISTS rate_limits_window ON aksh.rate_limits (window_start);
ALTER TABLE aksh.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aksh.rate_limits FROM aksh_tenant;
