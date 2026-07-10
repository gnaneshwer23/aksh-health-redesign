# UK/EU Platform Quality Audit And Next Build Plan

Updated: 2 May 2026

## Audit Summary

The UK/EU platform is now a credible synthetic-data clinical proof system rather than a scaffold. It covers the full review-first loop: intake, generated FHIR-shaped draft, safety and validation logic, clinician review, accept/reject/defer decisions, frozen accepted artifacts, evidence exports, benchmark evidence, readiness gates, sign-off history, readiness trends, feedback capture, and ops reporting.

The quality profile has been restored after a broken partial workflow refactor. `npm run verify` and `npm run build` now both complete successfully again. The current risk is no longer basic build confidence; it is keeping future refactors small enough that verification stays green after each move.

## Verification Result

Current reliable gates:

- `npm run verify`: passes workflow scenario checks, API contract checks, export mapping checks, and TypeScript verification.
- `npm run build`: passes production Next.js build and generated 56 routes in the latest verified run.

The app currently builds the full product surface: public product pages, onboarding, dashboards, workspace, intake, review queue, case evidence/dossier/report pages, benchmark evidence/report surfaces, readiness, ops, command centre, roadmap, pilot/demo, and API routes.

## What Is Strong

- Shared workflow logic drives acceptance blockers, safety flags, finalization state, FHIR-shaped evidence payloads, frozen artifacts, benchmark checks, validation streams, and ops metrics.
- Synthetic scenario coverage now includes clean review, missing vitals, medication allergy/intolerance risk, respiratory escalation, conflicting evidence, medication dosing ambiguity, low-confidence intake, reviewer checklist controls, and editable intake extraction controls.
- Evidence governance is strong for an internal proof: accepted cases preserve frozen artifacts, reviewer attribution, validation history, export resources, and benchmark/readiness evidence.
- Synthetic-only boundaries are explicit. Medplum sync and FastAPI synthesis are disabled unless environment flags are set.
- Ops surfaces are unusually mature for this stage: benchmark action queue, sign-off, readiness gate, readiness history, readiness trend, data health, feedback follow-up, remediation routing, handoffs, meeting follow-through, and owner workload signals are visible.

## Quality Risks

- `lib/workflow.ts` is now a true compatibility barrel. The major workflow domains have focused modules, so the current maintainability risk has shifted from domain sprawl to keeping UI section modules focused and documentation current.
- Several UI components are still sizeable, especially the validation-heavy ops section files and report section modules. They are functional and now domain-split, but future changes should keep report-specific sections in focused modules rather than expanding shell components again.
- Data persistence is still JSON-file based with multiple user-scoped files in `data/`. That is acceptable for this phase, but reset/export discipline must stay explicit so demo state is not mistaken for a clean cohort.
- Test coverage is strong at the domain workflow level but still concentrated in one large scenario test file. UI behavior and API route behavior have less direct coverage.
- FHIR output is useful for proof and evidence review, but it remains export-shaped rather than integration-grade. It should not yet be described as NHS-ready or production integration-ready.
- Authentication and user scoping exist as lightweight proof controls, not production-grade security governance.

## Next Build Plan

1. Finish UI risk reduction safely.

- Split repeated ops dashboard/report rendering sections into focused components.
- Keep `lib/ops-analytics.ts` as the shared calculation layer so dashboard/report counts stay aligned.
- Keep public function contracts stable so existing routes and tests continue to pass.
- Acceptance: `npm run verify` and `npm run build` pass after each extraction.

2. Add API contract tests for evidence-critical routes.

- Cover `/api/benchmarks/evidence`.
- Cover `/api/readiness/evidence`.
- Cover `/api/readiness/history`.
- Cover `/api/review-cases/[id]` accept behavior with Medplum disabled.
- Acceptance: contract tests prove exported payloads use current persisted state and external sync stays off by default.

3. Strengthen data hygiene tooling.

- Add a safe data health or reset preview script that reports scoped files, seed cases, extra user cases, open feedback, open benchmark actions, and saved readiness snapshots.
- Do not delete scoped files automatically.
- Add a documented clean-demo reset path.
- Acceptance: the team can tell whether the demo is clean, modified, or carrying session history before a stakeholder walkthrough.

4. Consolidate ops/report UI sections.

- Extract reusable sections for readiness gate, readiness trend, benchmark sign-off, data health, action queue, and owner workload.
- Preserve current behavior and visual hierarchy.
- Acceptance: dashboard and report show the same counts and labels without duplicating calculation/rendering logic.

5. Improve export fidelity without pretending to be integrated.

