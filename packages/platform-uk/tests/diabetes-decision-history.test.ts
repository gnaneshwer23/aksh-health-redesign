/**
 * D4 (docs/PHASED_BUILD_PLAN_D.md): deepen Patient State in the
 * diabetes/CONDUCTOR path — persist the diabetes Decision domain's own
 * output (escalation + a compact HORIZON/GUARDIAN/areaFailures summary)
 * back onto Patient State as a new, durable, append-only fact type
 * ("diabetes_decision_snapshot"), closing the loop C6/C1 left one-
 * directional (Patient State only ever fed *into* the diabetes composite).
 *
 * Covers:
 *  1. recordDiabetesDecisionSnapshot + loadDiabetesDecisionHistory round
 *     trip: a snapshot written is readable back with the same fields.
 *  2. Append-only / supersession: writing a second snapshot for the same
 *     patient appends (never overwrites) — both remain readable via
 *     listPatientStateFacts, and loadDiabetesDecisionHistory returns both,
 *     oldest-first.
 *  3. Fail-open: a write that cannot be serialised (simulated failure)
 *     resolves to `null` rather than throwing.
 *  4. Orchestration-level: a diabetes-flagged, module-enabled orchestration
 *     run for P026 (hypo-risk) produces a new diabetes_decision_snapshot
 *     fact whose `escalation` matches the run's own
 *     `diabetesEscalation` ("diabetes_nurse_review"); a non-diabetes
 *     patient (P001) and the module-off case produce zero new facts —
 *     byte-identical to pre-D4 behaviour for both.
 *  5. The write is fire-and-forget: `runClinicalSpineOrchestrate`'s return
 *     value/shape is unaffected regardless of whether the underlying
 *     Patient State write succeeds (asserted via #4's own return-shape
 *     checks, since orchestrate.ts never awaits this write).
 */

import assert from "node:assert/strict";

import {
  recordDiabetesDecisionSnapshot,
  loadDiabetesDecisionHistory,
  DIABETES_DECISION_SNAPSHOT_FACT_TYPE
} from "../lib/disease-modules/diabetes/decision-history";
import { listPatientStateFacts } from "../lib/patient-state/repository";
import { runClinicalSpineOrchestrate } from "../lib/clinical-spine/orchestrate";

async function testRoundTrip() {
  const scopeKey = `diab_decision_history_test_${Date.now()}`;
  const patientId = `test-diab-decision-${Date.now()}`;
  const options = { scopeKey };

  const result = await recordDiabetesDecisionSnapshot(
    {
      patientId,
      snapshot: {
        escalation: "diabetes_nurse_review",
        horizonContributingFactorCount: 3,
        guardianSafetyFlagCount: 1,
        areaFailures: [],
        orchestratedAt: "2026-08-11T12:00:00.000Z"
      }
    },
    options
  );
  assert.ok(result, "recordDiabetesDecisionSnapshot must succeed for a well-formed snapshot");
  assert.equal(result!.fact.factType, DIABETES_DECISION_SNAPSHOT_FACT_TYPE);
  assert.equal(result!.fact.source.system, "clinical_spine_orchestrate");

  const history = await loadDiabetesDecisionHistory(patientId, options);
  assert.equal(history.length, 1);
  assert.equal(history[0].escalation, "diabetes_nurse_review");
  assert.equal(history[0].horizonContributingFactorCount, 3);
  assert.equal(history[0].guardianSafetyFlagCount, 1);
  assert.deepEqual(history[0].areaFailures, []);

  console.log("Diabetes decision history: recordDiabetesDecisionSnapshot/loadDiabetesDecisionHistory round-trip passed.");
}

async function testAppendOnlySupersession() {
  const scopeKey = `diab_decision_history_test_append_${Date.now()}`;
  const patientId = `test-diab-decision-append-${Date.now()}`;
  const options = { scopeKey };

  const first = await recordDiabetesDecisionSnapshot(
    {
      patientId,
      snapshot: {
        escalation: "routine_coaching",
        horizonContributingFactorCount: 1,
        guardianSafetyFlagCount: 0,
        areaFailures: [],
        orchestratedAt: "2026-08-01T00:00:00.000Z"
      }
    },
    options
  );
  const second = await recordDiabetesDecisionSnapshot(
    {
      patientId,
      snapshot: {
        escalation: "diabetes_nurse_review",
        horizonContributingFactorCount: 2,
        guardianSafetyFlagCount: 1,
        areaFailures: [],
        orchestratedAt: "2026-08-11T00:00:00.000Z"
      }
    },
    options
  );
  assert.ok(first && second);
  assert.notEqual(first!.fact.id, second!.fact.id);

  const { facts } = await listPatientStateFacts(patientId, options);
  const decisionFacts = facts.filter((f) => f.factType === DIABETES_DECISION_SNAPSHOT_FACT_TYPE);
  assert.equal(decisionFacts.length, 2, "both snapshots remain readable — append-only, never overwritten");
  const firstFact = decisionFacts.find((f) => f.id === first!.fact.id);
  assert.equal(firstFact?.supersededBy, second!.fact.id, "the first snapshot is marked superseded by the second, never mutated");

  const history = await loadDiabetesDecisionHistory(patientId, options);
  assert.equal(history.length, 2, "loadDiabetesDecisionHistory returns the full history, not just the current fact");
  assert.equal(history[0].escalation, "routine_coaching", "oldest-first ordering");
  assert.equal(history[1].escalation, "diabetes_nurse_review");

  console.log("Diabetes decision history: append-only supersession across repeated writes passed.");
}

