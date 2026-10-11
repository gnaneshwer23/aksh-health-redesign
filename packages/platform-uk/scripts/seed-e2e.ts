/**
 * Seed Aksh E2E synthetic healthcare ecosystem.
 *
 * Usage:
 *   E2E_TEST_MODE=true npm run seed:e2e
 *   E2E_TEST_MODE=true npm run seed:e2e -- --apply
 *   E2E_TEST_MODE=true npm run seed:e2e -- --apply --seed=20260812
 *   E2E_TEST_MODE=true npm run seed:e2e -- --reset --apply --batch=e2e-20260812-20260812
 *
 * Honesty: synthetic only · @e2e.akshhealth.com · never touches @demo.akshhealth.com
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { hash } from "bcryptjs";
import pg from "pg";

import {
  assertE2EGeneratorInvariants,
  generateE2EDataset,
} from "../lib/e2e/generator";
import { resolveE2EPassword } from "../lib/e2e/env";
import { E2E_EMAIL_DOMAIN, E2E_SOURCE } from "../lib/e2e/types";
import { assertE2EDatasetValid } from "../lib/e2e/validation";
import {
  E2E_BATCHES_SQL,
  EMAIL_VERIFICATION_SQL,
  PATIENT_STATE_FACTS_SQL,
  USERS_PROFILES_SQL,
} from "../lib/db/schema-sql";
import { assertSeedingAllowed } from "../lib/env/deployment";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";

const { Pool } = pg;
const root = process.cwd();

function parseArgs(argv: string[]) {
  const seedArg = argv.find((a) => a.startsWith("--seed="));
  const batchArg = argv.find((a) => a.startsWith("--batch="));
  return {
    apply: argv.includes("--apply"),
    reset: argv.includes("--reset"),
    skipArtifacts: argv.includes("--skip-artifacts"),
    seed: seedArg ? Number(seedArg.split("=")[1]) : undefined,
    batchId: batchArg ? batchArg.split("=")[1] : undefined,
  };
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required for --apply (.env.local).");
  }
  return url;
}

async function writeArtifacts(dataset: ReturnType<typeof generateE2EDataset>) {
  const dir = path.join(root, "data", "e2e", dataset.manifest.batchId);
  await mkdir(dir, { recursive: true });

  const files = {
    manifest: dataset.manifest,
    organisations: dataset.organisations,
    users: dataset.users,
    patients: dataset.patients,
    patientStateFacts: dataset.patientStateFacts,
    labEvents: dataset.labEvents,
    pharmacyEvents: dataset.pharmacyEvents,
  };

  for (const [name, payload] of Object.entries(files)) {
    const filePath = path.join(dir, `${name}.json`);
    await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
    console.log(`  ${filePath}`);
  }

  // Latest pointer for report/dashboard
  await writeFile(
    path.join(root, "data", "e2e", "latest-batch.json"),
    JSON.stringify({ batchId: dataset.manifest.batchId, generatedAt: dataset.manifest.generatedAt }, null, 2),
    "utf8"
  );
}

async function ensureSchema(pool: pg.Pool) {
  await pool.query(USERS_PROFILES_SQL);
  await pool.query(EMAIL_VERIFICATION_SQL);
  await pool.query(PATIENT_STATE_FACTS_SQL);
  await pool.query(E2E_BATCHES_SQL);
}

async function resetBatch(pool: pg.Pool, batchId: string) {
  await pool.query(
    `DELETE FROM aksh.patient_state_facts WHERE source_system = $1 AND source_reference LIKE $2`,
    [E2E_SOURCE, `${batchId}:%`]
  );
  await pool.query(
    `DELETE FROM aksh.users WHERE email ILIKE $1 AND id LIKE 'usr_e2e_%'`,
    [`%@${E2E_EMAIL_DOMAIN}`]
  );
  await pool.query(`DELETE FROM aksh.e2e_batches WHERE batch_id = $1`, [batchId]);
  console.log(`Reset batch ${batchId}: removed E2E users + patient_state_facts + batch row.`);
}

async function upsertBatch(pool: pg.Pool, dataset: ReturnType<typeof generateE2EDataset>) {
  const { manifest } = dataset;
  await pool.query(
    `INSERT INTO aksh.e2e_batches (
      batch_id, seed, generated_at, source, patient_count, user_count,
      scenario_distribution, metadata
    ) VALUES ($1, $2, $3::timestamptz, $4, $5, $6, $7::jsonb, $8::jsonb)
    ON CONFLICT (batch_id) DO UPDATE SET
      patient_count = EXCLUDED.patient_count,
      user_count = EXCLUDED.user_count,
      scenario_distribution = EXCLUDED.scenario_distribution,
      metadata = EXCLUDED.metadata,
      cleaned_up_at = NULL`,
    [
      manifest.batchId,
      manifest.seed,
      manifest.generatedAt,
      manifest.source,
      manifest.patientCount,
      manifest.userCount,
      JSON.stringify(manifest.scenarioDistribution),
      JSON.stringify({
        organisationCount: manifest.organisationCount,
        labCount: manifest.labCount,
        pharmacyCount: manifest.pharmacyCount,
        patientStateFactCount: manifest.patientStateFactCount,
        liveEmis: false,
        isSynthetic: true,
      }),
    ]
  );
}

async function upsertUsers(pool: pg.Pool, dataset: ReturnType<typeof generateE2EDataset>, password: string) {
  const passwordHash = await hash(password, 10);
  let inserted = 0;
  let updated = 0;

  for (const user of dataset.users) {
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM aksh.users WHERE email = $1 LIMIT 1`,
      [user.email]
    );

    const preferences = {
      syntheticOnly: true,
      liveEmis: false,
      e2eBatch: dataset.manifest.batchId,
      subRole: user.subRole,
      specialty: user.specialty,
      providerId: user.providerId,
      credentialsHint: user.credentialsHint,
      source: E2E_SOURCE,
    };

    if (existing.rows[0]) {
      const userId = existing.rows[0].id;
      await pool.query(
        `UPDATE aksh.users SET password_hash = $2, email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = $1`,
        [userId, passwordHash]
      );
      await pool.query(
        `INSERT INTO aksh.profiles (user_id, role, full_name, onboarding_complete, practice_ods, preferences)
         VALUES ($1, $2, $3, TRUE, $4, $5::jsonb)
         ON CONFLICT (user_id) DO UPDATE SET
           role = EXCLUDED.role, full_name = EXCLUDED.full_name, onboarding_complete = TRUE,
           practice_ods = EXCLUDED.practice_ods, preferences = EXCLUDED.preferences, updated_at = NOW()`,
        [userId, user.role, user.fullName, user.practiceOds, JSON.stringify(preferences)]
      );
      updated += 1;
    } else {
      await pool.query(
        `INSERT INTO aksh.users (id, email, password_hash, email_verified_at) VALUES ($1, $2, $3, NOW())`,
        [user.id, user.email, passwordHash]
      );
      await pool.query(
        `INSERT INTO aksh.profiles (user_id, role, full_name, onboarding_complete, practice_ods, preferences)
         VALUES ($1, $2, $3, TRUE, $4, $5::jsonb)`,
        [user.id, user.role, user.fullName, user.practiceOds, JSON.stringify(preferences)]
      );
      inserted += 1;
    }
  }

  console.log(`Neon E2E users: inserted ${inserted}, updated ${updated} (total ${dataset.users.length}).`);
}

async function upsertPatientStateFacts(pool: pg.Pool, dataset: ReturnType<typeof generateE2EDataset>) {
  await pool.query(
    `DELETE FROM aksh.patient_state_facts WHERE source_system = $1 AND source_reference LIKE $2`,
    [E2E_SOURCE, `${dataset.manifest.batchId}:%`]
  );

  let count = 0;
  for (const fact of dataset.patientStateFacts) {
    await pool.query(
      `INSERT INTO aksh.patient_state_facts (
        id, patient_id, fact_type, value, source_system, source_reference,
        confidence, effective_at, recorded_at
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::timestamptz, $9::timestamptz)
      ON CONFLICT (id) DO NOTHING`,
      [
        fact.id,
        fact.patientId,
        fact.factType,
        JSON.stringify(fact.value),
        fact.sourceSystem,
        fact.sourceReference,
        fact.confidence,
        fact.effectiveAt,
        fact.recordedAt,
      ]
    );
    count += 1;
  }
  console.log(`Neon patient_state_facts: upserted ${count} E2E fact(s) for batch ${dataset.manifest.batchId}.`);
}

async function run() {
  assertSeedingAllowed("seed-e2e");
  if (process.env.E2E_TEST_MODE !== "true" && process.env.SYNTHETIC_DATA !== "true") {
    console.warn("Tip: set E2E_TEST_MODE=true or SYNTHETIC_DATA=true when seeding E2E data.");
  }

  const args = parseArgs(process.argv.slice(2));
  const dataset = generateE2EDataset({
    seed: args.seed,
    batchId: args.batchId,
  });

  const invariants = assertE2EGeneratorInvariants(dataset);
  assertE2EDatasetValid(dataset);

  console.log("E2E generator OK:");
  console.log(`  batchId: ${invariants.batchId}`);
  console.log(`  patients: ${invariants.patients} · users: ${invariants.users}`);
  console.log(`  doctors: ${invariants.doctors} · nurses: ${invariants.nurses}`);
  console.log(`  cohorts: ${JSON.stringify(invariants.scenarioDistribution)}`);
  console.log(`  liveEmis: false · source: ${E2E_SOURCE}`);

  if (!args.skipArtifacts) {
    console.log("Wrote artifacts:");
    await writeArtifacts(dataset);
  }

  if (!args.apply) {
    console.log("\nDry run — Neon not modified.");
    console.log("Re-run with --apply to upsert batch, users, and patient_state_facts.");
    console.log(`Sample login: gp01@${E2E_EMAIL_DOMAIN}`);
    return;
  }

  const pool = new Pool({ connectionString: getDatabaseUrl(), max: 3 });

  await assertNotProductionDatabase(pool, "seed-e2e"); // the database itself must say simulation
  const password = resolveE2EPassword();

  try {
    await ensureSchema(pool);
    if (args.reset) {
      await resetBatch(pool, dataset.manifest.batchId);
    }
    await upsertBatch(pool, dataset);
    await upsertUsers(pool, dataset, password);
    await upsertPatientStateFacts(pool, dataset);

    const verify = await pool.query<{ users: string; facts: string }>(
      `SELECT
        (SELECT COUNT(*)::text FROM aksh.users WHERE email ILIKE $1) AS users,
        (SELECT COUNT(*)::text FROM aksh.patient_state_facts WHERE source_system = $2 AND source_reference LIKE $3) AS facts`,
      [`%@${E2E_EMAIL_DOMAIN}`, E2E_SOURCE, `${dataset.manifest.batchId}:%`]
    );
    console.log(
      `Verify: ${verify.rows[0]?.users ?? 0} @${E2E_EMAIL_DOMAIN} users · ${verify.rows[0]?.facts ?? 0} facts`
    );
  } finally {
    await pool.end();
  }

  console.log("\nDone.");
  console.log(`Cleanup: npm run cleanup:e2e -- --batch=${dataset.manifest.batchId} --apply`);
  console.log(`Report:  npm run report:e2e`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
