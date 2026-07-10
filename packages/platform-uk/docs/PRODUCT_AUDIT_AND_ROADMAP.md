# Aksh Health UK/EU Product Audit And Roadmap

Updated: 2 May 2026

## Executive View

The UK/EU platform has moved beyond scaffold status. It is now a working synthetic-data clinical proof platform for a review-first healthcare workflow.

The product currently proves this loop:

`synthetic consultation input -> generated FHIR-shaped draft -> safety and validation checks -> clinician review -> decision capture -> frozen evidence artifact -> benchmark/readiness/report outputs`

The strongest part of the product is the evidence discipline: accepted cases preserve final draft state, reviewer decision metadata, validation state, safety findings, export payloads, audit history, and registry-ready evidence artifacts. The weakest part is not product breadth anymore; it is production readiness. Storage, auth, integration, observability, and UI test coverage are still proof-stage.

## Current Product Boundary

- The active build target is UK/EU.
- India should stay paused until the UK/EU proof is easier to maintain and validate.
- The app is synthetic-data-first.
- It should not yet be positioned as live NHS integration, production clinical safety infrastructure, or real-patient-data handling. The current direction is own-system-first with synthetic patients and internal evidence controls.
- The Figma 10-layer NHS architecture board is now tracked as the staged build map in `docs/FIGMA_10_LAYER_NHS_ARCHITECTURE_BUILD_MAP.md`.
- Medplum, FastAPI synthesis, and Deepgram are integration rehearsals or optional adapters, not the default operating path.
- The integration adapter registry explicitly keeps Medplum and FastAPI disabled unless flags are enabled, and keeps EHR connectors as planned placeholders.
- Clinical safety/finalization, validation protocol, remediation analytics, benchmark contracts/actions, benchmark coverage, data-collection profiling, export mapping, meeting analytics, intake generation, review helpers, evidence payloads, and evidence registry now have focused modules instead of living in a workflow monolith.
- Red-flag escalation, referral/pathway, and medication/decision confirmation now have an explicit human-gate domain model.
- Simulated patient profiles, governance pack, own-system interface contracts, and database-boundary planning now have explicit modules and UI surfaces.

## What Is Built

### 1. Product Shell And Navigation

Built routes include:

- `/`: entry page.
- `/product`: product landing page.
- `/onboarding`: role-based user onboarding page.
- `/dashboards`: role-based clinical, operations, and evidence dashboards.
- `/demo`: product tour and question-handling guide.
- `/workspace`: working area entry point.
- `/review/command-centre`: product command centre for built state, safe demo surfaces, guardrails, and next build priorities.
- `/review/command-centre/report`: printable product state report.
- `/review/team-mode`: internal team execution path across review, intake, evidence, operations, and M1 actions.
- `/review/demo-mode`: external walkthrough path across product story, presenter guide, pilot package, benchmark report, and roadmap report.
- `/review/demo-readiness`: clean-demo readiness checklist for seed state, evidence sign-off, readiness snapshots, safe routes, and manual rehearsal checks.
- `/review/simulated-patients`: simulated patient cohort for own-system testing without real patient records.
- `/review/governance-pack`: clinical safety governance pack with hazard rehearsal and production-readiness gaps.
- `/intake`: synthetic note/transcript intake and draft generation.
- `/review`: review queue.
- `/cases/[id]`: detailed case review.
- `/cases/[id]/evidence`: case evidence view.
- `/cases/[id]/dossier`: case dossier view.
- `/cases/[id]/report`: printable/shareable case report.
- `/review/summary`: portfolio summary.
- `/review/benchmarks`: benchmark drilldown.
- `/review/benchmarks/report`: printable benchmark report.
- `/review/readiness`: evidence readiness view.
- `/review/roadmap`: 12-month execution roadmap, critical path, budget readiness, and build-gap board.
- `/review/roadmap/actions`: owner-facing M1 action inbox.
- `/review/roadmap/actions/report`: printable M1 owner action report.
- `/review/roadmap/follow-through`: M1 follow-through board for next step, target date, blockers, and evidence links.
- `/review/ops`: internal operations dashboard.
- `/review/ops/report`: printable operations report.
- `/review/feedback`: feedback capture and resolution workflow.
- `/review/meeting-packet`: internal meeting packet.
- `/review/failures`: failure drilldown.
- `/review/dossiers`: dossier batch view.
- `/review/pilot`, `/review/pilot/report`, `/review/presenter`, `/review/rehearsal`: demo, pilot, presenter, and rehearsal surfaces.

