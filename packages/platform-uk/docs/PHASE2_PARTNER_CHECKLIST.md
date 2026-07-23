# Phase 2 Partner Checklist — EMIS + Wearable DPIA

**Date:** 18 Jul 2026  
**Status:** Readiness scaffold — **not** evidence that partners or live modalities exist  
**Invariant:** HITL mandatory · **zero autonomous clinical EHR write** · `liveEmis: false` until signed go

Companion: [`PRECISION_HEALTH_DELIVERY_ROADMAP.md`](./PRECISION_HEALTH_DELIVERY_ROADMAP.md) · API: `GET /api/integrations/emis-partner-checklist`

---

## Purpose

This checklist is what **org / partners / IG** must complete before Phase 2 exit for:

1. Partner EMR write-back (EMIS / SystmOne track)
2. First consented live wearable (or lifestyle) modality

Code in this repo can only mark scaffolding rows. Partner credentials, DPIA, and CSO signatures are **out-of-band**.

---

## A. EMIS Partner write-back

| # | Item | Owner | Status | Evidence |
| --- | --- | --- | --- | --- |
| E1 | Partner API sandbox access | Partner / engineering | ☐ | Client id + token URL in secure env (never commit) |
| E2 | FHIR R4 write scope agreed | Partner + CSO | ☐ | Scope doc (which resources; Accept-only) |
| E3 | HITL Accept → staging → Partner path UAT | Engineering + clinical lead | ☐ | UAT script; sim token path rehearsed |
| E4 | DPIA covering EMR write-back | IG / DPO | ☐ | DPIA reference ID |
| E5 | DPA / processing agreement with practice | Legal / IG | ☐ | Signed DPA |
| E6 | Signed write-back **go / no-go** | CSO + release authority | ☐ | Written decision; if no-go, stay staging-only |
| E7 | Rollback / disable path | Engineering | ☐ | Flag off + queue drain procedure |

**Platform today:** `POST /api/integrations/emis-staging` queues internally; `liveWriteBack: false`; `liveEmis: false`. Approval tokens exist on **ehr-writeback-sim** only.

---

## B. Wearable / lifestyle modality DPIA

| # | Item | Owner | Status | Evidence |
| --- | --- | --- | --- | --- |
| W1 | Choose **one** first modality (wearable **or** lifestyle diary) | Product + CSO | ☐ | Decision note |
| W2 | Purpose codes mapped to lawful basis | IG | ☐ | Align with `/api/consent/grants` purpose catalogue |
| W3 | Consent UX + revoke-effective enforcement | Engineering + IG | ☐ | Revoke tested on ingest API |
| W4 | DPIA for device / diary data | IG / DPO | ☐ | DPIA reference ID |
| W5 | Vendor DPA (e.g. Fitbit) if OAuth live | Legal | ☐ | Only after `FITBIT_CLIENT_*` + real OAuth — never invent live streams |
| W6 | Clinical safety scope for coaching vs clinical claims | CSO | ☐ | Coaching remains “not clinical advice” unless safety case expands |
| W7 | Neo4j living-KG tenant / retention rules | Engineering + IG | ☐ | If Aura used for MEASURED edges |

**Platform today:** connectors `wearable_synthetic_stream`, `lifestyle_diary`, `fitbit_oauth_stub`, `file_import` — `liveStream: false` unless Fitbit client env present; ingest never invents device reads.

### Documented env var **names** (future real connectors)

- `FITBIT_CLIENT_ID`
- `FITBIT_CLIENT_SECRET`
- `FITBIT_REDIRECT_URI`
- `WEARABLE_IMPORT_BUCKET`
- `LIFESTYLE_DIARY_WEBHOOK_SECRET`
- `ENABLE_EMIS_PARTNER_SANDBOX` (default false = sim path; true = sandbox rehearsal only)
- `EMIS_PARTNER_CLIENT_ID`
- `EMIS_PARTNER_CLIENT_SECRET`
- `EMIS_PARTNER_TOKEN_URL`
- `EMIS_PARTNER_FHIR_BASE_URL`

Presence of Partner env ≠ `liveEmis` flip. Smoke: `npm run smoke:emis-partner`.

---

## C. Predictive model ownership (ORACLE)

| # | Item | Owner | Status |
| --- | --- | --- | --- |
| M1 | Name clinical owner on model card | CSO | ☐ (card currently `UNASSIGNED`) |
| M2 | Eval harness gate on release | Engineering | Scaffold: `npm run eval:agents` |
| M3 | No auto-retrain | All | Enforced — see `docs/GOVERNED_MODEL_RELEASE_SOP.md` |

---

## D. Medplum rehearsal

| # | Item | Owner | Status |
| --- | --- | --- | --- |
| F1 | `ENABLE_MEDPLUM_SYNC=true` in staging only | Engineering | Optional |
| F2 | Dry-run FHIR bundle sync green | Engineering | `npm run smoke:medplum` · `GET /api/integrations/medplum-status?probe=dry-run` |
| F3 | Never claim Medplum = EMIS write-back | All | `liveEmis: false` always |

---

## Exit gate (honest)

Phase 2 **exit** still requires partners + DPIA + named clinical owner. This document + in-repo APIs prove **readiness scaffolding**, not live Partner EMR or live Fitbit.
