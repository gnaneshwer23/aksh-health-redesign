/**
 * Apply Neon migration 014 (e2e_batches) for platform E2E validation.
 *
 * Usage:
 *   npm run db:migrate:e2e
 *   node --env-file=.env.local scripts/apply-neon-migration-014.mjs
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const MIGRATIONS = ["014_e2e_batches.sql"];

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required before applying 014.");
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
    const regs = await pool.query(`SELECT to_regclass('aksh.e2e_batches')::text AS e2e_batches`);
    if (!regs.rows[0]?.e2e_batches) {
      throw new Error("aksh.e2e_batches missing after migrate");
    }
    console.log("Verify: aksh.e2e_batches present");
    console.log("Honesty: E2E synthetic batches only · liveEmis:false");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
