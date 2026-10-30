/**
 * Pure catalog + control-default checks for guided production-workflow demos.
 * No database. Ensures synthetic disclosure metadata and HITL framing stay intact.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  WORKFLOW_DEMOS,
  demoControlDefaults,
  workflowDemo,
} from "../lib/workflow-demos";
import { PUBLIC_DEMOS } from "../lib/demo-catalog";
import { capability } from "../lib/status/capabilities";

const root = join(__dirname, "..");

assert.equal(WORKFLOW_DEMOS.length, 2);
const slot = workflowDemo("slot-fill");
const glucose = workflowDemo("glucose");

assert.equal(slot.capabilityId, "slot_fill");
assert.equal(glucose.capabilityId, "cgm_monitoring");
assert.equal(capability(slot.capabilityId).status, "production");
assert.equal(capability(glucose.capabilityId).status, "production");

for (const entry of WORKFLOW_DEMOS) {
  assert.ok(entry.controls.some((c) => c.kind === "checkpoint" && c.key === "step"));
  assert.ok(entry.controls.some((c) => c.key === "decision"));
  assert.ok(entry.variants.length >= 1);
  assert.match(entry.interaction, /decide|review|Step/i);
  assert.ok(entry.tags.includes("synthetic"));
}

const base = demoControlDefaults(slot);
assert.equal(base.step, "event");
assert.equal(base.decision, "offer");
const handoff = demoControlDefaults(slot, "handoff");
assert.equal(handoff.step, "result");
assert.equal(handoff.decision, "handoff");

assert.equal(PUBLIC_DEMOS[0]!.id, "slot-fill");
assert.equal(PUBLIC_DEMOS[1]!.id, "glucose");
assert.ok(PUBLIC_DEMOS.some((d) => d.id === "connected-diabetes"));

const files = [
  "app/demo/page.tsx",
  "app/demo/slot-fill/page.tsx",
  "app/demo/glucose/page.tsx",
  "app/demo/connected-diabetes/page.tsx",
  "components/demo/workflow/WorkflowDemoPlayer.tsx",
  "components/demo/workflow/SlotFillDemo.tsx",
  "components/demo/workflow/GlucoseMonitorDemo.tsx",
  "components/demo/workflow/ConnectedDiabetesDemo.tsx",
  "app/page.tsx",
];
for (const rel of files) {
  const text = readFileSync(join(root, rel), "utf8");
  if (rel === "app/page.tsx") {
    assert.match(text, /Explore a demo/);
    assert.match(text, /Diabetes reviews/);
    assert.match(text, /\/demo\/slot-fill/);
    assert.match(text, /\/demo\/glucose/);
    continue;
  }
  assert.match(text, /[Ss]ynthetic/, `${rel} must disclose synthetic data`);
}

const player = readFileSync(join(root, "components/demo/workflow/WorkflowDemoPlayer.tsx"), "utf8");
assert.match(player, /Staff \/ clinician decide/);
assert.match(player, /No live patient data/);
assert.match(player, /capture/);

const glucoseUi = readFileSync(join(root, "components/demo/workflow/GlucoseMonitorDemo.tsx"), "utf8");
assert.match(glucoseUi, /does not change treatment/i);

const slotUi = readFileSync(join(root, "components/demo/workflow/SlotFillDemo.tsx"), "utf8");
assert.match(slotUi, /never contacts patients/i);

console.log("workflow-demos: catalog, defaults, synthetic disclosure — PASS");
