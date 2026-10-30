/**
 * Central orchestration contracts — capability map, typed I/O validation,
 * tool boundaries, failure hooks. Reuses existing agents (no duplicates).
 */
import assert from "node:assert/strict";

import {
  PLATFORM_CAPABILITIES,
  capabilitySummaryTable,
} from "../lib/agents/contracts/capabilities";
import {
  ORCHESTRATION_TOOLS,
  assertToolAllowed,
  buildFailureResponse,
  resolveOrchestrationStack,
  validateOrchestrationRequest,
  type OrchestrationRequest,
} from "../lib/agents/contracts/orchestration";
import { AGENTS } from "../lib/agents/register";

function baseRequest(over: Partial<OrchestrationRequest> = {}): OrchestrationRequest {
  return {
    requestId: "req-1",
    patientId: "P002",
    scopeKey: "shared",
    capability: "clinical_documentation",
    agents: ["SYNTHESIS"],
    actor: { userId: "u1", role: "gp" },
    input: {},
    safety: {
      liveEmis: false,
      ehrWrite: false,
      autonomousPrescribe: false,
      hitlRequired: true,
    },
    ...over,
  };
}

assert.equal(PLATFORM_CAPABILITIES.length, 12, "exactly 12 required capabilities");
assert.equal(capabilitySummaryTable().length, 12);

const ids = new Set(PLATFORM_CAPABILITIES.map((c) => c.id));
assert.equal(ids.size, 12);

for (const cap of PLATFORM_CAPABILITIES) {
  assert.equal(cap.access.draftsRequireHitl, true, `${cap.id}: HITL required`);
  assert.equal(cap.access.autonomousPrescribe, false, `${cap.id}: no autonomous Rx`);
  assert.equal(cap.access.liveEhrWrite, false, `${cap.id}: no live EHR write`);
  assert.equal(cap.access.mayBypassAuthOrRules, false, `${cap.id}: no auth bypass`);
  assert.ok(cap.primaryAgents.length, `${cap.id}: maps to agents`);
  for (const agentId of cap.primaryAgents) {
    assert.ok(
      AGENTS.some((a) => a.id === agentId),
      `${cap.id}: agent ${agentId} exists in register`
    );
  }
  const stack = resolveOrchestrationStack(cap.id);
  assert.ok(stack.entrypoints.length, `${cap.id}: has entrypoints`);
}

assert.ok(ORCHESTRATION_TOOLS.some((t) => t.id === "guardian_gateway_evaluate"));
assert.ok(ORCHESTRATION_TOOLS.some((t) => t.id === "review_queue_enqueue"));

assert.equal(assertToolAllowed("graph_retrieval", "cds"), null);
assert.ok(assertToolAllowed("graph_retrieval", "appointment_workflow"));
assert.equal(assertToolAllowed("eval_score_append", "evaluation_quality"), null);

const ok = validateOrchestrationRequest(baseRequest());
assert.equal(ok.ok, true);

const badAgent = validateOrchestrationRequest(
  baseRequest({ capability: "patient_intake", agents: ["NEXUS"] })
);
assert.equal(badAgent.ok, false);
if (!badAgent.ok) assert.equal(badAgent.failure.code, "AGENT_NOT_ALLOWED");

const planned = validateOrchestrationRequest(
  baseRequest({ capability: "cds", agents: ["PRISM"] })
);
assert.equal(planned.ok, false);

const unsafe = baseRequest();
(unsafe.safety as { ehrWrite: boolean }).ehrWrite = true;
const liveWrite = validateOrchestrationRequest(unsafe);
assert.equal(liveWrite.ok, false);
if (!liveWrite.ok) assert.equal(liveWrite.failure.code, "PROHIBITED_ACTION");

const failure = buildFailureResponse(
  baseRequest(),
  { code: "GATEWAY_BLOCK", message: "blocked by Guardian", retryable: false },
  new Date().toISOString(),
  "corr-1"
);
assert.equal(failure.status, "blocked");
assert.equal(failure.escalation, "BLOCK");
assert.equal(failure.evaluation.autoRetrain, false);
assert.equal(failure.evaluation.modelUpdated, false);
assert.equal(failure.synthetic, true);

const classifications = new Set(PLATFORM_CAPABILITIES.map((c) => c.classification));
assert.ok(classifications.has("operational"));
assert.ok(classifications.has("partially_integrated"));
assert.ok(classifications.has("simulated_adapter"));
assert.ok(!classifications.has("missing"), "no capability in the 12 is fully missing");

console.log(
  `orchestration-contracts: 12 capabilities mapped to existing agents, tools/boundaries/eval hooks — PASS`
);
