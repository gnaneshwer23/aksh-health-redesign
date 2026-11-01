/**
 * Milestone C3 — lab / pharmacy product HITL honesty.
 * Simulation only — never live NHS pathology / EPS / EHR write.
 */

export const LAB_PHARMACY_HITL_DOC = "docs/milestone-c/LAB_PHARMACY_HITL.md" as const;

export const LAB_PHARMACY_HITL_HONESTY = {
  live: false as const,
  liveNhsLab: false as const,
  livePrescribing: false as const,
  liveEps: false as const,
  liveEmis: false as const,
  ehrWrite: false as const,
  hitlRequired: true as const,
  clinicalValidationClaim: false as const,
  syntheticOnly: true as const,
  note: "Lab / pharmacy product HITL · simulation only · no live pathology / EPS / EHR write.",
} as const;

export const LAB_PHARMACY_HITL_HONESTY_LINES = [
  "Simulation / synthetic validation — not a clinical device certification.",
  "Lab and pharmacy queues are product HITL rehearsal — not live NHS pathology or EPS.",
  "HITL required · ehrWrite: false · no autonomous Rx / live EHR write.",
  "HCP multi-role sessions use synthetic patients only — acceptance ≠ clinical accuracy.",
  "Admin E2E sims remain available; this path is the discoverable clinician/lab/pharmacy loop.",
] as const;
