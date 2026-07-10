# UK/EU Platform Architecture

Updated: 2 May 2026

## Product Goal

Aksh Health UK/EU is a synthetic-data, review-first clinical proof platform.

It proves this workflow:

`synthetic consultation input -> generated FHIR-shaped draft -> safety and validation checks -> clinician review -> decision capture -> frozen evidence artifact -> benchmark/readiness/report outputs`

The platform boundary is explicit: it is not production clinical software, not live NHS integration, and not a real-patient-data system. The current architecture optimizes for Aksh Health's own-system synthetic workflow, reviewability, evidence quality, and internal clinical/governance credibility.

The Figma 10-layer NHS architecture board is tracked in `docs/FIGMA_10_LAYER_NHS_ARCHITECTURE_BUILD_MAP.md`. The implementation follows that board as a staged build map while keeping live NHS/EHR integration, production clinical AI, production database, and real patient data out of scope for the current proof.

## Current Route Surface

The latest verified production build generates 56 routes. Source route files currently include 41 pages and 19 API routes.

Public and workspace routes:

- `/`
- `/product`
- `/onboarding`
- `/dashboards`
- `/demo`
- `/workspace`
- `/auth/signin`
- `/auth/error`

Clinical workflow routes:

- `/intake`
- `/review`
- `/cases/[id]`
- `/cases/[id]/evidence`
- `/cases/[id]/dossier`
- `/cases/[id]/report`
- `/review/summary`

Evidence and governance routes:

- `/review/command-centre`
- `/review/command-centre/report`
- `/review/benchmarks`
- `/review/benchmarks/report`
- `/review/readiness`
- `/review/simulated-patients`
- `/review/governance-pack`
- `/review/dossiers`
- `/review/failures`

Operations and demo routes:

- `/review/ops`
- `/review/ops/report`
- `/review/feedback`
- `/review/meeting-packet`
- `/review/demo-readiness`
- `/review/pilot`
- `/review/pilot/report`
- `/review/presenter`
- `/review/rehearsal`
- `/review/team-mode`
- `/review/demo-mode`

Roadmap execution routes:

- `/review/roadmap`
- `/review/roadmap/report`
- `/review/roadmap/actions`
- `/review/roadmap/actions/report`
- `/review/roadmap/follow-through`
- `/review/roadmap/m1-pack`

API routes:

- `/api/auth/[...nextauth]`
- `/api/dashboard`
- `/api/review-cases`
- `/api/review-cases/[id]`
- `/api/review-cases/[id]/export`
- `/api/benchmarks/evidence`
- `/api/benchmarks/signoff`
- `/api/readiness/evidence`
- `/api/readiness/history`
- `/api/evidence/registry`
- `/api/command-centre/state`
- `/api/feedback`
- `/api/roadmap`
- `/api/roadmap/actions`
- `/api/roadmap/evidence`
- `/api/roadmap/m1-pack`
- `/api/research/evaluation`
- `/api/system/database-contract`
- `/api/transcribe`

## Operating Modes

The default mode is `synthetic validation`.

- Synthetic data only by default.
- External integration is rehearsal-only unless explicitly enabled.
- `ENABLE_MEDPLUM_SYNC` defaults off.
- `ENABLE_FASTAPI_SYNTHESIS` defaults off.
- Live NHS/EHR integration is out of scope.
- Real patient data handling is out of scope.
- Live model deployment and production clinical AI claims are out of scope.

The authenticated workspace surfaces this with a product-mode banner. Queue and case review surfaces use case-state chips/ribbons so users can distinguish draft, warning, blocked, accepted/frozen, deferred, and rejected states.

## Research Evaluation Boundary

The product can later support PyHealth-style research discipline through explicit dataset, task, model, metric, interpretation, and calibration separation. That boundary is currently offline and synthetic-only.

Current allowed research sources are synthetic review cases, simulated patient profiles, benchmark expected outcomes, frozen evidence artifacts, and reviewer edit history. Model training on real patient data, live model deployment into clinician workflow, autonomous clinical decisioning, and production clinical AI claims are not allowed in this proof phase.

The typed source of truth is `lib/research-evaluation-plan.ts`; the policy doc is `docs/RESEARCH_EVALUATION_BOUNDARY.md`.

## Core Domain Model

Primary contracts live in `lib/types.ts`.

