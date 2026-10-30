/**
 * C6 (docs/PHASED_BUILD_PLAN_C.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P1-3): diabetes-specific Decision
 * escalation, additive to C2's `Decision.escalation` "none" placeholder.
 *
 * Covers:
 *  1. Unit-level `resolveDecision` escalation rule matrix: no diabetes
 *     contribution -> "none"; a GUARDIAN safety flag or referral_indicated
 *     complication -> "diabetes_nurse_review"; coaching drafts only ->
 *     "routine_coaching"; never affects `route`/`priority`.
 *  2. Orchestration-level: a hypo-risk diabetes-flagged patient (P026)
 *     resolves `diabetesEscalation: "diabetes_nurse_review"`; a diabetes-
 *     flagged patient with no safety flags (P002) resolves
 *     "routine_coaching"; a non-diabetes patient (P001) and the module-off
 *     case both resolve "none" — byte-identical to pre-C6 output.
 */

import assert from "node:assert/strict";

import { resolveDecision } from "../lib/decision";
import { buildDiabetesRiskContribution } from "../lib/disease-modules/diabetes";
import { runClinicalSpineOrchestrate } from "../lib/clinical-spine/orchestrate";
import type { OrchestrationResult } from "../lib/clinical-proof/agent-orchestration";

function minimalOrchestration(): OrchestrationResult {
  return {
    artifactType: "aksh-uk-agent-orchestration",
    sharedContext: {
      patientId: "mock-patient",
      patientLabel: "Mock Patient",
      proposedDrug: null,
      transcript: "mock transcript",
      flags: []
    },
    outputs: {
      SYNTHESIS: {} as OrchestrationResult["outputs"]["SYNTHESIS"],
      GUARDIAN: { overallStatus: "green", interactions: [] } as unknown as OrchestrationResult["outputs"]["GUARDIAN"],
      ORACLE: { oracleRisk: "Low" } as unknown as OrchestrationResult["outputs"]["ORACLE"],
      NEXUS: undefined
    },
    outputSlots: ["SYNTHESIS", "GUARDIAN", "ORACLE"],
    queuePriority: "Normal",
    reviewOrder: ["GUARDIAN", "SYNTHESIS", "ORACLE"],
    evidence: [],
    ehrWrite: false,
    hitlRequired: true,
    timedOut: false,
    elapsedMs: 1,
    perAgentMs: {},
    execution: {
      schemaVersion: "agent-execution-metadata-v1",
      correlationId: "mock-corr",
      careEpisodeId: null,
      scopeKey: null,
      startedAt: new Date(0).toISOString(),
      completedAt: new Date(0).toISOString(),
      durationMs: 1,
      status: "completed",
      guardianOutcome: null,
      reviewStatus: "pending_hitl",
      agents: [],
      evidenceRefs: [],
      errorCode: null,
      errorMessage: null,
      ehrWrite: false,
      hitlRequired: true,
    },
    agentMetadata: {},
  };
}

