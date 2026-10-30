/**
 * The agent register (lib/agents/register.ts) is complete, backed by evidence, and agrees with the code: model
 * permissions match the LLM gate, CONDUCTOR's review order comes from the register, planned agents are never run, every
 * draft-producing agent names its review item and reviewer, and the loop has the clinician in it.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";

import { llmAgentEnabled, type LlmAgent } from "../lib/ai/llm-gate";
import { AGENT_DIRECTORY } from "../lib/agents";
import {
  AGENTS,
  LOOP,
  PROHIBITED_FOR_ALL,
  REVIEW_ORDER,
  canonicalAgentId,
  toOrchestrationAgentId,
} from "../lib/agents/register";
import { resolveReviewOrder } from "../lib/clinical-proof/agent-orchestration";

const root = path.join(__dirname, "..");
const ids = AGENTS.map((a) => a.id);
assert.equal(new Set(ids).size, ids.length, "agent ids are unique");
assert.equal(AGENTS.length, 14, "12 directory agents plus VOICE and DrAssist (sub-capabilities)");

// Every directory agent is in the register (HORIZON/PATHWAY/COMPASS by their canonical names).
for (const d of AGENT_DIRECTORY) assert.ok(ids.includes(d.name as never), `${d.name} is in the register`);

for (const a of AGENTS) {
  for (const k of ["productName", "role", "onFailure", "reviewer"] as const) assert.ok(a[k].trim(), `${a.id}: ${k}`);
  assert.ok(a.requirements.length, `${a.id}: traced to PRD requirements`);
  if (a.status === "planned") {
    assert.equal(a.trigger, "never", `${a.id}: a planned agent is never run`);
    assert.equal(a.evidence.length, 0, `${a.id}: a planned agent claims no evidence`);
    assert.equal(a.environment, "none");
    continue;
  }
  assert.ok(a.inputs.length && a.outputs.length && a.reads.length, `${a.id}: inputs, outputs and data are defined`);
  assert.ok(a.evidence.length, `${a.id}: has test evidence`);
  for (const e of a.evidence) assert.ok(existsSync(path.join(root, e)), `${a.id}: evidence ${e} exists`);
  assert.notEqual(a.status, "production", `${a.id}: no agent runs on real patients until released`);
  assert.equal(a.environment, "simulation");
  if (a.partOf) assert.ok(ids.includes(a.partOf), `${a.id}: parent ${a.partOf} exists`);
}

// Drafting agents name what the clinician decides; gates are the three defined human gates.
for (const id of ["VOICE", "SYNTHESIS", "DrASSIST", "GUARDIAN", "HORIZON", "PATHWAY"] as const) {
  assert.ok(AGENTS.find((a) => a.id === id)!.reviewItem, `${id} produces a review item`);
}
assert.equal(AGENTS.find((a) => a.id === "GUARDIAN")!.humanGate, "medication_decision");
assert.equal(AGENTS.find((a) => a.id === "PATHWAY")!.humanGate, "referral_pathway");
assert.equal(AGENTS.find((a) => a.id === "PATHWAY")!.trigger, "after_note_and_codes_accepted");
assert.equal(AGENTS.find((a) => a.id === "BRIDGE")!.trigger, "after_case_accepted");
assert.ok(PROHIBITED_FOR_ALL.includes("write to a live clinical record"));

// Model permissions match the LLM gate exactly, and no agent may call a model in production.
const gateAgents: LlmAgent[] = ["SYNTHESIS", "GUARDIAN", "ORACLE", "DR_ASSIST", "NEXUS", "EQUITY"];
assert.deepEqual(AGENTS.map((a) => a.modelFlag).filter(Boolean).sort(), [...gateAgents].sort());
for (const g of gateAgents) {
  assert.equal(llmAgentEnabled(g, { AKSH_ENVIRONMENT: "production", [`ENABLE_LLM_${g}`]: "true" }), false, `${g}: never a model call in production`);
}

// CONDUCTOR's review order is the register's order (canonical HORIZON → ORACLE slot for runtime).
const mapOrder = (order: readonly string[]) => order.map((id) => toOrchestrationAgentId(id));
assert.deepEqual(resolveReviewOrder("Normal", true, true), mapOrder(REVIEW_ORDER.normal));
assert.deepEqual(resolveReviewOrder("Urgent", true, true), mapOrder(REVIEW_ORDER.urgent));
assert.equal(resolveReviewOrder("Urgent", false, false)[0], "GUARDIAN", "safety first when urgent");
assert.deepEqual(resolveReviewOrder("Normal", false, false), ["SYNTHESIS", "GUARDIAN", "ORACLE"]);
assert.equal(REVIEW_ORDER.normal[2], "HORIZON", "P1-ALIAS-01: REVIEW_ORDER uses canonical HORIZON");
assert.equal(canonicalAgentId("ORACLE"), "HORIZON");
assert.equal(toOrchestrationAgentId("HORIZON"), "ORACLE");
assert.equal(canonicalAgentId("REFERRAL"), "PATHWAY");
assert.equal(toOrchestrationAgentId("PATHWAY"), "REFERRAL");

// The loop runs through the clinician, and staging comes after the decision.
const steps = LOOP.map((s) => s.actor);
assert.ok(steps.includes("CLINICIAN"));
assert.ok(steps.indexOf("CLINICIAN") < steps.indexOf("BRIDGE"), "nothing is staged before a clinician decides");
assert.ok(steps.indexOf("CLINICIAN") < steps.indexOf("PATHWAY"), "referrals follow an accepted assessment");
assert.ok(!steps.includes("PRISM") && !steps.includes("ATLAS"), "planned agents are not in the loop");

console.log(`agent-register: ${AGENTS.length} contracts complete, evidence present, model gate and review order match the code, clinician in the loop — PASS`);
