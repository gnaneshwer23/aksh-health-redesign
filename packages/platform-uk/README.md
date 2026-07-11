# Aksh Health UK/EU Platform

Aksh Health UK/EU is a synthetic-data, review-first clinical proof platform.

It proves this loop:

`synthetic consultation input -> generated structured draft -> safety and validation checks -> clinician review -> decision capture -> frozen evidence artifact -> benchmark/readiness/report outputs`

This is not production clinical software, not live NHS integration, and not a real-patient-data platform. The current milestone is credible, inspectable synthetic proof quality for Aksh Health's own-system workflow.

## Current Product State

The latest verified production build generates 56 Next.js routes across:

- Public product surfaces: landing, product page, onboarding, dashboards, demo, workspace.
- Clinical workflow: intake, review queue, case review, case evidence, case dossier, case report.
- Evidence and governance: benchmark drilldown/report, readiness, evidence registry API, command centre, command centre report.
- Simulated system proof: fake longitudinal patient profiles and a clinical safety governance rehearsal pack.
- Operations: ops dashboard/report, feedback, meeting packet, failures, dossiers, summary.
- Roadmap execution: 12-month roadmap, M1 actions, follow-through, owner report, M1 evidence pack, roadmap report.
- Integration rehearsal APIs: review cases, exports, readiness, benchmarks, command centre, roadmap, research evaluation, database adapter contract, transcription, feedback.

The product has moved beyond a scaffold. It is now a working internal proof system for clinical workflow critique, evidence-quality demonstration, advisor walkthroughs, and synthetic validation rehearsal.

## What Is Built

- Synthetic intake generation with deterministic draft creation and generation trace.
- Six-category L1 synthetic source fixture catalog for voice/notes, public health/SDOH, wearables, imaging/labs, genomics/family history, and EHR handoff placeholders.
- FHIR-shaped draft editing and clinician review decisions: accept, reject, defer.
- Safety and finalization rules for blocker, warning, and ready states.
- Explicit persisted human-gate decisions for red-flag escalation, referral/pathway, and medication/decision confirmation.
- L9 reviewer-confirmed action drafts for safety-netting, referral/pathway, and medication decisions.
- L10 synthetic outcome-capture labels for offline benchmark/evaluation learning without live learning claims.
- Field-change history, reviewer notes, override reasons, checklist blockers, and activity timelines.
- Frozen accepted artifacts preserving final draft, review summary, safety state, validation state, export bundle, and evidence payloads.
- Benchmark evidence, scenario coverage, benchmark action queues, sign-off readiness, and printable benchmark reports.
- Evidence readiness gate, readiness history support, readiness trend analytics, and command-centre product state artifacts.
- Simulated patient profiles for realistic own-system testing without real patient records.
- Clinical safety governance pack with safety-case sections, hazard log rehearsal, required controls, and production-readiness gaps.
- ML/research evaluation boundary for future offline synthetic evaluation without live model deployment or production clinical AI claims.
- Operations dashboards and reports covering feedback, validation, remediation, meeting follow-through, owner workload, handoff churn, and coordination risk.
- 12-month roadmap tracking with critical path, budget readiness, M1 action inbox, follow-through, evidence pack, and guardrails.
- Synthetic-only integration boundaries for Medplum and FastAPI synthesis, disabled by default.

## Important Routes

- `/`: public landing page.
- `/onboarding`: role-based onboarding.
- `/dashboards`: role-based dashboards.
- `/workspace`: authenticated workspace entry.
- `/intake`: synthetic consultation intake.
- `/review`: review queue.
- `/cases/[id]`: case review.
- `/cases/[id]/evidence`: case evidence.
- `/cases/[id]/dossier`: validation dossier.
- `/cases/[id]/report`: printable case report.
- `/review/command-centre`: product state command centre.
- `/review/command-centre/report`: printable product state report.
- `/review/demo-readiness`: clean-demo readiness checklist.
- `/review/simulated-patients`: simulated patient cohort.
- `/review/governance-pack`: clinical safety governance pack.
- `/review/benchmarks`: benchmark drilldown.
- `/review/benchmarks/report`: benchmark report.
- `/review/readiness`: evidence readiness.
- `/review/ops`: operations dashboard.
- `/review/ops/report`: operations report.
- `/review/roadmap`: 12-month roadmap.
- `/review/roadmap/actions`: M1 action inbox.
- `/review/roadmap/m1-pack`: M1 evidence pack.
- `/api/research/evaluation`: research evaluation boundary JSON export.
- `/api/system/database-contract`: database adapter boundary JSON export.

## Technical Map