Important types:

- `ReviewCase`
- `ConsultationInput`
- `FhirBundleDraft`
- `SafetyFlag`
- `HumanGateDecision`
- `ReviewSummary`
- `ValidationIssue`
- `ValidationHistoryEntry`
- `FhirExportBundle`
- `FieldChange`
- `MeetingOutcome`
- `BenchmarkActionResolution`
- `RemediationActionResolution`

## Technical Layers

- `app/`: Next.js App Router pages and API route handlers.
- `components/product/`: public landing, onboarding, dashboard, and tour surfaces.
- `components/review/`: authenticated review, evidence, benchmark, dossier, roadmap, ops, and report UI.
- `lib/types.ts`: shared product/domain contracts.
- `lib/workflow.ts`: stable 13-line compatibility barrel for `@/lib/workflow` imports.
- `lib/workflow/finalization.ts`: finalization and decision label helpers.
- `lib/workflow/safety.ts`: safety flags, clinical rule results, blockers, and finalization rule engine.
- `lib/workflow/validation.ts`: validation readiness, protocol analytics, trends, dossier analytics, meeting packets, and failure drilldown.
- `lib/workflow/remediation.ts`: remediation queues, stalled alerts, owner load, handoff churn, and coordination-risk analytics.
- `lib/workflow/benchmarks.ts`: scenario benchmark checks, action queues, coverage, and benchmark action resolution.
- `lib/workflow/evidence.ts`: evidence payload composition, frozen artifacts, source trace, and persistence normalization.
- `lib/workflow/review.ts`: review analytics, intake-to-case creation, audit helpers, draft sections, checklist blockers, and activity labels.
- `lib/workflow/data-collection.ts`: data collection profile and analytics.
- `lib/intake-generation.ts`: synthetic intake parsing, confidence inference, generation trace, and draft generation.
- `lib/export-mapping.ts`: FHIR-shaped bundle mapping, deterministic synthetic bundle IDs, resource references, and validation summaries.
- `lib/ops-analytics.ts`: shared ops analytics derivation used by dashboard and report surfaces.
- `lib/meeting-outcome-analytics.ts`: meeting outcome priority, SLA escalation, and owner workload logic.
- `lib/benchmark-evidence.ts`: benchmark evidence artifact composition.
- `lib/readiness-evidence.ts`: evidence readiness artifact composition.
- `lib/evidence-artifact-registry.ts`: registry of case evidence artifacts and frozen/live state.
- `lib/simulated-patients.ts`: curated fake longitudinal patient profiles for own-system testing.
- `lib/governance-pack.ts`: clinical safety governance rehearsal, hazards, controls, and production-readiness gaps.
- `lib/system-contracts.ts`: own-system interface contracts, database adapter contract, and planned database boundary.
- `lib/human-gates.ts`: explicit human gates for red-flag escalation, referral/pathway, and medication/decision confirmation.
- `lib/reviewer-confirmed-actions.ts`: L9 reviewer-confirmed action drafts for safety-netting, referral/pathway, and medication decisions.
- `lib/outcome-capture.ts`: L10 synthetic outcome-capture schema for offline benchmark/evaluation learning only.
- `lib/synthetic-source-profiles.ts`: L1 six-category synthetic source fixture catalog with no live ingestion.
- `lib/research-evaluation-plan.ts`: offline synthetic ML/research evaluation boundary.
- `lib/integration-config.ts`: explicit adapter registry and integration enablement boundaries.
- `lib/roadmap*.ts`: 12-month roadmap evidence, state, repository, and action tracking.
- `lib/*repository.ts`: JSON-backed persistence adapters.
- `scripts/`: diagnostics, data health, and smoke checks.
- `tests/`: workflow, API contract, read-only route contract, repository parity, export mapping, and route/UI smoke checks.

## UI Composition

The largest UI surfaces have been split into domain sections.

