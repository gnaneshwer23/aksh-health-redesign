/**
 * Apply Neon migrations 009 (practices) + 010 (consent_grants).
 * Idempotent: CREATE IF NOT EXISTS / ON CONFLICT DO NOTHING.
 * Does not drop or alter existing SHIELD / users tables.
 *
 * Usage:
 *   npm run db:migrate:p1
 *   # or
 *   node --env-file=.env.local scripts/apply-neon-migrations-009-010.mjs
 *
 * Requires DATABASE_URL. Never invents credentials.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

const MIGRATIONS = ["009_practices.sql", "010_consent_grants.sql"];

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is required. Set it in .env.local (or the environment) before applying 009/010."
    );
  }
  return url;
}

function redactUrl(url) {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
}

async function applyMigrations(pool) {
  for (const file of MIGRATIONS) {
    const migrationPath = path.join(process.cwd(), "db/migrations", file);
    const sql = await readFile(migrationPath, "utf8");
    process.stdout.write(`Applying ${file}... `);
    await pool.query(sql);
    console.log("ok");
  }
}

async function verify(pool) {
  const regs = await pool.query(`
    SELECT to_regclass('aksh.practices')::text AS practices,
           to_regclass('aksh.consent_grants')::text AS consent_grants,
           to_regclass('aksh.users')::text AS users,
           to_regclass('aksh.shield_audit_events')::text AS shield
  `);
  const row = regs.rows[0];
  if (!row.practices || !row.consent_grants) {
    throw new Error(`Tables missing after migrate: ${JSON.stringify(row)}`);
  }
  if (!row.users || !row.shield) {
    throw new Error(`Safety check failed — users/SHIELD missing: ${JSON.stringify(row)}`);
  }

  const practices = await pool.query(
    `SELECT ods_code, practice_name, synthetic FROM aksh.practices ORDER BY ods_code`
  );
  const grantCount = await pool.query(`SELECT COUNT(*)::int AS n FROM aksh.consent_grants`);

  console.log("Verify:");
  console.log(`  aksh.practices: ${practices.rowCount} row(s)`);
  for (const p of practices.rows) {
    console.log(`    ${p.ods_code} · ${p.practice_name} · synthetic=${p.synthetic}`);
  }
  console.log(`  aksh.consent_grants: ${grantCount.rows[0].n} row(s)`);
  console.log(`  aksh.users / shield_audit_events: intact`);
  console.log(
    "Honesty: practices seed is synthetic ODS lookup only — not live EMIS practice sync."
  );
}

async function run() {
  const url = getDatabaseUrl();
  console.log(`Target: ${redactUrl(url)}`);
  const pool = new Pool({ connectionString: url, max: 2 });

  try {
    await applyMigrations(pool);
    await verify(pool);
    console.log("P1 migrations 009 + 010 applied.");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
