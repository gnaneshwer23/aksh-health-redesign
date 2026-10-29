import { randomUUID } from "crypto";

import { getPatientById } from "../mock-data";
import {
  loadIngestedDiabetesReadings,
  recordDiabetesGlucoseReading,
} from "../disease-modules/diabetes/ingest";
import { assessGlucoseMissing, assessHistoryMissing } from "./missing-data";
import {
  appendJourneyEvent,
  createCarePlanRecord,
  decideCarePlan,
  listCarePlans,
  listFollowUps,
  listJourneyEvents,
  updateFollowUp,
} from "./repository";
import type {
  CarePlanDecisionAction,
  CarePlanSection,
  ClinicalHistorySnapshot,
  DiabetesJourneySnapshot,
  GlucoseObservation,
} from "./types";

export function buildClinicalHistory(patientId: string): ClinicalHistorySnapshot {
  const patient = getPatientById(patientId);
  if (!patient) {
    return {
      conditions: [],
      medications: [],
      allergies: [],
      missingFields: ["patient_record", "conditions", "medications", "allergies"],
    };
  }
  const missingFields: string[] = [];
  if (!patient.nhsNumber) missingFields.push("nhs_number");
  if (!patient.vitals) missingFields.push("vitals");
  if (!patient.allergies?.length) missingFields.push("allergies_explicit_none_ok");
  return {
    conditions: patient.activeConditions ?? [],
    medications: patient.activeMedications ?? [],
    allergies: patient.allergies ?? [],
    missingFields: missingFields.filter((f) => f !== "allergies_explicit_none_ok"),
  };
}

export async function loadGlucosePanel(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<{ observations: GlucoseObservation[]; fromIngest: boolean }> {
  const { glucoseReadings } = await loadIngestedDiabetesReadings(patientId, options);
  if (glucoseReadings.length > 0) {
    return {
      fromIngest: true,
      observations: glucoseReadings.map((r) => ({
        recordedAt: r.recordedAt,
        glucoseMgDl: r.glucoseMgDl,
        context: r.context,
      })),
    };
  }
  return { fromIngest: false, observations: [] };
}

export async function buildDiabetesJourney(
  patientId: string,
  options?: { scopeKey?: string; actor?: string }
): Promise<DiabetesJourneySnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  const patient = getPatientById(patientId);
  const patientLabel = patient?.name ?? patientId;
  const history = buildClinicalHistory(patientId);
  const historyMissing = assessHistoryMissing(history);
  const { observations } = await loadGlucosePanel(patientId, { scopeKey });
  const glucoseAssess = assessGlucoseMissing(observations);

  const [carePlans, followUps, storedEvents] = await Promise.all([
    listCarePlans(patientId, { scopeKey }),
    listFollowUps(patientId, { scopeKey }),
    listJourneyEvents(patientId, { scopeKey }),
  ]);

  const derivedEvents = [
    {
      id: `hist-${patientId}`,
      patientId,
      kind: "history" as const,
      title: "Clinical history snapshot",
      summary:
        history.conditions.length > 0
          ? `Conditions: ${history.conditions.slice(0, 3).join("; ")}`
          : "No conditions on file",
      occurredAt: (() => {
        if (!patient?.lastEncounterDate) return new Date().toISOString();
        const d = new Date(patient.lastEncounterDate);
        return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      })(),
      ehrWrite: false as const,
      metadata: { missingFields: history.missingFields },
    },
    ...observations.map((o, i) => ({
      id: `glu-${patientId}-${i}-${o.recordedAt}`,
      patientId,
      kind: "glucose" as const,
      title: "Glucose observation",
      summary: `${o.glucoseMgDl} mg/dL${o.context ? ` (${o.context})` : ""}`,
      occurredAt: o.recordedAt,
      ehrWrite: false as const,
    })),
    ...[...historyMissing, ...glucoseAssess.missingData].map((m, i) => ({
      id: `miss-${patientId}-${m.code}-${i}`,
      patientId,
      kind: "missing_data" as const,
      title: "Missing data",
      summary: m.message,
      occurredAt: new Date().toISOString(),
      ehrWrite: false as const,
      metadata: { code: m.code },
    })),
  ];

  const byId = new Map<string, (typeof derivedEvents)[number] | (typeof storedEvents)[number]>();
  for (const e of [...derivedEvents, ...storedEvents]) byId.set(e.id, e);
  const timeline = [...byId.values()].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  return {
    patientId,
    patientLabel,
    synthetic: true,
    ehrWrite: false,
    hitlRequired: true,
    history: {
      ...history,
      missingFields: [
        ...new Set([...history.missingFields, ...historyMissing.map((m) => m.field ?? m.code)]),
      ],
    },
    glucose: {
      observations,
      missingData: glucoseAssess.missingData,
      dataCompleteness: glucoseAssess.dataCompleteness,
    },
    carePlans,
    followUps,
    timeline,
  };
}

