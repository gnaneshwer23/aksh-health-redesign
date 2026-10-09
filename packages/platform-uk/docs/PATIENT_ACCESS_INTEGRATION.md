# Patient access integration (synthetic, staged)

**Status:** staged adapter `patient-access-synthetic`, disabled by default. Synthetic data only. No vendor integrated, no telephony, no EHR write.

## What it does

An external patient-access service (voice/SMS/fax/email agents that take referrals, run intake, book and track appointments) sends events to Aksh. Aksh turns them into tagged FHIR resources, raises diabetes access-gap findings, and, only after a named clinician accepts, asks the service to make one non-clinical call per patient.

```
access event ─► lib/patient-access/adapter.ts   tagged FHIR + Provenance (unverified)
            ─► lib/patient-access/signals.ts   draft findings (no writes)
            ─► lib/patient-access/gate.ts      clinician accept / reject (audited)
            ─► dispatchOutreach()              1 request per patient, fixed phrases only
```

## Invariants (tests/patient-access-diabetes.test.ts, 22 checks)

- Access data never modifies an existing EHR Patient. New patients are tagged `external-patient-access`.
- Patient-reported data is unverified: it can raise a concern, never close one.
- No DetectedIssue, CommunicationRequest or outbound request before acceptance by an authorised clinician.
- Rejection requires a reason. Decisions are final.
- Outbound scripts contain no results, medicines or diagnoses. Rebooking a missed appointment absorbs a separate review booking.
- Dispatch is idempotent. No phone on record means no call.

## Architecture rules respected

- Integration adapter, not an agent: AGENT_DIRECTORY unchanged (12), no new orchestrator, no second SHIELD.
- Registered in `getIntegrationAdapterRegistry()`; `LIVE_ALLOW_LIST` untouched, so mode stays `staged`.
- HbA1c stored in mmol/mol (IFCC). `%` input is converted. HbA1c trend stays with `disease-modules/diabetes/hba1c.ts`.

## Open items (not built)

1. **CSO sign-off** on `PATIENT_ACCESS_THRESHOLDS` and `OUTREACH_PHRASES` (`PATIENT_ACCESS_HONESTY.thresholdsClinicallySignedOff === false`).
2. Wire proposals into the existing review queue / CONDUCTOR, and audit entries into SHIELD's trail (currently a local audit array).
3. Swap `InMemoryFhirStore` for the Medplum rehearsal client.
4. API route for inbound events (with auth + RBAC) and a vendor transport behind `AccessServiceTransport`.
5. Medication reconciliation against the GP record; contact-preference/consent check before outreach.
6. Unit consistency: the diabetes module stores HbA1c in %, while the site shows mmol/mol.
