import assert from "node:assert/strict";
import { unlink } from "node:fs/promises";
import path from "node:path";

import { PUT as putReviewCase } from "../app/api/review-cases/[id]/route";

const testUserId = "rbac_fr_per_009_user";

async function cleanupSeededReviewCasesFile() {
  // The clinical_reviewer sanity-check request below reads through to
  // `readReviewCases`, which seeds a per-scope demo dataset file on first
  // access for a new scopeKey — clean it up so repeated runs stay hermetic.
  await unlink(path.join(process.cwd(), "data", `review-cases.${testUserId}.json`)).catch(() => {});
}

/**
 * B1 / FR-PER-009: no non-clinical persona — including the newly-scoped
 * `patient`/`researcher` `AppRole`s, and any unrecognized ("restricted") role —
 * can record a clinical Accept/Edit/Reject via `PUT /api/review-cases/[id]`.
 *
 * Run via `tsx` (not the tsc-compiled `.tmp-tests` commonjs bundle) because
 * `app/api/review-cases/[id]/route.ts` uses `@/`-aliased imports, which plain
 * `tsc`-emitted `require()` calls cannot resolve at runtime.
 */
function buildDecisionRequest(role: string) {
  return new Request("http://localhost:3000/api/review-cases/case-does-not-matter", {
    method: "PUT",
    headers: {
      "x-user-id": testUserId,
      "x-user-email": "rbac-fr-per-009@akshhealth.com",
      "x-user-role": role,
      "content-type": "application/json"
    },
    body: JSON.stringify({ id: "case-does-not-matter", status: "accepted" })
  });
}

async function run() {
  process.env.AKSH_TEST_AUTH_HEADER = "true";

  try {
    for (const role of ["patient", "researcher", "operations_lead", "some-unrecognized-role"]) {
      const response = await putReviewCase(buildDecisionRequest(role), {
        params: Promise.resolve({ id: "case-does-not-matter" })
      });
      assert.equal(
        response.status,
        403,
        `FR-PER-009: role "${role}" must be forbidden from recording an Accept/Edit/Reject decision`
      );
      const body = (await response.json()) as { error?: string };
      assert.ok(body.error, `FR-PER-009: role "${role}" 403 response should carry an error message`);
    }

    // Sanity: a clinical_reviewer session hits the (unrelated) 404 case-lookup path, not the
    // 403 role gate — proves the gate is role-specific, not a blanket failure for every role.
    const clinicalResponse = await putReviewCase(buildDecisionRequest("gp"), {
      params: Promise.resolve({ id: "case-does-not-matter" })
    });
    assert.notEqual(
      clinicalResponse.status,
      403,
      "clinical_reviewer (gp) must not be blocked by the FR-PER-009 role gate"
    );
  } finally {
    delete process.env.AKSH_TEST_AUTH_HEADER;
    await cleanupSeededReviewCasesFile();
  }

  console.log("FR-PER-009 non-clinical-persona decision-block checks passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
