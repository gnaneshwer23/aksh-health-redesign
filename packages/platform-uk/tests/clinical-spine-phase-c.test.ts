/**
 * Phase C clinical spine — orchestrate + safety route + twin honesty + coaching gate.
 * Invariants: ehrWrite:false · autoRetrain:false · liveEmis:false · physiologicalTwin:false.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { runAgentOrchestration } from "../lib/clinical-proof/agent-orchestration";
import {
  getClinicalSpineOrchestrateCapabilities,
  runClinicalSpineOrchestrate
} from "../lib/clinical-spine/orchestrate";
import {
  coachingAllowedForRoute,
  resolveSafetyRouteFromOrchestration,
  resolveSafetyRouteFromSignals
} from "../lib/clinical-spine/safety-route";
import { getOracleModelCard } from "../lib/precision-health/oracle-model-card";

async function run() {
  process.env.ENABLE_LLM_SYNTHESIS = "false";
  process.env.ENABLE_LLM_GUARDIAN = "false";
  process.env.ENABLE_LLM_ORACLE = "false";
  process.env.ENABLE_LLM_DR_ASSIST = "false";
  process.env.ENABLE_LLM_NEXUS = "false";

  // --- Capabilities honesty ---
  const caps = getClinicalSpineOrchestrateCapabilities();
  assert.equal(caps.ehrWrite, false);
  assert.equal(caps.physiologicalTwin, false);
  assert.equal(caps.autoRetrain, false);
  assert.equal(caps.liveEmis, false);
  assert.equal(caps.hitlRequired, true);
  assert.equal(caps.simulationMode, "synthetic_rules");
  assert.ok(caps.agents.includes("NEXUS"));
  assert.ok(caps.modelCard.clinicalOwner.includes("UNASSIGNED"));

  // --- Orchestrate (Patel — typically urgent GUARDIAN) ---
  const result = await runClinicalSpineOrchestrate({
    patientId: "P002",
    includeDrAssist: false,
    includeTwinRanking: true,
    actor: "phase-c-test@aksh.health"
  });

  assert.equal(result.artifactType, "aksh-clinical-spine-orchestrate");
  assert.equal(result.ehrWrite, false);
  assert.equal(result.physiologicalTwin, false);
  assert.equal(result.autoRetrain, false);
  assert.equal(result.liveEmis, false);
  assert.equal(result.hitlRequired, true);
  assert.ok(result.orchestration.reviewOrder.length >= 4);
  assert.ok(result.orchestration.outputs.SYNTHESIS);
  assert.ok(result.orchestration.outputs.GUARDIAN);
  assert.ok(result.orchestration.outputs.ORACLE);
  assert.ok(result.orchestration.outputs.NEXUS);
  assert.equal(result.orchestration.outputs.NEXUS?.status, "draft");
  assert.ok(result.orchestration.reviewOrder.includes("NEXUS"));
  assert.ok(result.twin);
  assert.equal(result.twin.simulationMode, "synthetic_rules");
  assert.equal(result.twin.physiologicalTwin, false);
  assert.equal(result.twin.planPromotionRequiresHitl, true);
  assert.ok(result.modelCard.clinicalOwner.includes("UNASSIGNED"));
  assert.equal(result.modelCard.autoRetrain, false);

  if (result.orchestration.queuePriority === "Urgent") {
    assert.equal(result.orchestration.reviewOrder[0], "GUARDIAN");
    assert.equal(result.safetyRoute, "urgent_flag");
  }

  const routeFromOrch = resolveSafetyRouteFromOrchestration(result.orchestration);
  assert.equal(routeFromOrch, result.safetyRoute);

  // --- Low-risk coaching gate ---
  const low = resolveSafetyRouteFromSignals({
    guardianStatus: "green",
    oracleRisk: "Low",
    flags: [],
    hasMinimalContext: true
  });
  assert.equal(low, "low_risk_coaching");
  assert.equal(coachingAllowedForRoute(low), true);
  assert.equal(coachingAllowedForRoute("urgent_flag"), false);
  assert.equal(coachingAllowedForRoute("clinical_review_queue"), false);

  // --- Model card ---
  const card = getOracleModelCard();
  assert.equal(card.physiologicalTwin, false);
  assert.equal(card.autoRetrain, false);

  // --- Reuse clinical-proof orchestration invariants ---
  const urgent = await runAgentOrchestration({
    patientId: "P002",
    includeDrAssist: false
  });
  if (urgent.queuePriority === "Urgent") {
    assert.equal(urgent.reviewOrder[0], "GUARDIAN");
  }
  assert.equal(urgent.ehrWrite, false);
  assert.equal(urgent.hitlRequired, true);

  // --- UI / docs wiring ---
  const gpPage = fs.readFileSync(
    path.join(process.cwd(), "app/dashboard/gp/patients/[id]/page.tsx"),
    "utf8"
  );
  assert.ok(gpPage.includes("ClinicalOrchestratePanel"));
  assert.ok(gpPage.includes("ScenarioRankingPanel"));
  assert.ok(gpPage.includes("CausalHypothesisPanel"));
  assert.ok(gpPage.includes("seedFromOrchestrate"));

  const reviewQueue = fs.readFileSync(
    path.join(process.cwd(), "app/dashboard/gp/review-queue/page.tsx"),
    "utf8"
  );
  assert.ok(reviewQueue.includes("ClinicalOrchestratePanel"));

  const companion = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/PatientCompanion.tsx"),
    "utf8"
  );
  assert.ok(companion.includes("SafetyRouteCoachingGate"));

  const orchUi = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/precision-health/ClinicalOrchestratePanel.tsx"),
    "utf8"
  );
  assert.ok(orchUi.includes("orchestrate-run"));
  assert.ok(orchUi.includes("CONDUCTOR · Orchestrate"));
  assert.ok(orchUi.includes("GUARDIAN"));
  assert.ok(orchUi.includes("NEXUS"));
  assert.ok(orchUi.includes("HitlActions"));
  assert.ok(orchUi.includes("physiologicalTwin: false"));
  assert.ok(orchUi.includes("liveEmis: false"));

  const agentControl = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/AgentControlPanel.tsx"),
    "utf8"
  );
  assert.ok(agentControl.includes("gp-agent-brand-strip"));
  assert.ok(agentControl.includes("CANVAS"));
  assert.ok(agentControl.includes("BRIDGE"));
  assert.ok(agentControl.includes("CONDUCTOR"));
  assert.ok(agentControl.includes("sub-capability"));
  assert.ok(agentControl.includes("liveEmis:false"));
  assert.ok(agentControl.includes("John Snow Labs NLP is"));
  assert.ok(agentControl.includes("not wired"));
  assert.ok(!agentControl.includes("14 live agents"));

  const agentDirectory = fs.readFileSync(path.join(process.cwd(), "lib/agents.ts"), "utf8");
  assert.ok(agentDirectory.includes('name: "CANVAS"'));
  assert.ok(agentDirectory.includes('name: "BRIDGE"'));
  assert.ok(agentDirectory.includes('name: "CONDUCTOR"'));
  assert.ok(agentDirectory.includes('name: "PRISM"'));
  assert.ok(agentDirectory.includes('name: "ATLAS"'));
  assert.ok(agentDirectory.includes("phase: 2, live: false"));
  assert.ok(!agentDirectory.includes('name: "VOICE"'));
  assert.ok(!agentDirectory.includes('name: "DrASSIST"'));

  // Public site (app/page.tsx, components/site): the real product only; no agent roster or demo claims.
  const home = fs.readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");
  assert.ok(!home.includes("100 patients"));
  assert.ok(!home.includes("liveEmis:false"), "public copy uses plain words, not flags");

  const oracleUi = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/OracleRiskPanel.tsx"),
    "utf8"
  );
  assert.ok(oracleUi.includes("oracle-risk-model-card"));

  const gateUi = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/precision-health/SafetyRouteCoachingGate.tsx"),
    "utf8"
  );
  assert.ok(gateUi.includes("low_risk_coaching"));
  assert.ok(gateUi.includes("coaching-paused-notice"));

  const checklist = fs.readFileSync(
    path.join(process.cwd(), "docs/CLINICAL_SPINE_PHASE_C.md"),
    "utf8"
  );
  assert.ok(checklist.includes("liveEmis: false"));
  assert.ok(checklist.includes("physiologicalTwin: false"));
  assert.ok(checklist.includes("autoRetrain: false"));
  assert.ok(checklist.includes("Phase D next"));

  const orchRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/agents/orchestrate/route.ts"),
    "utf8"
  );
  assert.ok(orchRoute.includes("runClinicalSpineOrchestrate"));
  assert.ok(orchRoute.includes("ehrWrite"));

  console.log(
    `Phase C clinical spine checks passed (priority=${result.orchestration.queuePriority}; route=${result.safetyRoute}; twin=${result.twin.simulationMode}).`
  );
}

void run();
