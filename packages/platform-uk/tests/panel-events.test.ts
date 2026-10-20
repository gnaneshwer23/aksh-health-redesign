/** Panel audit events: the server writes the wording from a fixed catalogue; anything outside it is refused. */
import assert from "node:assert/strict";

import { composePanelEvent } from "../lib/audit/panel-events";

const ok = composePanelEvent({ event: "staged", subject: "risk_brief", action: "accept", agent: "HORIZON" });
assert.ok(!("error" in ok));
assert.equal((ok as { label: string }).label, "SHIELD: HORIZON risk brief staged for clinician review");
assert.equal((ok as { category: string }).category, "reviewer_note");
const decided = composePanelEvent({ event: "decided", subject: "capacity_recommendation", action: "reject", agent: "HORIZON" }) as { label: string; category: string };
assert.equal(decided.label, "SHIELD: HORIZON capacity recommendation rejected");
assert.equal(decided.category, "reviewer_decision");
assert.equal((composePanelEvent({ event: "exported", subject: "evaluation", action: "export", agent: "SHIELD" }) as { category: string }).category, "system");
assert.equal((composePanelEvent({ event: "escalated", subject: "coaching", action: "defer", agent: "NUTRITION" }) as { label: string }).label, "SHIELD: NUTRITION coaching draft escalated to a clinician");
for (const bad of [
  { event: "approved", subject: "draft", action: "accept" },
  { event: "decided", subject: "prescription", action: "accept" },
  { event: "decided", subject: "draft", action: "prescribe" },
  { event: "decided", subject: "draft", action: "accept", agent: "ROOT" },
  { event: "decided", subject: "__proto__", action: "accept" },
  { event: "decided", subject: "constructor", action: "accept" },
]) assert.ok("error" in composePanelEvent(bad), JSON.stringify(bad));
console.log("panel-events: server-written wording from a fixed catalogue; unknown events, subjects, actions and agents refused — PASS");
