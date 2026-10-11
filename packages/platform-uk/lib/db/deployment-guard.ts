/**
 * Refuse to write test or seed data into a production database. Reads aksh.deployment_marker, which lives in the
 * database itself (set once with scripts/db-mark-deployment.ts), so a missing or misspelled env variable cannot defeat it.
 * Use together with assertSeedingAllowed (the env check).
 */
import type { Pool, PoolClient } from "pg";

export async function assertNotProductionDatabase(db: Pool | PoolClient, purpose: string) {
  const r = await db.query<{ deployment: string }>(
    `SELECT deployment FROM aksh.deployment_marker WHERE singleton`
  ).catch(() => ({ rows: [] as { deployment: string }[] }));
  if (r.rows[0]?.deployment === "production") {
    throw new Error(`${purpose} refuses to run: this database is marked production. Use the simulation database.`);
  }
}
