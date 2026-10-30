/**
 * Connected journey chrome / demo step registry.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  CONNECTED_DEMO_PATIENT_ID,
  CONNECTED_JOURNEY_DISCLOSURE,
  CONNECTED_JOURNEY_STEPS,
  connectedJourneyStep,
} from "../lib/diabetes-intelligence/connected-journey-steps";
import { LIVE_ORGANISATIONS, capability } from "../lib/status/capabilities";

assert.equal(LIVE_ORGANISATIONS, 0);
assert.equal(CONNECTED_DEMO_PATIENT_ID, "P002");
assert.match(CONNECTED_JOURNEY_DISCLOSURE, /Synthetic/);
assert.match(CONNECTED_JOURNEY_DISCLOSURE, /LIVE organisations: 0/);

assert.equal(CONNECTED_JOURNEY_STEPS.length, 8);
assert.equal(
  connectedJourneyStep("orchestrate").href("P002"),
  "/dashboard/gp/patients/P002/connected-diabetes"
);
assert.equal(connectedJourneyStep("glucose").href("P002"), "/dashboard/gp/patients/P002/diabetes-intelligence");
assert.equal(connectedJourneyStep("journey").href("P002"), "/dashboard/gp/diabetes-journey/P002");
assert.equal(connectedJourneyStep("timeline").href("P002"), "/dashboard/gp/patients/P002/timeline");

for (const id of [
  "diabetes_care_journey",
  "patient_360_foundation",
  "diabetes_glucose_intelligence",
  "medication_personalised_care",
  "continuous_care_operations",
  "diabetes_agent_intelligence",
  "chronic_disease_domain_framework",
] as const) {
  assert.equal(capability(id).status, "synthetic_demo", id);
}

const root = join(__dirname, "..");
for (const rel of [
  "components/dashboard/diabetes-intelligence/ConnectedPatientChrome.tsx",
  "components/demo/workflow/ConnectedDiabetesDemo.tsx",
  "app/demo/connected-diabetes/page.tsx",
  "app/dashboard/gp/patients/[id]/timeline/page.tsx",
  "app/dashboard/gp/patients/[id]/connected-diabetes/page.tsx",
  "components/dashboard/diabetes-intelligence/ConnectedDiabetesOrchestrationWorkspace.tsx",
]) {
  const text = readFileSync(join(root, rel), "utf8");
  assert.match(text, /[Ss]ynthetic|CONNECTED_JOURNEY_DISCLOSURE/, `${rel} must disclose synthetic`);
}

console.log("connected-journey-steps: registry + synthetic honesty — PASS");
