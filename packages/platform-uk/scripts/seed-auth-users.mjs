import { hashSync } from "bcryptjs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

const demoPassword = process.env.AKSH_DEMO_PASSWORD ?? "demo123";
const demoPasswordHash = hashSync(demoPassword, 10);

const demoUsers = [
  {
    id: "user-001",
    email: "doctor@akshhealth.com",
    role: "gp",
    fullName: "Dr. Clinical User",
    onboardingComplete: true,
  },
  {
    id: "user-002",
    email: "reviewer@akshhealth.com",
    role: "practice-manager",
    fullName: "Dr. Reviewer",
    onboardingComplete: true,
  },
  {
    id: "user-003",
    email: "smoke@akshhealth.com",
    role: "gp",
    fullName: "Smoke Loop Reviewer",
    onboardingComplete: true,
  },
];

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required to seed auth users.");
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

    for (const user of demoUsers) {
      await pool.query(
        `INSERT INTO aksh.users (id, email, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [user.id, user.email, demoPasswordHash]
      );

      await pool.query(
        `INSERT INTO aksh.profiles (user_id, role, full_name, onboarding_complete)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE
           SET role = EXCLUDED.role,
               full_name = EXCLUDED.full_name,
               onboarding_complete = EXCLUDED.onboarding_complete,
               updated_at = NOW()`,
        [user.id, user.role, user.fullName, user.onboardingComplete]
      );
    }

    console.log(`Seeded ${demoUsers.length} auth user(s) with demo password "${demoPassword}".`);
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
