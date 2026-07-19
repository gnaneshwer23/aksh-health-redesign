# Clinical spine — Phase E

**Status:** Shipped in-repo (synthetic / HITL / sim write-back)  
**Honesty:** `liveEmis: false` · `autoRetrain: false` · `physiologicalTwin: false` · `ehrWrite: false` · `modelUpdated: false`

## Goal

Outcomes / learning **closed loop** on the same clinical spine: care actions (HITL) → eventual outcomes → governed evaluation. Never autonomous model retrain.

## Checklist

- [x] Care actions / HITL decisions already write learning events (Phase A queue + Phase D pharmacist); outcomes attach via append-only `linksToEventId`
- [x] Clinician + patient outcome capture UI on GP patient + companion (`SpineOutcomesCapturePanel`)
- [x] Spine outcomes API: `GET/POST /api/clinical-spine/outcomes`
- [x] Governed evaluation path: review → G-ML-1…3 human gates → block `propose_model_update` without signatures; never auto-retrain
- [x] Admin learning page: `GovernedEvaluationPanel` + existing CSV / eventual-outcome link
- [x] System spine Phase E loop status (counts + autoRetrain:false)
- [x] Tests: `tests/clinical-spine-phase-e.test.ts` in `npm run test:clinical-proof`
- [ ] Live EMIS write-back (parallel partner track — Phase F)
- [ ] Partner DPIA / CSO signed Gate 2 (parallel — Phase F)
- [ ] Named CSO who signs G-ML-2 in production (external)

## APIs

| Endpoint | Role |
|----------|------|
| `GET /api/clinical-spine/outcomes` | Loop status (optional `?patientId=` / `?view=actions`) |
| `POST /api/clinical-spine/outcomes` | Capture eventual outcome (`reporterRole`: clinician \| patient \| admin) |
| `GET/POST /api/clinical-spine/governed-evaluation` | List / record evaluation; gate `propose_model_update` |
| Existing `/api/learning/events` + `/outcome` | Unchanged append-only recorder |

## Loop shape

```text
HITL care action (learning event)
  → eventual outcome link (append-only row, linksToEventId)
    → governed evaluation review (G-ML-1…3)
      → manual release only (autoRetrain:false · modelUpdated:false)
```

## How to verify

```bash
cd packages/platform-uk
npx tsx tests/clinical-spine-phase-e.test.ts
npm run test:clinical-proof
```

Manual UI:

1. GP → patient → Accept a draft (or pharmacist Mark Reviewed) → **Capture care outcome** → link eventual outcome → timeline refreshes.
2. Patient companion → **Report an outcome** against the same open care action (patient-reported).
3. Admin → Learning → **Governed evaluation** → try `propose_model_update` without gates (blocked) → sign G-ML-1…3 → record (still autoRetrain:false).
4. Admin → Precision Health → System spine → Phase E section shows loop counts.

## Phase F next (partners — parallel)

EMIS / SystmOne write-back, DPIA, CSO Gate 2 signatures, first live modality credentials. Still no fake live EMR, physiological twin, or auto-retrain until those gates are real.
