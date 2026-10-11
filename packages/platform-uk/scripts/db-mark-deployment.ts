/**
 * Stamp a database with what it is (aksh.deployment_marker: production | simulation), stored in the database itself so
 * it cannot be lost with an env file. Test and seed tooling refuses to write when it reads "production".
 *
 *   npx tsx --env-file=.env.local scripts/db-mark-deployment.ts simulation
 *   npx tsx --env-file=.env.production.local scripts/db-mark-deployment.ts production
 */
import pg from "pg";

async function main() {
  const value = process.argv[2];
  if (value !== "simulation" && value !== "production") throw new Error("Pass simulation or production.");
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required.");
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  try {
    const current = (await pool.query<{ deployment: string }>("SELECT deployment FROM aksh.deployment_marker WHERE singleton")).rows[0]?.deployment;
    // Downgrading production would let test tooling write to it: refuse unless explicitly forced.
    if (current === "production" && value !== "production" && !process.argv.includes("--force")) {
      throw new Error("This database is marked production. Re-marking it needs --force (and a very good reason).");
    }
    await pool.query(
      `INSERT INTO aksh.deployment_marker (singleton, deployment) VALUES (TRUE, $1)
       ON CONFLICT (singleton) DO UPDATE SET deployment = EXCLUDED.deployment, marked_at = NOW()`,
      [value]
    );
    console.log(`marked: ${(await pool.query("SELECT deployment FROM aksh.deployment_marker")).rows[0].deployment}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
