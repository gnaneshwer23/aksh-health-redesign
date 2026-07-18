import assert from "node:assert/strict";

import { validateAkshDraftBundle, validateFhirShapedResource, WORKFLOW_TO_FHIR } from "../lib/clinical-proof/fhir-shape";
import { reviewCases } from "../lib/mock-data";

function run() {
  assert.equal(WORKFLOW_TO_FHIR["SOAP note"], "DocumentReference");
  assert.equal(WORKFLOW_TO_FHIR.Consultation, "Encounter");

  const validCondition = validateFhirShapedResource({
    resourceType: "Condition",
    id: "condition-proof",
    codeText: "Type 2 diabetes mellitus",
    clinicalStatus: "active"
  });
  assert.equal(validCondition.ok, true);

  const invalid = validateFhirShapedResource({
    resourceType: "Condition",
    id: "x"
  });
  assert.equal(invalid.ok, false);
  assert.ok(invalid.issues.some((i) => i.path === "codeText"));

  const audit = validateFhirShapedResource({
    resourceType: "AuditEvent",
    id: "ae-1",
    type: { code: "rest" },
    recorded: new Date().toISOString()
  });
  assert.equal(audit.ok, true);

  const seeded = reviewCases[0];
  assert.ok(seeded?.draft);
  const bundle = validateAkshDraftBundle(seeded!.draft);
  assert.equal(bundle.ok, true, JSON.stringify(bundle.results.filter((r) => !r.ok)));

  console.log("FHIR-shaped validation gates passed (not a full HL7 validator).");
}

void run();
