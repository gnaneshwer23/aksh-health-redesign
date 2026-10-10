/**
 * Rotate the shared password for the @demo.akshhealth.com demo cohort.
 *
 *   DEMO_COHORT_PASSWORD=... npx tsx --env-file=.env.local scripts/rotate-demo-password.ts           # dry run
 *   DEMO_COHORT_PASSWORD=... npx tsx --env-file=.env.local scripts/rotate-demo-password.ts --apply   # write
 *
 * Only accounts on the demo domain are touched. The password comes from the environment and is never logged.
 */
import { hash } from "bcryptjs";
import pg from "pg";

const DEMO_DOMAIN = "demo.akshhealth.com";

async function main() {
  const apply = process.argv.includes("--apply");
  const password = process.env.DEMO_COHORT_PASSWORD?.trim();
  if (!password || password.length < 16) throw new Error("Set DEMO_COHORT_PASSWORD (16+ characters).");
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required.");

  const pool = new pg.Pool({ connectionString: url, max: 2 });
  try {
    const { rows } = await pool.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM aksh.users WHERE email LIKE $1`,
      [`%@${DEMO_DOMAIN}`]
    );
    console.log(`Demo accounts on ${DEMO_DOMAIN}: ${rows[0]?.n ?? 0}`);
    if (!apply) {
      console.log("Dry run. Re-run with --apply to rotate.");
      return;
    }
    const passwordHash = await hash(password, 12);
    const res = await pool.query(`UPDATE aksh.users SET password_hash = $2 WHERE email LIKE $1`, [
      `%@${DEMO_DOMAIN}`,
      passwordHash,
    ]);
    console.log(`Rotated password for ${res.rowCount} demo accounts.`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
