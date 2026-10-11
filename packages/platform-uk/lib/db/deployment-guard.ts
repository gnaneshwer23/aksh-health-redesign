/**
 * Refuse to write test or seed data into a production database. Reads aksh.deployment_marker, which lives in the
 * database itself (set once with scripts/db-mark-deployment.ts), so a missing or misspelled env variable cannot defeat it.
 * Use together with assertSeedingAllowed (the env check).
 */
import type { Pool, PoolClient } from "pg";

export async function assertNotProductionDatabase(db: Pool | PoolClient, purpose: string) {
  let deployment: string | undefined;
  try {
    deployment = (await db.query<{ deployment: string }>(`SELECT deployment FROM aksh.deployment_marker WHERE singleton`)).rows[0]?.deployment;
  } catch {
    deployment = undefined;
  }
  // Only an explicit simulation marker allows test or seed writes: missing, unreadable or production all refuse.
  if (deployment !== "simulation") {
    throw new Error(`${purpose} refuses to run: this database is ${deployment ? `marked ${deployment}` : "not marked"}. Mark a simulation database with scripts/db-mark-deployment.ts simulation.`);
  }
}
