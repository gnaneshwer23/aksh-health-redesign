/**
 * FHIR R4–compatible resource shapes for Patient 360 spine.
 * Mirrors patterns in lib/patient-access/fhir.ts — not a live FHIR store.
 */

import { LOINC, SNOMED } from "../patient-access/fhir";
import type {
  AllergyRecord,
  ConditionRecord,
  DiabetesProfile,
  EncounterRecord,
  FamilyHistoryRecord,
  ObservationItem,
  Patient360Profile,
} from "./types";

export const DIABETES_SNOMED: Record<string, { code: string; display: string }> = {
  type_1: { code: "46635009", display: "Diabetes mellitus type 1" },
  type_2: { code: "44054006", display: "Diabetes mellitus type 2" },
  gestational: { code: "11687002", display: "Gestational diabetes mellitus" },
  prediabetes: { code: "714628002", display: "Prediabetes" },
  unspecified: { code: "73211009", display: "Diabetes mellitus" },
  none: { code: "260413007", display: "None" },
  modynam: { code: "237599002", display: "Maturity-onset diabetes of the young" },
  secondary: { code: "8801005", display: "Secondary diabetes mellitus" },
};

export type FhirLikeResource = {
  resourceType: string;
  id: string;
  meta?: { tag?: Array<{ system: string; code: string; display?: string }> };
  [key: string]: unknown;
};

const SYNTHETIC_TAG = {
  system: "urn:aksh:data-origin",
  code: "synthetic-patient-360",
  display: "Patient 360 synthetic spine — not clinically verified",
};

export function conditionToFhir(c: ConditionRecord): FhirLikeResource {
  return {
    resourceType: "Condition",
    id: c.id,
    meta: { tag: [SYNTHETIC_TAG] },
    clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: c.clinicalStatus }] },
    category: [{ coding: [{ system: "urn:aksh:condition-category", code: c.category }] }],
    code: {
      text: c.display,
      coding: c.code
        ? [{ system: c.codeSystem ?? SNOMED, code: c.code, display: c.display }]
        : undefined,
    },
    subject: { reference: `Patient/${c.patientId}` },
    onsetDateTime: c.onsetDate ?? undefined,
  };
}

export function allergyToFhir(a: AllergyRecord): FhirLikeResource {
  return {
    resourceType: "AllergyIntolerance",
    id: a.id,
    meta: { tag: [SYNTHETIC_TAG] },
    clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", code: a.clinicalStatus }] },
    criticality: a.criticality === "high" ? "high" : a.criticality === "low" ? "low" : "unable-to-assess",
    code: {
      text: a.substance,
      coding: a.code
        ? [{ system: a.codeSystem ?? SNOMED, code: a.code, display: a.substance }]
        : undefined,
    },
    patient: { reference: `Patient/${a.patientId}` },
    reaction: a.reaction ? [{ description: a.reaction }] : undefined,
  };
}

export function familyHistoryToFhir(f: FamilyHistoryRecord): FhirLikeResource {
  return {
    resourceType: "FamilyMemberHistory",
    id: f.id,
    meta: { tag: [SYNTHETIC_TAG] },
    status: "completed",
    patient: { reference: `Patient/${f.patientId}` },
    relationship: { text: f.relationship },
    condition: [
      {
        code: {
          text: f.conditionDisplay,
          coding: f.conditionCode
            ? [{ system: f.codeSystem ?? SNOMED, code: f.conditionCode, display: f.conditionDisplay }]
            : undefined,
        },
        onsetAge: f.onsetAgeYears != null ? { value: f.onsetAgeYears, unit: "a" } : undefined,
        note: f.notes ? [{ text: f.notes }] : undefined,
      },
    ],
  };
}

export function diabetesToFhirCondition(d: DiabetesProfile): FhirLikeResource {
  const snomed = DIABETES_SNOMED[d.diabetesType] ?? DIABETES_SNOMED.unspecified;
  return {
    resourceType: "Condition",
    id: d.id,
    meta: { tag: [SYNTHETIC_TAG] },
    clinicalStatus: {
      coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: d.status === "active" ? "active" : "inactive" }],
    },
    category: [{ coding: [{ system: "urn:aksh:condition-category", code: "diabetes" }] }],
    code: {
      text: snomed.display,
      coding: [{ system: SNOMED, code: d.snomedCode ?? snomed.code, display: snomed.display }],
    },
    subject: { reference: `Patient/${d.patientId}` },
    onsetDateTime: d.diagnosedOn ?? undefined,
    note: d.classificationNote ? [{ text: d.classificationNote }] : undefined,
  };
}

export function encounterToFhir(e: EncounterRecord): FhirLikeResource {
  return {
    resourceType: "Encounter",
    id: e.id,
    meta: { tag: [SYNTHETIC_TAG] },
    status: e.status === "finished" ? "finished" : e.status === "in_progress" ? "in-progress" : e.status,
    class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "AMB", display: e.className },
    reasonCode: e.reason ? [{ text: e.reason }] : undefined,
    subject: { reference: `Patient/${e.patientId}` },
    period: { start: e.startedAt, end: e.endedAt ?? undefined },
    text: e.clinicianSummary ? { status: "generated", div: e.clinicianSummary } : undefined,
  };
}

export function observationToFhir(o: ObservationItem): FhirLikeResource {
  return {
    resourceType: "Observation",
    id: o.id,
    meta: { tag: [SYNTHETIC_TAG] },
    status: o.verified ? "final" : "preliminary",
    code: {
      text: o.display,
      coding: o.code
        ? [{ system: o.codeSystem ?? LOINC, code: o.code, display: o.display }]
        : undefined,
    },
    subject: { reference: `Patient/${o.patientId}` },
    effectiveDateTime: o.observedAt,
    valueQuantity:
      o.valueNumeric != null
        ? { value: o.valueNumeric, unit: o.unit ?? undefined }
        : undefined,
    valueString: o.valueText ?? undefined,
  };
}

/** Assemble a FHIR Bundle snapshot for export / staging — never an EHR write. */
export function patient360ToFhirBundle(profile: Patient360Profile): {
  resourceType: "Bundle";
  type: "collection";
  id: string;
  meta: { tag: typeof SYNTHETIC_TAG[] };
  entry: Array<{ resource: FhirLikeResource }>;
  ehrWrite: false;
} {
  const resources: FhirLikeResource[] = [
    {
      resourceType: "Patient",
      id: profile.patientId,
      meta: { tag: [SYNTHETIC_TAG] },
      name: [{ text: profile.identity.displayName }],
      gender: profile.identity.sex?.toLowerCase(),
      birthDate: profile.identity.dateOfBirth ?? undefined,
      identifier: profile.identity.nhsNumber
        ? [{ system: "https://fhir.nhs.uk/Id/nhs-number", value: profile.identity.nhsNumber.replace(/\s/g, "") }]
        : undefined,
    },
    ...profile.conditions.map(conditionToFhir),
    ...profile.allergies.map(allergyToFhir),
    ...profile.familyHistory.map(familyHistoryToFhir),
    ...(profile.diabetes ? [diabetesToFhirCondition(profile.diabetes)] : []),
    ...profile.encounters.map(encounterToFhir),
    ...profile.observations.map(observationToFhir),
  ];

  return {
    resourceType: "Bundle",
    type: "collection",
    id: `bundle-p360-${profile.patientId}`,
    meta: { tag: [SYNTHETIC_TAG] },
    entry: resources.map((resource) => ({ resource })),
    ehrWrite: false,
  };
}
