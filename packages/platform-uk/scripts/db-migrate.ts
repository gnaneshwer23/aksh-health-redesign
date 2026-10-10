/**
 * Apply db/migrations/*.sql in order and record each in aksh.schema_migrations (version, checksum, applied_at).
 *
 *   npx tsx --env-file=.env.local scripts/db-migrate.ts            # status: applied / pending / changed
 *   npx tsx --env-file=.env.local scripts/db-migrate.ts --apply    # apply pending migrations
 *
 * Migrations are idempotent (IF NOT EXISTS), so a database created by the older one-off scripts is adopted safely:
 * its migrations are re-run once and then recorded. A recorded migration whose file has since changed is reported
 * and blocks --apply; fix forward with a new migration instead of editing an applied one.
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import pg from "pg";

import { getDeploymentEnvironment } from "../lib/env/deployment";

const DIR = path.join(process.cwd(), "db/migrations");

function redact(url: string) {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@").replace(/\?.*$/, "");
}

async function main() {
  const apply = process.argv.includes("--apply");
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required.");
  console.log(`Environment: ${getDeploymentEnvironment()} · target: ${redact(url)}`);

  const files = (await readdir(DIR)).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
  const migrations = await Promise.all(
    files.map(async (file) => {
      const sql = await readFile(path.join(DIR, file), "utf8");
      return { version: file.replace(/\.sql$/, ""), sql, checksum: createHash("sha256").update(sql).digest("hex") };
    })
  );

  const pool = new pg.Pool({ connectionString: url, max: 2 });
  try {
    // Status mode stays read-only: the tracking table is only created when applying.
    if (apply) {
      await pool.query(`CREATE SCHEMA IF NOT EXISTS aksh`);
      await pool.query(
        `CREATE TABLE IF NOT EXISTS aksh.schema_migrations (
           version TEXT PRIMARY KEY,
           checksum TEXT NOT NULL,
           applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
         )`
      );
    }
    const exists = await pool.query<{ t: string | null }>(`SELECT to_regclass('aksh.schema_migrations')::text AS t`);
    const { rows } = exists.rows[0]?.t
      ? await pool.query<{ version: string; checksum: string }>(`SELECT version, checksum FROM aksh.schema_migrations`)
      : { rows: [] as { version: string; checksum: string }[] };
    const applied = new Map(rows.map((r) => [r.version, r.checksum]));

    const changed = migrations.filter((m) => applied.has(m.version) && applied.get(m.version) !== m.checksum);
    const pending = migrations.filter((m) => !applied.has(m.version));
    for (const m of migrations) {
      const state = !applied.has(m.version) ? "pending" : applied.get(m.version) === m.checksum ? "applied" : "CHANGED";
      console.log(`  ${state.padEnd(8)} ${m.version}`);
    }
    if (changed.length) {
      throw new Error(`Applied migrations changed on disk: ${changed.map((m) => m.version).join(", ")}. Add a new migration instead.`);
    }
    if (!apply) {
      console.log(pending.length ? `${pending.length} pending. Re-run with --apply.` : "Up to date.");
      return;
    }
    for (const m of pending) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(m.sql);
        await client.query(`INSERT INTO aksh.schema_migrations (version, checksum) VALUES ($1, $2)`, [m.version, m.checksum]);
        await client.query("COMMIT");
        console.log(`  applied  ${m.version}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`${m.version} failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        client.release();
      }
    }
    console.log(pending.length ? `Applied ${pending.length} migration(s).` : "Up to date.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
