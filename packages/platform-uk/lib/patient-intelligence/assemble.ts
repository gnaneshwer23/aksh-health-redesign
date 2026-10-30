import { getPatientById } from "../mock-data";
import { listJourneyEvents } from "../diabetes-intelligence/repository";
import { assessPatient360Quality } from "./quality";
import {
  decideCanonicalMedReconciliation,
  startCanonicalMedReconciliation,
} from "./med-recon-canonical";
import {
  getDiabetesProfile,
  listAllergies,
  listCareAssignments,
  listConditions,
  listEncounters,
  listFamilyHistory,
  listMedRecons,
  listObservations,
  listSharingPreferences,
} from "./repository";
import { seedPatient360FromCohort } from "./seed";
import type {
  MedicationListItem,
  Patient360Profile,
  PatientTimelineEvent,
} from "./types";

function medicationItemsFromCohort(patientId: string): MedicationListItem[] {
  const patient = getPatientById(patientId);
  return (patient?.activeMedications ?? []).map((name) => ({
    name,
    status: /proposed/i.test(name) ? ("proposed" as const) : ("active" as const),
    source: "mock_cohort",
  }));
}

function buildTimeline(profile: {
  patientId: string;
  conditions: Patient360Profile["conditions"];
  allergies: Patient360Profile["allergies"];
  familyHistory: Patient360Profile["familyHistory"];
  diabetes: Patient360Profile["diabetes"];
  encounters: Patient360Profile["encounters"];
  observations: Patient360Profile["observations"];
  medRecons: Patient360Profile["medicationReconciliations"];
  careTeam: Patient360Profile["careTeam"];
  sharing: Patient360Profile["sharingPreferences"];
  quality: Patient360Profile["qualityIndicators"];
  journeyEvents: Awaited<ReturnType<typeof listJourneyEvents>>;
}): PatientTimelineEvent[] {
  const events: PatientTimelineEvent[] = [];

  for (const c of profile.conditions) {
    events.push({
      id: `tl-cond-${c.id}`,
      patientId: profile.patientId,
      kind: "condition",
      title: "Condition",
      summary: c.display,
      occurredAt: c.onsetDate
        ? new Date(c.onsetDate).toISOString()
        : c.provenance.recordedAt,
      ehrWrite: false,
      metadata: { category: c.category, status: c.clinicalStatus },
    });
  }
  for (const a of profile.allergies) {
    events.push({
      id: `tl-alg-${a.id}`,
      patientId: profile.patientId,
      kind: "allergy",
      title: "Allergy",
      summary: a.substance,
      occurredAt: a.provenance.recordedAt,
      ehrWrite: false,
    });
  }
  for (const f of profile.familyHistory) {
    events.push({
      id: `tl-fh-${f.id}`,
      patientId: profile.patientId,
      kind: "family_history",
      title: "Family history",
      summary: `${f.relationship}: ${f.conditionDisplay}`,
      occurredAt: f.provenance.recordedAt,
      ehrWrite: false,
    });
  }
  if (profile.diabetes) {
    events.push({
      id: `tl-diab-${profile.diabetes.id}`,
      patientId: profile.patientId,
      kind: "diabetes",
      title: "Diabetes classification",
      summary: `${profile.diabetes.diabetesType}${profile.diabetes.diagnosedOn ? ` · diagnosed ${profile.diabetes.diagnosedOn}` : ""}`,
      occurredAt: profile.diabetes.diagnosedOn
        ? new Date(profile.diabetes.diagnosedOn).toISOString()
        : profile.diabetes.provenance.recordedAt,
      ehrWrite: false,
    });
  }
  for (const e of profile.encounters) {
    events.push({
      id: `tl-enc-${e.id}`,
      patientId: profile.patientId,
      kind: "encounter",
      title: "Clinical encounter",
      summary: e.reason ?? e.className,
      occurredAt: e.startedAt,
      ehrWrite: false,
    });
  }
  for (const o of profile.observations) {
    events.push({
      id: `tl-obs-${o.id}`,
      patientId: profile.patientId,
      kind: "observation",
      title: o.display,
      summary:
        o.valueNumeric != null
          ? `${o.valueNumeric}${o.unit ? ` ${o.unit}` : ""}`
          : (o.valueText ?? o.kind),
      occurredAt: o.observedAt,
      ehrWrite: false,
      metadata: { qualityFlag: o.qualityFlag, verified: o.verified },
    });
  }
  for (const m of profile.medRecons) {
    events.push({
      id: `tl-mrecon-${m.id}`,
      patientId: profile.patientId,
      kind: "medication_recon",
      title: "Medication reconciliation",
      summary: `Status ${m.status}; ${m.discrepancies.length} discrepancy(ies)`,
      occurredAt: m.decidedAt ?? m.createdAt,
      ehrWrite: false,
    });
  }
  for (const c of profile.careTeam.filter((x) => x.status === "active")) {
    events.push({
      id: `tl-care-${c.id}`,
      patientId: profile.patientId,
      kind: "care_team",
      title: "Care-team assignment",
      summary: `${c.memberDisplay} · ${c.careRole}`,
      occurredAt: c.assignedAt,
      ehrWrite: false,
    });
  }
  for (const s of profile.sharing) {
    events.push({
      id: `tl-share-${s.id}`,
      patientId: profile.patientId,
      kind: "consent",
      title: "Data-sharing preference",
      summary: `${s.purpose}: ${s.status}`,
      occurredAt: s.recordedAt,
      ehrWrite: false,
    });
  }
  for (const q of profile.quality.slice(0, 8)) {
    events.push({
      id: `tl-q-${q.code}-${q.field ?? "x"}`,
      patientId: profile.patientId,
      kind: "quality",
      title: "Data quality",
      summary: q.message,
      occurredAt: new Date().toISOString(),
      ehrWrite: false,
      metadata: { flag: q.flag },
    });
  }
  for (const j of profile.journeyEvents) {
    events.push({
      id: `tl-journey-${j.id}`,
      patientId: profile.patientId,
      kind: "journey",
      title: j.title,
      summary: j.summary,
      occurredAt: j.occurredAt,
      ehrWrite: false,
      metadata: { journeyKind: j.kind },
    });
  }

  return events.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

export async function buildPatient360(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<Patient360Profile> {
  const scopeKey = options?.scopeKey ?? "shared";
  const patient = getPatientById(patientId);

  const [
    conditions,
    allergies,
    familyHistory,
    diabetes,
    encounters,
    observations,
    careTeam,
    sharingPreferences,
    medicationReconciliations,
    journeyEvents,
  ] = await Promise.all([
    listConditions(patientId, { scopeKey }),
    listAllergies(patientId, { scopeKey }),
    listFamilyHistory(patientId, { scopeKey }),
    getDiabetesProfile(patientId, { scopeKey }),
    listEncounters(patientId, { scopeKey }),
    listObservations(patientId, { scopeKey }),
    listCareAssignments(patientId, { scopeKey }),
    listSharingPreferences(patientId, { scopeKey }),
    listMedRecons(patientId, { scopeKey }),
    listJourneyEvents(patientId, { scopeKey }),
  ]);

  const medications = medicationItemsFromCohort(patientId);
  const { indicators, dataCompleteness } = assessPatient360Quality({
    hasNhsNumber: Boolean(patient?.nhsNumber),
    conditions,
    allergies,
    familyHistory,
    diabetes,
    encounters,
    observations,
    medicationsCount: medications.length,
    careTeamCount: careTeam.filter((c) => c.status === "active").length,
    sharing: sharingPreferences,
  });

  const timeline = buildTimeline({
    patientId,
    conditions,
    allergies,
    familyHistory,
    diabetes,
    encounters,
    observations,
    medRecons: medicationReconciliations,
    careTeam,
    sharing: sharingPreferences,
    quality: indicators,
    journeyEvents,
  });

  return {
    patientId,
    identity: {
      patientId,
      displayName: patient?.name ?? patientId,
      nhsNumber: patient?.nhsNumber ?? null,
      dateOfBirth: patient?.dob ?? null,
      sex: patient?.gender ?? null,
      organisation: patient?.organisation ?? null,
    },
    diabetes,
    conditions,
    allergies,
    familyHistory,
    medications,
    medicationReconciliations,
    encounters,
    observations,
    careTeam,
    sharingPreferences,
    timeline,
    qualityIndicators: indicators,
    dataCompleteness,
    synthetic: true,
    ehrWrite: false,
    hitlRequired: true,
    autonomousPrescribe: false,
    note: "Patient 360 foundation — synthetic / simulation spine; not clinically validated; ehrWrite=false; no autonomous prescribing.",
  };
}

export async function seedAndBuildPatient360(
  patientId: string,
  options?: { scopeKey?: string; actor?: string }
): Promise<Patient360Profile> {
  await seedPatient360FromCohort(patientId, options);
  return buildPatient360(patientId, { scopeKey: options?.scopeKey });
}

export async function startMedicationReconciliation(
  patientId: string,
  options: { scopeKey?: string; createdBy: string }
): Promise<Patient360Profile> {
  const scopeKey = options.scopeKey ?? "shared";
  // INT-04 — canonical write path (dedupe open runs across patient-360 / medcare).
  await startCanonicalMedReconciliation(patientId, {
    scopeKey,
    createdBy: options.createdBy,
    entrySurface: "patient360",
  });
  return buildPatient360(patientId, { scopeKey });
}

export async function decideMedicationReconciliation(
  input: {
    patientId: string;
    runId: string;
    action: "complete" | "cancel";
    actor: string;
    note?: string;
  },
  options?: { scopeKey?: string }
): Promise<Patient360Profile> {
  const scopeKey = options?.scopeKey ?? "shared";
  await decideCanonicalMedReconciliation(
    {
      runId: input.runId,
      action: input.action,
      actor: input.actor,
      note: input.note,
    },
    { scopeKey }
  );
  return buildPatient360(input.patientId, { scopeKey });
}
