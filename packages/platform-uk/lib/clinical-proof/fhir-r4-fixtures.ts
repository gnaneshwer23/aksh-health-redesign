/**
 * Synthetic FHIR R4 fixtures for clinical-proof CI validation.
 * Not real patient data.
 */

import type { ClinicalProofFhirR4Type } from "./fhir-r4-validator";

const SUBJECT = { reference: "Patient/P002", display: "Mr James Patel (synthetic)" };

export function buildClinicalProofFhirR4Fixtures(): Record<ClinicalProofFhirR4Type, Record<string, unknown>> {
  const now = "2026-07-18T12:00:00Z";

  return {
    DocumentReference: {
      resourceType: "DocumentReference",
      id: "doc-soap-p002",
      status: "current",
      type: { text: "SOAP note" },
      subject: SUBJECT,
      date: now,
      content: [
        {
          attachment: {
            contentType: "text/plain",
            title: "Synthetic SOAP — Patel golden path",
            data: Buffer.from(
              "S: Leg swelling. O: DVT + T2D. A: Anticoag interaction risk. P: Review GUARDIAN alert."
            ).toString("base64")
          }
        }
      ]
    },
    Condition: {
      resourceType: "Condition",
      id: "cond-dvt-p002",
      clinicalStatus: {
        coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }],
        text: "active"
      },
      code: {
        coding: [{ system: "http://snomed.info/sct", code: "128053003", display: "Deep venous thrombosis" }],
        text: "Deep vein thrombosis"
      },
      subject: SUBJECT,
      recordedDate: "2026-07-15"
    },
    Flag: {
      resourceType: "Flag",
      id: "flag-guardian-p002",
      status: "active",
      code: {
        text: "GUARDIAN: Aspirin + Apixaban bleeding risk"
      },
      subject: SUBJECT,
      category: [{ text: "safety" }]
    },
    MedicationRequest: {
      resourceType: "MedicationRequest",
      id: "medreq-apixaban-p002",
      status: "draft",
      intent: "proposal",
      medicationCodeableConcept: {
        text: "Apixaban 10mg BD (proposed)"
      },
      subject: SUBJECT,
      authoredOn: now,
      dosageInstruction: [{ text: "10mg twice daily for 7 days then review" }],
      reasonCode: [{ text: "Confirmed DVT" }]
    },
    RiskAssessment: {
      resourceType: "RiskAssessment",
      id: "risk-oracle-p002",
      status: "final",
      subject: SUBJECT,
      occurrenceDateTime: now,
      method: { text: "ORACLE composite" },
      prediction: [
        {
          outcome: { text: "14-day admission" },
          qualitativeRisk: { text: "High" },
          probabilityDecimal: 0.42,
          rationale: "Synthetic ORACLE score for clinical proof"
        }
      ]
    },
    ServiceRequest: {
      resourceType: "ServiceRequest",
      id: "servreq-referral-p002",
      status: "draft",
      intent: "order",
      code: { text: "Urgent DVT clinic referral" },
      subject: SUBJECT,
      authoredOn: now,
      reasonCode: [{ text: "Ultrasound-confirmed DVT with T2D" }]
    },
    Observation: {
      resourceType: "Observation",
      id: "obs-hba1c-p002",
      status: "final",
      code: {
        coding: [{ system: "http://loinc.org", code: "4548-4", display: "Hemoglobin A1c" }],
        text: "HbA1c"
      },
      subject: SUBJECT,
      effectiveDateTime: "2026-07-10",
      valueQuantity: {
        value: 68,
        unit: "mmol/mol",
        system: "http://unitsofmeasure.org",
        code: "mmol/mol"
      }
    },
    AuditEvent: {
      resourceType: "AuditEvent",
      id: "ae-hitl-accept-p002",
      type: {
        system: "http://terminology.hl7.org/CodeSystem/audit-event-type",
        code: "rest",
        display: "Restful Operation"
      },
      action: "U",
      recorded: now,
      agent: [
        {
          requestor: true,
          name: "Dr Proof (synthetic)",
          who: { reference: "Practitioner/gp-proof-1" }
        }
      ],
      source: {
        observer: { display: "Aksh Health clinical-proof harness" },
        type: [{ code: "4", display: "Application Server" }]
      },
      entity: [
        {
          what: { reference: "DocumentReference/doc-soap-p002" },
          name: "Accepted SOAP draft"
        }
      ]
    },
    Encounter: {
      resourceType: "Encounter",
      id: "enc-p002-proof",
      status: "finished",
      class: {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "AMB",
        display: "ambulatory"
      },
      subject: SUBJECT,
      reasonCode: [{ text: "DVT follow-up / medication safety review" }],
      period: { start: "2026-07-18T09:30:00Z", end: "2026-07-18T09:50:00Z" }
    }
  };
}

/** Bundle containing one of each clinical-proof target resource type. */
export function buildClinicalProofFhirR4Bundle(): Record<string, unknown> {
  const fixtures = buildClinicalProofFhirR4Fixtures();
  const resources = Object.values(fixtures);
  return {
    resourceType: "Bundle",
    id: "bundle-clinical-proof-r4",
    type: "collection",
    timestamp: "2026-07-18T12:00:00Z",
    meta: {
      tag: [
        {
          system: "https://akshhealth.app/tags/data-boundary",
          code: "synthetic-only",
          display: "Synthetic-only proof artifact"
        }
      ]
    },
    entry: resources.map((resource) => ({
      fullUrl: `urn:uuid:${String(resource.resourceType)}-${String(resource.id)}`,
      resource
    }))
  };
}
