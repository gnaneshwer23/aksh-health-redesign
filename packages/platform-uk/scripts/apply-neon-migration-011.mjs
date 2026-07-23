/**
 * Apply Neon migration 011 (fhir_staging_bundles) for D1 BRIDGE staging.
 * Idempotent: CREATE IF NOT EXISTS.
 *
 * Usage:
 *   npm run db:migrate:d1
 *   node --env-file=.env.local scripts/apply-neon-migration-011.mjs
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const MIGRATIONS = ["011_fhir_staging_bundles.sql"];

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required before applying 011.");
  }
  return url;
}

function redactUrl(url) {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
}

async function run() {
  const url = getDatabaseUrl();
  console.log(`Target: ${redactUrl(url)}`);
  const pool = new Pool({ connectionString: url, max: 2 });
  try {
    for (const file of MIGRATIONS) {
      const migrationPath = path.join(process.cwd(), "db/migrations", file);
      const sql = await readFile(migrationPath, "utf8");
      process.stdout.write(`Applying ${file}... `);
      await pool.query(sql);
      console.log("ok");
    }
    const regs = await pool.query(
      `SELECT to_regclass('aksh.fhir_staging_bundles')::text AS fhir_staging`
    );
    if (!regs.rows[0]?.fhir_staging) {
      throw new Error("aksh.fhir_staging_bundles missing after migrate");
    }
    console.log("Verify: aksh.fhir_staging_bundles present");
    console.log("Honesty: BRIDGE staging only · liveEmis:false · Medplum not required.");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
