import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

const dataDir = path.join(process.cwd(), "data");
const seedFile = path.join(dataDir, "seed", "review-cases.seed.json");
const migrationFile = path.join(process.cwd(), "db", "migrations", "001_review_cases.sql");
const scopeKey = process.env.AKSH_DATA_SCOPE ?? "shared";
const practiceId = process.env.AKSH_PRACTICE_ID ?? "practice-demo";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required. Set Neon pooled connection string for project floral-salad-21467299.");
  }
  return url;
}

async function ensureSchema(pool) {
  const migrationSql = await readFile(migrationFile, "utf8");
  await pool.query(migrationSql);
}

async function run() {
  const seedRaw = await readFile(seedFile, "utf8");
  const seedCases = JSON.parse(seedRaw);
  const pool = new Pool({ connectionString: getDatabaseUrl(), max: 3 });
  // Refuse unless the database itself is marked simulation (see scripts/db-mark-deployment.ts).
  const marker = await pool.query("SELECT deployment FROM aksh.deployment_marker WHERE singleton").catch(() => ({ rows: [] }));
  if (marker.rows[0]?.deployment !== "simulation") {
    await pool.end();
    throw new Error("data-seed-postgres refuses to run: this database is not marked simulation.");
  }

  try {
    await ensureSchema(pool);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.practice_id', $1, true)", [practiceId]);
      await client.query(`DELETE FROM aksh.review_cases WHERE scope_key = $1 AND practice_id = $2`, [scopeKey, practiceId]);

      for (const reviewCase of seedCases) {
        const payload = { ...reviewCase, practiceId };
        await client.query(
          `INSERT INTO aksh.review_cases (id, scope_key, practice_id, user_id, payload, updated_at)
           VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`,
          [reviewCase.id, scopeKey, practiceId, reviewCase.userId || "demo", JSON.stringify(payload)]
        );
      }

      await client.query("COMMIT");

      const countResult = await client.query(
        `SELECT COUNT(*)::int AS count FROM aksh.review_cases WHERE scope_key = $1 AND practice_id = $2`,
        [scopeKey, practiceId]
      );
      const patelResult = await client.query(
        `SELECT id FROM aksh.review_cases WHERE id = 'case-patel-demo' AND scope_key = $1 AND practice_id = $2`,
        [scopeKey, practiceId]
      );

      console.log(`Seeded ${seedCases.length} review case(s) to aksh.review_cases (scope="${scopeKey}", practice="${practiceId}")`);
      console.log(`Row count in aksh.review_cases: ${countResult.rows[0]?.count ?? 0}`);
      console.log(`Patel case present: ${patelResult.rowCount ? "yes" : "no"}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
