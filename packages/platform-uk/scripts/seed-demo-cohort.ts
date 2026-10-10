/**
 * Seed 100 synthetic demo patients (app mock + Neo4j) and 100 users/profiles (Neon).
 *
 * Usage:
 *   npm run seed:demo-cohort                  # write artifacts + dry-run Neon
 *   npm run seed:demo-cohort -- --apply       # upsert Neon users + learning events
 *   npm run seed:demo-cohort -- --apply --with-neo4j
 *   npm run seed:demo-cohort -- --reset --apply   # delete @demo.akshhealth.com cohort then re-seed
 *
 * Honesty: synthetic only · liveEmis:false · never real NHS passwords as secrets.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { hash } from "bcryptjs";
import pg from "pg";

import { resolveBoundPatientIdForSession } from "../lib/auth/demo-patient-binding";
import {
  DEMO_COHORT_EMAIL_DOMAIN,
  DEMO_COHORT_PATIENT_TARGET,
  DEMO_COHORT_USER_TARGET,
  assertDemoCohortGeneratorInvariants,
  generateDemoCohortLearningSeeds,
  generateDemoCohortUsers,
  generateExtendedDemoPatients,
  summarizeDemoCohortUsers,
} from "../lib/mock-data/demo-cohort-generator";
import { patients } from "../lib/mock-data/patients";
import {
  LEARNING_GOVERNANCE_NOTE,
  buildLearningEvent,
  buildLinkedOutcomeEvent,
  type LearningEvent,
} from "../lib/clinical-proof/learning-loop";
import { USERS_PROFILES_SQL, EMAIL_VERIFICATION_SQL, LEARNING_EVENTS_SQL } from "../lib/db/schema-sql";
import { assertSeedingAllowed } from "../lib/env/deployment";

const { Pool } = pg;
const root = process.cwd();
const seedDir = path.join(root, "data", "seed");

function buildDemoPreferences(user: {
  email: string;
  role: string;
  credentialsHint: string | null;
}) {
  const boundPatientId = resolveBoundPatientIdForSession({
    role: user.role,
    email: user.email,
  });
  return {
    syntheticOnly: true,
    liveEmis: false,
    demoCohort: true,
    credentialsHint: user.credentialsHint,
    ...(boundPatientId ? { boundPatientId } : {}),
  };
}

function parseArgs(argv: string[]) {
  return {
    apply: argv.includes("--apply"),
    reset: argv.includes("--reset"),
    withNeo4j: argv.includes("--with-neo4j"),
    skipArtifacts: argv.includes("--skip-artifacts"),
  };
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is required for --apply. Set it in .env.local (npm run seed:demo-cohort uses --env-file=.env.local)."
    );
  }
  return url;
}

function resolvePassword() {
  const password = process.env.DEMO_COHORT_PASSWORD?.trim();
  if (!password || password.length < 16) {
    throw new Error("Set DEMO_COHORT_PASSWORD (16+ characters). It is never stored in the repository.");
  }
  return password;
}

async function writeArtifacts() {
  await mkdir(seedDir, { recursive: true });
  const extended = generateExtendedDemoPatients();
  const users = generateDemoCohortUsers();
  const learning = generateDemoCohortLearningSeeds(20);

  const patientsPath = path.join(seedDir, "demo-cohort-patients.json");
  const usersPath = path.join(seedDir, "demo-cohort-users.json");
  const learningPath = path.join(seedDir, "demo-cohort-learning-events.json");

  await writeFile(
    patientsPath,
    JSON.stringify(
      {
        syntheticOnly: true,
        liveEmis: false,
        note: "Extended cohort P027–P100. Core P001–P026 remain in lib/mock-data/patients.ts.",
        count: extended.length,
        patients: extended,
      },
      null,
      2
    ),
    "utf8"
  );

  await writeFile(
    usersPath,
    JSON.stringify(
      {
        syntheticOnly: true,
        liveEmis: false,
        emailDomain: DEMO_COHORT_EMAIL_DOMAIN,
        passwordEnv: "DEMO_COHORT_PASSWORD",
        count: users.length,
        byRole: summarizeDemoCohortUsers(users).byRole,
        users: users.map(({ id, email, role, fullName, practiceOds, credentialsHint }) => ({
          id,
          email,
          role,
          fullName,
          practiceOds,
          credentialsHint,
        })),
      },
      null,
      2
    ),
    "utf8"
  );

  await writeFile(
    learningPath,
    JSON.stringify(
      {
        syntheticOnly: true,
        liveEmis: false,
        autoRetrain: false,
        count: learning.length,
        seeds: learning,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`Wrote artifacts:`);
  console.log(`  ${patientsPath} (${extended.length} patients)`);
  console.log(`  ${usersPath} (${users.length} users)`);
  console.log(`  ${learningPath} (${learning.length} learning seed pairs)`);
}

async function ensureAuthSchema(pool: pg.Pool) {
  await pool.query(USERS_PROFILES_SQL);
  await pool.query(EMAIL_VERIFICATION_SQL);
  await pool.query(LEARNING_EVENTS_SQL);
}

async function resetDemoCohortUsers(pool: pg.Pool) {
  const result = await pool.query(
    `DELETE FROM aksh.users
     WHERE email ILIKE $1
     RETURNING email`,
    [`%@${DEMO_COHORT_EMAIL_DOMAIN}`]
  );
  console.log(`Reset: deleted ${result.rowCount ?? 0} @${DEMO_COHORT_EMAIL_DOMAIN} user(s).`);
}

async function upsertUsers(pool: pg.Pool, password: string) {
  const users = generateDemoCohortUsers();
  const passwordHash = await hash(password, 10);
  let inserted = 0;
  let updated = 0;

  for (const user of users) {
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM aksh.users WHERE email = $1 LIMIT 1`,
      [user.email]
    );

    if (existing.rows[0]) {
      const userId = existing.rows[0].id;
      await pool.query(
        `UPDATE aksh.users
         SET password_hash = $2, email_verified_at = COALESCE(email_verified_at, NOW())
         WHERE id = $1`,
        [userId, passwordHash]
      );
      await pool.query(
        `INSERT INTO aksh.profiles (user_id, role, full_name, onboarding_complete, practice_ods, preferences)
         VALUES ($1, $2, $3, TRUE, $4, $5::jsonb)
         ON CONFLICT (user_id) DO UPDATE SET
           role = EXCLUDED.role,
           full_name = EXCLUDED.full_name,
           onboarding_complete = TRUE,
           practice_ods = EXCLUDED.practice_ods,
           preferences = EXCLUDED.preferences,
           updated_at = NOW()`,
        [
          userId,
          user.role,
          user.fullName,
          user.practiceOds,
          JSON.stringify(buildDemoPreferences(user)),
        ]
      );
      updated += 1;
    } else {
      await pool.query(
        `INSERT INTO aksh.users (id, email, password_hash, email_verified_at)
         VALUES ($1, $2, $3, NOW())`,
        [user.id, user.email, passwordHash]
      );
      await pool.query(
        `INSERT INTO aksh.profiles (user_id, role, full_name, onboarding_complete, practice_ods, preferences)
         VALUES ($1, $2, $3, TRUE, $4, $5::jsonb)`,
        [
          user.id,
          user.role,
          user.fullName,
          user.practiceOds,
          JSON.stringify(buildDemoPreferences(user)),
        ]
      );
      inserted += 1;
    }
  }

  console.log(`Neon users: inserted ${inserted}, updated ${updated} (total ${users.length}).`);
}

function buildLearningEventsFromSeeds(): LearningEvent[] {
  const seeds = generateDemoCohortLearningSeeds(20);
  const events: LearningEvent[] = [];

  for (const seed of seeds) {
    const base = buildLearningEvent(
      {
        patientId: seed.patientId,
        practiceId: seed.practiceId,
        agentLabel: seed.agentLabel,
        predictionId: seed.predictionId,
        predictionSummary: seed.predictionSummary,
        decision: seed.decision,
        decisionActor: seed.decisionActor,
        outcomeKind: seed.outcomeKind,
        outcomeSummary: seed.outcomeSummary,
        modelVersion: "demo-cohort-seed-v1",
      },
      () => seed.id
    );
    // Freeze recordedAt for idempotent re-seeds
    (base as { recordedAt: string }).recordedAt = `2026-07-20T10:${String(
      (events.length % 50) + 10
    ).padStart(2, "0")}:00.000Z`;

    const linked = buildLinkedOutcomeEvent(
      base,
      {
        outcomeKind: seed.linkOutcomeKind,
        outcomeSummary: seed.linkOutcomeSummary,
        decisionActor: seed.decisionActor,
        decisionNotes: "Synthetic eventual outcome · autoRetrain:false · liveEmis:false",
      },
      () => seed.linkOutcomeId
    );
    (linked as { recordedAt: string }).recordedAt = `2026-07-21T11:${String(
      (events.length % 50) + 10
    ).padStart(2, "0")}:00.000Z`;

    if (base.governanceNote !== LEARNING_GOVERNANCE_NOTE) {
      throw new Error("Unexpected governance note on learning seed");
    }

    events.push(base, linked);
  }

  return events;
}

async function seedLearningFileStore(events: LearningEvent[]) {
  const file = path.join(root, "data", "learning-events.json");
  let existing: LearningEvent[] = [];
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { events?: LearningEvent[] };
    existing = Array.isArray(parsed.events) ? parsed.events : [];
  } catch {
    existing = [];
  }

  const demoIds = new Set(events.map((e) => e.id));
  const retained = existing.filter((e) => !demoIds.has(e.id) && !e.id.startsWith("learn-demo-cohort-"));
  const merged = [...retained, ...events];
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify({ events: merged }, null, 2), "utf8");
  console.log(`File learning store: wrote ${events.length} demo-cohort events (${merged.length} total).`);
}

async function seedLearningPostgres(pool: pg.Pool, events: LearningEvent[]) {
  await pool.query(`DELETE FROM aksh.learning_events WHERE id LIKE 'learn-demo-cohort-%'`);

  for (const event of events) {
    await pool.query(
      `INSERT INTO aksh.learning_events (
        id, recorded_at, practice_id, case_id, queue_item_id, patient_id,
        agent_label, prediction_id, prediction_summary, model_version,
        decision, decision_actor, decision_notes, outcome_kind, outcome_summary,
        outcome_metric, auto_retrain_triggered, model_updated, ehr_write,
        hitl_required, governance_note, payload
      ) VALUES (
        $1, $2::timestamptz, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16::jsonb, FALSE, FALSE, FALSE,
        TRUE, $17, $18::jsonb
      )`,
      [
        event.id,
        event.recordedAt,
        event.practiceId,
        event.caseId,
        event.queueItemId,
        event.patientId,
        event.agentLabel,
        event.predictionId,
        event.predictionSummary ?? null,
        event.modelVersion,
        event.decision,
        event.decisionActor,
        event.decisionNotes ?? null,
        event.outcomeKind,
        event.outcomeSummary ?? null,
        event.outcomeMetric ? JSON.stringify(event.outcomeMetric) : null,
        event.governanceNote,
        JSON.stringify({
          autoRetrainTriggered: false,
          modelUpdated: false,
          ehrWrite: false,
          liveEmis: false,
          linksToEventId: event.linksToEventId ?? null,
          demoCohort: true,
        }),
      ]
    );
  }

  console.log(`Neon learning_events: upserted ${events.length} demo-cohort row(s).`);
}

function runNeo4jSeed(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      ["tsx", "--env-file=.env.local", "scripts/seed-neo4j.ts"],
      { cwd: root, stdio: "inherit", shell: process.platform === "win32" }
    );
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Neo4j seed exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

async function run() {
  assertSeedingAllowed("seed-demo-cohort");
  const args = parseArgs(process.argv.slice(2));
  const invariants = assertDemoCohortGeneratorInvariants();

  console.log("Demo cohort generator OK:");
  console.log(`  Patients in app mock: ${patients.length} (target ${DEMO_COHORT_PATIENT_TARGET})`);
  console.log(`  Users: ${invariants.users} · roles: ${JSON.stringify(invariants.byRole)}`);
  console.log(`  liveEmis: false · syntheticOnly: true`);

  if (patients.length !== DEMO_COHORT_PATIENT_TARGET) {
    throw new Error(
      `patients.ts export length ${patients.length} !== ${DEMO_COHORT_PATIENT_TARGET}`
    );
  }

  if (!args.skipArtifacts) {
    await writeArtifacts();
  }

  const learningEvents = buildLearningEventsFromSeeds();
  // Always refresh file store so local outcomes demos work without Neon.
  await seedLearningFileStore(learningEvents);

  if (!args.apply) {
    console.log("\nDry run only — Neon not modified.");
    console.log("Re-run with --apply to upsert users + learning events into Neon.");
    console.log(`Sample login: gp01@${DEMO_COHORT_EMAIL_DOMAIN} / (see DEMO_LAUNCH_CREDENTIALS.md)`);
    if (args.withNeo4j) {
      console.log("Note: --with-neo4j ignored without --apply (run npm run data:seed:neo4j separately).");
    }
    return;
  }

  const password = resolvePassword();
  const pool = new Pool({ connectionString: getDatabaseUrl(), max: 3 });

  try {
    await ensureAuthSchema(pool);
    if (args.reset) {
      await resetDemoCohortUsers(pool);
    }
    await upsertUsers(pool, password);
    await seedLearningPostgres(pool, learningEvents);

    const count = await pool.query<{ count: string; roles: string }>(
      `SELECT COUNT(*)::text AS count,
              string_agg(DISTINCT p.role, ', ' ORDER BY p.role) AS roles
       FROM aksh.users u
       JOIN aksh.profiles p ON p.user_id = u.id
       WHERE u.email ILIKE $1`,
      [`%@${DEMO_COHORT_EMAIL_DOMAIN}`]
    );
    console.log(
      `Verify: ${count.rows[0]?.count ?? 0} cohort users · roles: ${count.rows[0]?.roles ?? "none"}`
    );
  } finally {
    await pool.end();
  }

  if (args.withNeo4j) {
    console.log("\nSeeding Neo4j from patients mock (P001–P100)…");
    await runNeo4jSeed();
  }

  console.log("\nDone. Sample: gp01@demo.akshhealth.com · nurse01@demo.akshhealth.com");
  console.log("Reset users: npm run seed:demo-cohort -- --reset --apply");
  console.log("Or: npm run auth:cleanup-demo -- --apply");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
