/**
 * Synthetic cohort for the patient access integration. All people, NHS
 * numbers (999 test range) and phones (Ofcom +44 7700 900xxx drama range)
 * are fictional. Patel uses id P002 and HbA1c 72 mmol/mol to match /demo/patel.
 */
import { CODES, NHS_NUMBER_SYSTEM, type Coding, type InMemoryFhirStore } from "./fhir";
import type { AccessEvent, AccessPatient } from "./types";

export const PATIENT_ACCESS_FIXTURE_NOW = new Date("2026-10-09T09:00:00.000Z");

export const FIXTURE_PATIENTS = {
  patel: { nhsNumber: "9990000001", given: "James", family: "Patel", birthDate: "1972-03-14", gender: "male", phone: "+447700900001" },
  okafor: { nhsNumber: "9990000002", given: "Ada", family: "Okafor", birthDate: "1980-07-02", gender: "female", phone: "+447700900002" },
  novak: { nhsNumber: "9990000003", given: "Tomas", family: "Novak", birthDate: "1961-11-23", gender: "male", phone: "+447700900003" }
} satisfies Record<string, AccessPatient>;

function seedEhrPatient(
  store: InMemoryFhirStore,
  id: string,
  p: AccessPatient,
  conditions: Coding[],
  labs: [Coding, string, number | null][],
  meds: string[] = []
) {
  store.create({
    resourceType: "Patient",
    id,
    identifier: [{ system: NHS_NUMBER_SYSTEM, value: p.nhsNumber }],
    name: [{ family: p.family, given: [p.given] }],
    birthDate: p.birthDate,
    gender: p.gender,
    telecom: p.phone ? [{ system: "phone", value: p.phone, use: "mobile" }] : []
  });
  for (const coding of conditions) {
    store.create({
      resourceType: "Condition",
      subject: { reference: `Patient/${id}` },
      code: { coding: [coding] },
      clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
      verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed" }] }
    });
  }
  for (const [coding, when, value] of labs) {
    store.create({
      resourceType: "Observation",
      status: "final",
      code: { coding: [coding] },
      subject: { reference: `Patient/${id}` },
      effectiveDateTime: when,
      ...(value === null ? {} : { valueQuantity: { value, unit: "mmol/mol", system: "http://unitsofmeasure.org", code: "mmol/mol" } })
    });
  }
  for (const med of meds) {
    store.create({ resourceType: "MedicationStatement", status: "active", medicationCodeableConcept: { text: med }, subject: { reference: `Patient/${id}` } });
  }
}

const DVT: Coding = { system: "http://snomed.info/sct", code: "128053003", display: "Deep venous thrombosis" };

/** Simulates data already in the GP record (verified, untagged). Novak deliberately has none. */
export function seedPatientAccessEhr(store: InMemoryFhirStore) {
  seedEhrPatient(store, "P002", FIXTURE_PATIENTS.patel, [CODES.t2d, DVT], [
    [CODES.hba1c, "2026-02-10", 72],
    [CODES.urineAcr, "2026-02-10", null],
    [CODES.retinal, "2025-06-01", null],
    [CODES.foot, "2025-05-20", null]
  ]);
  seedEhrPatient(store, "P-OKAFOR", FIXTURE_PATIENTS.okafor, [CODES.t2d], [
    [CODES.hba1c, "2026-08-01", 48],
    [CODES.urineAcr, "2026-03-10", null],
    [CODES.retinal, "2026-03-10", null],
    [CODES.foot, "2026-03-10", null]
  ], ["metformin 500 mg twice daily"]);
}

let n = 0;
const ev = (type: AccessEvent["type"], channel: AccessEvent["channel"], occurredAt: string, payload: AccessEvent["payload"]): AccessEvent => ({
  eventId: `access-evt-fixture-${++n}`, type, channel, occurredAt, payload
});

export function patelAccessEvents(): AccessEvent[] {
  const patient = FIXTURE_PATIENTS.patel;
  return [
    ev("referral.received", "fax", "2026-09-01T10:00:00.000Z", {
      patient, referrer: "Riverside Medical Practice (synthetic)", reason: "Type 2 diabetes review, poor control",
      letterText: "Please review diabetes control. On anticoagulation post-DVT."
    }),
    ev("intake.completed", "voice", "2026-09-25T10:00:00.000Z", {
      patient,
      medications: ["metformin 1 g twice daily", "gliclazide 80 mg once daily", "apixaban 5 mg twice daily", "aspirin 75 mg once daily"],
      reportedHbA1c: { value: 60, unit: "mmol/mol", date: "2026-08-20" },
      hypoEpisodes30d: 2
    }),
    ev("appointment.booked", "voice", "2026-09-25T11:00:00.000Z", { patient, start: "2026-09-28T09:30:00.000Z", service: "Diabetes review" }),
    ev("appointment.no_show", "voice", "2026-09-28T10:00:00.000Z", { patient, start: "2026-09-28T09:30:00.000Z" })
  ];
}

export function okaforAccessEvents(): AccessEvent[] {
  return [ev("intake.completed", "sms", "2026-10-02T10:00:00.000Z", { patient: FIXTURE_PATIENTS.okafor, medications: ["metformin 500 mg twice daily"], hypoEpisodes30d: 0 })];
}

export function novakAccessEvents(): AccessEvent[] {
  const patient = FIXTURE_PATIENTS.novak;
  return [
    ev("referral.received", "voice", "2026-10-01T10:00:00.000Z", { patient, referrer: "Self-referral via phone", reason: "New patient, diabetes" }),
    ev("intake.completed", "voice", "2026-10-01T12:00:00.000Z", {
      patient, conditions: ["Type 2 diabetes"], medications: ["metformin 1 g twice daily", "insulin glargine 20 units at night"], hypoEpisodes30d: 1
    })
  ];
}
