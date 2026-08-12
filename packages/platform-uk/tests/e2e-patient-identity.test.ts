import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FLAGSHIP_CANONICAL_PATIENT_ID,
  FLAGSHIP_LEGACY_GENERATOR_ID,
  isFlagshipCanonicalPatientId,
  listLegacyAliasesForCanonical,
  resolveCanonicalPatientId,
} from "../lib/e2e/patient-identity";

describe("patient identity (P1-ID-001)", () => {
  it("resolves legacy E2P021 to canonical P002", () => {
    assert.equal(resolveCanonicalPatientId(FLAGSHIP_LEGACY_GENERATOR_ID), FLAGSHIP_CANONICAL_PATIENT_ID);
    assert.equal(resolveCanonicalPatientId("P002"), "P002");
    assert.equal(resolveCanonicalPatientId("E2P001"), "E2P001");
  });

  it("recognises flagship canonical id", () => {
    assert.equal(isFlagshipCanonicalPatientId("P002"), true);
    assert.equal(isFlagshipCanonicalPatientId("E2P021"), true);
    assert.equal(isFlagshipCanonicalPatientId("E2P022"), false);
  });

  it("lists legacy aliases for P002 only", () => {
    assert.deepEqual(listLegacyAliasesForCanonical("P002"), [FLAGSHIP_LEGACY_GENERATOR_ID]);
    assert.deepEqual(listLegacyAliasesForCanonical("E2P001"), []);
  });
});
