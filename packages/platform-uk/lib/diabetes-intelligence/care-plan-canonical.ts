/**
 * INT-03 follow-through — canonical care-plan write path.
 *
 * Physical SoT: `aksh.care_plan_records`. Journey drafts write here directly;
 * medcare template drafts keep a satellite `medcare_care_plans` row and mirror
 * into this store via care-plan-bridge (`canonical_plan_id` / `medcare_plan_id`).
 * No Neon drops — additive `entry_surface` + link columns (051, local-dev/sim only).
 * HITL Accept/Edit/Reject + ehrWrite=false unchanged.
 */

import {
  createCarePlanRecord,
  decideCarePlan,
  getCarePlan,
  getCarePlanByMedcareLink,
  listCarePlans,
} from "./repository";
import type {
  CarePlanDecisionAction,
  CarePlanEntrySurface,
  CarePlanRecord,
  CarePlanSection,
  MissingDataIndicator,
} from "./types";
import type { ClinicalPersona } from "../user-scope";

export const CARE_PLAN_CANONICAL_STORE = "care_plan_records" as const;
export const CARE_PLAN_MEDCARE_SATELLITE_STORE = "medcare_care_plans" as const;

export type { CarePlanEntrySurface };

export type DraftCanonicalCarePlanResult = {
  plan: CarePlanRecord;
  physicalStore: typeof CARE_PLAN_CANONICAL_STORE;
  entrySurface: CarePlanEntrySurface;
  ehrWrite: false;
  hitlRequired: true;
};

export type DecideCanonicalCarePlanResult = Awaited<ReturnType<typeof decideCarePlan>> & {
  physicalStore: typeof CARE_PLAN_CANONICAL_STORE;
  ehrWrite: false;
};

/** Draft into the single physical care-plan SoT. */
export async function draftCanonicalCarePlan(
  input: {
    patientId: string;
    patientLabel: string;
    sections: CarePlanSection[];
    safetyNotes: string[];
    missingData: MissingDataIndicator[];
    createdBy: string;
    entrySurface: CarePlanEntrySurface;
    medcarePlanId?: string | null;
  },
  options?: { scopeKey?: string; organisationId?: string | null }
): Promise<DraftCanonicalCarePlanResult> {
  const plan = await createCarePlanRecord(
    {
      patientId: input.patientId,
      patientLabel: input.patientLabel,
      sections: input.sections,
      safetyNotes: input.safetyNotes,
      missingData: input.missingData,
      createdBy: input.createdBy,
      entrySurface: input.entrySurface,
      medcarePlanId: input.medcarePlanId ?? null,
    },
    options
  );
  return {
    plan,
    physicalStore: CARE_PLAN_CANONICAL_STORE,
    entrySurface: input.entrySurface,
    ehrWrite: false,
    hitlRequired: true,
  };
}

/** Decide a canonical plan (journey or medcare-mirrored) via the single physical store. */
export async function decideCanonicalCarePlan(
  input: {
    planId: string;
    action: CarePlanDecisionAction;
    actor: string;
    actorPersona?: ClinicalPersona | null;
    reason?: string;
    editedSections?: CarePlanSection[];
    skipFollowUp?: boolean;
  },
  options?: { scopeKey?: string; organisationId?: string | null }
): Promise<DecideCanonicalCarePlanResult> {
  const result = await decideCarePlan(input, options);
  return {
    ...result,
    physicalStore: CARE_PLAN_CANONICAL_STORE,
    ehrWrite: false,
  };
}

export async function findCanonicalPlanByMedcareId(
  medcarePlanId: string,
  options?: { scopeKey?: string }
): Promise<CarePlanRecord | null> {
  return getCarePlanByMedcareLink(medcarePlanId, options);
}

export async function getCanonicalCarePlan(
  planId: string,
  options?: { scopeKey?: string }
): Promise<CarePlanRecord | null> {
  return getCarePlan(planId, options);
}

export { listCarePlans as listCanonicalCarePlans };
