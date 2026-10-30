/**
 * INT-03 — unified care-plan read model over dual stores.
 *
 * Journey HITL plans live in `care_plan_records`; medcare template plans in
 * `medcare_care_plans`. This facade projects both into one provenance-tagged
 * list. Connected journey orchestration treats journey plans as the HITL
 * care-plan gate; medcare plans remain the medication personalisation surface.
 * No destructive migration / Neon drops.
 */

import { listCarePlans as listJourneyCarePlans } from "./repository";
import { listCarePlans as listMedCarePlans } from "./medcare-repository";
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
  return {
    id: plan.id,
    patientId: plan.patientId,
    patientLabel: plan.patientLabel,
    sourceStore: "journey_care_plan",
    unifiedKey: `journey:${plan.id}`,
    title: `Journey care plan v${plan.version}`,
    status: plan.status,
    sections: mapSections(plan.sections),
    version: plan.version,
    createdAt: plan.createdAt,
    decidedAt: plan.decidedAt,
    decidedBy: plan.decidedBy,
    hitlRequired: true,
    ehrWrite: false,
    synthetic: true,
    provenance: "journey_hitl",
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
  return [
    ...journey.map(toUnifiedFromJourney),
    ...medcare.map(toUnifiedFromMedCare),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Journey store is the connected-pipeline HITL care-plan source of truth. */
export function selectCanonicalJourneyPlans(plans: UnifiedCarePlan[]): UnifiedCarePlan[] {
  return plans.filter((p) => p.sourceStore === "journey_care_plan");
}

export function selectMedCarePlans(plans: UnifiedCarePlan[]): UnifiedCarePlan[] {
  return plans.filter((p) => p.sourceStore === "medcare_care_plan");
}
