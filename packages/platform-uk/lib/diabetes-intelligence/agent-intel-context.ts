/**
 * Shared patient context for Phase 5 agents.
 * Reuses mock cohort + live module snapshots when scopeKey is provided —
 * no separate patient data silos (INT-01 / INT-07 mitigation path).
 * Prefer the central Context Engine package when assembling drafts (CI 2.0 B-P2-1).
 */

import type { ClinicalContextPackage } from "../context-engine/types";
import { AGENTS } from "../agents/register";
import { getPatientById } from "../mock-data";
import { listConditions, listAllergies } from "../patient-intelligence/repository";
import type {
  AgentIntelContextPackageRef,
  SharedPatientContext,
  SharedPatientContextSource,
} from "./agent-intel-types";
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
  "assemble_context_engine_package",
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
      module: "context_engine",
      available: false,
      note: "Central Context Engine package not yet attached — call enrichSharedContextFromClinicalPackage",
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

export function toAgentIntelContextPackageRef(
  pkg: ClinicalContextPackage
): AgentIntelContextPackageRef {
  return {
    contextId: pkg.contextId,
    schemaVersion: pkg.schemaVersion,
    purpose: pkg.purpose,
    missing_information: [...pkg.missing_information],
    uncertainties: [...pkg.uncertainties],
    laboratoryResultCount: pkg.laboratory_results.length,
    evidenceCount: pkg.evidence.length,
    dataSource: pkg.dataSource,
  };
}

/**
 * Prefer signed Context Engine facts over siloed mock-only fields when both exist.
 * Keeps module live-signal enrichment; stamps context_engine source as available.
 */
export function enrichSharedContextFromClinicalPackage(
  base: SharedPatientContext,
  pkg: ClinicalContextPackage
): SharedPatientContext {
  const ref = toAgentIntelContextPackageRef(pkg);
  const sources = base.sources.map((s) =>
    s.module === "context_engine"
      ? {
          module: "context_engine" as const,
          available: true,
          note: `Context Engine ${pkg.schemaVersion} · ${pkg.contextId} · missing=${pkg.missing_information.join(",") || "none"}`,
        }
      : s
  );
  if (!sources.some((s) => s.module === "context_engine")) {
    sources.unshift({
      module: "context_engine",
      available: true,
      note: `Context Engine ${pkg.schemaVersion} · ${pkg.contextId}`,
    });
  }

  const conditions =
    pkg.conditions.length > 0 ? [...pkg.conditions] : base.conditions;
  const medications =
    pkg.medications.length > 0 ? [...pkg.medications] : base.medications;
  const allergies = pkg.allergies.length > 0 ? [...pkg.allergies] : base.allergies;
  const deteriorationSignals =
    pkg.risk_factors.length > 0 ? [...pkg.risk_factors] : base.deteriorationSignals;

  return {
    ...base,
    patientLabel: pkg.patient_context.label?.trim() || base.patientLabel,
    age: pkg.patient_context.age ?? base.age,
    gender: pkg.patient_context.gender ?? base.gender,
    conditions,
    medications,
    allergies,
    lastEncounterDate:
      pkg.encounter_context.lastEncounterDate ?? base.lastEncounterDate,
    deteriorationSignals,
    sources,
    contextPackage: ref,
    authorisedTools: Array.from(
      new Set([...base.authorisedTools, "assemble_context_engine_package"])
    ),
  };
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