The latest verified production build generates 56 routes successfully across the public product shell, workspace, review workflow, evidence/reporting, evidence registry, simulated patients, governance pack, research evaluation export, database adapter contract export, operations, roadmap, command centre, clean-demo readiness, and API surfaces.

### 2. Intake And Draft Generation

The intake layer supports synthetic note/transcript creation and deterministic draft generation.

Current strengths:

- Respiratory, hypertension, eczema, lipid, and general pathways.
- Symptom extraction.
- Medication mention extraction.
- Blood pressure, temperature, and LDL extraction.
- Transcript confidence inference.
- Generation trace tying source snippets to draft fields.
- Synthetic safety context inference for allergies/current medications.

Important module:

- `lib/intake-generation.ts`

Current limitation:

- This is still heuristic generation, not validated clinical NLP.
- FastAPI synthesis is disabled unless `ENABLE_FASTAPI_SYNTHESIS=true`.

### 3. Case Review Workflow

The review workflow supports:

- Review queue.
- Case detail route.
- Editable FHIR-shaped draft fields.
- Reviewer notes.
- Override reasons.
- Checklist confirmations.
- Accept/reject/defer decisions.
- Activity timeline.
- Field-change history.
- API-backed JSON persistence.

Important modules:

- `components/review/case-detail.tsx`
- `lib/use-review-cases.ts`
- `lib/review-case-repository.ts`
- `lib/workflow.ts`
- `lib/workflow/validation.ts`
- `lib/workflow/remediation.ts`

Current limitation:

- `case-detail.tsx` is still large and should be split before adding more review UX.

### 4. Safety And Finalization Logic

The platform derives safety flags and acceptance blockers for:

- Allergy conflict.
- Intolerance overlap.
- Medication review need.
- Low-confidence extraction.
- Low-confidence source input.
- Missing required observations.
- Respiratory escalation concern.
- Conflicting source/draft evidence.
- Medication dosing ambiguity.
- Missing checklist confirmation.

The finalization state is separated into:

- `ready`
- `warn`
- `blocked`

Current limitation:

- The rule set is strong for synthetic proof but not yet a clinically governed rule engine.
- Rules should be organized into a clearer clinical validation module next.

### 5. Evidence And Export Layer

The evidence layer is one of the most mature parts of the product.

Built:

- Case evidence payload.
- Case JSON export endpoint.
- Printable case report.
- Frozen artifact creation for accepted cases.
- FHIR-shaped Bundle export.
- Synthetic-only labels.
- Deterministic synthetic bundle identifiers.
- Canonical resource references between Encounter, Condition, Observation, and MedicationRequest.
- Per-resource validation summaries.
- Export quality issue counts.

Important modules:

- `lib/export-mapping.ts`
- `lib/workflow.ts`
- `app/api/review-cases/[id]/export/route.ts`

Current limitation:

- The export is FHIR-shaped and useful for evidence review, but not yet integration-grade NHS/FHIR interoperability.

### 6. Benchmark And Clinical Coverage

The benchmark layer tests the synthetic case cohort against expected outcomes.

Built:

- Scenario benchmark checks.
- Benchmark evidence JSON payload.
- Benchmark runbook.
- Benchmark action queue.
- Benchmark action resolution/reopen support.
- Clinical rule coverage matrix.
- Benchmark sign-off workflow.
- Printable benchmark report.

Important modules:

- `lib/benchmark-evidence.ts`
- `lib/benchmark-runbook.ts`
- `lib/workflow/benchmarks.ts`
- `lib/benchmark-signoff-repository.ts`
- `components/review/benchmark-drilldown-page.tsx`
- `components/review/benchmark-report.tsx`

Current state:

- The current seeded benchmark suite passes.
- Tests assert 7 benchmarked scenario cases with zero benchmark failures.

### 7. Evidence Readiness And Governance

Built:

- Evidence readiness payload.
- Readiness gate.
- Readiness history snapshots.
- Readiness trend analytics.
- Benchmark sign-off dependency.
- Open/resolved action counts.
- Feedback and follow-up awareness.

Important modules:

- `lib/readiness-evidence.ts`
- `lib/readiness-history-analytics.ts`
- `lib/readiness-history-repository.ts`
- `components/review/evidence-readiness-page.tsx`

Current limitation:

- Readiness history stores are currently absent in the local data health preview, so the feature exists but has not accumulated local snapshot history yet.

### 8. Operations, Feedback, And Meeting Follow-Through

Built:

- Ops dashboard.
- Ops report.
- Feedback capture.
- Feedback archive.
- Feedback resolution workflow.
- Owner and due-date follow-up.
- Overdue feedback highlighting.
- Meeting outcome disposition.
- Meeting follow-through owner.
- Meeting SLA escalation.
- Owner workload summary.
- Remediation routing, handoffs, stalled alerts, churn risk, and owner load.

Important modules:

- `components/review/ops-dashboard.tsx`
- `components/review/ops-dashboard-dossier-sections.tsx`
- `components/review/ops-dashboard-feedback-sections.tsx`
- `components/review/ops-dashboard-meeting-sections.tsx`
- `components/review/ops-dashboard-remediation-sections.tsx`
- `components/review/ops-dashboard-sections.tsx`
- `components/review/ops-dashboard-validation-sections.tsx`
- `components/review/ops-report.tsx`
- `components/review/ops-report-remediation-sections.tsx`
- `components/review/ops-report-validation-sections.tsx`
- `components/review/ops-shared-sections.tsx`
- `lib/feedback-insights.ts`
- `lib/meeting-outcome-analytics.ts`

Current limitation:

- `ops-dashboard.tsx` is now a smaller shell after moving meeting packet, owner workload, dossier, and validation action queue sections into focused dashboard domain files.
- `ops-report.tsx` is now a smaller orchestration component after moving validation, dossier, and remediation report sections into focused report modules.
- The main remaining UI maintainability risk is documentation drift and the remaining feedback report section cluster, not the ops report remediation block.

### 9. Persistence And Data Health

Built:

- JSON-file review case repository.
- JSON-file feedback repository.
- User-scoped data files.
- Read-only data health preview.
- Data reset policy documentation.

Current local data health:

- Review case stores: 7.
- Feedback stores: 8.
- Benchmark sign-off stores: 0.
- Readiness history stores: 0.
- Shared cohort is clean seed.
- Seeded cohorts generally contain 5 cases, 1 frozen artifact, 2 decisions, 3 pending cases, 1 deferred case, and 1 accepted case.

Important files:

- `data/review-cases.json`
- `data/feedback-state.json`
- `scripts/data-health.mjs`
- `docs/DATA_HEALTH_AND_RESET_POLICY.md`

Current limitation:

- JSON persistence is acceptable for proof work, but it is not a production data layer.
- There are multiple user-scoped files that should be archived/reset deliberately before demos.

### 10. Auth And User Scoping

Built:

- NextAuth credentials flow.
- Demo clinical reviewer and operations lead roles.
- JWT session strategy.
- Pseudonymous cookie/user-scope fallback.
- Basic route middleware/auth shape.

Current limitation:

- Demo passwords and in-memory users are proof-only.
- This is not production-grade identity, RBAC, audit security, or clinical data access control.

### 11. Integration Rehearsal

Built:

- Medplum sync guard.
- FastAPI synthesis guard.
- Deepgram transcription route with simulated fallback.
- Environment flags keep external behavior off by default.

Flags:

- `ENABLE_MEDPLUM_SYNC=true`
- `ENABLE_FASTAPI_SYNTHESIS=true`
- `DEEPGRAM_API_KEY`

Current limitation:

- These are adapters/rehearsals. The product should continue to label them as integration preparation, not live integration.

### 12. Roadmap And Programme Gap Tracking

Built:

- 12-month roadmap status board from the execution workbook.
- Month-by-month mapping between planned deliverables and current build reality.
- Editable owner, due-date, status, risk, evidence-link, and notes fields.
- Roadmap change history for status, owner, risk, due-date, evidence-link, and note edits.
- M1 execution checklist for CSO hire, EMIS partner application, regulatory consultant, AWS/EKS decision, synthetic validation scope, Medplum/FHIR plan, hazard log template, and safety committee setup.
- M1 owner follow-up board that groups checklist work by owner, open load, critical load, next due item, and missing evidence links.
- M1 due-date health that flags overdue, due-this-week, waiting-on-evidence, on-track, and done items.
- M1 suggested follow-up actions generated from overdue, due-this-week, missing-evidence, and critical-risk checklist items.
- M1 action acknowledgement tracking for accepted, done, deferred, and not-needed generated actions, with audit history and export/report visibility.
- M1 action inbox that filters generated follow-ups by active, acknowledged, all, and owner.
- M1 action inbox evidence JSON export and printable owner action report.
- M1 follow-through tracking for acknowledged actions, including next step, target date, blocked reason, and evidence link.
- JSON-backed roadmap state persistence through `/api/roadmap`.
- Next 30 Days operating panel and filters for blocked, not started, partial, critical path, and budget risk.
- Roadmap evidence JSON export through `/api/roadmap/evidence`.
- Printable roadmap report through `/review/roadmap/report`.
- M1 evidence pack through `/review/roadmap/m1-pack` and `/api/roadmap/m1-pack`, bundling immediate blockers, checklist status, handoff links, limitations, and recent changes.
- Critical path tracker for CSO, EMIS, DCB0129, AWS, LangGraph, validation, pilots, and safety-case blockers.
- Budget readiness view that flags the workbook mismatch between the header budget and line-item total.
- "Do not claim yet" guardrails for production clinical software, live NHS integration, real patient data, DCB0129, DTAC, EMIS/SystmOne, GP/ICS pilots, and clinical validation claims.

Important modules:

- `lib/roadmap.ts`
- `lib/roadmap-evidence.ts`
- `lib/roadmap-repository.ts`
- `lib/use-roadmap-state.ts`
- `components/review/roadmap-page.tsx`
- `components/review/m1-action-inbox.tsx`
- `components/review/m1-action-report.tsx`
- `components/review/m1-follow-through-board.tsx`
- `components/review/roadmap-report.tsx`
- `components/review/m1-evidence-pack.tsx`
- `app/api/roadmap/route.ts`
- `app/api/roadmap/actions/route.ts`
- `app/api/roadmap/evidence/route.ts`
- `app/api/roadmap/m1-pack/route.ts`
- `app/review/roadmap/page.tsx`
- `app/review/roadmap/actions/page.tsx`
- `app/review/roadmap/actions/report/page.tsx`
- `app/review/roadmap/follow-through/page.tsx`
- `app/review/roadmap/report/page.tsx`
- `app/review/roadmap/m1-pack/page.tsx`

Current limitation:

- The roadmap board is now an editable local tracker with audit history, but it is still proof-grade. It does not replace a production project-management system, board approval workflow, financial model, or formal regulatory tracker.

### 13. Product Command Centre

Built:

- `/review/command-centre` as the start-here page for product clarity.
- `/review/team-mode` and `/review/demo-mode` as explicit internal execution and external storytelling paths.
- `/review/command-centre/report` and `/api/command-centre/state` as product-state evidence artifacts.
- Built-state summary across clinical review, evidence readiness, roadmap status, and M1 action status.
- Safe-to-show route list for demos and advisor conversations.
- Do-not-claim guardrails surfaced from roadmap evidence.
- Recommended next-build priorities that keep the product focused before adding more surface area.

