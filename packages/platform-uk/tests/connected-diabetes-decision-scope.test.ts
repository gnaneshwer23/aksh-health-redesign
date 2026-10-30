/**
 * INT-10 — clinical persona gate for connected diabetes Accept/Edit/Reject.
 * Run: npx tsx tests/connected-diabetes-decision-scope.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  denyUnlessConnectedDiabetesDecisionScope,
  evaluateConnectedDiabetesDecisionScope,
} from "../lib/clinical-proof/connected-diabetes-decision-scope";

const DECISION_ROUTE_FILES = [
  "app/api/patients/[id]/diabetes-journey/care-plan/[planId]/decision/route.ts",
  "app/api/patients/[id]/diabetes-intelligence/review/[reviewId]/decision/route.ts",
  "app/api/patients/[id]/medication-care/care-plan/[planId]/decision/route.ts",
  "app/api/patients/[id]/medication-care/medication-reconciliation/[runId]/decision/route.ts",
  "app/api/patients/[id]/medication-care/safety-review/[reviewId]/decision/route.ts",
  "app/api/patients/[id]/patient-360/medication-reconciliation/[runId]/decision/route.ts",
  "app/api/patients/[id]/continuous-care/escalation/[escalationId]/decision/route.ts",
  "app/api/patients/[id]/agent-intelligence/draft/[draftId]/decision/route.ts",
];

function run() {
  assert.equal(
    evaluateConnectedDiabetesDecisionScope({ persona: "gp", kind: "journey_care_plan" }).allowed,
    true
  );
  assert.equal(
    evaluateConnectedDiabetesDecisionScope({ persona: "gp", kind: "agent_draft" }).allowed,
    true
  );

  assert.equal(
    evaluateConnectedDiabetesDecisionScope({
      persona: "clinical-pharmacist",
      kind: "medcare_reconciliation",
    }).allowed,
    true
  );
  assert.equal(
    evaluateConnectedDiabetesDecisionScope({
      persona: "clinical-pharmacist",
      kind: "journey_care_plan",
    }).allowed,
    false
  );

  assert.equal(
    evaluateConnectedDiabetesDecisionScope({
      persona: "nurse",
      kind: "continuous_escalation",
    }).allowed,
    true
  );
  assert.equal(
    evaluateConnectedDiabetesDecisionScope({ persona: "nurse", kind: "glucose_review" }).allowed,
    false
  );

  assert.equal(
    evaluateConnectedDiabetesDecisionScope({ persona: null, kind: "journey_care_plan" }).allowed,
    false
  );

  const denied = denyUnlessConnectedDiabetesDecisionScope("nurse", "journey_care_plan");
  assert.ok(denied);
  assert.equal(denied.status, 403);

  const allowed = denyUnlessConnectedDiabetesDecisionScope("gp", "journey_care_plan");
  assert.equal(allowed, null);

  const root = path.join(__dirname, "..");
  for (const rel of DECISION_ROUTE_FILES) {
    const src = fs.readFileSync(path.join(root, rel), "utf8");
    assert.ok(
      src.includes("denyUnlessConnectedDiabetesDecisionScope"),
      `${rel} must call denyUnlessConnectedDiabetesDecisionScope (INT-10)`
    );
    assert.ok(
      src.includes("decidedByPersona"),
      `${rel} must surface decidedByPersona (who signed)`
    );
  }

  console.log("connected-diabetes-decision-scope: INT-10 — PASS");
}

run();