export async function seedSyntheticJourney(
  patientId: string,
  options?: { scopeKey?: string; actor?: string }
): Promise<DiabetesJourneySnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  const actor = options?.actor ?? "synthetic-seed";
  const base = new Date();
  const readings = [
    { offsetH: -72, glucoseMgDl: 142, context: "fasting" as const },
    { offsetH: -48, glucoseMgDl: 188, context: "post_prandial" as const },
    { offsetH: -24, glucoseMgDl: 156, context: "fasting" as const },
    { offsetH: -6, glucoseMgDl: 210, context: "post_prandial" as const },
  ];

  for (const r of readings) {
    const at = new Date(base.getTime() + r.offsetH * 3600_000).toISOString();
    await recordDiabetesGlucoseReading(
      {
        patientId,
        reading: { recordedAt: at, glucoseMgDl: r.glucoseMgDl, context: r.context },
      },
      { scopeKey }
    );
  }

  await appendJourneyEvent(
    {
      id: `evt-${randomUUID()}`,
      patientId,
      kind: "note",
      title: "Synthetic journey seeded",
      summary: "Four glucose observations loaded for demo — not real patient data",
      occurredAt: new Date().toISOString(),
      metadata: { actor },
    },
    { scopeKey }
  );

  return buildDiabetesJourney(patientId, { scopeKey, actor });
}

export async function draftJourneyCarePlan(
  patientId: string,
  options?: { scopeKey?: string; createdBy: string }
): Promise<DiabetesJourneySnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  const createdBy = options?.createdBy ?? "clinician";
  const snap = await buildDiabetesJourney(patientId, { scopeKey });
  const missing = [...snap.glucose.missingData, ...assessHistoryMissing(snap.history)];

  const sections: CarePlanSection[] = [
    {
      id: "monitoring",
      title: "Monitoring",
      clinical: true,
      items: [
        snap.glucose.observations.length
          ? `Review ${snap.glucose.observations.length} glucose observation(s); completeness ${snap.glucose.dataCompleteness}`
          : "Obtain glucose series before treatment changes",
        "No autonomous treatment change — clinician confirmation required",
      ],
    },
    {
      id: "treatment",
      title: "Treatment discussion",
      clinical: true,
      items: [
        `Focus conditions: ${(snap.history.conditions.slice(0, 3).join("; ") || "confirm diagnosis with clinician")}`,
        "Draft only — Accept/Edit/Reject before any care-plan approval",
      ],
    },
    {
      id: "follow_up",
      title: "Follow-up",
      clinical: true,
      items: ["Schedule clinician-confirmed follow-up within 14 days if accepted"],
    },
  ];

  await createCarePlanRecord(
    {
      patientId,
      patientLabel: snap.patientLabel,
      sections,
      safetyNotes: [
        "Synthetic demo care plan",
        "ehrWrite=false",
        "Not a prescription",
        ...missing.map((m) => `Missing: ${m.message}`),
      ],
      missingData: missing,
      createdBy,
    },
    { scopeKey }
  );

  return buildDiabetesJourney(patientId, { scopeKey });
}

export async function decideJourneyCarePlan(
  input: {
    patientId: string;
    planId: string;
    action: CarePlanDecisionAction;
    actor: string;
    reason?: string;
    editedSections?: CarePlanSection[];
  },
  options?: { scopeKey?: string }
): Promise<DiabetesJourneySnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  await decideCarePlan(
    {
      planId: input.planId,
      action: input.action,
      actor: input.actor,
      reason: input.reason,
      editedSections: input.editedSections,
    },
    { scopeKey }
  );
  return buildDiabetesJourney(input.patientId, { scopeKey });
}

export async function advanceFollowUp(
  input: {
    patientId: string;
    taskId: string;
    action: "acknowledge" | "complete" | "cancel";
    note?: string;
  },
  options?: { scopeKey?: string }
): Promise<DiabetesJourneySnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  await updateFollowUp(
    { taskId: input.taskId, action: input.action, note: input.note },
    { scopeKey }
  );
  return buildDiabetesJourney(input.patientId, { scopeKey });
}
