/**
 * Release readiness: numeric targets measured against the agent loop, and no agent is ever "ready" on numbers alone —
 * targets must be confirmed by the clinical safety officer and every sign-off recorded.
 */
import assert from "node:assert/strict";

import { evaluateReadiness } from "../lib/agents/readiness";
import { AGENTS } from "../lib/agents/register";
import { tallyLoop } from "../lib/clinical-spine/loop-outcomes";
import type { ReviewCase } from "../lib/types";

const run = (n: number, synthesis: "ACCEPTED" | "REJECTED", edited = false) =>
  ({
    id: `c-${n}`,
    status: "pending_review",
    agentRun: { queuePriority: "Normal", pendingReferrals: [], missingLabs: [] },
    reviewQueueItems: [{ id: `c-${n}-soap`, agentId: "SYNTHESIS", itemType: "soap_note", status: synthesis, title: "", summary: "", metadata: { agent: "SYNTHESIS" }, ...(edited ? { originalContent: "x" } : {}) }],
  }) as unknown as ReviewCase;

// Every runnable agent has release criteria; drafting agents have numeric targets; planned agents have none.
for (const a of AGENTS) {
  if (a.status === "planned") assert.equal(a.release, undefined, `${a.id}: planned agents have no release criteria`);
  else assert.ok(a.release && a.release.signOffs.length >= 3, `${a.id}: release criteria with sign-offs`);
}
for (const id of ["SYNTHESIS", "DrASSIST", "GUARDIAN", "HORIZON", "PATHWAY"] as const) {
  const r = AGENTS.find((a) => a.id === id)!.release!;
  assert.ok(r.tallyName && r.minDecided, `${id}: numeric targets`);
  assert.equal(r.targetsConfirmedBy, null, `${id}: targets are proposed until the clinical safety officer confirms them`);
}

// 60 decided SYNTHESIS drafts: 57 accepted (6 edited), 3 rejected → 5% rejection, 85% accepted unedited.
const cases = [...Array.from({ length: 57 }, (_, i) => run(i, "ACCEPTED", i < 6)), ...Array.from({ length: 3 }, (_, i) => run(100 + i, "REJECTED"))];
const synthesis = evaluateReadiness(tallyLoop(cases)).find((a) => a.id === "SYNTHESIS")!;
const c = Object.fromEntries(synthesis.criteria.map((x) => [x.name, x]));
assert.equal(c["Decided drafts"]!.actual, "60");
assert.equal(c["Decided drafts"]!.met, true);
assert.equal(c["Rejection rate"]!.actual, "5%");
assert.equal(c["Rejection rate"]!.met, true);
assert.equal(c["Accepted without edits"]!.actual, "85%");
assert.equal(c["Accepted without edits"]!.met, true);
assert.equal(synthesis.ready, false, "numbers alone never make an agent ready");
assert.ok(synthesis.outstanding.some((o) => o.startsWith("Targets confirmed")));
assert.ok(synthesis.outstanding.some((o) => o.startsWith("Clinical safety case")));

// Too few decisions: the rate criteria are not met even if the observed rate looks good.
const few = evaluateReadiness(tallyLoop(cases.slice(0, 10))).find((a) => a.id === "SYNTHESIS")!;
assert.equal(few.criteria.find((x) => x.name === "Rejection rate")!.met, false);
// Recorded sign-offs are counted; targets still need confirmation.
const signed = evaluateReadiness(tallyLoop(cases), { SYNTHESIS: AGENTS.find((a) => a.id === "SYNTHESIS")!.release!.signOffs }).find((a) => a.id === "SYNTHESIS")!;
assert.deepEqual(signed.outstanding.map((o) => o.split(":")[0]), ["Targets confirmed by the clinical safety officer"]);
// No agent is ready today.
assert.ok(evaluateReadiness(tallyLoop([])).every((a) => !a.ready));
console.log("agent-readiness: criteria for every runnable agent, numeric targets measured on decided drafts, never ready on numbers alone — PASS");
