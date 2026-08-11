import { randomUUID } from "crypto";

import { z } from "zod";

import type { LifestyleSample } from "@/lib/precision-health/modalities";
import { ingestModalitySampleStub } from "@/lib/repositories/modality-sample-repository";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import type { NurseEscalationTask } from "@/lib/types";

/**
 * Patient companion self-report check-in (B5, docs/PHASED_BUILD_PLAN.md).
 *
 * Persists via the existing consent-gated `lifestyle` modality pattern
 * (lib/repositories/modality-sample-repository.ts, FR-PAT-038) under the `coaching_wellness`
 * purpose — the same self-report input the Behaviour Scientist diabetes module documents as its
 * stated input (docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md §7). This module also gives
 * `clinicalEscalationHints` (lib/disease-modules/diabetes/behaviour.ts) an active detector for
 * the first time: a self-disclosed self-harm/crisis, red-flag-symptom, or diabetes-distress
 * phrase routes to a clinician-visible escalation task, never handled autonomously.
 *
 * Not a validated clinical screening tool — the phrase lists below are a conservative,
 * documented placeholder (see behaviour.ts's own TODO, spec Open Question #6, clinical-lead
 * sign-off pending), mirroring the existing lib/human-gates.ts keyword-match pattern.
 */

export const CHECK_IN_MOODS = ["good", "okay", "struggling"] as const;
export type CheckInMood = (typeof CHECK_IN_MOODS)[number];

export const MEDICATION_ADHERENCE_VALUES = ["yes", "no", "partly"] as const;
export type MedicationAdherence = (typeof MEDICATION_ADHERENCE_VALUES)[number];

export const checkInInputSchema = z.object({
  mood: z.enum(CHECK_IN_MOODS),
  symptomText: z.string().trim().max(2000).optional().default(""),
  medicationAdherence: z.enum(MEDICATION_ADHERENCE_VALUES).optional()
});

export type CheckInInput = z.infer<typeof checkInInputSchema>;

export type CheckInEscalationCategory = "self_harm_or_crisis" | "red_flag_symptom" | "diabetes_distress";

export type CheckInEscalationResult = {
  triggered: boolean;
  category: CheckInEscalationCategory | null;
  matchedPhrase: string | null;
};

const SELF_HARM_OR_CRISIS_PHRASES = [
  "suicide",
  "suicidal",
  "kill myself",
  "end my life",
  "ending my life",
  "want to die",
  "harm myself",
  "self-harm",
  "self harm",
  "not worth living"
];

const RED_FLAG_SYMPTOM_PHRASES = [
  "chest pain",
  "can't breathe",
  "cant breathe",
  "cannot breathe",
  "severe breathlessness",
  "blue lips",
  "collapsed"
];

const DIABETES_DISTRESS_PHRASES = [
  "diabetes distress",
  "burnt out with my diabetes",
  "burned out with my diabetes",
  "diabetes burnout",
  "given up on my diabetes",
  "can't cope with my diabetes",
  "cant cope with my diabetes",
  "cannot cope with my diabetes",
  "disengaged from my diabetes"
];

function findPhrase(text: string, phrases: string[]): string | null {
  return phrases.find((phrase) => text.includes(phrase)) ?? null;
}

/** Priority order: an acute crisis/red-flag signal always wins over a chronic-distress one. */
export function detectCheckInEscalation(symptomText: string): CheckInEscalationResult {
  const text = symptomText.toLowerCase();

  const selfHarm = findPhrase(text, SELF_HARM_OR_CRISIS_PHRASES);
  if (selfHarm) {
    return { triggered: true, category: "self_harm_or_crisis", matchedPhrase: selfHarm };
  }

  const redFlag = findPhrase(text, RED_FLAG_SYMPTOM_PHRASES);
  if (redFlag) {
    return { triggered: true, category: "red_flag_symptom", matchedPhrase: redFlag };
  }

  const distress = findPhrase(text, DIABETES_DISTRESS_PHRASES);
  if (distress) {
    return { triggered: true, category: "diabetes_distress", matchedPhrase: distress };
  }

  return { triggered: false, category: null, matchedPhrase: null };
}

