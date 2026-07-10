# Canonical Data Model and Interoperability Contracts

## Canonical Envelope

All ingestion payloads are normalized into:

```json
{
  "eventId": "uuid",
  "sourceSystem": "string",
  "sourceType": "EHR|LAB|DICOM|WEARABLE|NOTES|SDOH|GENOMICS",
  "patientKey": "string",
  "eventTime": "ISO8601",
  "consentToken": "string",
  "payloadType": "FHIR_RESOURCE|FHIR_BUNDLE|HL7V2|DICOM_META|CUSTOM",
  "payload": {}
}
```

## Core FHIR Resources

- `Patient`
- `Encounter`
- `Condition`
- `Observation`
- `MedicationRequest`
- `MedicationStatement`
- `DiagnosticReport`
- `ImagingStudy`
- `CarePlan`
- `AllergyIntolerance`

## Required Mapping Rules

1. HL7 v2 -> FHIR intermediate projection.
2. DICOM metadata -> FHIR `ImagingStudy`.
3. Lab messages -> FHIR `Observation` + LOINC normalization.
4. Problem lists -> `Condition` + SNOMED canonicalization.
5. Medication records -> `MedicationRequest` and `MedicationStatement`.

## Data Quality Contract

Each normalized event includes:

- `schemaValid` boolean
- `terminologyCoverage` decimal 0..1
- `missingCriticalFields` string[]
- `qualityScore` decimal 0..100

Events with `qualityScore < 80` are quarantined for remediation.

## Patient Context Contract

Unified context response:

```json
{
  "patientKey": "string",
  "bundle": {},
  "graphSummary": {
    "nodeCount": 0,
    "edgeCount": 0,
    "lastUpdated": "ISO8601"
  },
  "riskSignals": [],
  "consentState": {
    "active": true,
    "scope": ["care", "analytics"],
    "expiresAt": "ISO8601"
  }
}
```
