import assert from "node:assert/strict";
import { unlink } from "node:fs/promises";
import path from "node:path";

import { POST as postCheckIn } from "../app/api/patients/[id]/check-in/route";
import { detectCheckInEscalation } from "../lib/patient-companion/check-in";

/**
 * B5 (docs/PHASED_BUILD_PLAN.md) — patient self-report check-in.
 *
 * Run via `tsx` (not the tsc-compiled `.tmp-tests` commonjs bundle) because
 * `app/api/patients/[id]/check-in/route.ts` uses `@/`-aliased imports, matching the pattern
 * established by `clinical-proof-rbac-decision-gate.test.ts` for `review-cases/[id]/route.ts`.
 */

const TEST_SCOPE_USER_ID = "checkin_b5_test_user";
const PATIENT_A = "checkin_b5_patient_a";
const PATIENT_B = "checkin_b5_patient_b";

function buildCheckInRequest(options: {
  patientId: string;
  role: string;
  boundPatientId?: string;
  body?: Record<string, unknown>;
}) {
  const headers: Record<string, string> = {
    "x-user-id": TEST_SCOPE_USER_ID,
    "x-user-email": "checkin-b5-test@akshhealth.com",
    "x-user-role": options.role,
    "content-type": "application/json"
  };
  if (options.boundPatientId) {
    headers["x-bound-patient-id"] = options.boundPatientId;
  }

  return new Request(`http://localhost:3000/api/patients/${options.patientId}/check-in`, {
    method: "POST",
    headers,
    body: JSON.stringify(options.body ?? { mood: "good" })
  });
}

async function cleanupSeededFiles() {
  // ingestModalitySampleStub seeds a per-scope synthetic-fixture file on first access.
  await unlink(path.join(process.cwd(), "data", `modality-samples.${TEST_SCOPE_USER_ID}.json`)).catch(() => {});
}

