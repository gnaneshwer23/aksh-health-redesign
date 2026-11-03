/**
 * Purge removable synthetic demo cohort without destroying non-demo data.
 *
 * Usage:
 *   npm run purge:demo-cohort              # dry run (file + Neon counts)
 *   npm run purge:demo-cohort -- --apply   # delete tagged rows
 *   npm run purge:demo-cohort -- --files-only --apply
 *
 * Matches: @demo.akshhealth.com users, learn-demo-cohort-*, ce-demo-cohort-*,
 * lph-*-demo-cohort-*, preferences.demoCohortId / DEMO_COHORT_ID.
 *
 * Does NOT flip productionRbacEnforced or touch live EHR connectors.
 * Refuses Neon deletes unless deployment_marker = simulation.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

import {
  DEMO_COHORT_EMAIL_DOMAIN,
  DEMO_COHORT_ID,
  isDemoCohortTagged,
  purgeDemoCohortTaggedRows,
} from "../lib/mock-data/demo-cohort-generator";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";

const { Pool } = pg;
const root = process.cwd();
const dataDir = path.join(root, "data");

function parseArgs(argv: string[]) {
  return {
    apply: argv.includes("--apply"),
    filesOnly: argv.includes("--files-only"),
  };
}

async function applyFilePurges(apply: boolean) {
  await mkdir(dataDir, { recursive: true });
  const summary: Record<string, { before: number; purged: number; after: number }> = {};

  // Learning events
  {
    const file = path.join(dataDir, "learning-events.json");
    let events: { id: string }[] = [];
    try {
      const parsed = JSON.parse(await readFile(file, "utf8")) as { events?: { id: string }[] };
      events = Array.isArray(parsed.events) ? parsed.events : [];
    } catch {
      events = [];
    }
    const { retained, purged } = purgeDemoCohortTaggedRows(events);
    summary.learningEvents = { before: events.length, purged: purged.length, after: retained.length };
    if (apply) {
      await writeFile(file, JSON.stringify({ events: retained }, null, 2), "utf8");
    }
  }

  // Care episodes
  {
    const file = path.join(dataDir, "care-episodes.json");
    let episodes: { id: string }[] = [];
    let events: { episodeId?: string; episode_id?: string }[] = [];
    try {
      const parsed = JSON.parse(await readFile(file, "utf8")) as {
        episodes?: { id: string }[];
        events?: { episodeId?: string; episode_id?: string }[];
      };
      episodes = Array.isArray(parsed.episodes) ? parsed.episodes : [];
      events = Array.isArray(parsed.events) ? parsed.events : [];
    } catch {
      /* empty */
    }
    const { retained, purged } = purgeDemoCohortTaggedRows(episodes);
    const purgedIds = new Set(purged.map((e) => e.id));
    const retainedEvents = events.filter((e) => {
      const eid = e.episodeId ?? e.episode_id ?? "";
      return !purgedIds.has(eid) && !isDemoCohortTagged({ id: eid });
    });
    summary.careEpisodes = {
      before: episodes.length,
      purged: purged.length,
      after: retained.length,
    };
    if (apply) {
      await writeFile(
        file,
        JSON.stringify({ episodes: retained, events: retainedEvents }, null, 2),
        "utf8"
      );
    }
  }

  // Lab/pharmacy HITL
  {
    const file = path.join(dataDir, "lab-pharmacy-hitl.json");
    let drafts: { id: string }[] = [];
    let kind = "lab_pharmacy_hitl_v1";
    try {
      const parsed = JSON.parse(await readFile(file, "utf8")) as {
        drafts?: { id: string }[];
        kind?: string;
      };
      drafts = Array.isArray(parsed.drafts) ? parsed.drafts : [];
      kind = parsed.kind ?? kind;
    } catch {
      /* empty */
    }
    const { retained, purged } = purgeDemoCohortTaggedRows(drafts);
    summary.labPharmacyHitl = {
      before: drafts.length,
      purged: purged.length,
      after: retained.length,
    };
    if (apply) {
      await writeFile(file, JSON.stringify({ kind, drafts: retained }, null, 2), "utf8");
    }
  }

  return summary;
}

async function purgeNeon(apply: boolean) {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.log("DATABASE_URL unset — skipping Neon purge.");
    return null;
  }

  const pool = new Pool({ connectionString: url, max: 3 });
  try {
    await assertNotProductionDatabase(pool, "purge-demo-cohort");
    const marker = await pool
      .query(`SELECT deployment FROM aksh.deployment_marker WHERE singleton`)
      .catch(() => ({ rows: [] as { deployment: string }[] }));
    if (marker.rows[0]?.deployment !== "simulation") {
      throw new Error("purge-demo-cohort refuses Neon deletes: database is not marked simulation.");
    }

    const users = await pool.query<{ id: string; email: string }>(
      `SELECT id, email FROM aksh.users WHERE email ILIKE $1 ORDER BY email`,
      [`%@${DEMO_COHORT_EMAIL_DOMAIN}`]
    );
    const learning = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM aksh.learning_events WHERE id LIKE 'learn-demo-cohort-%'`
    );

    console.log(`Neon: ${users.rowCount ?? 0} @${DEMO_COHORT_EMAIL_DOMAIN} user(s)`);
    console.log(`Neon: ${learning.rows[0]?.count ?? 0} learn-demo-cohort-* event(s)`);

    if (!apply) {
      return {
        users: users.rowCount ?? 0,
        learningEvents: Number(learning.rows[0]?.count ?? 0),
        deleted: false,
      };
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL aksh.purge_test_data = 'on'");
      const delLearn = await client.query(
        `DELETE FROM aksh.learning_events WHERE id LIKE 'learn-demo-cohort-%'`
      );
      await client
        .query(
          `DELETE FROM aksh.care_episodes WHERE id LIKE 'ce-demo-cohort-%' OR metadata->>'demoCohortId' = $1`,
          [DEMO_COHORT_ID]
        )
        .catch(() => ({ rowCount: 0 }));
      await client
        .query(`DELETE FROM aksh.lab_pharmacy_hitl_drafts WHERE id LIKE 'lph-%-demo-cohort-%'`)
        .catch(() => ({ rowCount: 0 }));
      const delUsers = await client.query(`DELETE FROM aksh.users WHERE id = ANY($1::text[])`, [
        users.rows.map((r) => r.id),
      ]);
      await client.query("COMMIT");
      console.log(
        `Neon deleted: ${delUsers.rowCount ?? 0} users · ${delLearn.rowCount ?? 0} learning events (+ tagged episodes/HITL if tables exist).`
      );
      return {
        users: delUsers.rowCount ?? 0,
        learningEvents: delLearn.rowCount ?? 0,
        deleted: true,
      };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Purge demo cohort · id=${DEMO_COHORT_ID} · domain=@${DEMO_COHORT_EMAIL_DOMAIN}`);
  console.log(`Mode: ${args.apply ? "APPLY" : "dry-run"}${args.filesOnly ? " · files-only" : ""}`);

  const files = await applyFilePurges(args.apply);
  for (const [k, v] of Object.entries(files)) {
    console.log(`  file ${k}: before=${v.before} purged=${v.purged} after=${v.after}`);
  }

  if (!args.filesOnly) {
    await purgeNeon(args.apply);
  }

  if (!args.apply) {
    console.log("\nDry run only — nothing deleted.");
    console.log("Re-run with --apply to purge tagged demo cohort rows.");
    console.log("Recreate: npm run seed:demo-cohort [-- --apply]");
  } else {
    console.log("\nPurge complete. Non-demo data retained.");
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
