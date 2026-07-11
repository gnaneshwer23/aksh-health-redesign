import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required to ensure auth schema.");
  }
  return url;
}

async function ensureSchema(pool) {
  const migrationPath = path.join(process.cwd(), "db/migrations/002_users_profiles.sql");
  const migrationSql = await readFile(migrationPath, "utf8");
  await pool.query(migrationSql);
}

async function run() {
  const pool = new Pool({ connectionString: getDatabaseUrl(), max: 3 });

  try {
    await ensureSchema(pool);
    console.log("Auth schema ready (aksh.users, aksh.profiles).");
    console.log("Demo account seeding was removed — users must sign up via /signup.");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
