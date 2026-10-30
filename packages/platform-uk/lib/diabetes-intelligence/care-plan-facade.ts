/**
 * INT-03 — unified care-plan read model over canonical SoT + satellite.
 *
 * Physical SoT: `care_plan_records` (journey + medcare-mirrored drafts).
 * Satellite: `medcare_care_plans` retained for template metadata; rows with
 * `canonicalPlanId` are projected from the SoT (deduped here). Legacy unlinked
 * medcare rows still appear until mirrored. No destructive Neon merge.
 */

import { listCarePlans as listJourneyCarePlans } from "./repository";
import { listCarePlans as listMedCarePlans } from "./medcare-repository";
import { CARE_PLAN_CANONICAL_STORE } from "./care-plan-canonical";
import type { CarePlanRecord, CarePlanSection } from "./types";
import type { PersonalisedCarePlan, PersonalisedCarePlanSection } from "./medcare-types";

export type UnifiedCarePlanSourceStore = "journey_care_plan" | "medcare_care_plan";

export type UnifiedCarePlanSection = {
  id: string;
  title: string;
  items: string[];
  clinical: boolean;
};

export type UnifiedCarePlan = {
  id: string;
  patientId: string;
  patientLabel: string;
  sourceStore: UnifiedCarePlanSourceStore;
  /** Stable composite key for UI / timeline — avoids colliding bare ids across stores. */
  unifiedKey: string;
  title: string;
  status: string;
  sections: UnifiedCarePlanSection[];
  version: number;
  createdAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  hitlRequired: true;
  ehrWrite: false;
  synthetic: true;
  provenance: "journey_hitl" | "medcare_template";
  /** Physical write store after INT-03 collapse. */
  physicalStore: typeof CARE_PLAN_CANONICAL_STORE | "medcare_care_plans_legacy";
  entrySurface?: "journey" | "medcare" | "shared" | null;
  medcarePlanId?: string | null;
};

function mapSections(
  sections: CarePlanSection[] | PersonalisedCarePlanSection[]
): UnifiedCarePlanSection[] {
  return sections.map((s) => ({
    id: s.id,
    title: s.title,
    items: [...(s.items ?? [])],
    clinical: s.clinical,
  }));
}

export function toUnifiedFromJourney(plan: CarePlanRecord): UnifiedCarePlan {
  const fromMedcare = plan.entrySurface === "medcare" || Boolean(plan.medcarePlanId);
  return {
    id: plan.id,
    patientId: plan.patientId,
    patientLabel: plan.patientLabel,
    sourceStore: fromMedcare ? "medcare_care_plan" : "journey_care_plan",
    unifiedKey: fromMedcare ? `medcare-canonical:${plan.id}` : `journey:${plan.id}`,
    title: fromMedcare
      ? `Medcare care plan v${plan.version}`
      : `Journey care plan v${plan.version}`,
    status: plan.status,
    sections: mapSections(plan.sections),
    version: plan.version,
    createdAt: plan.createdAt,
    decidedAt: plan.decidedAt,
    decidedBy: plan.decidedBy,
    hitlRequired: true,
    ehrWrite: false,
    synthetic: true,
    provenance: fromMedcare ? "medcare_template" : "journey_hitl",
    physicalStore: CARE_PLAN_CANONICAL_STORE,
    entrySurface: plan.entrySurface ?? (fromMedcare ? "medcare" : "journey"),
    medcarePlanId: plan.medcarePlanId ?? null,
  };
}

export function toUnifiedFromMedCare(plan: PersonalisedCarePlan): UnifiedCarePlan {
  return {
    id: plan.id,
    patientId: plan.patientId,
    patientLabel: plan.patientLabel,
    sourceStore: "medcare_care_plan",
    unifiedKey: `medcare:${plan.id}`,
    title: plan.title,
    status: plan.status,
    sections: mapSections(plan.sections),
    version: plan.version,
    createdAt: plan.createdAt,
    decidedAt: plan.decidedAt,
    decidedBy: plan.decidedBy,
    hitlRequired: true,
    ehrWrite: false,
    synthetic: true,
    provenance: "medcare_template",
    physicalStore: "medcare_care_plans_legacy",
    entrySurface: "medcare",
    medcarePlanId: plan.id,
  };
}

export async function listUnifiedCarePlans(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<UnifiedCarePlan[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  const [journey, medcare] = await Promise.all([
    listJourneyCarePlans(patientId, { scopeKey }),
    listMedCarePlans(patientId, { scopeKey }),
  ]);
  // Collapse: prefer canonical SoT; skip satellite rows already mirrored.
  const linkedMedcareIds = new Set(
    journey.map((p) => p.medcarePlanId).filter((id): id is string => Boolean(id))
  );
  const unlinkedMedcare = medcare.filter(
    (p) => !p.canonicalPlanId && !linkedMedcareIds.has(p.id)
  );
  return [
    ...journey.map(toUnifiedFromJourney),
    ...unlinkedMedcare.map(toUnifiedFromMedCare),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Journey-originated plans on the canonical physical store. */
export function selectCanonicalJourneyPlans(plans: UnifiedCarePlan[]): UnifiedCarePlan[] {
  return plans.filter(
    (p) => p.sourceStore === "journey_care_plan" && p.physicalStore === CARE_PLAN_CANONICAL_STORE
  );
}

export function selectMedCarePlans(plans: UnifiedCarePlan[]): UnifiedCarePlan[] {
  return plans.filter((p) => p.sourceStore === "medcare_care_plan");
}
