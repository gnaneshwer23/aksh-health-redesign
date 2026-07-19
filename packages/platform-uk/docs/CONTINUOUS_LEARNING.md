# Continuous learning — safe loop (Aksh Health)

**Status:** Recorder + eventual-outcome linking implemented. **Not** a production model-update pipeline.

## Principle

```text
prediction (agent draft)
  → clinician decision (Accept / Edit / Reject / Defer)   ← HITL mandatory
    → measurable / observational outcome (immediate or eventual)
    → append-only learning event (optional link row for delayed outcomes)
```

What this loop **must never** do:

- Auto-retrain models
- Silently bump prompt / model versions
- Write to the EHR
- Promote a draft to a clinical record
- UPDATE/DELETE prior learning rows

## API

| Method | Path | Behaviour |
| --- | --- | --- |
| `POST` | `/api/learning/events` | Append prediction → decision → outcome (auth required). `outcomeKind` optional (defaults `unknown`) |
| `GET` | `/api/learning/events` | List recent events |
| `POST` | `/api/learning/events/[id]/outcome` | Append-only **eventual outcome** link (new row with `linksToEventId`; source unchanged) |
| PUT / PATCH / DELETE | — | **Not exposed** |

Response always includes `autoRetrainTriggered: false`, `modelUpdated: false`, `ehrWrite: false`, `hitlRequired: true`.

### Example POST body (decision now, outcome later)

```json
{
  "agentLabel": "GUARDIAN",
  "predictionId": "pred-guardian-p002-1",
  "predictionSummary": "Aspirin + Apixaban interaction draft",
  "decision": "accept",
  "decisionNotes": "Interaction acknowledged",
  "patientId": "P002",
  "caseId": "case-123"
}
```

### Example eventual outcome link

```http
POST /api/learning/events/learn-…/outcome
```

```json
{
  "outcomeKind": "care_action_completed",
  "outcomeSummary": "Medication review completed at 30 days",
  "outcomeMetric": { "name": "days_to_follow_up", "value": 30, "unit": "days" }
}
```

## Admin UI

`/dashboard/admin/learning` — list, CSV export, and **Link eventual outcome** form. No retrain / version-bump controls.

## Storage

1. **Postgres** (`aksh.learning_events`) when `DATABASE_URL` is set — schema auto-ensured; migration `db/migrations/008_learning_events.sql`
2. **Controlled file fallback** under `packages/platform-uk/data/learning-events.json` (or scoped `learning-events.<scope>.json`) — never outside `data/`

Dual-write: a SHIELD-adjacent audit row (`category: continuous_learning`) when Postgres is available.

`linksToEventId` is stored in the JSON `payload` column (file store: top-level field).

## Governance / governed release SOP

- Learning events feed **evaluation / CSO review**, not automatic deployment.
- Model or prompt changes require explicit release authority — see **`docs/GOVERNED_MODEL_RELEASE_SOP.md`** (approval gates G-ML-1…3 before any version bump).
- Hazard H-011 / H-012 in `docs/HAZARD_LOG_TEMPLATE.md` track residual risk until Gate 2.

## How to verify

```bash
cd packages/platform-uk
npm run test:clinical-proof   # includes CP-LEARN-001
# With auth session:
# POST /api/learning/events  … then POST /api/learning/events/{id}/outcome
```

## Related

- Clinical spine Phase E closed loop: `docs/CLINICAL_SPINE_PHASE_E.md`
- Governed model release SOP: `docs/GOVERNED_MODEL_RELEASE_SOP.md`
- SHIELD audit: `/api/audit/shield`
- Eval harness: `docs/AGENT_EVAL_HARNESS.md`
- Safety case rehearsal: `docs/SAFETY_CASE_REHEARSAL.md`

### Clinical spine outcomes (Phase E)

| Method | Path | Behaviour |
| --- | --- | --- |
| `GET` | `/api/clinical-spine/outcomes` | Loop status (care actions awaiting / linked) |
| `POST` | `/api/clinical-spine/outcomes` | Capture eventual outcome (`reporterRole`: clinician \| patient \| admin) |
| `GET/POST` | `/api/clinical-spine/governed-evaluation` | Human-gated evaluation; blocks `propose_model_update` without G-ML-1…3 |
