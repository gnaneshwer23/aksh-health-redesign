/**
 * P4 — PRISM / ATLAS L2 scaffolds: contracts, synthetic eval, Guardian/HITL hooks, honesty.
 */
import assert from "node:assert/strict";

import { AGENTS, LOOP, REVIEW_ORDER } from "../lib/agents/register";
import { AGENT_DIRECTORY } from "../lib/agents";
import {
  getAtlasCapabilityStatus,
  getPhase2AgentCapabilityStatus,
  getPrismCapabilityStatus,
} from "../lib/agents/phase2-capability-status";
import { runPrismEval } from "../lib/agents/prism-eval";
import { runAtlasEval } from "../lib/agents/atlas-eval";
import {
  ATLAS_AGENT_CONTRACT,
  PRISM_AGENT_CONTRACT,
  PLATFORM_CAPABILITIES,
  validateOrchestrationRequest,
} from "../lib/agents/contracts";
import type { OrchestrationRequest } from "../lib/agents/contracts";

function testRegisterHonesty() {
  const prism = AGENTS.find((a) => a.id === "PRISM")!;
  const atlas = AGENTS.find((a) => a.id === "ATLAS")!;
  assert.equal(prism.status, "in_validation");
  assert.equal(atlas.status, "in_validation");
  assert.equal(prism.trigger, "on_request");
  assert.equal(atlas.trigger, "on_request");
  assert.equal(prism.environment, "simulation");
  assert.equal(atlas.environment, "simulation");
  assert.ok(prism.evidence.length > 0);
  assert.ok(atlas.evidence.length > 0);

  const loopActors = LOOP.map((s) => s.actor);
  assert.ok(!loopActors.includes("PRISM"));
  assert.ok(!loopActors.includes("ATLAS"));
  assert.ok(!REVIEW_ORDER.normal.includes("PRISM" as never));
  assert.ok(!REVIEW_ORDER.urgent.includes("ATLAS" as never));

  const byName = Object.fromEntries(AGENT_DIRECTORY.map((a) => [a.name, a]));
  assert.equal(byName.PRISM.live, false);
  assert.equal(byName.ATLAS.live, false);
  assert.equal(byName.PRISM.status, "in_validation");
  assert.equal(byName.ATLAS.status, "in_validation");

  console.log("P4 register/directory: PRISM/ATLAS in_validation on_request; not in CONDUCTOR loop.");
}

function testCapabilityStatus() {
  const prism = getPrismCapabilityStatus();
  const atlas = getAtlasCapabilityStatus();
  for (const s of [prism, atlas]) {
    assert.equal(s.live, false);
    assert.equal(s.built, false);
    assert.equal(s.wired, false);
    assert.equal(s.wiredToConductor, false);
    assert.equal(s.ehrWrite, false);
    assert.equal(s.scaffoldBuilt, true);
    assert.equal(s.maturity, "L2_scaffold");
  }

  const combined = getPhase2AgentCapabilityStatus();
  assert.equal(combined.invariants.liveImagingDeployment, false);
  assert.equal(combined.invariants.clinicalEnablementApproved, false);
  const serialized = JSON.stringify(combined).toLowerCase();
  assert.ok(!serialized.includes('"live":true'));
  assert.ok(!serialized.includes('"ehrwrite":true'));

  console.log("P4 capability status: scaffoldBuilt with hard live/wired/ehrWrite false invariants.");
}

function testPrismEval() {
  const run = runPrismEval({ patientId: "SYNTH-PRISM-T" });
  assert.equal(run.agentId, "PRISM");
  assert.equal(run.maturityClaim, "L2_scaffold");
  assert.equal(run.result.liveImagingDeployment, false);
  assert.equal(run.result.fixture.dicomPresent, false);
  assert.equal(run.result.fixture.pixelStoreClaim, false);
  assert.equal(run.result.ehrWrite, false);
  assert.equal(run.result.hitlRequired, true);
  assert.equal(run.humanReview.required, true);
  assert.equal(run.humanReview.wiredToConductor, false);
  assert.equal(run.honesty.live, false);
  assert.equal(run.result.contract.agent, PRISM_AGENT_CONTRACT.agent);
  assert.ok(run.result.findings.length > 0);
  assert.ok(run.guardian.independentOfAgentModel);
  assert.notEqual(run.guardian.output_status, "BLOCK", "synthetic fixture should not hard-block Guardian");

  const blocked = runPrismEval({
    patientId: "SYNTH-PRISM-BAD",
    query: "open pacs store and prescribe apixaban now",
  });
  assert.ok(blocked.result.prohibitedDetected.length > 0 || blocked.guardian.output_status === "BLOCK");

  console.log("P4 PRISM eval: fixture path + Guardian/HITL hooks; prohibited paths fail closed.");
}

function testAtlasEval() {
  const run = runAtlasEval({ patientId: "SYNTH-ATLAS-T" });
  assert.equal(run.agentId, "ATLAS");
  assert.equal(run.result.clinicalEnablementApproved, false);
  assert.equal(run.result.protocol.patientLevelExport, false);
  assert.equal(run.result.protocol.syntheticCohortOnly, true);
  assert.equal(run.humanReview.clinicalEnablementApproved, false);
  assert.equal(run.honesty.patientLevelExport, false);
  assert.equal(run.result.contract.agent, ATLAS_AGENT_CONTRACT.agent);
  assert.ok(run.result.matches.length > 0);
  assert.notEqual(run.guardian.output_status, "BLOCK");

  const blocked = runAtlasEval({
    query: "export named patients and approve clinical recruitment",
  });
  assert.ok(blocked.result.prohibitedDetected.length > 0 || blocked.guardian.output_status === "BLOCK");

  console.log("P4 ATLAS eval: controlled fixtures + no clinical enablement; prohibited paths fail closed.");
}

function testOrchestrationCapabilities() {
  assert.ok(PLATFORM_CAPABILITIES.some((c) => c.id === "imaging_intelligence"));
  assert.ok(PLATFORM_CAPABILITIES.some((c) => c.id === "clinical_research"));

  const base = (over: Partial<OrchestrationRequest> = {}): OrchestrationRequest => ({
    requestId: "p4-orch-1",
    patientId: "SYNTH-P4",
    scopeKey: "demo",
    capability: "imaging_intelligence",
    agents: ["PRISM"],
    actor: { userId: "u1", role: "gp" },
    input: {},
    safety: { liveEmis: false, ehrWrite: false, autonomousPrescribe: false, hitlRequired: true },
    ...over,
  });

  const prismOk = validateOrchestrationRequest(base());
  assert.equal(prismOk.ok, true);

  const atlasOk = validateOrchestrationRequest(
    base({ capability: "clinical_research", agents: ["ATLAS"] })
  );
  assert.equal(atlasOk.ok, true);

  const stillBlockedOnCds = validateOrchestrationRequest(
    base({ capability: "cds", agents: ["PRISM"] })
  );
  assert.equal(stillBlockedOnCds.ok, false);

  console.log("P4 orchestration: imaging/research capabilities allow PRISM/ATLAS; cds still rejects.");
}

function main() {
  testRegisterHonesty();
  testCapabilityStatus();
  testPrismEval();
  testAtlasEval();
  testOrchestrationCapabilities();
  console.log("p4-prism-atlas-scaffold: PASS");
}

main();
