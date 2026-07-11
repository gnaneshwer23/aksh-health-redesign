import pg from "pg";

const { Pool } = pg;

const FIXED_DEMO_EMAILS = [
  "doctor@akshhealth.com",
  "reviewer@akshhealth.com",
  "smoke@akshhealth.com",
];

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is required. Set it in .env.local or pass --env-file=.env.local via npm script."
    );
  }
  return url;
}

function parseArgs(argv) {
  return {
    apply: argv.includes("--apply"),
  };
}

async function findDemoUsers(pool) {
  const result = await pool.query(
    `SELECT id, email, created_at
     FROM aksh.users
     WHERE email ILIKE '%@demo.akshhealth.com'
        OR email = ANY($1::text[])
     ORDER BY email`,
    [FIXED_DEMO_EMAILS]
  );
  return result.rows;
}

async function deleteDemoUsers(pool, userIds) {
  if (userIds.length === 0) return 0;

  const result = await pool.query(`DELETE FROM aksh.users WHERE id = ANY($1::text[])`, [userIds]);
  return result.rowCount ?? 0;
}

async function run() {
  const { apply } = parseArgs(process.argv.slice(2));
  const pool = new Pool({ connectionString: getDatabaseUrl(), max: 3 });

  try {
    const matches = await findDemoUsers(pool);

    if (matches.length === 0) {
      console.log("No demo users matched cleanup criteria.");
      return;
    }

    console.log(`Found ${matches.length} demo user(s):`);
    for (const row of matches) {
      console.log(`  - ${row.email} (${row.id})`);
    }

    if (!apply) {
      console.log("\nDry run only — no rows deleted.");
      console.log("Re-run with --apply to delete these users (profiles cascade automatically).");
      return;
    }

    const deleted = await deleteDemoUsers(
      pool,
      matches.map((row) => row.id)
    );
    console.log(`\nDeleted ${deleted} user(s) from aksh.users.`);
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
