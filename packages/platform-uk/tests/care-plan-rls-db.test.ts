/**
 * care_plan_records isolation is enforced by the database (migration 054), not only by query filters.
 * Neon / Postgres gated — skips cleanly without DATABASE_URL.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { closePgPool, getPgPool, isPostgresConfigured, withOrgContext } from "../lib/db/client";

function isSkippableRlsEnvError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /relation .* does not exist|role "aksh_tenant" does not exist|function aksh\.ctx_org_ids/i.test(
    msg
  );
}

async function run() {
  if (!isPostgresConfigured()) {
    console.log("care-plan-rls-db: skipped (no DATABASE_URL)");
    return;
  }

  const id = `cprls-${randomUUID().slice(0, 8)}`;
  const orgA = `org-cprls-a-${id}`;
  const orgB = `org-cprls-b-${id}`;

  try {
    await withOrgContext(orgA, (c) =>
      c.query(
        `INSERT INTO aksh.care_plan_records
          (id, scope_key, organisation_id, patient_id, patient_label, status, sections,
           safety_notes, missing_data, created_by, version, hitl_required, ehr_write, synthetic)
         VALUES ($1,'cprls',$2,'P002','RLS Test','DRAFT','[]'::jsonb,'{}',
           '[]'::jsonb,'cprls',1,true,false,true)`,
        [id, orgA]
      )
    );

    const own = await withOrgContext(orgA, (c) =>
      c.query<{ n: number }>(`SELECT count(*)::int AS n FROM aksh.care_plan_records WHERE id = $1`, [
        id,
      ])
    );
    assert.equal(own.rows[0]?.n, 1, "own org must see stamped row");

    const other = await withOrgContext(orgB, (c) =>
      c.query<{ n: number }>(`SELECT count(*)::int AS n FROM aksh.care_plan_records WHERE id = $1`, [
        id,
      ])
    );
    assert.equal(other.rows[0]?.n, 0, "cross-org must not see stamped row under RLS");

    const empty = await withOrgContext("", (c) =>
      c.query<{ n: number }>(`SELECT count(*)::int AS n FROM aksh.care_plan_records WHERE id = $1`, [
        id,
      ])
    );
    assert.equal(empty.rows[0]?.n, 0, "empty org context is fail-closed");

    await assert.rejects(
      withOrgContext(orgB, (c) =>
        c.query(
          `INSERT INTO aksh.care_plan_records
            (id, scope_key, organisation_id, patient_id, patient_label, status, sections,
             safety_notes, missing_data, created_by, version, hitl_required, ehr_write, synthetic)
           VALUES ($1,'cprls',$2,'P002','X','DRAFT','[]'::jsonb,'{}','[]'::jsonb,'cprls',1,true,false,true)`,
          [`${id}-x`, orgA]
        )
      ),
      /row-level security/,
      "cannot write into another organisation"
    );

    await getPgPool().query(`DELETE FROM aksh.care_plan_records WHERE id = $1`, [id]);
    console.log(
      "care-plan-rls-db: enforced isolation, fail-closed empty ctx, no cross-org writes — PASS"
    );
  } catch (err) {
    await getPgPool()
      .query(`DELETE FROM aksh.care_plan_records WHERE id = $1`, [id])
      .catch(() => undefined);

    if (isSkippableRlsEnvError(err)) {
      console.log(
        "care-plan-rls-db: skipped (",
        err instanceof Error ? err.message : err,
        ")"
      );
      return;
    }
    throw err;
  } finally {
    await closePgPool().catch(() => undefined);
  }
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closePgPool());
