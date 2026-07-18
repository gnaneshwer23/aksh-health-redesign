# Continuous learning — safe loop (Aksh Health)

**Status:** Recorder implemented (Sprint C). **Not** a production model-update pipeline.

## Principle

```text
prediction (agent draft)
  → clinician decision (Accept / Edit / Reject / Defer)   ← HITL mandatory
  → measurable / observational outcome
  → append-only learning event
```

What this loop **must never** do:

- Auto-retrain models
- Silently bump prompt / model versions
- Write to the EHR
- Promote a draft to a clinical record

## API

| Method | Path | Behaviour |
| --- | --- | --- |
| `POST` | `/api/learning/events` | Append prediction → decision → outcome (auth required) |
| `GET` | `/api/learning/events` | List recent events |
| PUT / PATCH / DELETE | — | **Not exposed** |

Response always includes `autoRetrainTriggered: false`, `modelUpdated: false`, `ehrWrite: false`, `hitlRequired: true`.

### Example POST body

```json
{
  "agentLabel": "GUARDIAN",
  "predictionId": "pred-guardian-p002-1",
  "predictionSummary": "Aspirin + Apixaban interaction draft",
  "decision": "accept",
  "decisionNotes": "Interaction acknowledged",
  "outcomeKind": "care_action_completed",
  "outcomeSummary": "Medication review completed",
  "patientId": "P002",
  "caseId": "case-123",
  "outcomeMetric": { "name": "days_to_follow_up", "value": 7, "unit": "days" }
}
```

## Storage

1. **Postgres** (`aksh.learning_events`) when `DATABASE_URL` is set — schema auto-ensured; migration `db/migrations/008_learning_events.sql`
2. **Controlled file fallback** under `packages/platform-uk/data/learning-events.json` (or scoped `learning-events.<scope>.json`) — never outside `data/`

Dual-write: a SHIELD-adjacent audit row (`category: continuous_learning`) when Postgres is available.

## Governance

- Learning events feed **evaluation / CSO review**, not automatic deployment.
- Model or prompt changes require explicit release authority (see evidence pack #5 / #13).
- Hazard H-011 / H-012 in `docs/HAZARD_LOG_TEMPLATE.md` track residual risk until Gate 2.

## How to verify

```bash
cd packages/platform-uk
npm run test:clinical-proof   # includes CP-LEARN-001
# With auth session:
# POST /api/learning/events  … then GET /api/learning/events
```

## Related

- SHIELD audit: `/api/audit/shield`
- Eval harness: `docs/AGENT_EVAL_HARNESS.md`
- Safety case rehearsal: `docs/SAFETY_CASE_REHEARSAL.md`
