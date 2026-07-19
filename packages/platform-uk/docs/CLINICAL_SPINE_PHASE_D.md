# Clinical spine — Phase D

**Status:** Shipped in-repo (synthetic / HITL / sim write-back)  
**Honesty:** `liveEmis: false` · `autoRetrain: false` · `physiologicalTwin: false` · `ehrWrite: false`

## Goal

Stakeholders + delivery share the **same events** on one product spine — nurse, pharmacist, ICS, hospital, patient — not siloed demos.

## Checklist

- [x] Nurse vitals → shared modality store → patient timeline (+ Neo4j MEASURED when live)
- [x] Nurse observations page shows the same `PatientTimelinePanel` as GP
- [x] Pharmacist meds review → SHIELD + learning event (timeline parity); HITL clinical
- [x] ICS + hospital: `SpineSharedEventsPanel` from `GET /api/clinical-spine/aggregates` (same stores)
- [x] Patient companion: consent + health-plan from same APIs as GP (`mode="patient"`)
- [x] Write-back remains sim/staging only (`ehr-writeback-sim` / `emis-staging`) — never claim live EMIS
- [x] Admin system spine Phase D stakeholder paths note
- [x] Tests: `tests/clinical-spine-phase-d.test.ts` in `npm run test:clinical-proof`
- [ ] Live EMIS write-back (parallel partner track — not this phase)
- [ ] Partner DPIA / F (parallel — not this phase)

## APIs

| Endpoint | Role |
|----------|------|
| `POST /api/clinical-spine/nurse-vitals` | Nurse observations → timeline / optional KG |
| `POST /api/clinical-spine/pharmacist-review` | Meds review → SHIELD + learning |
| `GET /api/clinical-spine/aggregates` | ICS/hospital cohort counts from shared stores |
| Existing timeline / consent / health-plan | Unchanged; patient + nurse reuse |

## How to verify

```bash
cd packages/platform-uk
npx tsx tests/clinical-spine-phase-d.test.ts
npm run test:clinical-proof
```

Manual UI:

1. Nurse → Observations → save vitals → timeline panel refreshes with biomarker chips; GP patient page shows same event.
2. Pharmacist → Mark Reviewed → SHIELD trail + learning on patient timeline.
3. ICS overview / Hospital overview → Shared clinical spine aggregates (not parallel fake warehouse).
4. Patient companion → Health → consent + health plan (read-only) + timeline from same APIs.
5. Confirm toasts / banners still say liveEmis:false · ehrWrite:false · sim write only.

## Phase E next

Outcomes / learning closed loop: link care actions → eventual outcomes → governed evaluation (still `autoRetrain: false`). Partner DPIA / live EMIS remain parallel — still no fake live EMR / twin physiology.