async function run() {
  // Deterministic: force the "no Postgres configured" SHIELD path regardless of ambient env,
  // matching clinical-proof-shield.test.ts's own approach for the same reason.
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousUsePostgres = process.env.USE_POSTGRES;
  delete process.env.DATABASE_URL;
  delete process.env.USE_POSTGRES;
  process.env.AKSH_TEST_AUTH_HEADER = "true";

  try {
    // --- Escalation detection (pure function) ---
    assert.equal(detectCheckInEscalation("Feeling fine today, just a bit tired.").triggered, false);
    assert.deepEqual(detectCheckInEscalation("Feeling fine today, just a bit tired.").category, null);

    assert.equal(
      detectCheckInEscalation("Sometimes I think about ending my life").triggered,
      true
    );
    assert.equal(
      detectCheckInEscalation("Sometimes I think about ending my life").category,
      "self_harm_or_crisis"
    );

    assert.equal(
      detectCheckInEscalation("I've had chest pain since this morning").category,
      "red_flag_symptom"
    );

    assert.equal(
      detectCheckInEscalation("I've completely burnt out with my diabetes lately").category,
      "diabetes_distress"
    );

    // A crisis phrase must win over a co-occurring distress phrase (priority order).
    assert.equal(
      detectCheckInEscalation(
        "I've given up on my diabetes and feel like life is not worth living"
      ).category,
      "self_harm_or_crisis"
    );

    // --- No clinical_reviewer fallthrough: only the `patient` AppRole may check in ---
    for (const role of ["clinical_reviewer", "gp", "researcher", "operations_lead", "some-unrecognized-role"]) {
      const response = await postCheckIn(
        buildCheckInRequest({ patientId: PATIENT_A, role, boundPatientId: PATIENT_A }),
        { params: { id: PATIENT_A } }
      );
      assert.equal(
        response.status,
        403,
        `role "${role}" must not be able to submit a patient check-in (no clinical_reviewer fallthrough)`
      );
      const body = (await response.json()) as { error?: string };
      assert.ok(body.error, `role "${role}" 403 response should carry an error message`);
    }

    // --- FR-CORE-005: a patient session with no bound patient id fails closed, not open ---
    const noBoundResponse = await postCheckIn(
      buildCheckInRequest({ patientId: PATIENT_A, role: "patient" }),
      { params: { id: PATIENT_A } }
    );
    assert.equal(noBoundResponse.status, 403);
    const noBoundBody = (await noBoundResponse.json()) as { error?: string; denied?: boolean };
    assert.equal(noBoundBody.denied, true);
    assert.match(noBoundBody.error ?? "", /no bound patient id/i);

    // --- FR-PER-006/FR-PER-014: patient A's session cannot write to patient B's check-in record ---
    const crossPatientResponse = await postCheckIn(
      buildCheckInRequest({ patientId: PATIENT_B, role: "patient", boundPatientId: PATIENT_A }),
      { params: { id: PATIENT_B } }
    );
    assert.equal(crossPatientResponse.status, 403);
    const crossPatientBody = (await crossPatientResponse.json()) as { error?: string; denied?: boolean };
    assert.equal(crossPatientBody.denied, true);
    assert.match(crossPatientBody.error ?? "", /cannot access/i);

    // --- Own-record success, benign check-in: SHIELD write failure is surfaced, not swallowed ---
    const okResponse = await postCheckIn(
      buildCheckInRequest({
        patientId: PATIENT_A,
        role: "patient",
        boundPatientId: PATIENT_A,
        body: { mood: "okay", symptomText: "Feeling a bit tired", medicationAdherence: "yes" }
      }),
      { params: { id: PATIENT_A } }
    );
    assert.equal(okResponse.status, 200);
    const okBody = (await okResponse.json()) as {
      escalation?: { triggered?: boolean };
      nurseTask?: unknown;
      ehrWrite?: boolean;
      isClinicalAdvice?: boolean;
      shieldAuditWriteFailed?: boolean;
      shieldPersisted?: boolean;
    };
    assert.equal(okBody.escalation?.triggered, false);
    assert.equal(okBody.nurseTask, null);
    assert.equal(okBody.ehrWrite, false);
    assert.equal(okBody.isClinicalAdvice, false);
    assert.equal(okBody.shieldPersisted, false);
    assert.equal(
      okBody.shieldAuditWriteFailed,
      true,
      "a SHIELD write failure must be visibly surfaced on the check-in response, not silently swallowed (B1 pattern)"
    );

    // --- Escalation-worthy self-report reaches a clinician gate, not silently stored ---
    const escalationResponse = await postCheckIn(
      buildCheckInRequest({
        patientId: PATIENT_A,
        role: "patient",
        boundPatientId: PATIENT_A,
        body: { mood: "struggling", symptomText: "I have been thinking about ending my life" }
      }),
      { params: { id: PATIENT_A } }
    );
    assert.equal(escalationResponse.status, 200);
    const escalationBody = (await escalationResponse.json()) as {
      escalation?: { triggered?: boolean; category?: string };
      nurseTask?: { priority?: string; source?: string; summary?: string } | null;
      ehrWrite?: boolean;
    };
    assert.equal(escalationBody.escalation?.triggered, true);
    assert.equal(escalationBody.escalation?.category, "self_harm_or_crisis");
    assert.ok(
      escalationBody.nurseTask,
      "a flagged self-report must produce a clinician-visible escalation task, not be silently logged"
    );
    assert.equal(escalationBody.nurseTask?.priority, "urgent");
    assert.equal(escalationBody.nurseTask?.source, "patient_check_in");
    assert.equal(escalationBody.ehrWrite, false);
  } finally {
    delete process.env.AKSH_TEST_AUTH_HEADER;
    if (previousDatabaseUrl !== undefined) process.env.DATABASE_URL = previousDatabaseUrl;
    if (previousUsePostgres !== undefined) process.env.USE_POSTGRES = previousUsePostgres;
    await cleanupSeededFiles();
  }

  console.log("B5 patient check-in checks passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
