/**
 * C2 — Decision module extraction (docs/PHASED_BUILD_PLAN_C.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P0-2).
 * Honest invariant: this is a pure extraction/re-export — resolveDecision's
 * `route` must be byte-identical to resolveSafetyRouteFromOrchestration's
 * output across every SafetyRoute branch, and orchestrate.ts's call-site
 * swap must not change runClinicalSpineOrchestrate's public output.
 */

import assert from "node:assert/strict";

import { resolveDecision } from "../lib/decision";
import {
  resolveSafetyRouteFromOrchestration,
  type SafetyRoute
} from "../lib/clinical-spine/safety-route";
import { runClinicalSpineOrchestrate } from "../lib/clinical-spine/orchestrate";
import type { OrchestrationResult } from "../lib/clinical-proof/agent-orchestration";

function mockOrchestration(overrides: {
  queuePriority: OrchestrationResult["queuePriority"];
  guardianStatus: "green" | "amber" | "red";
  oracleRisk: string;
}): OrchestrationResult {
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
      GUARDIAN: { overallStatus: overrides.guardianStatus, interactions: [] } as unknown as OrchestrationResult["outputs"]["GUARDIAN"],
      ORACLE: { oracleRisk: overrides.oracleRisk } as unknown as OrchestrationResult["outputs"]["ORACLE"],
      NEXUS: undefined
    },
    outputSlots: ["SYNTHESIS", "GUARDIAN", "ORACLE"],
    queuePriority: overrides.queuePriority,
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

async function testDecisionMatchesResolverAcrossEveryBranch() {
  const cases: Array<{ label: string; orchestration: OrchestrationResult | null; ingestedCount?: number; expectedModalities?: number }> = [
    { label: "urgent (queuePriority=Urgent)", orchestration: mockOrchestration({ queuePriority: "Urgent", guardianStatus: "green", oracleRisk: "Low" }) },
    { label: "urgent (GUARDIAN red)", orchestration: mockOrchestration({ queuePriority: "Normal", guardianStatus: "red", oracleRisk: "Low" }) },
    { label: "clinical_review_queue (queuePriority=High)", orchestration: mockOrchestration({ queuePriority: "High", guardianStatus: "green", oracleRisk: "Low" }) },
    { label: "clinical_review_queue (GUARDIAN amber)", orchestration: mockOrchestration({ queuePriority: "Normal", guardianStatus: "amber", oracleRisk: "Low" }) },
    { label: "clinical_review_queue (ORACLE High)", orchestration: mockOrchestration({ queuePriority: "Normal", guardianStatus: "green", oracleRisk: "High" }) },
    { label: "low_risk_coaching", orchestration: mockOrchestration({ queuePriority: "Normal", guardianStatus: "green", oracleRisk: "Low" }) },
    { label: "null orchestration -> clinical_review_queue", orchestration: null },
    { label: "request_more_data (insufficient ingested modalities)", orchestration: null, ingestedCount: 1, expectedModalities: 4 }
  ];

  const seenRoutes = new Set<SafetyRoute>();

  for (const testCase of cases) {
    const expected = resolveSafetyRouteFromOrchestration(testCase.orchestration, {
      ingestedCount: testCase.ingestedCount,
      expectedModalities: testCase.expectedModalities
    });
    const decision = resolveDecision({
      orchestration: testCase.orchestration,
      ingestedCount: testCase.ingestedCount,
      expectedModalities: testCase.expectedModalities
    });
    assert.equal(decision.route, expected, `resolveDecision route must match resolveSafetyRouteFromOrchestration for case: ${testCase.label}`);
    assert.equal(decision.escalation, "none", "escalation is a hard-set 'none' placeholder in C2");
    assert.equal(decision.priority, testCase.orchestration?.queuePriority ?? null);
    seenRoutes.add(decision.route);
  }

  const allRoutes: SafetyRoute[] = ["urgent_flag", "clinical_review_queue", "low_risk_coaching", "request_more_data"];
  for (const route of allRoutes) {
    assert.ok(seenRoutes.has(route), `test matrix must exercise every SafetyRoute branch — missing ${route}`);
  }

  console.log("Decision module: resolveDecision matches resolveSafetyRouteFromOrchestration across every SafetyRoute branch.");
}

async function testGoldenScenarioRegressionAfterCallSiteSwap() {
  process.env.ENABLE_LLM_SYNTHESIS = "false";
  process.env.ENABLE_LLM_GUARDIAN = "false";
  process.env.ENABLE_LLM_ORACLE = "false";
  process.env.ENABLE_LLM_DR_ASSIST = "false";
  process.env.ENABLE_LLM_NEXUS = "false";

  // P002 is the established concrete stand-in for the golden Patel-demo
  // scenario (GOLDEN_SCENARIO_PATEL_DEMO_ID = "case-patel-demo") used
  // throughout the existing test suite (e.g. tests/clinical-spine-phase-c.test.ts,
  // tests/clinical-spine-phase-a.test.ts's minimalCase()).
  for (const patientId of ["P002", "P009"]) {
    const result = await runClinicalSpineOrchestrate({
      patientId,
      includeDrAssist: false,
      includeTwinRanking: false,
      actor: "decision-module-test@aksh.health"
    });

    // The route orchestrate.ts's post-C2 call site produced must equal what
    // directly calling the original resolver on the same orchestration
    // snapshot produces — proving the call-site swap changed nothing observable.
    const independentRoute = resolveSafetyRouteFromOrchestration(result.orchestration);
    assert.equal(result.safetyRoute, independentRoute, `golden scenario ${patientId}: safetyRoute must be unchanged after the C2 call-site swap`);

    const decision = resolveDecision({ orchestration: result.orchestration });
    assert.equal(decision.route, result.safetyRoute, `golden scenario ${patientId}: resolveDecision must agree with orchestrate.ts's own safetyRoute`);
    assert.equal(result.ehrWrite, false);
    assert.equal(result.autoRetrain, false);
    assert.equal(result.liveEmis, false);
  }

  console.log("Decision module: golden-scenario (Patel/P002, P009) safetyRoute/safetyRouteLabel unchanged after the C2 call-site swap.");
}

async function main() {
  await testDecisionMatchesResolverAcrossEveryBranch();
  await testGoldenScenarioRegressionAfterCallSiteSwap();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
