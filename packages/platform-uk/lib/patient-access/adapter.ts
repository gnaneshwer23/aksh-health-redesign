/**
 * Access events -> FHIR R4-shaped resources.
 *
 * Invariants (each covered by tests/patient-access-diabetes.test.ts):
 *  - every resource created from an event is tagged EXTERNAL_ACCESS_TAG and
 *    covered by one Provenance (agent = access-service Device, entity = event id);
 *  - patient-reported clinical data is unverified (Observation.status =
 *    preliminary, Condition.verificationStatus = unconfirmed);
 *  - an existing EHR Patient is matched by NHS number and never modified.
 */
import { ACCESS_CHANNELS, ACCESS_EVENT_TYPES, type AccessEvent, type AccessPatient } from "./types";
import {
  CODES,
  EXTERNAL_ACCESS_TAG,
  NHS_NUMBER_SYSTEM,
  hba1cPercentToMmolMol,
  refOf,
  type FhirResource,
  type InMemoryFhirStore
} from "./fhir";

export const ACCESS_SERVICE_DEVICE_ID = "patient-access-service";

export type IngestResult = { patientId: string; created: string[]; updated: string[] };

export function validateAccessEvent(event: AccessEvent): void {
  if (!ACCESS_EVENT_TYPES.includes(event.type)) throw new Error(`Unknown access event type: ${event.type}`);
  if (!ACCESS_CHANNELS.includes(event.channel)) throw new Error(`Unknown access channel: ${event.channel}`);
  if (!event.payload?.patient?.nhsNumber) throw new Error("Access event must carry patient.nhsNumber");
  if ((event.type === "appointment.booked" || event.type === "appointment.no_show") && !event.payload.start) {
    throw new Error(`${event.type} requires payload.start`);
  }
}

export function ensureAccessServiceDevice(store: InMemoryFhirStore): void {
  if (!store.exists("Device", ACCESS_SERVICE_DEVICE_ID)) {
    store.create({
      resourceType: "Device",
      id: ACCESS_SERVICE_DEVICE_ID,
      deviceName: [{ name: "External patient-access service (synthetic)", type: "user-friendly-name" }]
    });
  }
}

function meta(event: AccessEvent) {
  return { tag: [EXTERNAL_ACCESS_TAG], source: `urn:aksh:access-event:${event.eventId}` };
}

function findPatient(store: InMemoryFhirStore, nhs: string): FhirResource | undefined {
  return store.search("Patient", (p) =>
    ((p.identifier as { system: string; value: string }[] | undefined) ?? []).some(
      (i) => i.system === NHS_NUMBER_SYSTEM && i.value === nhs
    )
  )[0];
}

function createPatient(store: InMemoryFhirStore, event: AccessEvent, p: AccessPatient): FhirResource {
  return store.create({
    resourceType: "Patient",
    meta: meta(event),
    identifier: [{ system: NHS_NUMBER_SYSTEM, value: p.nhsNumber }],
    name: [{ family: p.family, given: [p.given] }],
    birthDate: p.birthDate,
    gender: p.gender ?? "unknown",
    ...(p.phone ? { telecom: [{ system: "phone", value: p.phone, use: "mobile" }] } : {})
  });
}

export function ingestAccessEvent(store: InMemoryFhirStore, event: AccessEvent): IngestResult {
  validateAccessEvent(event);
  ensureAccessServiceDevice(store);

  const created: string[] = [];
  const updated: string[] = [];
  const pl = event.payload;

  let patient = findPatient(store, pl.patient.nhsNumber);
  if (!patient) {
    patient = createPatient(store, event, pl.patient);
    created.push(refOf(patient));
  }
  const pref = refOf(patient);
  const add = (r: Omit<FhirResource, "id">) => created.push(refOf(store.create({ ...r, meta: meta(event) })));

  switch (event.type) {
    case "referral.received":
      add({
        resourceType: "ServiceRequest",
        status: "active",
        intent: "order",
        code: { text: pl.reason ?? "Referral" },
        subject: { reference: pref },
        requester: { display: pl.referrer ?? "Unknown referrer" },
        authoredOn: event.occurredAt,
        note: pl.letterText ? [{ text: pl.letterText }] : []
      });
      break;

    case "intake.completed":
      for (const med of pl.medications ?? []) {
        add({
          resourceType: "MedicationStatement",
          status: "active",
          medicationCodeableConcept: { text: med },
          subject: { reference: pref },
          informationSource: { reference: pref },
          dateAsserted: event.occurredAt
        });
      }
      for (const condition of pl.conditions ?? []) {
        add({
          resourceType: "Condition",
          clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
          verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "unconfirmed" }] },
          code: { text: condition },
          subject: { reference: pref }
        });
      }
      if (pl.reportedHbA1c) {
        const r = pl.reportedHbA1c;
        add({
          resourceType: "Observation",
          status: "preliminary",
          code: { coding: [CODES.hba1c] },
          subject: { reference: pref },
          effectiveDateTime: r.date,
          valueQuantity: {
            value: r.unit === "%" ? hba1cPercentToMmolMol(r.value) : r.value,
            unit: "mmol/mol",
            system: "http://unitsofmeasure.org",
            code: "mmol/mol"
          },
          performer: [{ reference: pref }]
        });
      }
      if (typeof pl.hypoEpisodes30d === "number") {
        add({
          resourceType: "Observation",
          status: "preliminary",
          code: { coding: [CODES.hypoCount] },
          subject: { reference: pref },
          effectiveDateTime: event.occurredAt,
          valueInteger: Math.max(0, Math.trunc(pl.hypoEpisodes30d)),
          performer: [{ reference: pref }]
        });
      }
      break;

    case "appointment.booked":
      add({
        resourceType: "Appointment",
        status: "booked",
        start: pl.start,
        serviceType: [{ text: pl.service ?? "Diabetes review" }],
        participant: [{ actor: { reference: pref }, status: "accepted" }]
      });
      break;

    case "appointment.no_show": {
      const existing = store.search(
        "Appointment",
        (a) =>
          a.start === pl.start &&
          ((a.participant as { actor?: { reference?: string } }[] | undefined) ?? []).some((p) => p.actor?.reference === pref)
      )[0];
      if (existing) {
        store.update({ ...existing, status: "noshow" });
        updated.push(refOf(existing));
      } else {
        add({
          resourceType: "Appointment",
          status: "noshow",
          start: pl.start,
          serviceType: [{ text: pl.service ?? "Diabetes review" }],
          participant: [{ actor: { reference: pref }, status: "accepted" }]
        });
      }
      break;
    }
  }

  const targets = [...created, ...updated];
  if (targets.length) {
    store.create({
      resourceType: "Provenance",
      target: targets.map((reference) => ({ reference })),
      recorded: event.occurredAt,
      activity: {
        coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation", code: created.length ? "CREATE" : "UPDATE" }]
      },
      agent: [
        {
          type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/provenance-participant-type", code: "author" }] },
          who: { reference: `Device/${ACCESS_SERVICE_DEVICE_ID}` }
        }
      ],
      entity: [
        {
          role: "source",
          what: { identifier: { system: "urn:aksh:access-event", value: event.eventId }, display: `${event.type} via ${event.channel}` }
        }
      ]
    });
  }

  return { patientId: patient.id, created, updated };
}
