/**
 * Milestone C5 — COMPASS / ICS brief honesty.
 * Decision-support + sandbox labels only. Does not claim certified ICS routing
 * or clinical validation. Reuses C2 honesty-strip tone.
 */

export const COMPASS_HONESTY_DOC = "docs/milestone-c/COMPASS_HONESTY.md" as const;

export const COMPASS_HONESTY_LINES = [
  "COMPASS ICS / population briefs are decision-support drafts in a synthetic sandbox — not certified ICS routing.",
  "Simulation / synthetic validation — not a clinical device certification.",
  "Aggregate / small-cell suppressed only · never patient-identifiable · HITL before operational staging.",
  "HITL required · ehrWrite: false · no autonomous population write-back.",
  "Legacy API id EQUITY remains an alias; product-facing label is COMPASS.",
] as const;

export type CompassCapabilities = {
  decisionSupportOnly: true;
  sandbox: true;
  aggregateOnly: true;
  smallCellSuppression: true;
  hitlRequired: true;
  ehrWrite: false;
  clinicalValidationClaim: false;
  certifiedIcsRouting: false;
  liveEmis: false;
  productLabel: "COMPASS";
  legacyAlias: "EQUITY";
  apiPaths: readonly ["/api/agents/compass", "/api/agents/equity"];
  docPath: typeof COMPASS_HONESTY_DOC;
};

export const COMPASS_CAPABILITIES: CompassCapabilities = {
  decisionSupportOnly: true,
  sandbox: true,
  aggregateOnly: true,
  smallCellSuppression: true,
  hitlRequired: true,
  ehrWrite: false,
  clinicalValidationClaim: false,
  certifiedIcsRouting: false,
  liveEmis: false,
  productLabel: "COMPASS",
  legacyAlias: "EQUITY",
  apiPaths: ["/api/agents/compass", "/api/agents/equity"],
  docPath: COMPASS_HONESTY_DOC,
};

export const COMPASS_NON_CLAIMS = [
  "Not certified ICS routing or commissioning authority.",
  "Not clinical validation or device certification.",
  "Not patient-level case notes or identifiable spill.",
  "Not live EMIS / EHR / population write-back.",
] as const;

export type CompassHonestyModel = {
  surface: string;
  capabilities: CompassCapabilities;
  lines: readonly string[];
  nonClaims: readonly string[];
  clinicalValidationClaim: false;
  certifiedIcsRouting: false;
  ehrWrite: false;
};

export function buildCompassHonestyModel(surface = "COMPASS population brief"): CompassHonestyModel {
  return {
    surface,
    capabilities: COMPASS_CAPABILITIES,
    lines: COMPASS_HONESTY_LINES,
    nonClaims: COMPASS_NON_CLAIMS,
    clinicalValidationClaim: false,
    certifiedIcsRouting: false,
    ehrWrite: false,
  };
}
