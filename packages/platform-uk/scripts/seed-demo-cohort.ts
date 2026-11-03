/**
 * Seed stakeholder-scale synthetic demo cohort (patients · users · relational glue).
 *
 * Usage:
 *   npm run seed:demo-cohort                  # write artifacts + file stores (dry Neon)
 *   npm run seed:demo-cohort -- --apply       # upsert Neon users + learning + optional PG glue
 *   npm run seed:demo-cohort -- --apply --with-neo4j
 *   npm run seed:demo-cohort -- --reset --apply   # purge @demo.akshhealth.com then re-seed
 *
 * Honesty: syntheticDemo:true · removable:true · liveEmis:false · ehrWrite:false
 * Password: DEMO_SEED_PASSWORD or DEMO_COHORT_PASSWORD (local default only when unset).
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { hash } from "bcryptjs";
import pg from "pg";

import { resolveBoundPatientIdForSession } from "../lib/auth/demo-patient-binding";
import {
  DEMO_COHORT_EMAIL_DOMAIN,
  DEMO_COHORT_ID,
  DEMO_COHORT_META,
  DEMO_COHORT_PASSWORD_ENV,
  DEMO_COHORT_PATIENT_TARGET,
  DEMO_COHORT_USER_TARGET,
  DEMO_SEED_PASSWORD_ENV,
  DEMO_SEED_PASSWORD_LOCAL_DEFAULT,
  assertDemoCohortGeneratorInvariants,
  generateDemoCohortCareEpisodes,
  generateDemoCohortHitlDrafts,
  generateDemoCohortLearningSeeds,
  generateDemoCohortReviewQueueItems,
  generateDemoCohortUsers,
  generateExtendedDemoPatients,
  summarizeDemoCohortUsers,
  type DemoCohortUserSpec,
} from "../lib/mock-data/demo-cohort-generator";
import { buildDemoTerminologyArtifact } from "../lib/mock-data/demo-terminology";
import { patients } from "../lib/mock-data/patients";
import {
  LEARNING_GOVERNANCE_NOTE,
  buildLearningEvent,
  buildLinkedOutcomeEvent,
  type LearningEvent,
} from "../lib/clinical-proof/learning-loop";
import { USERS_PROFILES_SQL, EMAIL_VERIFICATION_SQL, LEARNING_EVENTS_SQL } from "../lib/db/schema-sql";
import { assertSeedingAllowed } from "../lib/env/deployment";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";

const { Pool } = pg;
const root = process.cwd();
const seedDir = path.join(root, "data", "seed");
const dataDir = path.join(root, "data");

function buildDemoPreferences(user: DemoCohortUserSpec) {
  const boundPatientId = resolveBoundPatientIdForSession({
    role: user.role,
    email: user.email,
  });
  return {
    ...DEMO_COHORT_META,
    syntheticOnly: true,
    demoCohort: true,
    demoCohortId: DEMO_COHORT_ID,
    credentialsHint: user.credentialsHint,
    ...(user.subRole ? { subRole: user.subRole } : {}),
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
  const fromSeed = process.env[DEMO_SEED_PASSWORD_ENV]?.trim();
  const fromLegacy = process.env[DEMO_COHORT_PASSWORD_ENV]?.trim();
  const password = fromSeed || fromLegacy || DEMO_SEED_PASSWORD_LOCAL_DEFAULT;
  if (!fromSeed && !fromLegacy) {
    console.warn(
      `[seed-demo-cohort] Using local synthetic default password (${DEMO_SEED_PASSWORD_ENV} / ${DEMO_COHORT_PASSWORD_ENV} unset). Documented in docs/DEMO_COHORT_SEED.md — never for production.`
    );
  }
  if (password.length < 12) {
    throw new Error(`Demo seed password must be 12+ characters (${DEMO_SEED_PASSWORD_ENV}).`);
  }
  return password;
}

async function writeArtifacts() {
  await mkdir(seedDir, { recursive: true });
  const extended = generateExtendedDemoPatients();
  const users = generateDemoCohortUsers();
  const learning = generateDemoCohortLearningSeeds(40);
  const episodes = generateDemoCohortCareEpisodes();
  const hitl = generateDemoCohortHitlDrafts();
  const queueExtras = generateDemoCohortReviewQueueItems();

  const patientsPath = path.join(seedDir, "demo-cohort-patients.json");
  const usersPath = path.join(seedDir, "demo-cohort-users.json");
  const learningPath = path.join(seedDir, "demo-cohort-learning-events.json");
  const relationalPath = path.join(seedDir, "demo-cohort-relational.json");

  await writeFile(
    patientsPath,
    JSON.stringify(
      {
        ...DEMO_COHORT_META,
        note: `Extended cohort P027–P200. Core P001–P026 remain in lib/mock-data/patients.ts.`,
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
        ...DEMO_COHORT_META,
        emailDomain: DEMO_COHORT_EMAIL_DOMAIN,
        passwordEnv: [DEMO_SEED_PASSWORD_ENV, DEMO_COHORT_PASSWORD_ENV],
        count: users.length,
        byRole: summarizeDemoCohortUsers(users).byRole,
        bySubRole: summarizeDemoCohortUsers(users).bySubRole,
        byEmailPrefix: summarizeDemoCohortUsers(users).byEmailPrefix,
        users: users.map(
          ({ id, email, role, subRole, fullName, practiceOds, credentialsHint }) => ({
            id,
            email,
            role,
            subRole,
            fullName,
            practiceOds,
            credentialsHint,
          })
        ),
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
        ...DEMO_COHORT_META,
        autoRetrain: false,
        count: learning.length,
        seeds: learning,
      },
      null,
      2
    ),
    "utf8"
  );

  await writeFile(
    relationalPath,
    JSON.stringify(
      {
        ...DEMO_COHORT_META,
        careEpisodeCount: episodes.length,
        hitlDraftCount: hitl.length,
        reviewQueueExtraCount: queueExtras.length,
        terminologyNote:
          "Patients carry codedConditions (SNOMED) + codedMedications (ATC); HITL drafts carry codedItems (LOINC/ATC). Curated subset only — see demo-terminology-curated.json.",
        episodes,
        hitlDrafts: hitl,
        reviewQueueItemIds: queueExtras.map((q) => q.id),
      },
      null,
      2
    ),
    "utf8"
  );

  const terminologyPath = path.join(seedDir, "demo-terminology-curated.json");
  await writeFile(
    terminologyPath,
    JSON.stringify(
      {
        ...DEMO_COHORT_META,
        ...buildDemoTerminologyArtifact(),
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
  console.log(
    `  ${relationalPath} (${episodes.length} episodes · ${hitl.length} HITL · ${queueExtras.length} queue)`
  );
  console.log(`  ${terminologyPath} (curated SNOMED/LOINC/ATC subset)`);
}

async function seedRelationalFileStores() {
  const episodes = generateDemoCohortCareEpisodes();
  const hitl = generateDemoCohortHitlDrafts();
  await mkdir(dataDir, { recursive: true });

  // Care episodes — retain non-demo rows
  const cePath = path.join(dataDir, "care-episodes.json");
  let ceStore: { episodes: unknown[]; events: unknown[] } = { episodes: [], events: [] };
  try {
    const raw = await readFile(cePath, "utf8");
    const parsed = JSON.parse(raw) as { episodes?: unknown[]; events?: unknown[] };
    ceStore = {
      episodes: Array.isArray(parsed.episodes) ? parsed.episodes : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    /* fresh */
  }
  const retainedEpisodes = (ceStore.episodes as { id?: string }[]).filter(
    (e) => !String(e.id ?? "").startsWith("ce-demo-cohort-")
  );
  const retainedEvents = (ceStore.events as { episode_id?: string; episodeId?: string }[]).filter(
    (e) => {
      const eid = e.episodeId ?? e.episode_id ?? "";
      return !String(eid).startsWith("ce-demo-cohort-");
    }
  );
  const episodeRows = episodes.map((ep) => ({
    id: ep.id,
    publicId: ep.publicId,
    scopeKey: ep.scopeKey,
    organisationId: ep.organisationId,
    practiceId: ep.practiceId,
    patientId: ep.patientId,
    patientLabel: ep.patientLabel,
    status: ep.status,
    pathway: ep.pathway,
    links: [],
    tasks: [],
    createdAt: "2026-07-20T09:00:00.000Z",
    updatedAt: "2026-07-20T09:00:00.000Z",
    createdBy: ep.createdBy,
    version: 1,
    synthetic: true,
    ehrWrite: false,
    idempotencyKey: ep.idempotencyKey,
    metadata: ep.metadata,
  }));
  await writeFile(
    cePath,
    JSON.stringify({ episodes: [...retainedEpisodes, ...episodeRows], events: retainedEvents }, null, 2),
    "utf8"
  );
  console.log(`File care-episodes: wrote ${episodeRows.length} demo episodes (${retainedEpisodes.length} retained).`);

  // Lab/pharmacy HITL — retain non-demo drafts
  const lphPath = path.join(dataDir, "lab-pharmacy-hitl.json");
  let existingDrafts: { id?: string }[] = [];
  try {
    const raw = await readFile(lphPath, "utf8");
    const parsed = JSON.parse(raw) as { drafts?: { id?: string }[] };
    existingDrafts = Array.isArray(parsed.drafts) ? parsed.drafts : [];
  } catch {
    existingDrafts = [];
  }
  const retainedDrafts = existingDrafts.filter(
    (d) =>
      !String(d.id ?? "").startsWith("lph-lab-demo-cohort-") &&
      !String(d.id ?? "").startsWith("lph-pharmacy-demo-cohort-")
  );
  const hitlRows = hitl.map(({ demoCohortId: _d, removable: _r, syntheticDemo: _s, ...draft }) => draft);
  await writeFile(
    lphPath,
    JSON.stringify({ kind: "lab_pharmacy_hitl_v1", drafts: [...retainedDrafts, ...hitlRows] }, null, 2),
    "utf8"
  );
  console.log(`File lab-pharmacy-hitl: wrote ${hitlRows.length} demo drafts (${retainedDrafts.length} retained).`);
}

