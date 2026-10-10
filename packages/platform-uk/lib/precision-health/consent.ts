import { z } from "zod";

import { MODALITY_IDS, modalityIdSchema } from "./modalities";

/**
 * Purpose-bound consent registry (Phase 1).
 * Extends onboarding checkboxes with enforceable purpose + modality grants.
 */

export const PURPOSE_CODES = [
  "care_delivery",
  "care_improvement",
  "clinical_research_deidentified",
  "population_analytics",
  "coaching_wellness",
  "risk_stratification_demo"
] as const;

export type PurposeCode = (typeof PURPOSE_CODES)[number];

export const purposeCodeSchema = z.enum(PURPOSE_CODES);

export const PURPOSE_CATALOGUE: Record<
  PurposeCode,
  { label: string; description: string; allowsClinicalWrite: false }
> = {
  care_delivery: {
    label: "Care delivery",
    description: "Use consented data to support clinician-reviewed care drafts under HITL.",
    allowsClinicalWrite: false
  },
  care_improvement: {
    label: "Care improvement",
    description: "Anonymised / aggregate learning events — no auto-retrain, no EHR write.",
    allowsClinicalWrite: false
  },
  clinical_research_deidentified: {
    label: "De-identified research",
    description: "Research evaluation exports under governance boundaries only.",
    allowsClinicalWrite: false
  },
  population_analytics: {
    label: "Population analytics",
    description: "Regional aggregate risk and equity overlays (demo or pilot).",
    allowsClinicalWrite: false
  },
  coaching_wellness: {
    label: "Wellness coaching",
    description:
      "Nutrition/sleep/exercise/mental-health coaching drafts — not clinical advice; HITL if escalated.",
    allowsClinicalWrite: false
  },
  risk_stratification_demo: {
    label: "Risk stratification (demo)",
    description: "ORACLE / risk-state model demos on synthetic or consented pilot data.",
    allowsClinicalWrite: false
  }
};

export const consentGrantStatusSchema = z.enum(["active", "revoked"]);

export const consentGrantInputSchema = z.object({
  patientId: z.string().min(1),
  purposeCode: purposeCodeSchema,
  modalities: z.array(modalityIdSchema).min(1),
  grantedBy: z.string().min(1),
  notes: z.string().max(2000).optional(),
  /** When true, creates a revoke of an existing grant id */
  revokeGrantId: z.string().optional()
});

export type ConsentGrantInput = z.infer<typeof consentGrantInputSchema>;

export type ConsentGrant = {
  id: string;
  patientId: string;
  purposeCode: PurposeCode;
  modalities: Array<(typeof MODALITY_IDS)[number]>;
  status: "active" | "revoked";
  grantedBy: string;
  grantedAt: string;
  revokedAt: string | null;
  revokedBy: string | null;
  notes: string | null;
  ehrWrite: false;
  hitlRequired: true;
};

export function isModalityGranted(
  grants: ConsentGrant[],
  patientId: string,
  modality: (typeof MODALITY_IDS)[number],
  purposeCode?: PurposeCode
): boolean {
  return grants.some(
    (g) =>
      g.patientId === patientId &&
      g.status === "active" &&
      g.modalities.includes(modality) &&
      (purposeCode ? g.purposeCode === purposeCode : true)
  );
}

export function listPurposeCatalogue() {
  return PURPOSE_CODES.map((code) => ({
    code,
    ...PURPOSE_CATALOGUE[code]
  }));
}
