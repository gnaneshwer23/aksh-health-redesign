import { getPatientById } from "../mock-data";
import { DIABETES_SNOMED } from "./fhir";
import { prov, randomUUID, replacePatientSpine } from "./repository";
import type {
  AllergyRecord,
  CareAssignment,
  ConditionRecord,
  DiabetesProfile,
  DiabetesType,
  EncounterRecord,
  FamilyHistoryRecord,
  ObservationItem,
  SharingPreference,
} from "./types";

function inferDiabetesType(conditions: string[]): DiabetesType {
  const joined = conditions.join(" ").toLowerCase();
  if (/type\s*1|t1dm/.test(joined)) return "type_1";
  if (/gestational/.test(joined)) return "gestational";
  if (/prediabetes|impaired glucose/.test(joined)) return "prediabetes";
  if (/type\s*2|t2dm|diabetes mellitus/.test(joined)) return "type_2";
  return "none";
}

function categoriseCondition(display: string): ConditionRecord["category"] {
  const d = display.toLowerCase();
  if (/diabetes/.test(d)) return "diabetes";
  if (/hypertension|ckd|obesity|dyslipid|heart|copd|depression|dvt|frailty/.test(d)) {
    return "comorbidity";
  }
  return "problem";
}

/** Seed structured Patient 360 spine from mock cohort + synthetic enrichments. */
export async function seedPatient360FromCohort(
  patientId: string,
  options?: { scopeKey?: string; actor?: string }
): Promise<void> {
  const scopeKey = options?.scopeKey ?? "shared";
  const patient = getPatientById(patientId);
  const recordedAt = new Date().toISOString();
  const source = "synthetic_seed";

  const conditions: Omit<ConditionRecord, "synthetic">[] = (patient?.activeConditions ?? []).map(
    (display) => ({
      id: `cond-${randomUUID()}`,
      patientId,
      display,
      code: null,
      codeSystem: null,
      clinicalStatus: "active",
      category: categoriseCondition(display),
      onsetDate: null,
      provenance: prov(source, 0.85, undefined, recordedAt),
    })
  );

  const allergies: Omit<AllergyRecord, "synthetic">[] = (patient?.allergies ?? [])
    .filter((a) => a && !/^none known$/i.test(a.trim()))
    .map((substance) => ({
      id: `alg-${randomUUID()}`,
      patientId,
      substance,
      code: null,
      codeSystem: null,
      criticality: /penicillin|sulfonamide/i.test(substance) ? "high" : "unknown",
      reaction: null,
      clinicalStatus: "active" as const,
      provenance: prov(source, 0.9, undefined, recordedAt),
    }));

  if (allergies.length === 0 && patient) {
    allergies.push({
      id: `alg-${randomUUID()}`,
      patientId,
      substance: "No known drug allergies",
      code: "716186003",
      codeSystem: "http://snomed.info/sct",
      criticality: "unable_to_assess",
      reaction: null,
      clinicalStatus: "active",
      provenance: prov(source, 0.7, "nkda-synthetic", recordedAt),
    });
  }

  const diabetesType = inferDiabetesType(patient?.activeConditions ?? []);
  const snomed = DIABETES_SNOMED[diabetesType];
  const diabetes: Omit<DiabetesProfile, "synthetic"> | null =
    diabetesType === "none"
      ? {
          id: `diab-${randomUUID()}`,
          patientId,
          diabetesType: "none",
          classificationNote: "No diabetes diagnosis on synthetic cohort record",
          diagnosedOn: null,
          snomedCode: null,
          status: "unknown",
          provenance: prov(source, 0.8, undefined, recordedAt),
        }
      : {
          id: `diab-${randomUUID()}`,
          patientId,
          diabetesType,
          classificationNote: `Inferred from cohort conditions for synthetic demo (${diabetesType})`,
          diagnosedOn: patient?.lastEncounterDate?.slice(0, 10) ?? null,
          snomedCode: snomed?.code ?? null,
          status: "active",
          provenance: prov(source, 0.8, undefined, recordedAt),
        };

  const familyHistory: Omit<FamilyHistoryRecord, "synthetic">[] =
    diabetesType === "type_2" || diabetesType === "type_1"
      ? [
          {
            id: `fh-${randomUUID()}`,
            patientId,
            relationship: "mother",
            conditionDisplay: "Type 2 diabetes mellitus",
            conditionCode: "44054006",
            codeSystem: "http://snomed.info/sct",
            onsetAgeYears: 55,
            notes: "Synthetic family history for demo",
            provenance: prov(source, 0.6, undefined, recordedAt),
          },
          {
            id: `fh-${randomUUID()}`,
            patientId,
            relationship: "father",
            conditionDisplay: "Essential hypertension",
            conditionCode: "59621000",
            codeSystem: "http://snomed.info/sct",
            onsetAgeYears: 60,
            notes: null,
            provenance: prov(source, 0.6, undefined, recordedAt),
          },
        ]
      : [
          {
            id: `fh-${randomUUID()}`,
            patientId,
            relationship: "sibling",
            conditionDisplay: "No significant family history recorded",
            conditionCode: null,
            codeSystem: null,
            onsetAgeYears: null,
            notes: "Placeholder synthetic entry",
            provenance: prov(source, 0.5, undefined, recordedAt),
          },
        ];

  const started =
    patient?.lastEncounterDate && !Number.isNaN(new Date(patient.lastEncounterDate).getTime())
      ? new Date(patient.lastEncounterDate).toISOString()
      : recordedAt;

  const encounters: Omit<EncounterRecord, "synthetic">[] = [
    {
      id: `enc-${randomUUID()}`,
      patientId,
      className: "primary-care",
      reason: patient?.activeConditions?.[0] ?? "Routine review",
      clinicianSummary: patient
        ? `Synthetic encounter for ${patient.name}. Supervising: ${patient.supervisingGp ?? "unassigned"}.`
        : "Synthetic encounter — patient not in mock cohort",
      status: "finished",
      startedAt: started,
      endedAt: started,
      provenance: prov(source, 0.85, undefined, recordedAt),
    },
  ];

  const observations: Omit<ObservationItem, "synthetic">[] = [];
  if (patient?.vitals) {
    const v = patient.vitals;
    const [sys, dia] = (v.bloodPressure ?? "").split("/").map((x) => Number(x));
    const obsAt = new Date(v.recordedAt.replace(" ", "T") + "Z").toISOString();
    if (Number.isFinite(sys)) {
      observations.push({
        id: `obs-${randomUUID()}`,
        patientId,
        kind: "systolic_bp",
        display: "Systolic blood pressure",
        valueNumeric: sys,
        valueText: null,
        unit: "mmHg",
        code: "8480-6",
        codeSystem: "http://loinc.org",
        observedAt: obsAt,
        sourceChannel: "clinic",
        verified: true,
        qualityFlag: "ok",
        provenance: prov(source, 0.9, v.recordedBy, recordedAt),
      });
    }
    if (Number.isFinite(dia)) {
      observations.push({
        id: `obs-${randomUUID()}`,
        patientId,
        kind: "diastolic_bp",
        display: "Diastolic blood pressure",
        valueNumeric: dia,
        valueText: null,
        unit: "mmHg",
        code: "8462-4",
        codeSystem: "http://loinc.org",
        observedAt: obsAt,
        sourceChannel: "clinic",
        verified: true,
        qualityFlag: "ok",
        provenance: prov(source, 0.9, v.recordedBy, recordedAt),
      });
    }
    observations.push({
      id: `obs-${randomUUID()}`,
      patientId,
      kind: "heart_rate",
      display: "Heart rate",
      valueNumeric: v.heartRate,
      valueText: null,
      unit: "/min",
      code: "8867-4",
      codeSystem: "http://loinc.org",
      observedAt: obsAt,
      sourceChannel: "clinic",
      verified: true,
      qualityFlag: "ok",
      provenance: prov(source, 0.9, v.recordedBy, recordedAt),
    });
  }

  if (diabetesType === "type_2" || diabetesType === "type_1") {
    observations.push({
      id: `obs-${randomUUID()}`,
      patientId,
      kind: "hba1c",
      display: "HbA1c",
      valueNumeric: patientId === "P002" ? 68 : 52,
      valueText: null,
      unit: "mmol/mol",
      code: "4548-4",
      codeSystem: "http://loinc.org",
      observedAt: started,
      sourceChannel: "lab",
      verified: true,
      qualityFlag: "ok",
      provenance: prov(source, 0.88, "synthetic-lab", recordedAt),
    });
  }

  const careAssignments: Omit<CareAssignment, "synthetic">[] = [
    {
      id: `care-${randomUUID()}`,
      patientId,
      memberDisplay: patient?.supervisingGp ?? "Dr Synthetic Lead",
      careRole: "lead_clinician",
      memberEmail: null,
      status: "active",
      assignedAt: recordedAt,
      endedAt: null,
    },
    {
      id: `care-${randomUUID()}`,
      patientId,
      memberDisplay: "Practice Nurse Adeyemi",
      careRole: "diabetes_educator",
      memberEmail: null,
      status: "active",
      assignedAt: recordedAt,
      endedAt: null,
    },
  ];

  const sharingPreferences: Omit<SharingPreference, "synthetic">[] = [
    {
      id: `share-${randomUUID()}`,
      patientId,
      purpose: "direct_care",
      status: "granted",
      basis: "synthetic explicit consent for demo",
      recordedBy: options?.actor ?? "synthetic-seed",
      recordedAt,
    },
    {
      id: `share-${randomUUID()}`,
      patientId,
      purpose: "care_coordination",
      status: "granted",
      basis: "synthetic explicit consent for demo",
      recordedBy: options?.actor ?? "synthetic-seed",
      recordedAt,
    },
    {
      id: `share-${randomUUID()}`,
      patientId,
      purpose: "research",
      status: "denied",
      basis: "synthetic preference — research opt-out",
      recordedBy: options?.actor ?? "synthetic-seed",
      recordedAt,
    },
  ];

  await replacePatientSpine(
    patientId,
    {
      conditions,
      allergies,
      familyHistory,
      diabetes,
      encounters,
      observations,
      careAssignments,
      sharingPreferences,
    },
    { scopeKey }
  );
}
