import assert from "node:assert/strict";

import {
  GOLDEN_PATH_COHORT,
  MULTI_PATIENT_E2E_COHORT,
  assertPartnerBlocksHonest
} from "../lib/clinical-proof/golden-path-cohort";

function run() {
  assert.ok(GOLDEN_PATH_COHORT.length >= 5 && GOLDEN_PATH_COHORT.length <= 10);
  assert.ok(MULTI_PATIENT_E2E_COHORT.length >= 5);
  assert.ok(!MULTI_PATIENT_E2E_COHORT.some((p) => p.id === "P002"), "Patel stays on dedicated UI spec");

  const ids = new Set(GOLDEN_PATH_COHORT.map((p) => p.id));
  assert.equal(ids.size, GOLDEN_PATH_COHORT.length, "golden path ids must be unique");

  const profileTags = new Set(GOLDEN_PATH_COHORT.flatMap((p) => p.profiles));
  for (const required of [
    "dvt_risk",
    "polypharmacy",
    "renal_impairment",
    "paediatric",
    "missing_clinical_info",
    "drug_allergy"
  ]) {
    assert.ok(profileTags.has(required), `golden paths must cover profile ${required}`);
  }

  for (const patient of GOLDEN_PATH_COHORT) {
    assertPartnerBlocksHonest(patient);
    assert.ok(patient.transcript.length > 20);
    assert.ok(patient.proposedDrug.length > 0);
  }

  console.log(
    `Golden-path cohort clinical-proof: ${GOLDEN_PATH_COHORT.length} patients (${MULTI_PATIENT_E2E_COHORT.length} multi-E2E); profiles=${[...profileTags].sort().join(",")}`
  );
}

void run();
