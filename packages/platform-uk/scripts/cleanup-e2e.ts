/**
 * Remove an E2E synthetic batch (batch-scoped cleanup).
 *
 * Usage:
 *   npm run cleanup:e2e -- --batch=e2e-20260812-20260812
 *   npm run cleanup:e2e -- --batch=e2e-20260812-20260812 --apply
 *   npm run cleanup:e2e -- --all --apply   # all active E2E batches
 *
 * Never deletes @demo.akshhealth.com cohort.
 */

import { rm, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

import { E2E_EMAIL_DOMAIN, E2E_SOURCE } from "../lib/e2e/types";
import { assertSeedingAllowed } from "../lib/env/deployment";

const DEMO_COHORT_EMAIL_DOMAIN = "demo.akshhealth.com"; // safety reference — never deleted

const { Pool } = pg;
const root = process.cwd();

function parseArgs(argv: string[]) {
  const batchArg = argv.find((a) => a.startsWith("--batch="));
  return {
    apply: argv.includes("--apply"),
    all: argv.includes("--all"),
    batchId: batchArg ? batchArg.split("=")[1] : undefined,
  };
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required for --apply.");
  return url;
}

async function resolveBatchId(args: ReturnType<typeof parseArgs>): Promise<string[]> {
  if (args.all) {
    const pool = new Pool({ connectionString: getDatabaseUrl(), max: 2 });
    try {
      const result = await pool.query<{ batch_id: string }>(
        `SELECT batch_id FROM aksh.e2e_batches WHERE cleaned_up_at IS NULL ORDER BY generated_at DESC`
      );
      return result.rows.map((r) => r.batch_id);
    } finally {
      await pool.end();
    }
  }

  if (args.batchId) return [args.batchId];

  try {
    const latest = JSON.parse(
      await readFile(path.join(root, "data", "e2e", "latest-batch.json"), "utf8")
    ) as { batchId?: string };
    if (latest.batchId) return [latest.batchId];
  } catch {
    // fall through
  }

  throw new Error("Provide --batch=<id>, --all, or seed first (latest-batch.json missing).");
}

async function cleanupBatch(pool: pg.Pool, batchId: string) {
  assertSeedingAllowed("cleanup-e2e"); // before any delete: never in production
  const facts = await pool.query(
    `DELETE FROM aksh.patient_state_facts WHERE source_system = $1 AND source_reference LIKE $2`,
    [E2E_SOURCE, `${batchId}:%`]
  );
  // Test accounts may carry append-only history (registration checks, go-live events); the purge flag lets the
  // cascade remove it, in this transaction only.
  const client = await pool.connect();
  let users: pg.QueryResult;
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL aksh.purge_test_data = 'on'");
    users = await client.query(
      `DELETE FROM aksh.users
       WHERE email ILIKE $1
         AND (preferences->>'e2eBatch' = $2 OR id LIKE 'usr_e2e_%')`,
      [`%@${E2E_EMAIL_DOMAIN}`, batchId]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
  await pool.query(
    `UPDATE aksh.e2e_batches SET cleaned_up_at = NOW() WHERE batch_id = $1`,
    [batchId]
  );

  const artifactDir = path.join(root, "data", "e2e", batchId);
  try {
    await rm(artifactDir, { recursive: true, force: true });
  } catch {
    // artifact dir may not exist
  }

  console.log(
    `Cleaned batch ${batchId}: ${facts.rowCount ?? 0} facts, ${users.rowCount ?? 0} users (marked cleaned_up_at).`
  );
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const batchIds = await resolveBatchId(args);

  console.log(`E2E cleanup plan: ${batchIds.join(", ")}`);
  console.log(`Safety: will NOT touch @${DEMO_COHORT_EMAIL_DOMAIN}`);

  if (!args.apply) {
    console.log("\nDry run — re-run with --apply to execute.");
    return;
  }

  const pool = new Pool({ connectionString: getDatabaseUrl(), max: 3 });
  try {
    for (const batchId of batchIds) {
      await cleanupBatch(pool, batchId);
    }
  } finally {
    await pool.end();
  }

  console.log("\nDone.");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
