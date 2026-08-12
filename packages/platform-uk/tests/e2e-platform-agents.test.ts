import assert from "node:assert/strict";

import {
  assertGoldenAgentScenario,
  assertOrchestrationInvariants,
  detectAllergyConflict,
} from "../lib/e2e/agent-orchestration-assertions";
import { GOLDEN_SCENARIOS } from "../lib/e2e/golden-scenarios";
import { generateE2EDataset } from "../lib/e2e/generator";
import { runAgentOrchestration } from "../lib/clinical-proof/agent-orchestration";
import { getPatientById } from "../lib/mock-data/patients";

const SCENARIO_0007 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0007")!;
const SCENARIO_0011 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0011")!;
const SCENARIO_0019 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0019")!;

/** Demo proxy for cohort G multimorbidity — polypharmacy + VeryHigh risk. */
const DEMO_MULTIMORBIDITY_PATIENT_ID = "P008";
/** Demo proxy for allergy block — documented penicillin allergy. */
const DEMO_ALLERGY_PATIENT_ID = "P001";
/** Demo proxy for cohort B deterioration / LLM-failure path. */
const DEMO_LLM_FAILURE_PATIENT_ID = "P002";

function disableAllLlmAgents() {
  process.env.ENABLE_LLM_SYNTHESIS = "false";
  process.env.ENABLE_LLM_GUARDIAN = "false";
  process.env.ENABLE_LLM_ORACLE = "false";
  process.env.ENABLE_LLM_DR_ASSIST = "false";
  process.env.ENABLE_LLM_NEXUS = "false";
}

async function run() {
  disableAllLlmAgents();

  const dataset = generateE2EDataset({ seed: 20260812 });
  const cohortGPatient = dataset.patients.find((p) => p.cohortId === "G");
  assert.ok(cohortGPatient, "generator must include cohort G patient");

  // AKSH-E2E-0007 — complex multimorbidity reasoning
  const multimorbidity = await runAgentOrchestration({
    patientId: DEMO_MULTIMORBIDITY_PATIENT_ID,
    transcript:
      "Comprehensive medication review for frail patient with polypharmacy. Draft only — HITL required.",
    includeDrAssist: true,
    agentTimeoutMs: 10_000,
    overallTimeoutMs: 30_000,
  });

  const result0007 = assertGoldenAgentScenario(SCENARIO_0007, multimorbidity, {
    generatorPatient: cohortGPatient,
  });
  assert.equal(result0007.ok, true, result0007.errors.join("; "));
  assert.ok(["Urgent", "High"].includes(multimorbidity.queuePriority));
  assert.ok(multimorbidity.outputs.NEXUS!.correlations.length >= 1);

  // AKSH-E2E-0011 — allergy safety block (workflow + orchestration)
  const allergyPatient = getPatientById(DEMO_ALLERGY_PATIENT_ID);
  assert.ok(allergyPatient);
  assert.equal(
    detectAllergyConflict(allergyPatient.allergies, "Amoxicillin"),
    true,
    "P001 must document penicillin allergy conflicting with Amoxicillin"
  );

  const allergyRun = await runAgentOrchestration({
    patientId: DEMO_ALLERGY_PATIENT_ID,
    proposedDrug: "Amoxicillin",
    transcript: "Chest infection — clinician considers Amoxicillin. Draft only.",
    includeDrAssist: false,
    agentTimeoutMs: 10_000,
  });

  const result0011 = assertGoldenAgentScenario(SCENARIO_0011, allergyRun, {
    proposedDrug: "Amoxicillin",
  });
  assert.equal(result0011.ok, true, result0011.errors.join("; "));

  // AKSH-E2E-0019 — AI provider failure / deterministic fallback, no corruption
  const llmFailure = await runAgentOrchestration({
    patientId: DEMO_LLM_FAILURE_PATIENT_ID,
    proposedDrug: "Apixaban",
    transcript: "LLM unavailable — deterministic CONDUCTOR rehearsal only.",
    includeDrAssist: true,
    agentTimeoutMs: 10_000,
  });

  assert.deepEqual(assertOrchestrationInvariants(llmFailure), []);
  assert.equal(llmFailure.outputs.SYNTHESIS.mode, "deterministic");
  assert.equal(llmFailure.outputs.GUARDIAN.mode, "deterministic");
  assert.equal(llmFailure.outputs.ORACLE.mode, "deterministic");
  assert.equal(llmFailure.outputs.NEXUS?.mode, "deterministic");

  const result0019 = assertGoldenAgentScenario(SCENARIO_0019, llmFailure);
  assert.equal(result0019.ok, true, result0019.errors.join("; "));

  console.log(
    `E2E agent orchestration passed (${SCENARIO_0007.testId} P008 priority=${multimorbidity.queuePriority}; ${SCENARIO_0011.testId} allergy flags; ${SCENARIO_0019.testId} deterministic modes; elapsed=${llmFailure.elapsedMs}ms).`
  );
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
