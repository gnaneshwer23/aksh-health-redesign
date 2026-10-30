/**
 * INT-03 follow-through — mirror medcare template plans into the canonical store.
 *
 * Medcare retains `medcare_care_plans` for template_id / goals / education metadata.
 * Connected HITL SoT is `care_plan_records` (single write path via care-plan-canonical).
 * Additive link columns only (051); no Neon drops; ehrWrite stays false.
 */

import {
  CARE_PLAN_CANONICAL_STORE,
  CARE_PLAN_MEDCARE_SATELLITE_STORE,
  draftCanonicalCarePlan,
  decideCanonicalCarePlan,
  findCanonicalPlanByMedcareId,
  getCanonicalCarePlan,
  type CarePlanEntrySurface,
} from "./care-plan-canonical";
import { linkPersonalisedCarePlanToCanonical } from "./medcare-repository";
import type { CarePlanRecord, CarePlanSection } from "./types";
import type {
  MedCareDecisionAction,
  PersonalisedCarePlan,
  PersonalisedCarePlanSection,
} from "./medcare-types";
import type { ClinicalPersona } from "../user-scope";

export type CarePlanBridgeWriteResult = {
  medcarePlan: PersonalisedCarePlan;
  canonicalPlan: CarePlanRecord;
  canonicalStore: typeof CARE_PLAN_CANONICAL_STORE;
  satelliteStore: typeof CARE_PLAN_MEDCARE_SATELLITE_STORE;
  entrySurface: CarePlanEntrySurface;
  ehrWrite: false;
};

function sectionsFromMedCare(sections: PersonalisedCarePlanSection[]): CarePlanSection[] {
  return sections.map((s) => ({
    id: s.id,
    title: s.title,
    items: [...(s.items ?? [])],
    clinical: s.clinical,
  }));
}

/** Upsert a canonical care_plan_records row for a medcare template draft. */
export async function mirrorMedCarePlanToCanonical(
  plan: PersonalisedCarePlan,
  options?: { scopeKey?: string; organisationId?: string | null }
): Promise<CarePlanBridgeWriteResult> {
  const scopeKey = options?.scopeKey ?? "shared";

  if (plan.canonicalPlanId) {
    const existing = await getCanonicalCarePlan(plan.canonicalPlanId, { scopeKey });
    if (existing) {
      return {
        medcarePlan: plan,
        canonicalPlan: existing,
        canonicalStore: CARE_PLAN_CANONICAL_STORE,
        satelliteStore: CARE_PLAN_MEDCARE_SATELLITE_STORE,
        entrySurface: "medcare",
        ehrWrite: false,
      };
    }
  }

  const byLink = await findCanonicalPlanByMedcareId(plan.id, { scopeKey });
  if (byLink) {
    const linked = await linkPersonalisedCarePlanToCanonical(plan.id, byLink.id, { scopeKey });
    return {
      medcarePlan: linked,
      canonicalPlan: byLink,
      canonicalStore: CARE_PLAN_CANONICAL_STORE,
      satelliteStore: CARE_PLAN_MEDCARE_SATELLITE_STORE,
      entrySurface: "medcare",
      ehrWrite: false,
    };
  }

  const drafted = await draftCanonicalCarePlan(
    {
      patientId: plan.patientId,
      patientLabel: plan.patientLabel,
      sections: sectionsFromMedCare(plan.sections),
      safetyNotes: [
        "Mirrored from medcare personalised care plan — synthetic",
        `template=${plan.templateId}`,
        "ehrWrite=false",
        "HITL required on both surfaces",
      ],
      missingData: [],
      createdBy: plan.createdBy,
      entrySurface: "medcare",
      medcarePlanId: plan.id,
    },
    { scopeKey, organisationId: options?.organisationId }
  );

  const linked = await linkPersonalisedCarePlanToCanonical(plan.id, drafted.plan.id, {
    scopeKey,
  });

  return {
    medcarePlan: linked,
    canonicalPlan: drafted.plan,
    canonicalStore: CARE_PLAN_CANONICAL_STORE,
    satelliteStore: CARE_PLAN_MEDCARE_SATELLITE_STORE,
    entrySurface: "medcare",
    ehrWrite: false,
  };
}

/**
 * After medcare Accept/Edit/Reject, sync the linked canonical plan status
 * (single physical SoT) without auto-EHR write.
 */
export async function syncMedCareDecisionToCanonical(
  medcarePlan: PersonalisedCarePlan,
  input: {
    action: MedCareDecisionAction;
    actor: string;
    actorPersona?: ClinicalPersona | null;
    reason?: string;
    editedSections?: PersonalisedCarePlanSection[];
  },
  options?: { scopeKey?: string; organisationId?: string | null }
): Promise<CarePlanBridgeWriteResult | null> {
  const scopeKey = options?.scopeKey ?? "shared";
  const mirrored = await mirrorMedCarePlanToCanonical(medcarePlan, options);
  const current = mirrored.canonicalPlan;

  if (current.status !== "DRAFT") {
    return {
      ...mirrored,
      medcarePlan: { ...mirrored.medcarePlan, ...pickMedcareDecision(medcarePlan) },
    };
  }

  const decided = await decideCanonicalCarePlan(
    {
      planId: current.id,
      action: input.action,
      actor: input.actor,
      actorPersona: input.actorPersona,
      reason: input.reason,
      editedSections: input.editedSections
        ? sectionsFromMedCare(input.editedSections)
        : undefined,
      // Satellite already owns medcare HITL; avoid duplicate journey follow-up
      skipFollowUp: true,
    },
    options
  );

  const linked = await linkPersonalisedCarePlanToCanonical(medcarePlan.id, decided.plan.id, {
    scopeKey,
  });

  return {
    medcarePlan: { ...linked, ...pickMedcareDecision(medcarePlan) },
    canonicalPlan: decided.plan,
    canonicalStore: CARE_PLAN_CANONICAL_STORE,
    satelliteStore: CARE_PLAN_MEDCARE_SATELLITE_STORE,
    entrySurface: "medcare",
    ehrWrite: false,
  };
}

function pickMedcareDecision(plan: PersonalisedCarePlan): Partial<PersonalisedCarePlan> {
  return {
    status: plan.status,
    decidedBy: plan.decidedBy,
    decidedAt: plan.decidedAt,
    decisionReason: plan.decisionReason,
    version: plan.version,
    sections: plan.sections,
  };
}
