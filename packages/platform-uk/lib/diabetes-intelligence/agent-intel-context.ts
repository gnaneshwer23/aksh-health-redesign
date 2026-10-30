/**
 * Shared patient context for Phase 5 agents.
 * Reuses mock cohort + live module snapshots when scopeKey is provided —
 * no separate patient data silos (INT-01 / INT-07 mitigation path).
 */

import { AGENTS } from "../agents/register";
import { getPatientById } from "../mock-data";
import { listConditions, listAllergies } from "../patient-intelligence/repository";
import type { SharedPatientContext, SharedPatientContextSource } from "./agent-intel-types";
import { listGlucoseSeries } from "./glucose-repository";
import { listCarePlans as listMedCarePlans } from "./medcare-repository";
import { listCarePlans as listJourneyCarePlans } from "./repository";
import { listFollowUpItems as listContinuousFollowUps } from "./continuous-care-repository";

/** Authorised tool ids agents may call against shared context (least privilege). */
export const AUTHORISED_AGENT_TOOLS = [
  "read_shared_patient_context",
  "retrieve_evidence_corpus",
  "draft_structured_output",
  "validate_structured_output",
  "enqueue_hitl_review",
  "record_learning_decision_link",
] as const;

export type SharedContextLiveSignals = {
  patient360ConditionCount: number;
  patient360AllergyCount: number;
  glucoseSeriesCount: number;
  journeyCarePlanCount: number;
  medcareCarePlanCount: number;
  continuousFollowUpCount: number;
};

function baseSources(patientAvailable: boolean): SharedPatientContextSource[] {
  return [
    {
      module: "mock_cohort",
      available: patientAvailable,
      note: patientAvailable
        ? "Hand-authored clinical-proof fixture"
        : "Patient id not in mock cohort",
    },
    {
      module: "patient_360",
      available: true,
      note: "Patient 360 foundation module (synthetic) — same patientId scope",
    },
    {
      module: "diabetes_journey",
      available: true,
      note: "Connected diabetes journey — shared patientId",
    },
    {
      module: "glucose_intelligence",
      available: true,
      note: "Glucose intelligence — shared patientId",
    },
    {
      module: "medication_care",
      available: true,
      note: "Medication & personalised care — shared patientId",
    },
    {
      module: "continuous_care",
      available: true,
      note: "Continuous care operations — shared patientId",
    },
    {
      module: "agents_register",
      available: AGENTS.length > 0,
      note: `Reuses agents register (${AGENTS.length} contracts); CONDUCTOR + specialists`,
    },
  ];
}

function applyLiveSignals(
  sources: SharedPatientContextSource[],
  live: SharedContextLiveSignals
): SharedPatientContextSource[] {
  return sources.map((s) => {
    if (s.module === "patient_360") {
      return {
        ...s,
        available: live.patient360ConditionCount > 0 || live.patient360AllergyCount > 0,
        note: `Patient 360 spine — ${live.patient360ConditionCount} condition(s), ${live.patient360AllergyCount} allerg(y/ies)`,
      };
    }
    if (s.module === "glucose_intelligence") {
      return {
        ...s,
        available: live.glucoseSeriesCount > 0,
        note: `Canonical glucose series — ${live.glucoseSeriesCount} reading(s)`,
      };
    }
    if (s.module === "diabetes_journey") {
      return {
        ...s,
        available: live.journeyCarePlanCount > 0 || live.glucoseSeriesCount > 0,
        note: `Journey care plans — ${live.journeyCarePlanCount} record(s)`,
      };
    }
    if (s.module === "medication_care") {
      return {
        ...s,
        available: live.medcareCarePlanCount > 0,
        note: `Medcare care plans — ${live.medcareCarePlanCount} record(s)`,
      };
    }
    if (s.module === "continuous_care") {
      return {
        ...s,
        available: live.continuousFollowUpCount > 0,
        note: `Continuous care follow-ups — ${live.continuousFollowUpCount} item(s)`,
      };
    }
    return s;
  });
}

/**
 * Sync context from mock cohort (deterministic drafts / offline tests).
 * Prefer `buildSharedPatientContextAsync` when assembling live snapshots.
 */
export function buildSharedPatientContext(
  patientId: string,
  options?: { now?: number; liveSignals?: SharedContextLiveSignals }
): SharedPatientContext {
  const patient = getPatientById(patientId);
  const builtAt = new Date(options?.now ?? Date.now()).toISOString();

  let sources = baseSources(Boolean(patient));
  if (options?.liveSignals) {
    sources = applyLiveSignals(sources, options.liveSignals);
  }

  return {
    patientId,
    patientLabel: patient?.name?.trim() || patientId,
    age: patient?.age ?? null,
    gender: patient?.gender ?? null,
    conditions: [...(patient?.activeConditions ?? [])],
    medications: [...(patient?.activeMedications ?? [])],
    allergies: [...(patient?.allergies ?? [])],
    lastEncounterDate: patient?.lastEncounterDate ?? null,
    deteriorationSignals: [...(patient?.digitalTwinPrediction?.deteriorationSignals ?? [])],
    sources,
    authorisedTools: [...AUTHORISED_AGENT_TOOLS],
    synthetic: true,
    ehrWrite: false,
    builtAt,
  };
}

/** Load live module counts for the same patientId + scopeKey and enrich context. */
export async function buildSharedPatientContextAsync(
  patientId: string,
  options?: { scopeKey?: string; now?: number }
): Promise<SharedPatientContext> {
  const scopeKey = options?.scopeKey ?? "shared";
  const patient = getPatientById(patientId);

  const [
    conditions,
    allergies,
    glucoseSeries,
    journeyPlans,
    medPlans,
    continuousFollowUps,
  ] = await Promise.all([
    listConditions(patientId, { scopeKey }).catch(() => []),
    listAllergies(patientId, { scopeKey }).catch(() => []),
    listGlucoseSeries(patientId, { scopeKey }).catch(() => []),
    listJourneyCarePlans(patientId, { scopeKey }).catch(() => []),
    listMedCarePlans(patientId, { scopeKey }).catch(() => []),
    listContinuousFollowUps(patientId, { scopeKey }).catch(() => []),
  ]);

  const liveSignals: SharedContextLiveSignals = {
    patient360ConditionCount: conditions.length,
    patient360AllergyCount: allergies.length,
    glucoseSeriesCount: glucoseSeries.length,
    journeyCarePlanCount: journeyPlans.length,
    medcareCarePlanCount: medPlans.length,
    continuousFollowUpCount: continuousFollowUps.length,
  };

  const base = buildSharedPatientContext(patientId, {
    now: options?.now,
    liveSignals,
  });

  // Prefer structured 360 spine labels when present.
  const conditionLabels =
    conditions.length > 0 ? conditions.map((c) => c.display) : base.conditions;
  const allergyLabels =
    allergies.length > 0 ? allergies.map((a) => a.substance) : base.allergies;

  return {
    ...base,
    conditions: conditionLabels,
    allergies: allergyLabels,
    patientLabel: patient?.name?.trim() || patientId,
  };
}