async function testFailOpenOnUnserialisableSnapshot() {
  const scopeKey = `diab_decision_history_test_failopen_${Date.now()}`;
  const patientId = `test-diab-decision-failopen-${Date.now()}`;

  // A circular-reference value cannot be JSON.stringify'd by the file-store
  // write path (lib/patient-state/repository.ts's writeFileStore) —
  // simulates a persistence failure without needing to fake Postgres.
  const circular: Record<string, unknown> = {};
  circular.self = circular;

  const result = await recordDiabetesDecisionSnapshot(
    {
      patientId,
      snapshot: {
        escalation: "none",
        horizonContributingFactorCount: 0,
        guardianSafetyFlagCount: 0,
        areaFailures: circular as never,
        orchestratedAt: "2026-08-11T00:00:00.000Z"
      }
    },
    { scopeKey }
  );

  assert.equal(result, null, "fail-open: a write that cannot be persisted resolves to null, never throws");

  console.log("Diabetes decision history: fail-open on a simulated write failure passed (no throw, null returned).");
}

async function testOrchestrationLevelWriteBack() {
  process.env.ENABLE_LLM_SYNTHESIS = "false";
  process.env.ENABLE_LLM_GUARDIAN = "false";
  process.env.ENABLE_LLM_ORACLE = "false";
  process.env.ENABLE_LLM_DR_ASSIST = "false";
  process.env.ENABLE_LLM_NEXUS = "false";

  // --- Module OFF: zero new diabetes_decision_snapshot facts for P002 ---
  delete process.env.ENABLE_DIABETES_MODULE;
  const beforeModuleOff = await listPatientStateFacts("P002");
  const moduleOffResult = await runClinicalSpineOrchestrate({
    patientId: "P002",
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "diabetes-decision-history-test@aksh.health"
  });
  assert.equal(moduleOffResult.diabetes, null, "module off — no diabetes contribution");
  const afterModuleOff = await listPatientStateFacts("P002");
  assert.equal(
    afterModuleOff.facts.filter((f) => f.factType === DIABETES_DECISION_SNAPSHOT_FACT_TYPE).length,
    beforeModuleOff.facts.filter((f) => f.factType === DIABETES_DECISION_SNAPSHOT_FACT_TYPE).length,
    "module off must produce zero new diabetes_decision_snapshot facts — byte-identical to pre-D4"
  );

  process.env.ENABLE_DIABETES_MODULE = "true";

  // --- Non-diabetes-flagged patient (P001): zero new facts even with module on ---
  const beforeNonDiabetes = await listPatientStateFacts("P001");
  const nonDiabetesResult = await runClinicalSpineOrchestrate({
    patientId: "P001",
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "diabetes-decision-history-test@aksh.health"
  });
  assert.equal(nonDiabetesResult.diabetes, null);
  const afterNonDiabetes = await listPatientStateFacts("P001");
  assert.equal(
    afterNonDiabetes.facts.filter((f) => f.factType === DIABETES_DECISION_SNAPSHOT_FACT_TYPE).length,
    beforeNonDiabetes.facts.filter((f) => f.factType === DIABETES_DECISION_SNAPSHOT_FACT_TYPE).length,
    "non-diabetes-flagged patient must produce zero new diabetes_decision_snapshot facts"
  );

  // --- P026 (hypo-risk -> diabetes_nurse_review): one new fact, matching escalation ---
  const beforeP026Count = (await loadDiabetesDecisionHistory("P026")).length;
  const p026Result = await runClinicalSpineOrchestrate({
    patientId: "P026",
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "diabetes-decision-history-test@aksh.health"
  });
  assert.ok(p026Result.diabetes);
  assert.equal(p026Result.diabetesEscalation, "diabetes_nurse_review");
  // The write is fire-and-forget (never awaited by orchestrate.ts) — poll
  // briefly for the new fact count to land rather than assuming a fixed delay.
  const p026History = await waitForNewDecisionSnapshot("P026", beforeP026Count);
  assert.ok(p026History, "a new diabetes_decision_snapshot fact must appear for P026 shortly after orchestration completes");
  assert.equal(p026History!.escalation, "diabetes_nurse_review", "the persisted snapshot's escalation must match the orchestration run's own diabetesEscalation");
  assert.equal(p026History!.guardianSafetyFlagCount, p026Result.diabetes!.guardianSafetyFlags.length);
  assert.equal(p026History!.horizonContributingFactorCount, p026Result.diabetes!.horizonContributingFactors.length);
  assert.deepEqual(p026History!.areaFailures, p026Result.diabetes!.areaFailures);

  process.env.ENABLE_DIABETES_MODULE = "false";

  console.log("Diabetes decision history: orchestration-level write-back (module-off/non-diabetes/P026) passed.");
}

async function waitForNewDecisionSnapshot(patientId: string, countBefore: number, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const history = await loadDiabetesDecisionHistory(patientId);
    if (history.length > countBefore) return history[history.length - 1];
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return null;
}

async function main() {
  await testRoundTrip();
  await testAppendOnlySupersession();
  await testFailOpenOnUnserialisableSnapshot();
  await testOrchestrationLevelWriteBack();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
