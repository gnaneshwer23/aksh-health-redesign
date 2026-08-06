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

**SHIELD dual-write is fail-visible, not best-effort-silent (B1 / OQ-HITL-2, closed):**
`persistShieldAuditEvent` returns a discriminated `{ persisted: true, row }` / `{ persisted: false, row: null, reason }`
result — a failed durable write is never indistinguishable from a successful one. `recordLearningEvent`
propagates this as `shieldAuditWriteFailed` / `shieldAuditWriteReason`, which `queue-decision.ts` (Accept/Edit/Reject),
`outcomes-loop.ts` (outcome capture, governed evaluation) surface to the API response and the reviewer UI
(dismissible "audit write degraded — retry" banner, `POST /api/clinical-spine/shield-audit-retry` to re-attempt).
The clinical action itself is **never** blocked on the SHIELD write — an Accept/Edit/Reject still completes and
returns 200 even when the audit mirror fails; only the honesty of what's reported back changes. This is *visibly
degraded when it fails*, not "guaranteed durable" — no stronger durability claim is made.

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

### Outcomes-loop honesty: two distinct ratios, not one blended number (B2 / OQ / FR-LEARN-012, -014, -015)

`classifyCareAction` (`lib/clinical-spine/outcomes-loop.ts`) puts every care action into exactly one `loopStage`:

| `loopStage` | Meaning | Is this a real captured outcome? |
| --- | --- | --- |
| `awaiting_outcome` | No disposition/outcome recorded yet. **Never auto-closes** (FR-LEARN-014) — no timeout, no silent default. | No — genuinely open. |
| `outcome_linked` | An eventual outcome was later linked (`captureSpineOutcome` / `POST .../outcome`) by a clinician, patient, or admin. | **Yes.** |
| `immediate_outcome` | A real outcome (`care_action_completed` / `adverse_event_none` / `adverse_event_suspected`) was reported at decision time itself, not via a separate link. | **Yes.** |
| `no_action_required` | **Reject**: `queue-decision.ts` sets `outcomeKind:"care_action_deferred"` on every Reject. There is nothing to follow up on a rejected draft — this is correct HITL behaviour and unchanged — but it is a *disposition*, not a human reporting what happened to the patient. | **No.** |

Before B2, Reject-driven closures were folded into the same `immediate_outcome` bucket as genuinely-reported outcomes, and a single `loopCompleteRatio` blended both into one number — inflating apparent "outcome completeness" by however many drafts got rejected (`VOLUME_I_DRAFT_AUDIT.md`'s own finding). `buildOutcomesLoopStatus` now reports two separately-labeled ratios instead of one:

- **`dispositionCompleteRatio`** — every care action with *any* Accept/Edit/Reject disposition recorded (`loopStage !== "awaiting_outcome"`), including `no_action_required`. A **workload/throughput** signal — this is what the old blended metric actually measured for Reject cases.
- **`realOutcomeCaptureRatio`** — only `outcome_linked` + genuinely-reported `immediate_outcome` (excludes `no_action_required` and `awaiting_outcome`). A **measurement-honesty** signal: how often a human actually reported what happened to the patient. Nothing in the code requires this to ever reach 1.0 — outcome reporting is genuinely best-effort/self-serve today, and `realOutcomeCaptureRatio` is expected to start low and stay low. It must never be presented as "complete" or "high" on any dashboard.

Both ratios, plus `noActionRequiredCount`, are on `OutcomesLoopStatus` and surfaced with distinct labels/tooltips on every dashboard that shows loop counts: `SpineOutcomesCapturePanel` (GP + patient companion), `SystemSpinePanel` (admin), `GovernedEvaluationPanel` (admin governed-eval banner) — no surface shows a single unlabeled "complete ratio" anymore.