Important modules:

- `components/review/command-centre.tsx`
- `components/review/command-centre-report.tsx`
- `components/review/product-mode-pages.tsx`
- `lib/command-centre-evidence.ts`
- `app/api/command-centre/state/route.ts`
- `app/review/command-centre/page.tsx`
- `app/review/command-centre/report/page.tsx`
- `app/review/team-mode/page.tsx`
- `app/review/demo-mode/page.tsx`

Current limitation:

- The command centre is a composed summary view. It does not yet persist a formal product status sign-off or release note history.

## Verification Snapshot

Commands run successfully in the latest verified cycle:

- `npm run verify`
- `npm run data:health`
- `npm run build`

Verification coverage includes:

- Workflow scenario checks.
- API contract checks.
- Export mapping checks.
- Route and UI smoke checks, including critical report routes.
- Live authenticated walkthrough smoke checks through `npm run smoke:walkthrough`.
- TypeScript verification.
- Production Next.js build.
- Read-only data health preview.

## Quality Assessment

### Strong

- The core clinical proof loop is coherent end-to-end.
- Evidence artifacts are more mature than typical early prototypes.
- Synthetic-only boundaries are explicit in exports and integration guards.
- Benchmark and readiness layers make the product inspectable for internal governance.
- The current quality gates are reliable and non-interactive.
- The product has enough demo/reporting surface for internal leadership, advisors, and early stakeholder walkthroughs.

### Medium Risk

- `components/review/ops-dashboard.tsx` is down to roughly 927 lines after the latest section extraction.
- `components/review/ops-dashboard-sections.tsx` is now a 5-line compatibility re-export backed by focused meeting, validation, remediation, feedback, and dossier section files.
- `components/review/ops-dashboard-validation-sections.tsx` is still sizeable at roughly 450 lines because the validation dashboard surface is broad.
- `components/review/ops-report.tsx` is down to roughly 408 lines after extracting validation, dossier, and remediation report sections.
- `components/review/ops-report-validation-sections.tsx` is roughly 418 lines and should stay focused on validation/dossier reporting only.
- `components/review/ops-report-remediation-sections.tsx` is roughly 346 lines and should stay focused on remediation, stalled-alert, owner-load, handoff-churn, and coordination-risk reporting only.
- `components/review/case-detail.tsx` is now a smaller shell, but its supporting case-detail subcomponents/hooks should still be watched as the review UX grows.
- `lib/workflow.ts` is now a stable 13-line compatibility barrel rather than a domain monolith.
- Most tests are domain/API-level, not UI-level.
- README and architecture docs now reflect the current 56-route synthetic proof product; keep them updated after future major build slices.

### High Risk If Mispositioned

- The product is not production clinical software yet.
- The product is not real patient-data ready.
- The product is not NHS/EHR integrated and does not depend on live external integrations for the current own-system proof.
- Auth is demo-grade.
- JSON persistence is demo/proof-grade.
- Clinical rules are synthetic proof rules, not a signed-off clinical safety case.

## Product Maturity Rating

### Current Stage

`Internal synthetic clinical proof system`

### Not Yet

- Production pilot platform.
- Real patient data platform.
- NHS-integrated platform.
- Regulated clinical decision support product.
- Multi-tenant SaaS product.

### Best Current Use

- Internal team alignment.
- Advisor walkthroughs.
- Clinical workflow critique.
- Evidence-quality demonstration.
- Synthetic validation scenario rehearsal.
- Preparing the shape of future integration and governance work.

## Recommended Next Product Strategy

The next phase should not add lots of new screens. It should make the existing proof more trustworthy, easier to maintain, and easier to explain.

### Phase 1: Maintainability And Trust

Goal: make the product easier to safely change.