async function ensureAuthSchema(pool: pg.Pool) {
  await pool.query(USERS_PROFILES_SQL);
  await pool.query(EMAIL_VERIFICATION_SQL);
  await pool.query(LEARNING_EVENTS_SQL);
}

async function resetDemoCohortUsers(pool: pg.Pool) {
  const marker = await pool
    .query(`SELECT deployment FROM aksh.deployment_marker WHERE singleton`)
    .catch(() => ({ rows: [] as { deployment: string }[] }));
  if (marker.rows[0]?.deployment !== "simulation") {
    throw new Error("seed-demo-cohort --reset refuses: database is not marked simulation.");
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL aksh.purge_test_data = 'on'");
    const result = await client.query(
      `DELETE FROM aksh.users
       WHERE email ILIKE $1
       RETURNING email`,
      [`%@${DEMO_COHORT_EMAIL_DOMAIN}`]
    );
    await client.query("COMMIT");
    console.log(`Reset: deleted ${result.rowCount ?? 0} @${DEMO_COHORT_EMAIL_DOMAIN} user(s).`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
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
  const seeds = generateDemoCohortLearningSeeds(40);
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
        modelVersion: "demo-cohort-seed-v2",
      },
      () => seed.id
    );
    (base as { recordedAt: string }).recordedAt = `2026-07-20T10:${String(
      (events.length % 50) + 10
    ).padStart(2, "0")}:00.000Z`;

    const linked = buildLinkedOutcomeEvent(
      base,
      {
        outcomeKind: seed.linkOutcomeKind,
        outcomeSummary: seed.linkOutcomeSummary,
        decisionActor: seed.decisionActor,
        decisionNotes: `Synthetic eventual outcome · autoRetrain:false · liveEmis:false · ${DEMO_COHORT_ID}`,
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
          demoCohortId: DEMO_COHORT_ID,
          syntheticDemo: true,
          removable: true,
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
  console.log(`  cohortId: ${DEMO_COHORT_ID}`);
  console.log(`  Patients in app mock: ${patients.length} (target ${DEMO_COHORT_PATIENT_TARGET})`);
  console.log(
    `  Users: ${invariants.users} / ${DEMO_COHORT_USER_TARGET} · prefixes: ${JSON.stringify(invariants.byEmailPrefix)}`
  );
  console.log(
    `  Glue: ${invariants.careEpisodes} episodes · ${invariants.hitlDrafts} HITL · ${invariants.reviewQueueExtras} queue`
  );
  console.log(`  liveEmis: false · ehrWrite: false · syntheticDemo: true · removable: true`);

  if (patients.length !== DEMO_COHORT_PATIENT_TARGET) {
    throw new Error(
      `patients.ts export length ${patients.length} !== ${DEMO_COHORT_PATIENT_TARGET}`
    );
  }

  if (!args.skipArtifacts) {
    await writeArtifacts();
  }

  await seedRelationalFileStores();

  const learningEvents = buildLearningEventsFromSeeds();
  await seedLearningFileStore(learningEvents);

  if (!args.apply) {
    console.log("\nDry run only — Neon not modified.");
    console.log("Re-run with --apply to upsert users + learning events into Neon.");
    console.log(`Sample login: gp01@${DEMO_COHORT_EMAIL_DOMAIN} / (see DEMO_LAUNCH_CREDENTIALS.md)`);
    console.log(`Lab operator: lab01@${DEMO_COHORT_EMAIL_DOMAIN} → /dashboard/admin/lab-queue`);
    console.log(`Front desk: frontdesk01@${DEMO_COHORT_EMAIL_DOMAIN} → /dashboard/front-desk`);
    if (args.withNeo4j) {
      console.log("Note: --with-neo4j ignored without --apply (run npm run data:seed:neo4j separately).");
    }
    return;
  }

  const password = resolvePassword();
  const pool = new Pool({ connectionString: getDatabaseUrl(), max: 3 });
  await assertNotProductionDatabase(pool, "seed-demo-cohort");

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
    console.log(`\nSeeding Neo4j from patients mock (P001–P${DEMO_COHORT_PATIENT_TARGET})…`);
    await runNeo4jSeed();
  }

  console.log("\nDone. Samples:");
  console.log(`  gp01@${DEMO_COHORT_EMAIL_DOMAIN} · nurse01@ · pharmacist01@ · lab01@ · frontdesk01@ · admin01@`);
  console.log("Purge: npm run purge:demo-cohort -- --apply");
  console.log("Reset+reseed: npm run seed:demo-cohort -- --reset --apply");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
