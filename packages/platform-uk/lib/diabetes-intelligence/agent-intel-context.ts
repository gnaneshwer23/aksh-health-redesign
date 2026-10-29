/**
 * Shared patient context for Phase 5 agents.
 * Reuses mock cohort + existing diabetes-intelligence / patient-360 surfaces —
 * no separate patient data silos.
 */

import { AGENTS } from "../agents/register";
import { getPatientById } from "../mock-data";
import type { SharedPatientContext, SharedPatientContextSource } from "./agent-intel-types";

/** Authorised tool ids agents may call against shared context (least privilege). */
export const AUTHORISED_AGENT_TOOLS = [
  "read_shared_patient_context",
  "retrieve_evidence_corpus",
  "draft_structured_output",
  "validate_structured_output",
  "enqueue_hitl_review",
  "record_learning_decision_link",
] as const;

export function buildSharedPatientContext(
  patientId: string,
  options?: { now?: number }
): SharedPatientContext {
  const patient = getPatientById(patientId);
  const builtAt = new Date(options?.now ?? Date.now()).toISOString();

  const sources: SharedPatientContextSource[] = [
    {
      module: "mock_cohort",
      available: Boolean(patient),
      note: patient ? "Hand-authored clinical-proof fixture" : "Patient id not in mock cohort",
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