- Add stricter internal validation messages for FHIR-shaped bundles.
- Make resource references and bundle IDs more deterministic.
- Label exports consistently as synthetic evidence artifacts and integration rehearsal outputs.
- Acceptance: evidence pages and JSON exports clearly show what is complete, what is synthetic, and what would need integration hardening.

## Recommended Immediate Step

Build `Step 1: ops UI split` next. Validation, remediation, benchmark, safety, data collection, export mapping, intake generation, meeting analytics, evidence registry, evidence payload composition, and integration adapter logic now have focused homes. The remaining high-value maintainability target is splitting the largest ops UI sections while preserving the shared analytics contract.

After that, add more API contract tests before adding product surface area.

## Build Progress

- Started workflow module split by moving benchmark evidence artifact composition into `lib/benchmark-evidence.ts`.
- Updated benchmark evidence API, benchmark sign-off API, benchmark report UI, sign-off repository types, and workflow tests to consume the new module directly.
- Moved readiness evidence artifact composition into `lib/readiness-evidence.ts`, leaving `lib/data-health.ts` focused on data health summaries and readiness gate logic.
- Updated readiness evidence API, readiness history API, readiness history types/repository, and workflow tests to consume the new readiness evidence module directly.
- Moved intake drafting, extraction, confidence, safety-context inference, and generation trace helpers into `lib/intake-generation.ts`.
- Kept `createReviewCaseFromIntake` exported from `lib/workflow.ts` so existing UI imports remain stable while clinical drafting logic now has a focused home.
- Reduced `lib/workflow.ts` from roughly 3,800 lines before the split work to roughly 3,170 lines after benchmark, readiness, and intake extraction.
- Added API contract coverage in `tests/api-contracts.test.ts` for benchmark evidence JSON, readiness evidence JSON, accepted-case JSON persistence, frozen evidence payloads, and Medplum-disabled sync behavior.
- Added `shouldSyncAcceptedCaseToMedplum` as a pure integration guard and updated the case update API route to use it.
- Updated `npm run test:workflow` so API contract checks run alongside workflow scenario checks.
- Added read-only data health preview tooling with `npm run data:health` and machine-readable output via `node scripts/data-health.mjs --json`.
- Documented the data health command, scope classifications, and reset policy in `docs/DATA_HEALTH_AND_RESET_POLICY.md`.
- Added `components/review/ops-shared-sections.tsx` to consolidate repeated review workflow and clinical benchmark sections across the ops dashboard and ops report.
- Updated ops dashboard/report to use shared benchmark links, workflow signal rows, sign-off summaries, readiness cards, and benchmark case rows.
- Extended the shared ops sections with clinical rule coverage rendering so dashboard/report coverage counts, status labels, and drilldown links stay aligned.
- Extended shared ops sections again with meeting outcome signals and SLA escalation lists while preserving dashboard-only owner reassignment controls.
- Reduced ops dashboard/report duplication enough to bring `/review/ops` down to roughly 9.09 kB and `/review/ops/report` down to roughly 6.48 kB in the production route summary.
- Added a shared read-only owner workload summary for the ops report while leaving the dashboard reassignment controls local and interactive.
- Reduced `/review/ops/report` further to roughly 6.28 kB in the production route summary.
- Hardened FHIR-shaped export metadata with explicit `syntheticOnly`, `integrationMode`, deterministic synthetic bundle identifiers, synthetic-only tags, export quality issue details, and validation issue counts.
- Surfaced synthetic boundary and export quality checks on case evidence and printable case report pages.
- Extended workflow and API contract tests to protect the stronger export artifact contract.
- Added canonical resource references inside export bundles so Condition, Observation, and MedicationRequest resources point back to the Encounter, and MedicationRequest points to the Condition reason.
- Added per-resource validation summaries and surfaced them on case evidence and printable report pages.
- Extracted export validation and FHIR-shaped bundle mapping into `lib/export-mapping.ts`, while re-exporting the public helpers from `lib/workflow.ts` for existing callers.
- Reduced `lib/workflow.ts` to roughly 2,960 lines after moving export mapping out of the core workflow file.
- Added focused `tests/export-mapping.test.ts` coverage for valid, warning, and blocked export mapping scenarios, including resource references, synthetic metadata, quality issue routing, and integration-readiness labels.
- Updated `npm run test:workflow` so export-mapping checks run alongside workflow scenario and API contract checks.
- Fixed a date-sensitive meeting SLA test fixture so workflow verification remains stable after 26 April 2026.
- Extracted meeting outcome analytics, priority routing, SLA escalation, and owner workload logic into `lib/meeting-outcome-analytics.ts`.
- Kept the meeting outcome functions re-exported from `lib/workflow.ts` so existing dashboard, report, and test imports remain stable.
- Reduced `lib/workflow.ts` further to roughly 2,659 lines after moving meeting outcome analytics and finalization label helpers out of the core workflow file and restoring the compatibility layer.
- Verified module seams, API contracts, data health tooling, and shared ops/report sections with `npm run data:health`, `node scripts/data-health.mjs --json`, `npm run verify`, and `npm run build`.
- Repaired the later incomplete workflow barrel refactor by restoring the `@/lib/workflow` compatibility surface, re-exporting meeting outcome functions, and turning placeholder workflow-domain files into valid modules until real extraction happens.
- Repaired `components/review/case-detail.tsx` after a partial split left duplicate component declarations and stale inline code mixed with the new hook/panel structure.
- Moved pure finalization and decision label helpers into `lib/workflow/finalization.ts` as the first small real domain-module extraction from the restored green baseline.
- Restored `npm run verify` and `npm run build`; that production build generated 51 routes after adding the evidence registry API.
- Extracted the clinical safety and finalization rule engine into `lib/workflow/safety.ts`, including structured clinical rule results with category, source, severity, warning/blocking impact, and required reviewer action.
- Added `ClinicalRuleResult` as a typed rule output so safety/validation findings can drive evidence, UI, and future governance consistently.
- Added `lib/evidence-artifact-registry.ts` and `/api/evidence/registry` so the product can export a machine-readable registry of case evidence artifacts, frozen/live state, and clinical rule summaries.
- Added an explicit integration adapter registry covering FHIR export, Medplum sync, FastAPI synthesis, and future EHR connectors while keeping live integration disabled or planned by default.
- Linked the evidence registry and benchmark evidence exports from the Command Centre data-health summary.
- Protected the new clinical rule, evidence registry, and integration adapter contracts with workflow and API contract tests.
- Moved clinical rule coverage matrix logic into `lib/workflow/benchmarks.ts`, making the benchmark module real while leaving scenario pass/fail logic in the workflow core until validation protocol extraction is safer.
- Moved data collection profile and analytics logic into `lib/workflow/data-collection.ts`, which unblocks cleaner evidence extraction because collection profile decisions now have their own module.
- Extracted shared feedback phrase analytics into `lib/feedback-analytics.ts` and reused it across `ops-dashboard` and `ops-report`.
- Extracted validation readiness, transition checklist, validation protocol, validation history, failure drilldown, dossier analytics, and validation meeting packets into `lib/workflow/validation.ts`.
- Moved timestamp formatting into `lib/time-format.ts` so domain modules can share it without circular workflow imports.
- Extracted remediation action queues, resolution analytics, stalled alerts, owner load, handoff churn, and coordination-risk analytics into `lib/workflow/remediation.ts`.
- Moved scenario benchmark checks, benchmark action queues, clinical rule coverage, and benchmark action resolution into `lib/workflow/benchmarks.ts`.
- Extracted evidence payload composition, source trace, frozen artifact creation, and persistence normalization into `lib/workflow/evidence.ts`.
- Extracted review analytics, intake-to-case creation, audit event helpers, draft section helpers, checklist blockers, and activity labels into `lib/workflow/review.ts`.
- Reduced `lib/workflow.ts` to a 13-line compatibility barrel while keeping `@/lib/workflow` as the stable public import surface.
- Added `lib/ops-analytics.ts` so ops dashboard and ops report share benchmark, readiness, remediation, meeting, feedback, and data-health calculations.
- Reduced ops dashboard/report derivation duplication; current file sizes before the latest dashboard section extraction were roughly 1,630 lines for `ops-dashboard` and 992 lines for `ops-report`.
- Added dynamic product-mode banner copy for synthetic validation, demo walkthrough, and recording walkthrough modes.
- Added reusable case-state summary/chips so the queue and case detail consistently show live/frozen artifact state, workflow status, finalization state, and safety level.
- Started splitting ops dashboard rendering into `components/review/ops-dashboard-sections.tsx`, beginning with feedback signals, validation stream readout, and governance/training cards.
- Reduced `ops-dashboard` further to roughly 1,537 lines while preserving interactive remediation and triage controls.
- Continued the ops dashboard split by moving validation protocol signals, validation trend signals, stage failure signals, remediation action cohorts, remediation completion signals, and remediation turnaround cards into `components/review/ops-dashboard-sections.tsx`.
- Reduced `ops-dashboard` further to roughly 1,328 lines while preserving interactive stalled-remediation, coordination-risk, and owner reassignment controls.
- Added `tests/route-smoke.test.ts` and included it in `npm run test:workflow` so critical route files and UI wiring for product mode, case state, ops analytics, and extracted ops sections are protected.
- Extracted the remaining meeting packet, owner workload, protocol trend, dossier readiness, meeting-ready dossier batch, and validation action queue sections from `components/review/ops-dashboard.tsx` into `components/review/ops-dashboard-sections.tsx`.
- Reduced `ops-dashboard` further to roughly 927 lines while preserving interactive owner reassignment, handoff notes, stalled-remediation, coordination-risk, and report export controls.
- Broadened `tests/route-smoke.test.ts` to cover report routes, including benchmark, command-centre, roadmap, M1 action, M1 evidence pack, pilot, case evidence, case dossier, and case report routes.
- Split `components/review/ops-dashboard-sections.tsx` into focused feedback, validation, remediation, meeting, and dossier section files, leaving the old file as a 5-line compatibility re-export.
- Extracted validation readiness actions, validation protocol signals, validation trend metrics, stage failure signals, dossier readiness, dossier spotlight, and meeting-ready dossier batch sections from `components/review/ops-report.tsx` into `components/review/ops-report-validation-sections.tsx`.
- Reduced `ops-report` from roughly 992 lines to roughly 653 lines, with report validation/dossier rendering now isolated in a roughly 418-line focused module.
- Updated route smoke coverage to protect the new domain files and report section module.
- Extracted remediation action cohorts, remediation completion, turnaround, stalled alerts, owner stalled load, handoff churn, and coordination-risk report sections into `components/review/ops-report-remediation-sections.tsx`.
- Reduced `ops-report` further to roughly 408 lines, with remediation report rendering isolated in a roughly 346-line focused module.
- Updated route smoke coverage to protect the new remediation report module.
- Latest extraction checkpoint passed `npm run verify`.
- Refreshed `README.md` and `docs/ARCHITECTURE.md` against the current product, focused workflow modules, synthetic-only boundaries, route surface, data-health practice, and verification gates.
- Added `/review/demo-readiness`, a clean-demo checklist for seed state, session state, benchmark sign-off, readiness snapshots, safe-to-show routes, and manual rehearsal checks before stakeholder walkthroughs.
- Added `/review/simulated-patients`, a richer fake longitudinal patient cohort for own-system testing without real patient data.
- Added `/review/governance-pack`, a clinical safety governance rehearsal pack with hazards, controls, safety-case sections, and production-readiness gaps.
- Added `lib/system-contracts.ts` for own-system interface contracts and the future database boundary plan.
- Latest production build generated 56 routes after adding simulated-patient, governance, research-evaluation export, and database adapter contract export surfaces.
- Added `npm run smoke:walkthrough`, a live authenticated walkthrough smoke gate for landing, onboarding, dashboards, product tour, workspace, command centre, clean-demo readiness, simulated patients, governance pack, review queue, case evidence, presenter guide, benchmark report, readiness, and roadmap report.
- Added `lib/research-evaluation-plan.ts` and `docs/RESEARCH_EVALUATION_BOUNDARY.md` to define a PyHealth-inspired offline ML/research evaluation boundary without live model deployment, real patient data training, or production clinical AI claims.
- Added a testable own-system boundary contract in `lib/system-contracts.ts` that protects synthetic-only scope, JSON proof storage, disabled external adapters, no live NHS/EHR integration, no real patient data, no production clinical AI, and no autonomous clinical decisioning.
- Deepened workflow/API/route smoke contract coverage around disabled Medplum/FastAPI defaults, explicit environment-flag enabling, JSON repository source of truth, and FHIR-shaped evidence as internal proof rather than live writeback.
- Added `buildDatabaseAdapterContract()` and `/api/system/database-contract` so JSON remains the active proof adapter while the planned database repository has explicit parity criteria, non-production boundaries, and no-real-patient-data constraints.
- Added endpoint-level route tests for `/api/research/evaluation` and `/api/system/database-contract`, including JSON attachment headers, no accidental scope-cookie creation, and read-only boundary payload checks.
- Added repository parity tests proving the active JSON repository preserves scoped round trips, seed rehydration, owner checks, create/update/reset behavior, and frozen artifact persistence before any future database adapter can be considered.
- Added endpoint-level route tests for persisted case evidence exports, benchmark evidence, and readiness evidence using isolated scoped JSON stores.
- Added `lib/human-gates.ts` to model red-flag escalation, referral/pathway, and medication/decision human gates without autonomous clinical decisioning.
- Next build target: surface human-gate status in case review, case evidence, and printable case reports, then expand smoke coverage toward hydrated browser interactions if a browser automation dependency is introduced.

## Boundaries For The Next Phase

- Keep UK/EU as the active build target.
- Keep the platform synthetic-data-first.
- Do not add live NHS integration, real patient-data handling, or production security claims in this phase. Keep the product own-system-first and synthetic-data-first.
- Do not broaden India work until the UK/EU proof is easier to maintain and validate.
- Treat the next milestone as maintainable clinical proof quality, not feature breadth.
