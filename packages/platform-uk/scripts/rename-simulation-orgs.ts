/** One-off: apply neutral place names to simulation organisations created before names were neutralised. */
import pg from "pg";

import { assertSeedingAllowed } from "../lib/env/deployment";
import { neutralOrgName } from "./simulation-names";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";

async function main() {
  assertSeedingAllowed("rename-simulation-orgs");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await assertNotProductionDatabase(pool, "rename-simulation-orgs"); // the database itself must say simulation
  const { rows } = await pool.query<{ id: string; name: string }>(
    `SELECT o.id, o.name FROM aksh.organisations o JOIN aksh.users u ON u.id = o.created_by WHERE u.email LIKE $1`,
    ["%@aksh-simulation.example"]
  );
  let n = 0;
  for (const r of rows) {
    const next = neutralOrgName(r.name);
    if (next !== r.name) {
      await pool.query(`UPDATE aksh.organisations SET name = $2 WHERE id = $1`, [r.id, next]);
      n += 1;
    }
  }
  console.log(`renamed ${n} of ${rows.length}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
