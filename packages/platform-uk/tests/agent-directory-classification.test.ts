/**
 * C3 — Agent directory classification (docs/PHASED_BUILD_PLAN_C.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P0-3).
 * Honest invariant (spec §13/§13.1/§54): this is a classification pass, not a
 * pruning pass — the 12-agent directory count and every entry's presence must
 * never regress, and every entry must stay `keepStatus: "keep"`.
 */

import assert from "node:assert/strict";

import { AGENT_DIRECTORY, type AgentKind, type AgentLayer } from "../lib/agents";

const VALID_KINDS: AgentKind[] = [
  "orchestration",
  "intelligence_llm",
  "intervention",
  "data_interop",
  "safety_governance"
];

const VALID_LAYERS: AgentLayer[] = [
  "patient_state",
  "intelligence",
  "decision",
  "intervention",
  "learning",
  "data_interop",
  "safety_governance"
];

function testAgentCountAndNamesUnchanged() {
  assert.equal(AGENT_DIRECTORY.length, 12, "AGENT_DIRECTORY must stay exactly 12 entries — zero deletions, zero additions");

  const expectedNames = [
    "CANVAS",
    "SYNTHESIS",
    "BRIDGE",
    "NEXUS",
    "GUARDIAN",
    "PRISM",
    "HORIZON",
    "PATHWAY",
    "COMPASS",
    "ATLAS",
    "SHIELD",
    "CONDUCTOR"
  ];
  const actualNames: string[] = AGENT_DIRECTORY.map((a) => a.name);
  for (const name of expectedNames) {
    assert.ok(actualNames.includes(name), `AGENT_DIRECTORY must still include ${name} — no agent-directory deletions permitted`);
  }

  console.log("Agent directory classification: 12-agent count and every named entry unchanged.");
}

function testEveryEntryClassifiedAndKept() {
  for (const agent of AGENT_DIRECTORY) {
    assert.ok(VALID_KINDS.includes(agent.kind), `${agent.name}: kind must be one of ${VALID_KINDS.join("|")}, got ${agent.kind}`);
    assert.ok(Array.isArray(agent.layer) && agent.layer.length > 0, `${agent.name}: layer must be a non-empty array`);
    for (const layer of agent.layer) {
      assert.ok(VALID_LAYERS.includes(layer), `${agent.name}: layer entry "${layer}" must be one of ${VALID_LAYERS.join("|")}`);
    }
    assert.equal(agent.keepStatus, "keep", `${agent.name}: keepStatus must be "keep" — no agent is dropped or reclassified as removed by C3`);
  }

  console.log("Agent directory classification: every entry has kind/layer/keepStatus, and every keepStatus is 'keep'.");
}

function testKnownKindAssignmentsPerGapAnalysisTable() {
  // Spot-checks the docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md §2.1 mapping this
  // phase's classification is populated from — a future PR that silently
  // reclassifies CONDUCTOR away from orchestration, or GUARDIAN/SHIELD away
  // from safety_governance, fails this test.
  const byName = Object.fromEntries(AGENT_DIRECTORY.map((a) => [a.name, a]));

  assert.equal(byName.CONDUCTOR.kind, "orchestration");
  assert.equal(byName.GUARDIAN.kind, "safety_governance");
  assert.equal(byName.SHIELD.kind, "safety_governance");
  assert.equal(byName.BRIDGE.kind, "data_interop");
  assert.equal(byName.PATHWAY.kind, "intervention");
  for (const name of ["HORIZON", "SYNTHESIS", "NEXUS", "CANVAS", "PRISM", "ATLAS", "COMPASS"]) {
    assert.equal(byName[name].kind, "intelligence_llm", `${name} must be classified intelligence_llm per the gap-analysis table`);
  }

  console.log("Agent directory classification: kind assignments match the gap-analysis §2.1 mapping.");
}

function testDiabetesSignalBuildersNotAddedAsAgents() {
  // Hard constraint: diabetes signals stay tools, never promoted into
  // AGENT_DIRECTORY.
  const diabetesToolNames = [
    "glucose",
    "hba1c",
    "insulin",
    "glp1",
    "nutrition",
    "exercise",
    "behaviour",
    "complications",
    "prevention"
  ];
  const directoryNames = AGENT_DIRECTORY.map((a) => a.name.toLowerCase());
  for (const tool of diabetesToolNames) {
    assert.ok(!directoryNames.includes(tool), `Diabetes signal builder "${tool}" must never appear in AGENT_DIRECTORY`);
  }

  console.log("Agent directory classification: diabetes signal builders confirmed absent from AGENT_DIRECTORY.");
}

function main() {
  testAgentCountAndNamesUnchanged();
  testEveryEntryClassifiedAndKept();
  testKnownKindAssignmentsPerGapAnalysisTable();
  testDiabetesSignalBuildersNotAddedAsAgents();
}

main();
