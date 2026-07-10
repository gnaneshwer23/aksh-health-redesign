# Data Health And Reset Policy

This platform remains a synthetic-data proof system. JSON files in `data/` are local proof-state files, not production records.

## Current Data Shape

- `data/review-cases.json` is the shared synthetic case store.
- `data/review-cases.<scope>.json` files are scoped demo/session stores.
- `data/feedback-state.json` is the shared feedback store.
- `data/feedback-state.<scope>.json` files are scoped feedback/session stores.
- `data/benchmark-signoffs.json` is the shared benchmark session sign-off store.
- `data/benchmark-signoffs.<scope>.json` files are scoped benchmark sign-off stores.
- `data/readiness-history.json` is the shared evidence-readiness snapshot archive.
- `data/readiness-history.<scope>.json` files are scoped readiness snapshot archives.

## Reset Rules

- Run `npm run data:health` before demos, evidence reviews, or manual cleanup.
- Run `npm run seed:demo-evidence` when the durable `usr_demo_evidence_loop` rehearsal scope needs to be recreated.
- Use `node scripts/data-health.mjs --json` when a machine-readable data health artifact is needed.
- Use the app reset action when a demo cohort needs to return to seeded cases.
- Do not delete scoped JSON files automatically from application code.
- Keep scoped files when they contain useful rehearsal history, benchmark resolutions, feedback follow-up, or meeting outcomes.
- Keep benchmark sign-off files when they contain reviewer acceptance, follow-up ownership, or internal evidence decisions.
- Keep readiness history files when they contain leadership-facing evidence gate snapshots.
- Archive or delete scoped files manually only after confirming they are not needed for evidence review.

## Health Signals

The ops dashboard/report and `npm run data:health` should be treated as the source of truth for whether the current local state is clean or session-modified:

- seed cases present
- extra cases created during intake rehearsal
- open benchmark actions
- stalled remediation actions
- open feedback items
- benchmark sign-off archives
- readiness history snapshots

The data health command is read-only. It classifies each scope as:

- `clean_seed`: seeded review cohort is present and no extra session evidence is attached.
- `session_modified`: extra cases, feedback, sign-off, readiness snapshots, or action-resolution history are present.
- `needs_review`: seeded cases are missing or the review store is incomplete.
- `no_review_store`: scoped feedback/sign-off/readiness state exists without a matching review-case store.

## Integration Boundary

External integrations are off by default:

- `ENABLE_FASTAPI_SYNTHESIS=false`
- `ENABLE_MEDPLUM_SYNC=false`

When either flag is enabled, the run should be considered an integration rehearsal, not a live patient-data workflow.
