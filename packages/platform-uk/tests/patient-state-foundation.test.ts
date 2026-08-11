/**
 * C1 — Patient State foundation (docs/PHASED_BUILD_PLAN_C.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P0-1).
 * Honest invariants: append-only (no UPDATE mutates value/id, no DELETE),
 * exactly one current fact per (patientId, factType), ehrWrite:false (this
 * module performs no EHR write of any kind).
 */

import assert from "node:assert/strict";

import { buildPatientStateSnapshot } from "../lib/patient-state/projection";
import { getPatientStateSnapshot, listPatientStateFacts, recordPatientStateFact } from "../lib/patient-state/repository";
import { resolveSpinePatientId } from "../lib/clinical-spine/queue-decision";
import { patients } from "../lib/mock-data/patients";
import { reviewCases as seedCases } from "../lib/mock-data";
import type { PatientStateFact } from "../lib/patient-state/types";
import type { ReviewCase } from "../lib/types";

function fact(overrides: Partial<PatientStateFact>): PatientStateFact {
  return {
    id: overrides.id ?? `pstate-test-${Math.random().toString(36).slice(2)}`,
    patientId: overrides.patientId ?? "P002",
    factType: overrides.factType ?? "hba1c",
    value: overrides.value ?? { percent: 7.1 },
    source: overrides.source ?? { system: "mock_cohort" },
    confidence: overrides.confidence ?? 1,
    consentScopeId: overrides.consentScopeId ?? null,
    effectiveAt: overrides.effectiveAt ?? "2026-01-01T00:00:00.000Z",
    recordedAt: overrides.recordedAt ?? "2026-01-01T00:00:00.000Z",
    supersededBy: overrides.supersededBy ?? null
  };
}

async function testProjectionCurrentStatePerFactType() {
  const older = fact({ id: "f1", factType: "hba1c", recordedAt: "2026-01-01T00:00:00.000Z", value: { percent: 7.1 } });
  const newer = fact({
    id: "f2",
    factType: "hba1c",
    recordedAt: "2026-02-01T00:00:00.000Z",
    value: { percent: 7.6 },
    supersededBy: null
  });
  const superseded = { ...older, supersededBy: newer.id };
  const weight = fact({ id: "f3", factType: "weight", recordedAt: "2026-01-15T00:00:00.000Z", value: { kg: 82 } });

  const snapshot = buildPatientStateSnapshot("P002", [superseded, newer, weight]);

  assert.equal(Object.keys(snapshot.current).length, 2, "one current fact per factType");
  assert.equal((snapshot.current.hba1c.value as { percent: number }).percent, 7.6, "current hba1c is the newer, non-superseded fact");
  assert.equal(snapshot.current.hba1c.id, "f2");
  assert.equal((snapshot.current.weight.value as { kg: number }).kg, 82);
  assert.equal(snapshot.factCount, 3, "factCount includes superseded facts — nothing is dropped from history");
  console.log("Patient State projection: current-state-per-factType checks passed.");
}

async function testProjectionIgnoresOtherPatients() {
  const mine = fact({ id: "g1", patientId: "P007", factType: "weight" });
  const other = fact({ id: "g2", patientId: "P099", factType: "weight" });
  const snapshot = buildPatientStateSnapshot("P007", [mine, other]);
  assert.equal(snapshot.factCount, 1, "snapshot only counts facts for the requested patientId");
  assert.equal(snapshot.current.weight.id, "g1");
  console.log("Patient State projection: cross-patient isolation checks passed.");
}

async function testRepositoryAppendOnlyAndSupersession() {
  // A dedicated per-run scopeKey (mirrors lib/repositories/learning-event-repository.ts's
  // convention) keeps this test's file-fallback writes out of the tracked, shared
  // data/patient-state-facts.json — see .gitignore's data/patient-state-facts.*.json rule.
  const scopeKey = `pstate_test_${Date.now()}`;
  const options = { scopeKey };
  const patientId = `test-patient-${Date.now()}`;

  const first = await recordPatientStateFact(
    {
      patientId,
      factType: "hba1c",
      value: { percent: 7.1 },
      source: { system: "test" }
    },
    options
  );

  const second = await recordPatientStateFact(
    {
      patientId,
      factType: "hba1c",
      value: { percent: 7.6 },
      source: { system: "test" }
    },
    options
  );

  const { facts } = await listPatientStateFacts(patientId, options);
  assert.equal(facts.length, 2, "append-only: both the original and the new fact remain readable");

  const firstAfter = facts.find((f) => f.id === first.fact.id);
  assert.ok(firstAfter, "the original fact row is never deleted");
  assert.equal(firstAfter?.supersededBy, second.fact.id, "the original fact is marked superseded by the new one, never mutated in value");
  assert.deepEqual(firstAfter?.value, { percent: 7.1 }, "a superseded fact's own value is never rewritten");

  const secondAfter = facts.find((f) => f.id === second.fact.id);
  assert.equal(secondAfter?.supersededBy, null, "the newest fact for a factType has no supersededBy");

  const snapshot = await getPatientStateSnapshot(patientId, options);
  assert.equal(Object.keys(snapshot.current).length, 1, "exactly one current fact for this factType");
  assert.deepEqual(snapshot.current.hba1c.value, { percent: 7.6 }, "snapshot resolves to the newest, non-superseded value");
  assert.equal(snapshot.factCount, 2);

  console.log(`Patient State repository: append-only + supersession checks passed (source=${second.source}).`);
}

async function testExistingSpinePatientIdsResolveCleanly() {
  // Mirrors the golden-mapping pattern used by tests/clinical-spine-phase-a.test.ts:
  // the B-tranche spine resolves the well-known PATEL-DEMO scenario to cohort patient P002.
  const seeded = seedCases.find((c) => c.id === "case-patel-demo") ?? seedCases[0];
  const patelCase: ReviewCase = { ...seeded, id: "case-patel-demo", scenarioId: "PATEL-DEMO" };
  const patelResolved = resolveSpinePatientId(patelCase);
  assert.equal(patelResolved, "P002", "golden PATEL-DEMO scenario must still resolve to cohort patient P002 (no regression to B-tranche spine identity)");
  assert.ok(
    patients.find((p) => p.id === patelResolved),
    "the golden PATEL-DEMO patient id must exist in the mock cohort"
  );

  // Every other existing seed case must resolve to *some* stable, non-empty id (never throw,
  // never blank) — whether that's a cohort P-id, a synthetic id, or the case-<id> fallback.
  let checkedCount = 0;
  for (const reviewCase of seedCases) {
    const resolved = resolveSpinePatientId(reviewCase);
    assert.ok(typeof resolved === "string" && resolved.length > 0, `resolveSpinePatientId must return a non-empty id for case ${reviewCase.id}`);
    checkedCount += 1;
  }

  console.log(`Patient State identity bridge: golden PATEL-DEMO -> P002 confirmed; ${checkedCount} existing seed cases resolve without regression.`);
}

async function testUnknownPatientReturnsEmptySnapshotNotCrash() {
  const snapshot = await getPatientStateSnapshot("unknown-patient-does-not-exist");
  assert.equal(Object.keys(snapshot.current).length, 0);
  assert.equal(snapshot.factCount, 0);
  console.log("Patient State: unknown patient id returns an honest empty snapshot, not a crash.");
}

async function main() {
  await testProjectionCurrentStatePerFactType();
  await testProjectionIgnoresOtherPatients();
  await testRepositoryAppendOnlyAndSupersession();
  await testExistingSpinePatientIdsResolveCleanly();
  await testUnknownPatientReturnsEmptySnapshotNotCrash();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
