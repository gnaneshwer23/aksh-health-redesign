/**
 * Recent errors grouped by fingerprint (read-only). Point it at the environment you are checking:
 *
 *   npm run errors:recent                      # simulation (.env.local)
 *   npm run errors:recent:production           # production (.env.production.local)
 *   ... -- --hours 72
 */
import pg from "pg";

import { getDeploymentEnvironment } from "../lib/env/deployment";

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required.");
  const i = process.argv.indexOf("--hours");
  const hours = Math.min(Math.max(Number(i > -1 ? process.argv[i + 1] : 24) || 24, 1), 24 * 90);
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  try {
    const r = await pool.query(
      `SELECT fingerprint, source, max(name) AS name, max(message) AS message, max(route) AS route, count(*)::int AS n,
              min(occurred_at) AS first, max(occurred_at) AS last, count(DISTINCT user_id)::int AS users, max(release) AS release
       FROM aksh.error_events WHERE occurred_at > now() - make_interval(hours => $1)
       GROUP BY fingerprint, source ORDER BY max(occurred_at) DESC LIMIT 50`,
      [hours]
    );
    console.log(`Environment: ${getDeploymentEnvironment()} · last ${hours}h · ${r.rowCount} distinct errors`);
    for (const e of r.rows) {
      console.log(`\n${e.fingerprint}  ${e.source}  ×${e.n}  users:${e.users}  ${e.route ?? ""}  release:${e.release ?? "-"}`);
      console.log(`  ${e.name}: ${e.message}`);
      console.log(`  first ${new Date(e.first).toISOString()}  last ${new Date(e.last).toISOString()}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