function testEscalationMatrix() {
  const orchestration = minimalOrchestration();

  const noneCase = resolveDecision({ orchestration, diabetes: null });
  assert.equal(noneCase.escalation, "none", "no diabetes contribution -> escalation none");

  const noneCaseUndefined = resolveDecision({ orchestration });
  assert.equal(noneCaseUndefined.escalation, "none", "omitted diabetes field -> escalation none (pre-C6 byte-identical default)");

  // Hypo-risk-flagged diabetes contribution -> diabetes_nurse_review
  const hypoContribution = buildDiabetesRiskContribution(
    { patientId: "UNIT-TEST-HYPO" },
    { insulinRegimen: { medications: ["Insulin glargine"], reportedHypoEventCount: 2 } }
  );
  assert.ok(hypoContribution.guardianSafetyFlags.length > 0, "fixture must actually produce a GUARDIAN safety flag for this case");
  const hypoDecision = resolveDecision({ orchestration, diabetes: hypoContribution });
  assert.equal(hypoDecision.escalation, "diabetes_nurse_review");
  assert.equal(hypoDecision.route, resolveDecision({ orchestration }).route, "escalation must never change route");
  assert.equal(hypoDecision.priority, resolveDecision({ orchestration }).priority, "escalation must never change priority");

  // Referral-indicated complication (>=2 evidence refs) -> diabetes_nurse_review, even with zero GUARDIAN flags
  const referralContribution = buildDiabetesRiskContribution(
    { patientId: "UNIT-TEST-REFERRAL" },
    { complicationEvidence: { retinopathy: ["ref-1", "ref-2"] } }
  );
  assert.equal(referralContribution.guardianSafetyFlags.length, 0, "this fixture case has no GUARDIAN safety flags of its own");
  const referralDecision = resolveDecision({ orchestration, diabetes: referralContribution });
  assert.equal(referralDecision.escalation, "diabetes_nurse_review");

  // Coaching drafts only, no safety flags, no referral-indicated complications -> routine_coaching
  const routineContribution = buildDiabetesRiskContribution({ patientId: "UNIT-TEST-ROUTINE" });
  assert.equal(routineContribution.guardianSafetyFlags.length, 0);
  assert.ok(routineContribution.coachingDrafts.length > 0);
  assert.ok(routineContribution.signals.complications.every((c) => c.flagLevel !== "referral_indicated"));
  const routineDecision = resolveDecision({ orchestration, diabetes: routineContribution });
  assert.equal(routineDecision.escalation, "routine_coaching");

  console.log("Decision escalation (C6/P1-3): resolveDecision matrix (none/diabetes_nurse_review/routine_coaching) passed.");
}

async function testOrchestrationLevelEscalation() {
  process.env.ENABLE_LLM_SYNTHESIS = "false";
  process.env.ENABLE_LLM_GUARDIAN = "false";
  process.env.ENABLE_LLM_ORACLE = "false";
  process.env.ENABLE_LLM_DR_ASSIST = "false";
  process.env.ENABLE_LLM_NEXUS = "false";

  // --- Module OFF: escalation must be "none" regardless of patient ---
  delete process.env.ENABLE_DIABETES_MODULE;
  const moduleOffResult = await runClinicalSpineOrchestrate({
    patientId: "P002",
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "diabetes-escalation-test@aksh.health"
  });
  assert.equal(moduleOffResult.diabetesEscalation, "none", "module off -> escalation none, byte-identical to pre-C6");

  process.env.ENABLE_DIABETES_MODULE = "true";

  // --- Non-diabetes-flagged patient (P001): escalation stays "none" even with module on ---
  const nonDiabetesResult = await runClinicalSpineOrchestrate({
    patientId: "P001",
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "diabetes-escalation-test@aksh.health"
  });
  assert.equal(nonDiabetesResult.diabetes, null);
  assert.equal(nonDiabetesResult.diabetesEscalation, "none", "non-diabetes patient must be byte-identical: escalation none");

  // --- P026 (2 reported hypo events -> GUARDIAN safety flag) -> diabetes_nurse_review ---
  const p026Result = await runClinicalSpineOrchestrate({
    patientId: "P026",
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "diabetes-escalation-test@aksh.health"
  });
  assert.ok(p026Result.diabetes);
  assert.equal(p026Result.diabetesEscalation, "diabetes_nurse_review", "P026's hypo-risk GUARDIAN flag must escalate to diabetes_nurse_review");

  // --- P002 (worsening HbA1c, neuropathy WATCH only, no hypo events) -> routine_coaching ---
  const p002Result = await runClinicalSpineOrchestrate({
    patientId: "P002",
    includeDrAssist: false,
    includeTwinRanking: false,
    actor: "diabetes-escalation-test@aksh.health"
  });
  assert.ok(p002Result.diabetes);
  assert.equal(p002Result.diabetes!.guardianSafetyFlags.length, 0, "P002 fixture has no hypo/GLP-1 flags");
  assert.equal(p002Result.diabetesEscalation, "routine_coaching", "P002 has coaching drafts but no nurse-review trigger -> routine_coaching");

  process.env.ENABLE_DIABETES_MODULE = "false";

  console.log("Decision escalation (C6/P1-3): orchestration-level checks (module-off/non-diabetes/P026/P002) passed.");
}

async function main() {
  testEscalationMatrix();
  await testOrchestrationLevelEscalation();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
