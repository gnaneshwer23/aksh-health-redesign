/**
 * INT-08 — org / practice tenancy helpers for connected diabetes module stores.
 *
 * DB columns `organisation_id` exist on 043–048. Simulation writes now stamp the
 * resolved practice/org id (default `practice-demo`, same as review-case tenant
 * context) so RLS proofs can exercise live-org FKs without flipping
 * LIVE_ORGANISATIONS. App-layer filters remain scope_key-first; organisation_id
 * is additive defence-in-depth for Neon local-dev / simulation only.
 */

export const CONNECTED_DIABETES_SIMULATION_ORG_ID = "practice-demo";

export type ConnectedDiabetesOrgOptions = {
  organisationId?: string | null;
};

/** Resolve org id for module writes. Empty string → simulation default. */
export function resolveConnectedDiabetesOrganisationId(
  options?: ConnectedDiabetesOrgOptions | { organisationId?: string | null }
): string {
  const raw = options?.organisationId?.trim();
  if (raw) return raw;
  return CONNECTED_DIABETES_SIMULATION_ORG_ID;
}

/**
 * App-layer row visibility for rows that may carry organisation_id.
 * - requested org unset → show all (legacy JSON / unscoped reads)
 * - row org null → visible (pre-INT-08 synthetic rows)
 * - else require exact match
 */
export function rowVisibleToOrganisation(
  rowOrganisationId: string | null | undefined,
  requestedOrganisationId: string | null | undefined
): boolean {
  if (!requestedOrganisationId?.trim()) return true;
  if (rowOrganisationId == null || rowOrganisationId === "") return true;
  return rowOrganisationId === requestedOrganisationId.trim();
}
