# Governed model release SOP (stub)

**Status:** Documentary control — **not** an automated pipeline.  
**Related:** `docs/CONTINUOUS_LEARNING.md` · REQ-029 · Gate 2 clinical safety.

## Purpose

Any change to a clinical-facing model, prompt pack, or agent version that can alter drafts shown to clinicians must pass explicit human approval gates. Learning events (`/api/learning/events`) are **evaluation input only** — they must never bump a model version.

## Hard rules

1. **No auto-retrain** from learning events, feedback, or SHIELD audits.
2. **No silent version bump** in production env / feature flags without a signed gate.
3. **HITL remains mandatory** for any draft that could become a clinical record after accept.
4. **Rollback plan** must exist before promote (see evidence pack #16).

## Approval gates (before any model version bump)

| Gate | Authority | Evidence required | Pass criteria |
| --- | --- | --- | --- |
| G-ML-1 | Engineering lead | Diff of model/prompt/config + eval harness delta | `npm run eval:agents` meets golden thresholds; no HITL/EHR invariant regressions |
| G-ML-2 | Clinical Safety Officer (CSO) | Hazard log delta + residual risk note | New/changed hazards linked to test IDs; unsigned hazards called out |
| G-ML-3 | Release authority / pilot sponsor | Gate 2 checklist slice + rollback owner | Explicit written approve of version string to promote |

Until G-ML-1…3 are signed, keep previous `modelVersion` / prompt pack in production.

## Release checklist (operator)

- [ ] Target version string recorded (e.g. `guardian-prompt-2026-07-18`)
- [ ] Learning-event sample reviewed (prediction → decision → **eventual outcome**); no auto-retrain flags
- [ ] `npm run test:clinical-proof` green (includes CP-LEARN-001)
- [ ] Eval report attached (`npm run eval:agents` / evidence pack #5)
- [ ] Hazard log updated (`docs/HAZARD_LOG_TEMPLATE.md`)
- [ ] Rollback: previous version + feature-flag off path documented
- [ ] CSO + release authority signatures (or ticket links) stored with evidence pack

## What this SOP does **not** cover

- EMIS / SystmOne live write-back (partner-blocked)
- CIS2 authentication (partner-blocked)
- CSO digital signatures productisation (documentary until Gate 2 signed)
- Mirth / HL7 v2 intake (GAP)

## How to verify the recorder boundary

```bash
cd packages/platform-uk
npm run test:clinical-proof   # CP-LEARN-001 — autoRetrainTriggered always false
```

Admin UI `/dashboard/admin/learning` can record/link eventual outcomes; it exposes **no** retrain or version-bump controls.