export function buildCheckInLifestyleSample(patientId: string, input: CheckInInput): LifestyleSample {
  const parts = [`Mood: ${input.mood}`];
  if (input.medicationAdherence) {
    parts.push(`Medication adherence: ${input.medicationAdherence}`);
  }
  if (input.symptomText) {
    parts.push(`Symptoms/notes: ${input.symptomText}`);
  }

  return {
    modality: "lifestyle",
    patientId,
    recordedAt: new Date().toISOString(),
    summary: `Patient companion check-in — ${parts.join(" · ")}`,
    provenance: {
      source: "ingestion_stub",
      liveStream: false,
      realPatientData: false,
      note: "Patient companion check-in — self-report, not a wearable/device stream"
    }
  };
}

export type CheckInResult = {
  patientId: string;
  mood: CheckInMood;
  medicationAdherence: MedicationAdherence | null;
  escalation: CheckInEscalationResult;
  nurseTask: NurseEscalationTask | null;
  modalitySampleAccepted: boolean;
  modalitySampleMessage: string;
  shieldPersisted: boolean;
  shieldAuditWriteFailed: boolean;
  ehrWrite: false;
  isClinicalAdvice: false;
  hitlRequired: true;
  note: string;
};

/**
 * Orchestrates a single check-in submission: consent-gated lifestyle-sample storage, escalation
 * detection, and a SHIELD audit event for every write (never a silent-swallow — B1 fail-visible
 * pattern: `shieldAuditWriteFailed` is always surfaced, not swallowed).
 */
export async function runPatientCheckIn(
  patientId: string,
  input: CheckInInput,
  options: { scopeKey: string; actor: string }
): Promise<CheckInResult> {
  const escalation = detectCheckInEscalation(input.symptomText ?? "");
  const sample = buildCheckInLifestyleSample(patientId, input);

  const storeResult = await ingestModalitySampleStub(sample, {
    scopeKey: options.scopeKey,
    purposeCode: "coaching_wellness"
  });

  const nurseTask: NurseEscalationTask | null = escalation.triggered
    ? {
        id: `checkin-${randomUUID()}`,
        patientLabel: patientId,
        caseId: patientId,
        priority: "urgent",
        summary: `Patient self-report check-in flagged (${escalation.category}) — clinician review required, never handled autonomously.`,
        createdAt: new Date().toISOString(),
        source: "patient_check_in"
      }
    : null;

  const shieldResult = await persistShieldAuditEvent({
    action: "defer",
    actor: options.actor,
    label: escalation.triggered
      ? "SHIELD: Patient check-in — escalation triggered"
      : "SHIELD: Patient check-in recorded",
    detail: escalation.triggered
      ? `category=${escalation.category}; routed to clinician escalation gate, not handled autonomously`
      : storeResult.message,
    category: escalation.triggered ? "human_review" : "system",
    agentLabel: "BEHAVIOUR",
    resourceRef: patientId,
    payload: {
      mood: input.mood,
      medicationAdherence: input.medicationAdherence ?? null,
      escalationTriggered: escalation.triggered,
      escalationCategory: escalation.category,
      nurseTask,
      modalitySampleAccepted: storeResult.accepted,
      modalitySampleId: storeResult.sample?.id ?? null,
      ehrWrite: false,
      isClinicalAdvice: false
    }
  });

  return {
    patientId,
    mood: input.mood,
    medicationAdherence: input.medicationAdherence ?? null,
    escalation,
    nurseTask,
    modalitySampleAccepted: storeResult.accepted,
    modalitySampleMessage: storeResult.message,
    shieldPersisted: shieldResult.persisted,
    shieldAuditWriteFailed: !shieldResult.persisted,
    ehrWrite: false,
    isClinicalAdvice: false,
    hitlRequired: true,
    note: escalation.triggered
      ? "Shared with your care team — a clinician will review this before any next step. Not handled automatically."
      : "Shared with your care team. Synthetic demo data — not a live wearable/device stream, no EHR write."
  };
}
