import assert from "node:assert/strict";

import { canRecordMedicationReview, evaluateDecisionScope } from "../lib/clinical-decision-scope";
import { deriveHumanGates } from "../lib/human-gates";
import { reviewCases } from "../lib/mock-data";
import type { HumanGateDecision, ReviewCase } from "../lib/types";
import { mapSessionRoleToAppRole, mapSessionRoleToClinicalPersona } from "../lib/user-scope";

// REQ-021 / EC-CLIN-3: disposition rights by clinical persona, enforced server-side.

const escalation = reviewCases.find((c) => c.id === "case-006") as ReviewCase;
assert.ok(escalation, "fixture case-006 (respiratory escalation) must exist");
assert.ok(
  deriveHumanGates(escalation).some((g) => g.id === "red_flag_escalation" && g.status === "required"),
  "case-006 must require the red-flag gate"
);

const ungated = reviewCases.find((c) => deriveHumanGates(c).every((g) => g.status !== "required")) as ReviewCase;
assert.ok(ungated, "need a fixture case with no required gates");

const pending = (c: ReviewCase): ReviewCase => ({ ...c, status: "pending_review", humanGateDecisions: [] });
const decide = (c: ReviewCase, patch: Partial<ReviewCase>): ReviewCase => ({ ...c, ...patch });
const gate = (id: HumanGateDecision["id"]): HumanGateDecision => ({
  id,
  status: "confirmed",
  decidedAt: "2026-10-10T09:00:00Z",
  decidedBy: "test",
});

// Persona mapping: AppRole still collapses, persona does not.
for (const role of ["gp", "nurse", "clinical-pharmacist", "clinical_reviewer"]) {
  assert.equal(mapSessionRoleToAppRole(role), "clinical_reviewer");
}
assert.equal(mapSessionRoleToClinicalPersona("gp"), "gp");
assert.equal(mapSessionRoleToClinicalPersona("clinical_reviewer"), "gp");
assert.equal(mapSessionRoleToClinicalPersona("nurse"), "nurse");
assert.equal(mapSessionRoleToClinicalPersona("clinical-pharmacist"), "clinical-pharmacist");
assert.equal(mapSessionRoleToClinicalPersona("patient"), null);
assert.equal(mapSessionRoleToClinicalPersona("researcher"), null);

// GP: full rights.
{
  const existing = pending(escalation);
  const next = decide(existing, { status: "accepted", humanGateDecisions: [gate("red_flag_escalation")] });
  assert.deepEqual(evaluateDecisionScope({ persona: "gp", existing, next }), { allowed: true });
}

// Nurse: cannot change disposition or confirm any gate; may save non-decision edits.
{
  const existing = pending(ungated);
  assert.equal(
    evaluateDecisionScope({ persona: "nurse", existing, next: decide(existing, { status: "accepted" }) }).allowed,
    false,
    "nurse must not Accept"
  );
  assert.equal(
    evaluateDecisionScope({ persona: "nurse", existing, next: decide(existing, { status: "rejected" }) }).allowed,
    false,
    "nurse must not Reject"
  );
  assert.equal(
    evaluateDecisionScope({
      persona: "nurse",
      existing,
      next: decide(existing, { humanGateDecisions: [gate("medication_decision")] }),
    }).allowed,
    false,
    "nurse must not confirm the medication gate"
  );
  assert.deepEqual(
    evaluateDecisionScope({ persona: "nurse", existing, next: decide(existing, { summary: "observation added" }) }),
    { allowed: true },
    "nurse may save without a disposition"
  );
}

// Pharmacist: medication gate only; no disposition while a GP gate is required.
{
  const plain = pending(ungated);
  assert.deepEqual(
    evaluateDecisionScope({
      persona: "clinical-pharmacist",
      existing: plain,
      next: decide(plain, { humanGateDecisions: [gate("medication_decision")] }),
    }),
    { allowed: true }
  );
  assert.deepEqual(
    evaluateDecisionScope({ persona: "clinical-pharmacist", existing: plain, next: decide(plain, { status: "accepted" }) }),
    { allowed: true },
    "pharmacist may accept a case with no GP gate pending"
  );

  const gated = pending(escalation);
  const confirmRedFlag = evaluateDecisionScope({
    persona: "clinical-pharmacist",
    existing: gated,
    next: decide(gated, { humanGateDecisions: [gate("red_flag_escalation")] }),
  });
  assert.equal(confirmRedFlag.allowed, false, "pharmacist must not confirm red-flag gate");

  const acceptGated = evaluateDecisionScope({
    persona: "clinical-pharmacist",
    existing: gated,
    next: decide(gated, { status: "accepted" }),
  });
  assert.equal(acceptGated.allowed, false, "pharmacist must not dispose a case with a required GP gate");
}

// Medication review route guard.
assert.equal(canRecordMedicationReview("clinical-pharmacist").allowed, true);
assert.equal(canRecordMedicationReview("gp").allowed, true);
assert.equal(canRecordMedicationReview("nurse").allowed, false);
assert.equal(canRecordMedicationReview(null).allowed, false);

console.log("clinical-decision-scope: REQ-021 / EC-CLIN-3 checks — PASS");
