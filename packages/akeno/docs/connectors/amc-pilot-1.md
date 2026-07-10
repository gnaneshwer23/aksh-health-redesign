# AMC Pilot-1 Connector Specification

## Pilot Scope

- AMC count: 1 (Pilot-1)
- Service lines: medical wards + outpatient chronic care
- Go-live mode: controlled ingestion + patient context validation

## Source Systems

| Source | Protocol | Priority |
|---|---|---|
| EHR/EMR | FHIR R4 + HL7 v2 | P0 |
| Labs | HL7 v2 ORU | P0 |
| Imaging | DICOM metadata | P1 |
| Wearables | FHIR Observation batches | P1 |
| SDOH feeds | CSV/API to FHIR Observation | P2 |

## Consent Policy

- Required scopes for ingestion: `care`, `analytics`
- Proxy delegation enabled for pediatric and elderly cohorts
- Consent token must match patient key on every ingest request

## Conformance Requirements

- Schema-valid payload rate target: >=95%
- Terminology normalization coverage target: >=90% for labs and diagnoses
- Patient context query p95 latency: <=500 ms

## Certification Checklist

1. Register pilot patients in identity-consent service.
2. Grant consent tokens with approved scopes.
3. Run adapter conformance tests for FHIR, HL7, and DICOM sample payloads.
4. Validate unified patient context bundle completeness.
5. Execute smoke test and capture audit evidence.

## Test Payloads

- FHIR Observation sample for vitals
- HL7 ORU sample mapped to Observation
- DICOM study metadata mapped to ImagingStudy

## Rollout Gate

Pilot-1 can expand to Pilot-2 only after:

- 14 consecutive days of >=95% schema-valid ingestion
- No unresolved P1 consent or audit incidents
- Clinical ops sign-off on patient context quality
