import assert from "node:assert/strict";

import { runOracleAgent } from "../lib/agents/llm-oracle";
import { runClinicalSpineOrchestrate } from "../lib/clinical-spine/orchestrate";
import { resolveSafetyRouteFromOrchestration } from "../lib/clinical-spine/safety-route";
import { resolveDecision } from "../lib/decision";
import {
  assertGoldenDecisionScenario,
  findCriticalLabEvents,
  textClaimsFabricatedRenalValue,
} from "../lib/e2e/decision-safety-assertions";
import { projectE2EFactsForPatient } from "../lib/e2e/patient-state-assertions";
import { GOLDEN_SCENARIOS } from "../lib/e2e/golden-scenarios";
import { generateE2EDataset } from "../lib/e2e/generator";

const SCENARIO_0001 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0001")!;
const SCENARIO_0009 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0009")!;
const SCENARIO_0012 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0012")!;

/** Stable T2D — well controlled, Low risk. */
const DEMO_STABLE_PATIENT_ID = "P007";
/** High-risk / critical lab proxy — URGENT + VeryHigh. */
const DEMO_ESCALATION_PATIENT_ID = "P018";
/** Missing renal labs — hallucination guard fixture. */
const DEMO_MISSING_RENAL_PATIENT_ID = "P015";

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
  const cohortA = dataset.patients.find((p) => p.cohortId === "A");
  const cohortC = dataset.patients.find((p) => p.cohortId === "C");
  const cohortF = dataset.patients.find((p) => p.cohortId === "F");
  assert.ok(cohortA && cohortC && cohortF);

  // AKSH-E2E-0001 — stable diabetes OBSERVE
  const stable = await runClinicalSpineOrchestrate({
    patientId: DEMO_STABLE_PATIENT_ID,
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "e2e-decision-test@aksh.health",
  });

  const stableRoute = resolveSafetyRouteFromOrchestration(stable.orchestration);
  assert.equal(stableRoute, stable.safetyRoute);
  assert.equal(stableRoute, "low_risk_coaching");

  const result0001 = assertGoldenDecisionScenario(SCENARIO_0001, {
    orchestration: stable.orchestration,
    safetyRoute: stableRoute,
    generatorPatient: cohortA,
  });
  assert.equal(result0001.ok, true, result0001.errors.join("; "));

  // AKSH-E2E-0009 — critical lab escalation
  const criticalLabs = findCriticalLabEvents(dataset.labEvents, cohortC.id);
  assert.ok(criticalLabs.length >= 1, "cohort C must include critical lab sim events");

  const escalate = await runClinicalSpineOrchestrate({
    patientId: DEMO_ESCALATION_PATIENT_ID,
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "e2e-decision-test@aksh.health",
  });

  const escalateRoute = resolveSafetyRouteFromOrchestration(escalate.orchestration);
  assert.equal(escalateRoute, "urgent_flag");

  const result0009 = assertGoldenDecisionScenario(SCENARIO_0009, {
    orchestration: escalate.orchestration,
    safetyRoute: escalateRoute,
    generatorPatient: cohortC,
    labEvents: dataset.labEvents,
  });
  assert.equal(result0009.ok, true, result0009.errors.join("; "));

  // AKSH-E2E-0012 — hallucination guard / ACQUIRE_DATA
  const acquireDecision = resolveDecision({
    orchestration: null,
    ingestedCount: 1,
    expectedModalities: 4,
  });
  assert.equal(acquireDecision.route, "request_more_data");

  const fSnapshot = projectE2EFactsForPatient(cohortF.id, dataset.patientStateFacts);
  assert.equal(fSnapshot.current.egfr, undefined);

  const oracleMissingRenal = await runOracleAgent({ patientId: DEMO_MISSING_RENAL_PATIENT_ID });
  assert.ok(oracleMissingRenal);
  const oracleText = [
    oracleMissingRenal.summary,
    ...oracleMissingRenal.contributingFactors,
    ...oracleMissingRenal.safetyNotes,
  ].join(" ");
  assert.equal(
    textClaimsFabricatedRenalValue(oracleText),
    false,
    `ORACLE must not fabricate renal values: ${oracleText.slice(0, 200)}`
  );

  const result0012 = assertGoldenDecisionScenario(SCENARIO_0012, {
    generatorPatient: cohortF,
    snapshot: fSnapshot,
    oracle: oracleMissingRenal,
    acquireDataDecision: acquireDecision,
  });
  assert.equal(result0012.ok, true, result0012.errors.join("; "));

  console.log(
    `E2E decision/safety passed (${SCENARIO_0001.testId} ${stableRoute}; ${SCENARIO_0009.testId} ${escalateRoute}; ${SCENARIO_0012.testId} request_more_data; critical labs=${criticalLabs.length}).`
  );
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
