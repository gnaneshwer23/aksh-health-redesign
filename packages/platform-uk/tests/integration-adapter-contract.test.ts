/**
 * C4 — Interop adapter contract formalization (docs/PHASED_BUILD_PLAN_C.md,
 * implements docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P0-4).
 * Honest invariant: this wraps, never replaces, the existing
 * getIntegrationAdapterRegistry() — one IntegrationAdapter per existing
 * entry, and every mode is "staged" (nothing is live anywhere).
 */

import assert from "node:assert/strict";

import {
  buildIntegrationAdapterRegistry,
  hasAnyLiveIntegrationAdapter
} from "../lib/data-interop/adapter-contract";
import { getIntegrationAdapterRegistry } from "../lib/integration-config";
import { buildIntegrationBoundaryContract } from "../lib/integration-boundary-contract";

function testOneToOneWithExistingRegistry() {
  const existing = getIntegrationAdapterRegistry();
  const formalized = buildIntegrationAdapterRegistry();

  assert.equal(formalized.length, existing.length, "formalized adapter registry must be one-to-one with the existing registry — nothing dropped or invented");

  const existingIds = existing.map((a) => a.id).sort();
  const formalizedIds = formalized.map((a) => a.systemId).sort();
  assert.deepEqual(formalizedIds, existingIds, "every existing adapter id must appear exactly once as a formalized systemId");

  for (const adapter of formalized) {
    assert.ok(typeof adapter.resourceType === "string" && adapter.resourceType.length > 0, `${adapter.systemId}: resourceType must be a non-empty string`);
    assert.ok(typeof adapter.provenanceTag === "string" && adapter.provenanceTag.length > 0, `${adapter.systemId}: provenanceTag must be a non-empty string`);
    assert.equal(typeof adapter.consentScopeRequired, "boolean", `${adapter.systemId}: consentScopeRequired must be a boolean`);
  }

  console.log(`Interop adapter contract: ${formalized.length} formalized adapters, one-to-one with getIntegrationAdapterRegistry().`);
}

function testNothingIsLiveAnywhere() {
  const formalized = buildIntegrationAdapterRegistry();
  for (const adapter of formalized) {
    assert.equal(adapter.mode, "staged", `${adapter.systemId}: mode must be "staged" — C4's allow-list is empty, nothing is live`);
  }
  assert.equal(hasAnyLiveIntegrationAdapter(), false, "hasAnyLiveIntegrationAdapter() must answer false — this is the single-array check the migration plan asks for");

  console.log("Interop adapter contract: every adapter mode is 'staged' — hasAnyLiveIntegrationAdapter() === false.");
}

function testBoundaryContractFormalizedAdaptersAdditive() {
  const before = buildIntegrationBoundaryContract({ generatedAt: "2026-01-01T00:00:00.000Z", generatedBy: "C4 test" });
  const { formalizedAdapters, ...rest } = before;

  assert.ok(Array.isArray(formalizedAdapters) && formalizedAdapters.length > 0, "formalizedAdapters must be present and non-empty");

  // Every pre-existing field must still be present and typed as before — this
  // is an additive-only change, not a reshape of the existing contract.
  assert.equal(rest.artifactType, "aksh-uk-eu-integration-boundary-contract");
  assert.equal(typeof rest.activeFlags, "object");
  assert.ok(Array.isArray(rest.externalAdapters));
  assert.ok(Array.isArray(rest.internalEvidenceAdapters));
  assert.ok(Array.isArray(rest.disabledByDefault));
  assert.ok(Array.isArray(rest.rehearsalRules));

  console.log("Interop adapter contract: buildIntegrationBoundaryContract()'s formalizedAdapters field is additive; every pre-existing field is unchanged.");
}

function main() {
  testOneToOneWithExistingRegistry();
  testNothingIsLiveAnywhere();
  testBoundaryContractFormalizedAdaptersAdditive();
}

main();
