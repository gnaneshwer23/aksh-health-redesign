/**
 * INT-08 — org tenancy helpers + RLS proof on local-dev Neon.
 * File-store path always runs; PG RLS requires DATABASE_URL (local-dev / simulation).
 * Never targets production Neon.
 *
 * Run: npx tsx --env-file=.env.local tests/connected-diabetes-org-tenancy.test.ts
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  CONNECTED_DIABETES_SIMULATION_ORG_ID,
  resolveConnectedDiabetesOrganisationId,
  rowVisibleToOrganisation,
  scopedSyntheticId,
} from "../lib/diabetes-intelligence/org-tenancy";
import { closePgPool, getPgPool, isPostgresConfigured, withOrgContext } from "../lib/db/client";

function isSkippableRlsEnvError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  // Missing role/table/migration on a fresh laptop — helpers still prove the contract.
  return /relation .* does not exist|role "aksh_tenant" does not exist|function aksh\.ctx_org_ids/i.test(
    msg
  );
}

async function run() {
  assert.equal(resolveConnectedDiabetesOrganisationId(), CONNECTED_DIABETES_SIMULATION_ORG_ID);
  assert.equal(
    resolveConnectedDiabetesOrganisationId({ organisationId: "org-a" }),
    "org-a"
  );
  assert.equal(rowVisibleToOrganisation(null, "org-a"), true);
  assert.equal(rowVisibleToOrganisation("org-a", "org-a"), true);
  assert.equal(rowVisibleToOrganisation("org-a", "org-b"), false);
  assert.equal(rowVisibleToOrganisation("org-a", null), true);

  // INT-16 residual — scoped synthetic PKs must not collide across scope_key.
  assert.equal(scopedSyntheticId("user-a", "goal-P002-adherence"), "user-a:goal-P002-adherence");
  assert.equal(
    scopedSyntheticId("user-a", "user-a:goal-P002-adherence"),
    "user-a:goal-P002-adherence"
  );
  assert.notEqual(
    scopedSyntheticId("user-a", "goal-P002-adherence"),
    scopedSyntheticId("user-b", "goal-P002-adherence")
  );

  if (!isPostgresConfigured() || !process.env.DATABASE_URL?.trim()) {
    console.log("connected-diabetes-org-tenancy: helpers PASS; RLS skipped (no DATABASE_URL)");
    return;
  }

  const id = `int08-${randomUUID().slice(0, 8)}`;
  const orgA = "org-int08-a";
  const orgB = "org-int08-b";

  try {
    await withOrgContext(orgA, async (c) => {
      await c.query(
        `INSERT INTO aksh.care_plan_records
          (id, scope_key, organisation_id, patient_id, patient_label, status, sections,
           safety_notes, missing_data, created_by, version, hitl_required, ehr_write, synthetic)
         VALUES ($1,'int08-rls',$2,'P002','Test','DRAFT','[]'::jsonb,'{}',
           '[]'::jsonb,'int08',1,true,false,true)`,
        [id, orgA]
      );
    });

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

    // 054 fail-closed: empty org context must not see stamped rows (soft NULL policy removed).
    const empty = await withOrgContext("", (c) =>
      c.query<{ n: number }>(`SELECT count(*)::int AS n FROM aksh.care_plan_records WHERE id = $1`, [
        id,
      ])
    );
    assert.equal(empty.rows[0]?.n, 0, "empty org context is fail-closed under enforced RLS");

    // aksh_tenant is intentionally SELECT/INSERT/UPDATE only (no DELETE) — clean up as owner.
    await getPgPool().query(`DELETE FROM aksh.care_plan_records WHERE id = $1`, [id]);

    console.log("connected-diabetes-org-tenancy: INT-08 helpers + enforced RLS — PASS");
  } catch (err) {
    // Best-effort cleanup if insert landed before a later assertion failed.
    await getPgPool()
      .query(`DELETE FROM aksh.care_plan_records WHERE id = $1`, [id])
      .catch(() => undefined);

    if (isSkippableRlsEnvError(err)) {
      console.log(
        "connected-diabetes-org-tenancy: helpers PASS; RLS skipped (",
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

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
