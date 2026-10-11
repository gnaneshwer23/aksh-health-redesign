/**
 * D5 (docs/PHASED_BUILD_PLAN_D.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P2-3): Patient State timeline UI —
 * read-only panel backed by GET /api/patients/[id]/state (C1), additively
 * extended with a `facts` field (the full ordered fact history, current and
 * superseded alike) rather than a new endpoint.
 *
 * Covers:
 *  1. The route's pre-existing response fields (artifactType, snapshot,
 *     factHistorySource, factHistoryCount, ehrWrite, note) are unchanged.
 *  2. The new `facts` field is present, is an array, its length matches
 *     `factHistoryCount`, and includes both a current and a superseded fact
 *     for a patient with a supersession chain (proving nothing is dropped).
 *  3. An unknown patient id resolves to an honest empty `facts: []`, not a
 *     crash (mirrors C1's own "honest empty, not a crash" convention).
 */

import assert from "node:assert/strict";

import { GET as getPatientState } from "../app/api/patients/[id]/state/route";
import { recordPatientStateFact } from "../lib/patient-state/repository";

const routeUserId = `pstate_timeline_test_${Date.now()}`;
const routeUserEmail = "patient-state-timeline-test@akshhealth.com";

function buildRouteRequest(pathname: string) {
  return new Request(`http://localhost:3000${pathname}`, {
    headers: {
      "x-user-id": routeUserId,
      "x-user-email": routeUserEmail,
      "x-user-role": "gp"
    }
  });
}

async function testExistingFieldsUnchangedPlusNewFactsField() {
  process.env.AKSH_TEST_AUTH_HEADER = "true";

  const patientId = "P002";
  const response = await getPatientState(buildRouteRequest(`/api/patients/${patientId}/state`), {
    params: Promise.resolve({ id: patientId })
  });
  assert.equal(response.status, 200);
  const body = (await response.json()) as Record<string, any>;

  // Pre-existing fields — unchanged by D5.
  assert.equal(body.artifactType, "aksh-patient-state-snapshot");
  assert.equal(body.patientId, patientId);
  assert.ok(body.snapshot, "snapshot field must still be present");
  assert.ok(["postgres", "file"].includes(body.factHistorySource));
  assert.equal(typeof body.factHistoryCount, "number");
  assert.equal(body.ehrWrite, false);
  assert.ok(typeof body.note === "string" && body.note.length > 0);

  // New D5 field.
  assert.ok(Array.isArray(body.facts), "facts field must be a new additive array");
  assert.equal(body.facts.length, body.factHistoryCount, "facts array length must match the pre-existing factHistoryCount");

  console.log("Patient State timeline API: pre-existing response fields unchanged, new facts field present and length-consistent.");
}

async function testFactsIncludeCurrentAndSupersededWithoutDropping() {
  process.env.AKSH_TEST_AUTH_HEADER = "true";

  const patientId = `test-pstate-timeline-${Date.now()}`;

  // Two writes to the SAME factType against the default ("shared") scope —
  // matching how the real recordPatientStateFact/orchestrate.ts call sites
  // operate in production (no scopeKey), since the API route itself never
  // passes one either.
  const first = await recordPatientStateFact({
    patientId,
    factType: "test_timeline_fact",
    value: { note: "first" },
    source: { system: "test" }
  });
  const second = await recordPatientStateFact({
    patientId,
    factType: "test_timeline_fact",
    value: { note: "second" },
    source: { system: "test" }
  });

  const response = await getPatientState(buildRouteRequest(`/api/patients/${patientId}/state`), {
    params: Promise.resolve({ id: patientId })
  });
  const body = (await response.json()) as Record<string, any>;

  const facts = body.facts as Array<{ id: string; supersededBy: string | null }>;
  const firstInResponse = facts.find((f) => f.id === first.fact.id);
  const secondInResponse = facts.find((f) => f.id === second.fact.id);

  assert.ok(firstInResponse, "the first (now-superseded) fact must still be present in the response — nothing dropped");
  assert.ok(secondInResponse, "the second (current) fact must be present");
  assert.equal(firstInResponse!.supersededBy, second.fact.id, "the superseded marker must be visible in the API response");
  assert.equal(secondInResponse!.supersededBy, null, "the current fact must have no supersededBy");

  console.log("Patient State timeline API: current + superseded facts both present in the response, supersession marker visible.");
}

async function testUnknownPatientReturnsHonestEmptyFacts() {
  process.env.AKSH_TEST_AUTH_HEADER = "true";

  const response = await getPatientState(
    buildRouteRequest("/api/patients/unknown-patient-does-not-exist/state"),
    { params: Promise.resolve({ id: "unknown-patient-does-not-exist" }) }
  );
  assert.equal(response.status, 200);
  const body = (await response.json()) as Record<string, any>;
  assert.deepEqual(body.facts, [], "an unknown patient id resolves to an honest empty facts array, not a crash");
  assert.equal(body.factHistoryCount, 0);

  console.log("Patient State timeline API: unknown patient id returns an honest empty facts array, not a crash.");
}

async function main() {
  await testExistingFieldsUnchangedPlusNewFactsField();
  await testFactsIncludeCurrentAndSupersededWithoutDropping();
  await testUnknownPatientReturnsHonestEmptyFacts();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
