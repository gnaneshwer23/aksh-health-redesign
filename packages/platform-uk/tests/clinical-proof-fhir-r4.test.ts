import assert from "node:assert/strict";

import {
  CLINICAL_PROOF_FHIR_R4_TYPES,
  assertFhirR4Valid,
  validateFhirR4Bundle,
  validateFhirR4Resource
} from "../lib/clinical-proof/fhir-r4-validator";
import {
  buildClinicalProofFhirR4Bundle,
  buildClinicalProofFhirR4Fixtures
} from "../lib/clinical-proof/fhir-r4-fixtures";
import { buildAcceptedFhirR4StagingBundle } from "../lib/clinical-proof/staged-fhir";

function run() {
  const fixtures = buildClinicalProofFhirR4Fixtures();

  for (const type of CLINICAL_PROOF_FHIR_R4_TYPES) {
    const result = validateFhirR4Resource(fixtures[type]);
    assert.equal(result.ok, true, `${type} fixture must pass FHIR R4: ${JSON.stringify(result.issues)}`);
  }

  const bundle = buildClinicalProofFhirR4Bundle();
  const bundleResult = validateFhirR4Bundle(bundle);
  assert.equal(bundleResult.ok, true, JSON.stringify(bundleResult.results.filter((r) => !r.ok)));
  assertFhirR4Valid(bundle, "clinical-proof-fixture-bundle");

  // Invalid resources must fail CI
  const invalidCondition = validateFhirR4Resource({
    resourceType: "Condition",
    id: "bad",
    code: { text: "missing clinicalStatus and subject" }
  });
  assert.equal(invalidCondition.ok, false);
  assert.ok(invalidCondition.issues.length >= 1);

  const invalidMedReq = validateFhirR4Resource({
    resourceType: "MedicationRequest",
    id: "bad-med",
    status: "draft",
    intent: "order",
    subject: { reference: "Patient/P002" }
    // missing medication*
  });
  assert.equal(invalidMedReq.ok, false);

  const invalidFlag = validateFhirR4Resource({
    resourceType: "Flag",
    id: "bad-flag",
    status: "active"
  });
  assert.equal(invalidFlag.ok, false);

  const acceptBundle = buildAcceptedFhirR4StagingBundle({
    caseId: "fhir-ci-accept",
    acceptedBy: "Dr Proof",
    resourceTypes: [...CLINICAL_PROOF_FHIR_R4_TYPES]
  });
  assert.equal(acceptBundle.entry.length, CLINICAL_PROOF_FHIR_R4_TYPES.length);
  assertFhirR4Valid(acceptBundle, "accept-staging-all-types");

  let threw = false;
  try {
    assertFhirR4Valid({ resourceType: "Observation", id: "x" }, "should-fail");
  } catch {
    threw = true;
  }
  assert.equal(threw, true, "assertFhirR4Valid must throw on invalid Observation");

  console.log(
    `FHIR R4 schema validation passed for ${CLINICAL_PROOF_FHIR_R4_TYPES.length} resource types (Zod R4 gates; not HL7 Java Validator JAR).`
  );
}

void run();
