/**
 * Read-only inventory of a database: schemas, table row counts and account domains. Use it before launch to prove
 * production holds no test data, and to see what a simulation branch contains.
 *
 *   npx tsx --env-file=.env.local scripts/db-inventory.ts
 */
import pg from "pg";

import { getDeploymentEnvironment } from "../lib/env/deployment";

/** Domains that only ever hold test, demo or automation accounts. */
export const TEST_ACCOUNT_DOMAINS = ["akshhealth.test", "e2e.akshhealth.com", "demo.akshhealth.com", "aksh-synthetic.example", "aksh-simulation.example", "example.com", "mailinator.com"];

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required.");
  const pool = new pg.Pool({ connectionString: url, max: 2 });
  try {
    console.log(`Environment: ${getDeploymentEnvironment()}`);
    const tables = await pool.query<{ schema: string; name: string }>(
      `SELECT table_schema AS schema, table_name AS name FROM information_schema.tables
       WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema')
       ORDER BY 1, 2`
    );
    const bySchema = new Map<string, string[]>();
    for (const t of tables.rows) bySchema.set(t.schema, [...(bySchema.get(t.schema) ?? []), t.name]);
    for (const [schema, names] of bySchema) {
      const counts: string[] = [];
      for (const name of names) {
        // Identifiers come from information_schema, quoted; no user input reaches this query.
        const { rows } = await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM "${schema}"."${name}"`);
        if (rows[0]?.n !== "0") counts.push(`${name}=${rows[0]?.n}`);
      }
      console.log(`${schema} (${names.length} tables) ${counts.join(" ")}`);
    }
    const hasUsers = tables.rows.some((t) => t.schema === "aksh" && t.name === "users");
    if (hasUsers) {
      const { rows } = await pool.query<{ domain: string; n: string }>(
        `SELECT split_part(email, '@', 2) AS domain, count(*)::text AS n FROM aksh.users GROUP BY 1 ORDER BY count(*) DESC`
      );
      const test = rows.filter((r) => TEST_ACCOUNT_DOMAINS.includes(r.domain));
      const other = rows.filter((r) => !TEST_ACCOUNT_DOMAINS.includes(r.domain));
      console.log(`Test/demo accounts: ${test.map((r) => `${r.domain}=${r.n}`).join(" ") || "none"}`);
      console.log(`Other accounts: ${other.reduce((n, r) => n + Number(r.n), 0)} across ${other.length} domain(s)`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