Build next:

- Keep the clean-demo readiness checklist aligned with demo-mode, command-centre routes, and current evidence gates.
- Consider extracting the remaining feedback report sections only if the report grows again; the urgent validation, dossier, and remediation report splits are complete.
- Keep the newly split dashboard domain files focused; avoid adding unrelated dashboard sections back into the compatibility re-export file.
- Keep `lib/workflow.ts` as the public compatibility barrel while focused workflow modules evolve behind it.
- Continue refining product-mode and case-state labels. The app shell now distinguishes synthetic validation, demo walkthrough, and recording walkthrough modes, and queue/case views share reusable state chips/ribbons.
- Keep README and architecture docs current after each major build slice.

Acceptance:

- `npm run verify` passes after each extraction.
- `npm run build` passes after each extraction.
- Public imports stay stable until the refactor is complete.

### Phase 2: Product Clarity

Goal: make every user understand where they are in the workflow.

Build next:

- Add a “Product Mode” banner: Synthetic Proof, Integration Rehearsal, or External Integration Enabled.
- Add a “Case State” ribbon on case detail: Draft, Warning, Blocked, Accepted/Frozen, Deferred, Rejected.
- Add clearer empty states for no readiness history, no sign-off, and no feedback.
- Keep the demo reset/readiness checklist current before stakeholder walkthroughs.

Acceptance:

- A reviewer can explain a case state in 30 seconds.
- A presenter can prove synthetic-only boundaries without opening code.

### Phase 3: Evidence Dossier Hardening

Goal: make the proof package external-review friendly without claiming production readiness.

Build next:

- One consolidated case dossier export that includes case evidence, source trace, validation protocol, benchmark status, and reviewer decision.
- One benchmark/readiness combined board-pack export.
- A “known limitations” section in every printable report.
- Versioned evidence artifact metadata.

Acceptance:

- The team can hand one synthetic artifact pack to an advisor and clearly show what is proven and what is not.

### Phase 4: Data And Governance Upgrade

Goal: prepare for controlled pilot architecture without touching real patient data yet.

Build next:

- Introduce a database abstraction while keeping JSON as the default adapter.
- Add deterministic seed/reset commands.
- Add audit log integrity checks.
- Add role/action permission matrix documentation.
- Add clinical safety file links/placeholders for DCB0129-style hazard work.

Acceptance:

- The team can switch from file persistence to a database without rewriting the product workflow.

### Phase 5: Integration Preparation

Goal: prepare interfaces before live integration.

Build next:

- Formalize own-system interface contracts and keep external adapter contracts disabled-by-default.
- Add contract tests with mocked external systems only where they protect boundaries.
- Add FastAPI synthesis response validation.
- Add transcription route dependency handling and package alignment.
- Document required environment variables and failure modes.

Acceptance:

- External services can be enabled in a controlled rehearsal environment without silently changing synthetic proof behavior.

## Recommended Immediate Build Order

1. Use the own-system and database adapter contracts as the single guardrails for claims: synthetic-only, JSON proof storage, no live NHS/EHR integration, no real patient data, no production clinical AI, no production database, and no autonomous clinical decisioning.
2. Use the repository parity suite as the storage migration gate: any future database-backed adapter must match JSON behavior for scoped reads/writes, seed rehydration, ownership checks, create/update/reset, and frozen artifact persistence.
3. Surface human-gate status in case review, case evidence, and printable case reports.
4. Keep the clean-demo readiness checklist aligned with demo-mode and command-centre routes.
5. Keep route smoke, walkthrough smoke, evidence/export/API contract, verify, and build gates green after every change.

## Simple Product Explanation

Aksh Health UK/EU is currently a synthetic clinical review proof system. It shows how a consultation note can become a structured draft, how safety and completeness checks can block or warn reviewers, how a clinician can make a final decision, and how the system can produce inspectable evidence artifacts for internal governance.

The next work is not to make it broader. The next work is to make it clearer, safer to change, and more credible as a product narrative.
