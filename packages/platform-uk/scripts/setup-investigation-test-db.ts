/** Disposable test bootstrap. Never uses the deployment DATABASE_URL. */
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
const raw = process.env.HSI_TEST_ADMIN_DB_URL;
if (!raw) throw new Error("HSI_TEST_ADMIN_DB_URL is required");
const target = new URL(raw);
if (!["127.0.0.1", "localhost"].includes(target.hostname) || target.pathname !== "/hsi_step3_test") throw new Error("Refusing non-local test database");
const pool = new Pool({ connectionString: raw, max: 1 });
const query = (text: string) => pool.query(text);
try {
  await query(`DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='hsi_app_test') THEN CREATE ROLE hsi_app_test LOGIN NOINHERIT PASSWORD 'hsi-test-only-password'; END IF; END $$;`);
  await query(`DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='aksh_tenant') THEN CREATE ROLE aksh_tenant NOLOGIN; END IF; END $$; GRANT aksh_tenant TO hsi_app_test;`);
  await query(await readFile(new URL("../db/migrations/056_hsi_investigations.sql", import.meta.url), "utf8"));
  await query(`GRANT USAGE ON SCHEMA aksh TO aksh_tenant,hsi_app_test;
INSERT INTO aksh.hsi_research_members(owner_id,role) VALUES ('usr_hsi_a','reviewer'),('usr_hsi_b','reviewer'),('usr_hsi_r','researcher'),('usr_hsi_browser','reviewer') ON CONFLICT(owner_id) DO UPDATE SET role=EXCLUDED.role;`);
  if (process.argv.includes("--reset")) await query("TRUNCATE aksh.hsi_investigation_audit,aksh.hsi_investigations,aksh.hsi_investigation_limits");
  console.log("Prepared disposable Aksh investigation database");
} finally { await pool.end(); }
