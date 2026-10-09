# Aksh Health × patient-access vendor: diabetes integration prototype

**Synthetic data only. Not a medical device and not for use with real patients.**

Python 3.12, standard library + pytest. No network calls.

## Build status

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundations — `fhir.py`, `vendor_mock.py` | Done |
| 2 | Intake adapter — `adapter.py` | Done |
| 3 | Diabetes rules — `diabetes_rules.py` | Done |
| 4 | Clinician approval gate — `approval_gate.py` | Done |
| 5 | Outreach dispatch | Done |
| **6** | Synthetic cohort, tests, demo | **DONE — awaiting review** |

## What it does

```
Vendor event (fax/voice/SMS)  →  PatientAccessAdapter  →  FHIR R4 (tagged + Provenance)
  referral / intake / booked / no-show                              |
                                                                    v
Mock vendor outbound call  ←  dispatch (1 call/patient)  ←  ApprovalGate  ←  diabetes_rules
                                                         clinician approve / reject
```

## Synthetic cohort

| Patient | Role |
|---|---|
| **Patel** | Poor control: high HbA1c, drug interaction, hypos, missed appointment |
| **Okafor** | Well controlled — must raise **zero** findings |
| **Novak** | Vendor-only new patient (no EHR); unconfirmed diagnosis |

## Safety properties (each covered by a test)

1. Vendor data is tagged `external-patient-access`, carries Provenance, never overwrites EHR patients.
2. Patient-reported data is unverified and never satisfies monitoring.
3. No `DetectedIssue` / `CommunicationRequest` / vendor call before clinician approval.
4. Rejections require a reason. Decisions are final and audited.
5. Outbound scripts use fixed non-clinical phrases only; one call per patient; idempotent dispatch.

## Run

```bash
cd packages/aksh-parakeet
python3.12 run_demo.py
python3.12 -m pytest -q
```

Thresholds in `diabetes_rules.DEFAULT_THRESHOLDS` are placeholders pending Clinical Safety Officer sign-off.