- `app/`: Next.js App Router pages and API routes.
- `components/product/`: public landing, onboarding, dashboard, and tour surfaces.
- `components/review/`: review, evidence, benchmark, ops, roadmap, and report UI.
- `lib/workflow.ts`: stable compatibility barrel for workflow imports.
- `lib/workflow/*`: focused workflow domains for safety, validation, remediation, benchmarks, evidence, review, finalization, and data collection.
- `lib/ops-analytics.ts`: shared ops analytics derivation for dashboard/report consistency.
- `lib/export-mapping.ts`: FHIR-shaped export mapping and validation summaries.
- `lib/intake-generation.ts`: synthetic intake parsing and draft generation.
- `lib/synthetic-source-profiles.ts`: L1 six-category synthetic source fixture catalog with no live ingestion.
- `lib/simulated-patients.ts`: fake longitudinal patient profiles for own-system testing.
- `lib/governance-pack.ts`: safety-case rehearsal, hazards, controls, and production-readiness gaps.
- `lib/system-contracts.ts`: own-system interface contracts, database adapter contract, and future database boundary plan.
- `lib/human-gates.ts`: explicit persisted human review gates for escalation, referral/pathway, and medication decisions.
- `lib/reviewer-confirmed-actions.ts`: L9 reviewer-confirmed action drafts.
- `lib/outcome-capture.ts`: L10 synthetic outcome-capture schema for offline evaluation.
- `lib/research-evaluation-plan.ts`: offline synthetic ML/research evaluation boundary inspired by dataset/task/metric separation.
- `lib/*repository.ts`: JSON-backed proof-stage persistence adapters.
- `data/`: shared seed and user-scoped JSON stores.
- `tests/`: workflow, API contract, read-only route contract, repository parity, export mapping, and route/UI smoke checks.
- `scripts/`: build diagnostics, data health preview, public smoke checks, and authenticated walkthrough smoke checks.

## Architecture Sequence

- `docs/FIGMA_10_LAYER_NHS_ARCHITECTURE_BUILD_MAP.md`: maps the Figma 10-layer NHS architecture board to the current build state, explicit proof boundaries, and next sequence.

## Quality Gates

Use the non-interactive local verification gate:

```bash
npm run verify
```

This runs workflow scenario checks, API contract checks, export mapping checks, route/UI smoke checks, and TypeScript verification.
Read-only route contracts exercise the actual App Router route handlers through a guarded test-only authenticated header path; they do not just call artifact builders directly.

Use the production build gate:

```bash
npm run build
```

Use the read-only data health preview:

```bash
npm run data:health
```

Use the live walkthrough smoke gate against a running app:

```bash
npm run dev
npm run smoke:walkthrough
```

This signs in with configured smoke credentials (`SMOKE_EMAIL` / `SMOKE_PASSWORD`) and checks the main public-to-workspace walkthrough path.

Use the browser-driven loop smoke gate against a running app:

```bash
npm run dev
npm run smoke:browser
```

This signs in through the UI, creates a synthetic intake case, accepts it through the reviewer decision panel, saves benchmark sign-off, and verifies the readiness page updates.

### Playwright E2E (Phase E)

Browser end-to-end tests cover marketing, auth, onboarding redirect, GP/patient dashboards, API health, and route protection.

```bash
npm run dev          # terminal 1 (optional — Playwright can start dev automatically)
npm run test:e2e     # terminal 2
npm run test:e2e:ui  # interactive UI mode
```

See `docs/QA_CHECKLIST_ALIGNMENT.md` for mapping to the deployment QA checklist.

E2E and authenticated smoke tests require `DATABASE_URL`. Playwright creates fresh users via `/api/auth/signup` each run (`e2e/helpers/auth.ts`). Smoke scripts require real credentials via env vars (see `.env.example`).

**CI:** GitHub Actions requires the `E2E_DATABASE_URL` secret (Neon pooled connection string). Optional: `E2E_TEST_PASSWORD`. See `docs/DEPLOYMENT_CONSOLIDATION.md`.

The current build uses separate Next outputs:

- `.next-dev-active` for `npm run dev`
- `.next-build-active` for `npm run build`

## Data And Safety Boundary

The app is synthetic-data-first. JSON-file persistence is acceptable for this proof phase, but it is not a production data layer. Auth and user scoping are proof-grade. Current product strategy is own-system-first: no live NHS/EHR integration is enabled or required for this proof. Any adapter-style code is a boundary/interface rehearsal, not a live integration path.

### Neon Postgres (connected July 2026)

- **Project:** `Aksh Health` · **Region:** `aws-eu-west-2`
- Set `USE_POSTGRES=true` and pooled `DATABASE_URL` in `.env.local` (see `.env.local.example`)
- Migration: `psql "$DATABASE_URL" -f db/migrations/001_review_cases.sql`
- Details: `docs/PHASE_B_COMPLETE.md`

Do not position this as production clinical software, live NHS/EHR integration, real patient data handling, DCB0129 completion, DTAC completion, or a signed-off clinical safety case.

## Key Docs

- Product audit and roadmap: `docs/PRODUCT_AUDIT_AND_ROADMAP.md`
- Architecture: `docs/ARCHITECTURE.md`
- Data health and reset policy: `docs/DATA_HEALTH_AND_RESET_POLICY.md`
- Build quality notes: `docs/BUILD_QUALITY_NOTES.md`
- Demo package: `docs/PILOT_PACKAGE.md` (internal rehearsal guide)
