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
  const migrations = ["002_users_profiles.sql", "005_password_reset.sql", "006_email_verification.sql"];

  for (const file of migrations) {
    const migrationPath = path.join(process.cwd(), "db/migrations", file);
    const migrationSql = await readFile(migrationPath, "utf8");
    await pool.query(migrationSql);
  }
}

async function run() {
  const pool = new Pool({ connectionString: getDatabaseUrl(), max: 3 });

  try {
    await ensureSchema(pool);
    console.log(
      "Auth schema ready (aksh.users, aksh.profiles, aksh.password_reset_tokens, aksh.email_verification_tokens)."
    );
    console.log("Demo account seeding was removed — users must sign up via /signup.");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
