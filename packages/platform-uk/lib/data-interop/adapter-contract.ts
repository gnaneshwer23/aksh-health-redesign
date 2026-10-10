/**
 * Interop adapter contract formalization (C4 — docs/PHASED_BUILD_PLAN_C.md,
 * implements docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P0-4).
 *
 * Gives Domain 6 (Data & Interoperability) one formal `IntegrationAdapter`
 * shape that every existing integration (FHIR/EMIS/Medplum/AI-Gateway
 * agents/diabetes module) is representable under. This module WRAPS the
 * existing `getIntegrationAdapterRegistry()` (lib/integration-config.ts) —
 * it does not replace or re-implement any adapter's internal logic, and
 * every existing registry entry's `id`/`enabled`/`status`/`boundary` fields
 * are read, never mutated.
 *
 * Hard invariant for this phase: `LIVE_ALLOW_LIST` is empty, so every
 * `IntegrationAdapter.mode` is "staged" — nothing is hand-set to "live" for
 * anything currently disabled, and no adapter can become "live" without an
 * explicit, reviewable addition to this allow-list.
 */

import { getIntegrationAdapterRegistry } from "../integration-config";

export type IntegrationAdapterMode = "staged" | "live";

export type IntegrationAdapter = {
  systemId: string;
  resourceType: string;
  mode: IntegrationAdapterMode;
  consentScopeRequired: boolean;
  provenanceTag: string;
};

/**
 * Explicit allow-list of adapter ids permitted to report `mode: "live"`.
 * Empty in C4 — nothing in this codebase is live. Adding an id here without
 * a corresponding real live-integration change is itself a violation of the
 * hard constraint this phase exists to make checkable.
 */
const LIVE_ALLOW_LIST: ReadonlySet<string> = new Set();

/** Best-effort human label for the kind of resource each adapter moves — additive metadata only, never consumed by the adapter's own logic. */
const RESOURCE_TYPE_BY_ADAPTER_ID: Record<string, string> = {
  "fhir-export": "FHIR R4-shaped evidence bundle (internal)",
  "medplum-sync": "FHIR Bundle (Medplum rehearsal)",
  "fastapi-synthesis": "Synthetic intake transcript",
  "ehr-connectors": "EHR resource (planned, not built)",
  "emis-fhir-staging": "FHIR R4 Bundle (EHR staging queue)",
  "ehr-writeback-sim": "Simulated EHR write-back payload",
  "llm-synthesis": "SOAP DocumentReference (draft)",
  "llm-guardian": "MedicationRequest safety flags",
  "llm-oracle": "Risk score contribution (HORIZON)",
  "llm-dr-assist": "Clinical coding draft (SNOMED/ICD-10)",
  "llm-equity": "Population equity brief",
  "diabetes-module": "Diabetes risk contribution (rules-based)",
  "voice-care-synthetic": "Synthetic outbound care script",
  "patient-access-synthetic": "Access events → FHIR R4 resources; CommunicationRequest outreach (synthetic)"
};

/**
 * `getIntegrationAdapterRegistry()`'s "planned" adapters (not built at all)
 * never touch patient data, so they carry no consent-scope requirement.
 * Every built adapter operates within a patient/case context and is treated
 * as consent-scope-required by default — this is a conservative default,
 * not a claim that consent enforcement is separately wired here.
 */
function resolveConsentScopeRequired(status: string): boolean {
  return status !== "planned";
}

export function buildIntegrationAdapterRegistry(): IntegrationAdapter[] {
  const existing = getIntegrationAdapterRegistry();

  return existing.map((adapter) => ({
    systemId: adapter.id,
    resourceType: RESOURCE_TYPE_BY_ADAPTER_ID[adapter.id] ?? `unmapped resource (${adapter.id})`,
    mode: LIVE_ALLOW_LIST.has(adapter.id) ? "live" : "staged",
    consentScopeRequired: resolveConsentScopeRequired(adapter.status),
    provenanceTag: adapter.defaultMode
  }));
}

/** True iff any formalized adapter reports mode "live" — the single array this contract exists to make answerable in one read. */
export function hasAnyLiveIntegrationAdapter(): boolean {
  return buildIntegrationAdapterRegistry().some((adapter) => adapter.mode === "live");
}
