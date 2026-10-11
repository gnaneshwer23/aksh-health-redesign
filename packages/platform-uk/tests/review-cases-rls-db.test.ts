/** review_cases isolation is enforced by the database (migration 023), not only by query filters. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { closePgPool, isPostgresConfigured, withPracticeContext } from "../lib/db/client";

async function run() {
  if (!isPostgresConfigured()) return console.log("review-cases-rls-db: skipped (no DATABASE_URL)");
  const id = `rls-${randomUUID().slice(0, 8)}`;
  const a = `practice-a-${id}`;
  const b = `practice-b-${id}`;
  await withPracticeContext(a, (c) => c.query(`INSERT INTO aksh.review_cases (id, scope_key, practice_id, payload) VALUES ($1, 'rls-test', $2, '{}'::jsonb)`, [id, a]));

  // Even a query with no practice filter sees only the context's practice.
  const own = await withPracticeContext(a, (c) => c.query(`SELECT count(*)::int AS n FROM aksh.review_cases WHERE id = $1`, [id]));
  assert.equal(own.rows[0].n, 1);
  const other = await withPracticeContext(b, (c) => c.query(`SELECT count(*)::int AS n FROM aksh.review_cases WHERE id = $1`, [id]));
  assert.equal(other.rows[0].n, 0, "practice B cannot read practice A");
  const empty = await withPracticeContext("", (c) => c.query(`SELECT count(*)::int AS n FROM aksh.review_cases`));
  assert.equal(empty.rows[0].n, 0, "no practice context, no rows (fail closed)");
  await assert.rejects(
    withPracticeContext(b, (c) => c.query(`INSERT INTO aksh.review_cases (id, scope_key, practice_id, payload) VALUES ($1, 'rls-test', $2, '{}'::jsonb)`, [`${id}-x`, a])),
    /row-level security/,
    "cannot write into another practice"
  );
  await withPracticeContext(a, (c) => c.query(`DELETE FROM aksh.review_cases WHERE id = $1`, [id]));
  console.log("review-cases-rls-db: enforced isolation, fail-closed, no cross-practice writes — PASS");
}

run().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => closePgPool());