- `components/review/ops-dashboard.tsx` is the interactive ops dashboard shell.
- `components/review/ops-dashboard-*-sections.tsx` holds focused dashboard cards for feedback, validation, remediation, meeting/owner workload, and dossier views.
- `components/review/ops-report.tsx` is the ops report shell.
- `components/review/ops-report-validation-sections.tsx` holds validation and dossier report sections.
- `components/review/ops-report-remediation-sections.tsx` holds remediation, stalled alert, handoff churn, owner load, and coordination risk report sections.
- `components/review/ops-shared-sections.tsx` holds shared read-only sections used by dashboard/report surfaces.
- `components/review/case-detail.tsx` is now a smaller review shell backed by focused case-detail hooks and panels.
- `components/review/case-human-review-panels.tsx` keeps human-gate and reviewer-action evidence consistent across case review, evidence, and report pages.
- `components/review/synthetic-outcome-capture-panel.tsx` surfaces the L10 synthetic outcome schema without implying live learning.

## Persistence

Current persistence is JSON-file backed.

- Review cases: `data/review-cases*.json`
- Feedback: `data/feedback-state*.json`
- Roadmap tracker and change history: `data/roadmap-state*.json`
- Benchmark sign-off and readiness history use repository helpers when present.

This is acceptable for synthetic proof work, but it is not a production data layer. Use `npm run data:health` before demos to see whether the shared seed is clean and whether scoped user stores carry prior session state.

## Safety And Review Logic

The product derives:

- Safety flags.
- Clinical rule results.
- Acceptance blockers.
- Finalization state: `ready`, `warn`, or `blocked`.
- Reviewer checklist guidance.
- Persisted human-gate decision state for red-flag escalation, referral/pathway, and medication/decision gates.
- L9 reviewer-confirmed action drafts for safety-netting, referral/pathway, and medication decisions.
- Validation readiness.
- Validation protocol analytics.
- Scenario benchmark status.
- Evidence readiness state.
- Remediation, handoff, and coordination-risk analytics.

The reviewer workflow supports editable FHIR-shaped draft fields, reviewer notes, override reasons, field-change history, checklist confirmations, decisions, and activity timeline persistence.
Human-gate decisions are now explicit persisted case records. Required gates block acceptance until a reviewer confirms or marks them not applicable, and accepted frozen artifacts preserve the final gate decision snapshot.

## Evidence And Exports

Accepted cases can preserve a frozen artifact containing:

- Final draft.
- Final review summary.
- Finalization state.
- Safety flags and clinical rule results.
- Acceptance blockers.
- Field changes.
- Human-gate decisions.
- Generation trace.
- Activity timeline.
- Source trace.
- FHIR-shaped export bundle.
- Validation issues.
- Validation history.
- L10 synthetic outcome-capture labels for offline benchmark/evaluation learning.

Exports are evidence-shaped and FHIR-oriented, not integration-grade NHS writeback. Export metadata marks the artifact as synthetic-only and includes validation/resource summaries for inspectability.

## Quality Gates

Use:

```bash
npm run verify
npm run build
npm run data:health
```

`npm run verify` runs:

- Workflow scenario checks.
- API contract checks.
- Export mapping checks.
- Route/UI smoke checks.
- TypeScript verification.

With the dev server running, public surface smoke checks are available:

```bash
npm run smoke:public
```

Current build uses separate Next outputs:

- `.next-dev-active` for `npm run dev`
- `.next-build-active` for `npm run build`

This prevents production builds from breaking live dev-server CSS/JS assets.

## Current Architecture Risks

- JSON persistence is proof-grade, not production-grade.
- Auth and user scoping are proof-grade, not production-grade identity, RBAC, or clinical access control.
- UI smoke coverage now includes route-file checks and an authenticated live walkthrough path, but not full click-by-click browser automation.
- Route contract coverage now exercises the real read-only API route handlers with guarded test-only authenticated headers, but live browser coverage for those export routes is still lighter than end-to-end UI automation.
- FHIR output is evidence-shaped and canonical enough for internal own-system/export rehearsal, but not integration-grade interoperability.
- Clinical rules are strong synthetic proof rules, not a signed-off clinical safety case.
- Readiness and sign-off history features exist but local stores may be empty unless the team actively captures snapshots/sign-offs.

## Near-Term Architecture Priorities

1. Keep README, architecture, and audit docs aligned with the real product after each major build slice.
2. Add live browser smoke assertions for human-gate persistence and L10 outcome panels.
3. Prepare a database boundary while keeping JSON persistence as the default proof adapter.
4. Add route/export surfacing for the L1 fixture catalog only if it improves internal architecture walkthroughs.
5. Maintain strict synthetic/proof positioning until governance, safety, identity, observability, and integration readiness mature.
