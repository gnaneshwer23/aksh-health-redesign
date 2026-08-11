# Phased Build Plan — Aksh Health UK (Build Tranche C: Frozen-Architecture Migration)

**Date:** 11 August 2026
**Scope:** `packages/platform-uk`, `main`
**Status:** Proposed — executing phase by phase
**This is not:** a redo of `docs/PHASED_BUILD_AND_AUDIT_PLAN.md` (P0–P7, closed) or `docs/PHASED_BUILD_PLAN.md` (B0–B7, closed). Both prior tranches are frozen and are not reopened by this document.

## Relationship to prior plans and to the frozen architecture

| Prior plan | This plan |
|---|---|
| P0–P7 (`PHASED_BUILD_AND_AUDIT_PLAN.md`) | Closed. Not reopened. |
| B0–B7 (`PHASED_BUILD_PLAN.md`) | Closed (SHIELD hard-fail, RBAC AppRole, outcomes honesty, Diabetes v1 signals+UI, patient check-in, population honesty, workspace nav). Not reopened. |
| **C0–C5 (this doc)** | **New tranche.** Executes `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` **P0** items (C1–C4) and the first slice of **P1** (C5), against the frozen baseline `docs/AKSH_FINAL_ARCHITECTURE_SPEC.md`. |

**Authoritative sources for this plan (read in this order):**
1. `docs/AKSH_FINAL_ARCHITECTURE_SPEC.md` — frozen baseline. Not redesigned by this plan.
2. `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md` — codebase-vs-spec mapping this plan closes gaps against.
3. `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` — the P0–P3 item definitions this plan's phases implement one-for-one (C1→P0-1, C2→P0-2, C3→P0-3, C4→P0-4, C5→P1 slice).
4. `docs/PHASED_BUILD_PLAN.md` (B0–B7, complete) — the product/safety tranche this architecture tranche builds on top of, unmodified.

## Hard constraints — apply to every phase in this document, no exceptions

1. **HITL remains mandatory** for every clinical-facing draft. No phase removes or bypasses Accept/Edit/Reject.
2. **`liveEmis: false`, `autoRetrain: false`** stay hard literal-type invariants. No phase changes either default or `canFlipLiveEmisInCode()`.
3. **No agent-directory deletions.** All 12 entries in `lib/agents.ts`'s `AGENT_DIRECTORY` stay present, named, and classified as `keepStatus: "keep"`. C3 adds classification fields only — it does not remove, merge, or "servicify away" any agent (`docs/AKSH_FINAL_ARCHITECTURE_SPEC.md` §13/§13.1/§54; `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` P0-3's own correction).
4. **Diabetes signals stay tools, not agents.** The 9 deterministic signal builders in `lib/disease-modules/diabetes/*` are never promoted into `AGENT_DIRECTORY` or given an agentic (multi-step/LLM) responsibility by this plan.
5. **Additive-only migration.** Every C0–C4 change is additive (new module/table/type/field) plus a call-site re-point where explicitly scoped — never a rewrite of working functionality. No existing test may be weakened to go green (`FR-VAL-032`, restated from B-tranche).
6. **No big-bang.** Each phase is scoped to be independently reviewable, independently revertible, and gated on the previous phase's Go/No-Go — mirroring the B-tranche's own discipline and the migration plan's own explicit non-instruction against implementing "all of P0 in one pass."
7. **A phase is Done only if** `npm run typecheck` is green and, for any clinical-facing/behavioural change, `npm run test:clinical-proof` is green. "Green by weakening an existing check" is not Done.
8. **Git safety:** every phase commits via a HEREDOC message, never `--amend`/`--no-verify`/force-push/`git config`. No `.js` twins of `.ts` source are committed. No `.env.local`/secrets are committed.

---

## Shared audit/functionality toolkit (referenced by phase, not repeated in full each time)

| Check | Command |
|---|---|
| Typecheck | `npm run typecheck` |
| Clinical proof (chained suites incl. HITL, SHIELD, RBAC, learning) | `npm run test:clinical-proof` |
| Workflow + clinical proof | `npm run test:workflow` |
| Hard-constraint grep | `grep -rn "liveEmis" lib/clinical-spine/orchestrate.ts`, confirm `false` literal unchanged; `grep -c "keepStatus: \"keep\"" lib/agents.ts` confirms 12 |
| Agent-directory count check | `AGENT_DIRECTORY.length === 12` (asserted in a test, not just by eye) |
| Deploy status | `vercel ls` / Vercel dashboard / MCP `get_deployment` — confirm latest deployment for the pushed commit reaches `READY` |

---

## C0 — Architecture docs freeze + overall architecture audit snapshot ✅ **COMPLETE (11 August 2026)**

**Goal:** Freeze the three frozen-architecture documents plus this plan into version control as the authoritative baseline for the C-tranche, and publish a snapshot audit of current codebase alignment against that baseline — before any product code changes.

**In scope**
- Commit `docs/AKSH_FINAL_ARCHITECTURE_SPEC.md`, `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md`, `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` (all three were present as untracked files at the start of this tranche — this phase is what brings them under version control).
- Commit this plan, `docs/PHASED_BUILD_PLAN_C.md`.
- Write `docs/AKSH_ARCHITECTURE_AUDIT_C0.md` — a short, standalone audit summarising current alignment vs the frozen architecture, Exists/Partial/Missing per the 7 domains + the agent layer, dated and versioned so later phases (C1–C5) can be diffed against it.

**Out of scope**
- No `lib/`, `app/`, or `components/` change of any kind.
- No new requirement ids, no code behaviour change, no test change.
- Not a rewrite or correction of the three frozen docs' content — they are frozen as delivered; only formatting/whitespace issues (if any) may be fixed, and only if it does not change meaning.

**Exit criteria (DoD)**
- [x] All three architecture docs + this plan + the C0 audit are tracked in git on `main`.
- [x] `docs/AKSH_ARCHITECTURE_AUDIT_C0.md` exists and covers all 7 domains + the agent layer with an Exists/Partial/Missing verdict per domain, each with a one-line evidence citation.
- [x] No file under `lib/`, `app/`, `components/`, `db/`, or `tests/` is modified.

**Audit checklist**
- [x] Diff review: this commit touches only `docs/*.md` — zero code paths (confirmed via `git status --short` before commit).
- [x] The C0 audit's verdicts are consistent with (not contradicting) `AKSH_ARCHITECTURE_GAP_ANALYSIS.md`'s own domain-by-domain findings — written as an explicit summary citing the same evidence, not a second independent analysis.
- [x] No claim in the C0 audit overstates readiness (Patient State is explicitly marked "Missing," Decision "Exists functionally, not separated" — neither claims C1/C2 have already landed).

**Functionality checks**
- [x] `npm run typecheck` — PASS (clean, no errors; doc-only change).
- [x] `npm run test:clinical-proof` — PASS. Full chained suite green (cohort, FHIR shape/R4, graph, HITL, HITL-chain, SHIELD, RBAC, golden-paths, learning, perf-SLOs, hazard-trace, Medplum, tenant-isolation, orchestration, NEXUS, precision-health phases 1–3 + whole-loop, clinical-spine phases A–F incl. diabetes B3, EMIS partner sandbox, demo-launch D1, onboarding role paths, RBAC decision gate, patient check-in B5, population honesty B6). Expected `[shield-audit] durable write failed ... postgres_not_configured` lines are the pre-existing, honest B1 failure-visibility signal in this no-`DATABASE_URL` test-run environment, not a regression.

**Commit + Deploy gate**
- Commit message documents this is a doc-only freeze (no code). Push to `main`. Vercel auto-deploys; a doc-only change should produce a `READY` deployment with no functional diff.

**Go/No-Go for C1: GO.** Baseline suite is green, all five docs (3 frozen architecture docs + this plan + the C0 audit) are committed.

---

## C1 — P0-1: Patient State foundation (versioned Patient State aggregate) ✅ **COMPLETE (11 August 2026)**

**Goal:** Introduce the frozen architecture's Domain 1 (Patient State) as a first-class, additive, versioned/append-only aggregate — without touching `ReviewCase`'s existing behaviour. Implements `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` **P0-1** exactly as scoped there.

**In scope**
- New `lib/patient-state/types.ts` — `PatientStateFact` (append-only: `patientId`, `factType`, `value`, `source`, `confidence`, `consentScopeId`, `effectiveAt`, `recordedAt`, `supersededBy`), `PatientStateFactInput`, `PatientStateSnapshot` (derived current-state projection: latest non-superseded fact per `factType`, plus `computedAt`).
- New `lib/patient-state/repository.ts` — `recordPatientStateFact`, `supersedePatientStateFact`, `listPatientStateFacts`, `getPatientStateSnapshot`. Postgres-preferred with file-fallback, mirroring the existing `lib/repositories/learning-event-repository.ts` dual-path pattern (never a hard dependency on a live DB).
- New `lib/patient-state/projection.ts` — pure function `buildPatientStateSnapshot(facts): PatientStateSnapshot`, unit-testable without I/O.
- New DB migration `db/migrations/013_patient_state.sql` (new schema/table only) + matching `PATIENT_STATE_FACTS_SQL` constant in `lib/db/schema-sql.ts` (same "keep migration file and embedded constant in sync" convention as `FHIR_STAGING_BUNDLES_SQL`/`LEARNING_EVENTS_SQL`).
- New read-only endpoint `GET /api/patients/[id]/state` — versioned snapshot + fact history. No existing endpoint's response shape changes.
- Additive `patientId?: string` field on `ReviewCase` (`lib/types.ts`) — optional, so **no existing `ReviewCase` literal, fixture, or test needs updating**. `patientLabel` stays exactly as-is for display.
- New `tests/patient-state-foundation.test.ts` — append-only invariant (a "superseding" write never deletes/mutates the prior row), version supersession (`getPatientStateSnapshot` always resolves to exactly one current value per `factType`), and an identity-resolution check that the existing `resolveSpinePatientId` (`lib/clinical-spine/queue-decision.ts`) values used by the B-tranche continue to resolve cleanly against this new store.
- Wired into `test:clinical-proof` (package.json script gains one more chained `npx tsx tests/patient-state-foundation.test.ts`).

**Out of scope**
- No change to `ReviewCase`'s required fields, to `lib/precision-health/timeline.ts`'s existing merge logic, or to any diabetes fixture — those are read-only re-pointing candidates for a **future** phase (per the migration plan's own "Files affected" note), not this one.
- No frontend surfacing of Patient State (explicitly deferred to P2-3 in the migration plan).
- No backfill/migration of historical `ReviewCase` data into the new store — this phase proves the mechanism exists and is correct, not that every historical record has been migrated.

**Exit criteria (DoD)**
- [x] `lib/patient-state/*` exists with passing unit tests for the append-only + supersession invariants.
- [x] `GET /api/patients/[id]/state` returns a versioned snapshot for a seeded patient id and an empty snapshot (not a crash) for an unknown one (`getPatientStateSnapshot` returns `{current:{}, factCount:0}` rather than throwing; route delegates straight to it).
- [x] `ReviewCase.patientId` is optional and additive; zero existing `ReviewCase` fixtures/tests were modified to accommodate it.
- [x] `npm run typecheck` and `npm run test:clinical-proof` both green, including the new test file.

**Audit checklist (architecture alignment + hard constraints)**
- [x] Confirms Domain 1 (Patient State) per `AKSH_FINAL_ARCHITECTURE_SPEC.md` §7 principle: current state, previous state, and change are explicitly represented (via `supersededBy` + `effectiveAt`/`recordedAt`), not just a flat latest-value cache.
- [x] Confirms no destructive overwrite of clinically-relevant state — every write is an `INSERT`, never an `UPDATE`/`DELETE` of an existing fact row (spec §48, §54). Verified by test: superseded fact's own `value`/`id` are asserted unchanged after a later write.
- [x] Confirms `liveEmis`/`autoRetrain` untouched (grep clean — this phase touches no orchestration/decision code).
- [x] Confirms no agent-directory change (grep clean — this phase touches no `lib/agents.ts`).
- [x] Confirms `ReviewCase`'s existing type surface is diff-clean except for the one additive optional field (`git diff` on `lib/types.ts` shows only the new `patientId?: string` + its doc comment).

**Functionality checks**
- [x] `npm run typecheck` — PASS.
- [x] `npm run test:clinical-proof` — PASS, full chain green including new `patient-state-foundation.test.ts` (projection current-state-per-factType, cross-patient isolation, repository append-only/supersession, identity-bridge regression against the golden PATEL-DEMO→P002 mapping, unknown-patient empty-snapshot). Same expected `postgres_not_configured` fail-visible warnings as prior phases (no `DATABASE_URL` in this sandbox) — not a regression.
- [x] Scripted: `testRepositoryAppendOnlyAndSupersession` seeds 2 facts of the same `factType` for one patient id via `recordPatientStateFact`, calls `getPatientStateSnapshot`, confirms exactly one current value and that the superseded fact is still retrievable via `listPatientStateFacts`.

**Commit + Deploy gate**
- Commit: new patient-state module + migration + route + tests + this plan's C1 checkbox update. Push to `main`. Confirm Vercel deployment reaches `READY` (MCP `get_deployment`/`list_deployments` or dashboard).

**Go/No-Go for C2:** **GO** — all exit criteria met, full clinical-proof chain stays green (no regression to B0–B7 behaviour), `ReviewCase`'s existing behaviour unchanged.

---

## C2 — P0-2: Extract a named Decision module from CONDUCTOR ✅ **COMPLETE (11 August 2026)**

**Goal:** Separate Domain 3 (Decision) from Domain 2 (Intelligence)/orchestration at the module boundary — a pure extraction/re-export refactor with **zero** behaviour change. Implements **P0-2** exactly as scoped.

**In scope**
- New `lib/decision/index.ts` exporting `resolveDecision(input): Decision`, where `Decision = { route: SafetyRoute; priority: QueuePriority | null; escalation: "none"; explanation: string; contributingIntelligenceRefs: string[] }`. Internally delegates to the existing `resolveSafetyRouteFromOrchestration` (`lib/clinical-spine/safety-route.ts`) for `route` — byte-identical logic, just named and callable as one Decision-domain function.
- `lib/clinical-spine/orchestrate.ts`'s call site swapped from calling `resolveSafetyRouteFromOrchestration` directly to calling `resolveDecision(...).route` — the only production call-site change in this phase.
- `escalation` is hard-set to the literal `"none"` in C2 (a placeholder slot for C5/P1-3's diabetes-specific escalation field — not populated yet, so this phase cannot regress or half-implement escalation logic).
- New `tests/decision-module.test.ts` — asserts `resolveDecision(...).route` is identical to `resolveSafetyRouteFromOrchestration(...)` across every `SafetyRoute` branch (urgent/high/low/request_more_data), and a golden-scenario regression check that `runClinicalSpineOrchestrate`'s `safetyRoute`/`safetyRouteLabel` output for the existing golden scenarios (`GOLDEN_SCENARIO_PATEL_DEMO_ID`, `GOLDEN_SCENARIO_V_UK1_ID`) is unchanged after the call-site swap.
- Wired into `test:clinical-proof`.

**Out of scope**
- No change to `queue-decision.ts`'s priority/routing logic — the migration plan's "internal implementation detail" framing is honoured by leaving `queue-decision.ts` untouched in this phase; unifying priority into the `Decision` type is a candidate for a future phase, not required for C2's exit criteria.
- No new escalation logic (`escalation` stays the literal `"none"` — see In scope).
- No API response shape change — `runClinicalSpineOrchestrate`'s public return type is byte-identical.

**Exit criteria (DoD)**
- [x] `lib/decision/index.ts` exists, is independently unit-tested, and is the only thing `orchestrate.ts` calls for `safetyRoute` resolution.
- [x] Golden-scenario regression test proves `safetyRoute`/`safetyRouteLabel` are unchanged before/after (P002/Patel and P009, matched against a direct call to the original resolver on the same orchestration snapshot).
- [x] `resolveSafetyRouteFromOrchestration` itself is untouched (still directly usable by any other existing caller — confirmed `lib/precision-health/whole-loop.ts`'s own direct call site is unmodified).

**Audit checklist**
- [x] Confirms Decision is now independently testable/importable without going through orchestration (spec §15: "Decision Layer is architecturally separate from the Intelligence Layer") — `resolveDecision` is unit-tested directly against synthetic `OrchestrationResult`s, no HTTP/orchestration round-trip required.
- [x] Confirms zero behaviour change via the golden-scenario diff, not just "looks equivalent by inspection" — `tests/decision-module.test.ts` asserts `result.safetyRoute === resolveSafetyRouteFromOrchestration(result.orchestration)` for both golden patients.
- [x] Confirms no safety-check bypass — `SafetyAssessment`/HITL gates downstream of `safetyRoute` are unaffected (this phase changes who calls the route resolver, not what the resolver decides).
- [x] Confirms `liveEmis`/`autoRetrain`/agent-directory untouched (grep clean; `lib/agents.ts` has zero diff in this phase).

**Functionality checks**
- [x] `npm run typecheck` — PASS.
- [x] `npm run test:clinical-proof` — PASS, full chain green (all existing `clinical-spine-phase-*` + `clinical-proof-orchestration` suites unmodified and green, plus new `decision-module.test.ts`: every `SafetyRoute` branch matrix + golden-scenario regression for P002/P009).

**Commit + Deploy gate**
- Commit: new `lib/decision/` + orchestrate.ts call-site swap + tests + plan update. Push to `main`. Confirm Vercel `READY`.

**Go/No-Go for C3:** **GO** — golden-scenario outputs are byte-identical and the full clinical-proof chain is green.

---

## C3 — P0-3: Agent directory classification (`kind`/`layer`/`keepStatus`) — zero deletions

**Goal:** Add additive classification metadata to all 12 `AGENT_DIRECTORY` entries so "is this agent still an agent, and where does it sit in the frozen architecture" is type-checkable, not just documented in prose. Implements **P0-3** exactly as scoped, including its explicit correction that this is a classification pass, not a pruning pass.

**In scope**
- Add three additive fields to every `AGENT_DIRECTORY` entry in `lib/agents.ts`:
  - `kind: "orchestration" | "intelligence_llm" | "intervention" | "data_interop" | "safety_governance"`
  - `layer: Array<"patient_state" | "intelligence" | "decision" | "intervention" | "learning" | "data_interop" | "safety_governance">`
  - `keepStatus: "keep"` (literal, on all 12 — no other value is introduced by this phase)
- Populate per `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md` §2.1's table (CONDUCTOR→orchestration; GUARDIAN/SHIELD→safety_governance; HORIZON/SYNTHESIS/NEXUS/CANVAS/VOICE/DrASSIST/PRISM/ATLAS→intelligence_llm; PATHWAY→intervention; BRIDGE→data_interop; COMPASS→intelligence_llm with a `decision`+`intervention` layer footprint reflecting its equity/care-coordination role).
- New `tests/agent-directory-classification.test.ts` — asserts `AGENT_DIRECTORY.length === 12` (unchanged count), every entry has non-empty `kind`/`layer`/`keepStatus`, and every `keepStatus === "keep"` (a future PR that silently changes this to anything else fails the test, per spec §54's guardrail).
- Wired into `test:clinical-proof`.

**Out of scope**
- No renaming of any `id`, `label`, alias, env var, or API route.
- No removal of any of the 12 entries; no addition of a 13th.
- No change to `CLINICAL_AGENT_META`, `AGENT_LABEL_ALIASES`, or any consumer's rendering logic — this phase is metadata-only.
- P2-1's NEXUS review (deterministic-vs-LLM fit) is explicitly not this phase's job — NEXUS keeps `keepStatus: "keep"` here regardless.

**Exit criteria (DoD)**
- [ ] Every one of the 12 `AGENT_DIRECTORY` entries has `kind`, `layer`, `keepStatus: "keep"`.
- [ ] `AGENT_DIRECTORY.length === 12` both before and after (asserted by test, not eyeballed).
- [ ] No existing consumer of `AGENT_DIRECTORY`/`CLINICAL_AGENT_META` (`lib/marketing/agent-job-in-loop.ts`, `tests/route-smoke.test.ts`'s `assertFileIncludes` check) breaks.

**Audit checklist**
- [ ] Diff review: the only file with a logic change is `lib/agents.ts`, and the only change within it is additive fields on the existing array literal.
- [ ] Confirms this satisfies spec §54's guardrail ("do not remove or collapse existing Aksh agents") in a type-checkable way, not just a doc promise.
- [ ] Confirms the diabetes 9 signal builders (`lib/disease-modules/diabetes/*`) are **not** added to `AGENT_DIRECTORY` by this phase — they stay tools, per the hard constraint.
- [ ] Confirms marketing/public pages that render `AGENT_DIRECTORY` (if any) show no new/removed agent tile.

**Functionality checks**
- [ ] `npm run typecheck`
- [ ] `npm run test:clinical-proof` (new `agent-directory-classification.test.ts`; existing `route-smoke.test.js` unmodified assertion on `AGENT_DIRECTORY` string presence stays green)
- [ ] `npx playwright test e2e/marketing.spec.ts` (if run: confirms no marketing-surface agent-grid regression) — best-effort in this environment.

**Commit + Deploy gate**
- Commit: `lib/agents.ts` classification fields + test + plan update. Push to `main`. Confirm Vercel `READY`.

**Go/No-Go for C4:** **GO** if the count-preserved + all-`keep` assertions pass and no consumer breaks. **NO-GO** on any agent count change of any kind, in either direction.

---

## C4 — P0-4: Interop adapter contract formalization

**Goal:** Give Domain 6 (Data & Interoperability) one formal `IntegrationAdapter` contract that every existing integration (FHIR/EMIS/Medplum/Neo4j/AI-Gateway agents/diabetes module) is representable under — additive wrapping, not a rewrite of any adapter's internal logic. Implements **P0-4** exactly as scoped.

**In scope**
- New `lib/data-interop/adapter-contract.ts` exporting `IntegrationAdapter = { systemId; resourceType; mode: "staged" | "live"; consentScopeRequired: boolean; provenanceTag: string }` and `buildIntegrationAdapterRegistry(): IntegrationAdapter[]`, which **wraps** (does not replace) the existing `getIntegrationAdapterRegistry()` (`lib/integration-config.ts`) entries — one `IntegrationAdapter` per existing registry entry, `mode` derived from each entry's existing `enabled`/`status` fields (never hand-set to `"live"` for anything currently disabled).
- `lib/integration-boundary-contract.ts`'s `buildIntegrationBoundaryContract()` gains one additive field, `formalizedAdapters: IntegrationAdapter[]`, sourced from the new registry — every existing field on its return value stays byte-identical.
- New `tests/integration-adapter-contract.test.ts` — asserts every adapter's `mode` is `"staged"` unless explicitly allow-listed (the allow-list is empty in this phase — nothing is live), and that the formalized registry's length matches `getIntegrationAdapterRegistry()`'s length (one-to-one, nothing dropped or invented).
- Wired into `test:clinical-proof`.

**Out of scope**
- No change to any individual adapter's actual behaviour (`lib/emis-staging.ts`, `lib/medplum-client.ts`, `lib/neo4j/queries.ts`, `lib/precision-health/connectors.ts` are all untouched).
- No new `data_interop_events` audit table (explicitly parked to P2-4 in the migration plan).
- No change to `liveEmis`, `ENABLE_MEDPLUM_SYNC`, or any other integration flag's default.

**Exit criteria (DoD)**
- [ ] `buildIntegrationAdapterRegistry()` returns one `IntegrationAdapter` per existing `getIntegrationAdapterRegistry()` entry, all `mode: "staged"`.
- [ ] `buildIntegrationBoundaryContract()`'s existing fields are byte-identical; `formalizedAdapters` is the only addition.
- [ ] A single test can answer "is anything live anywhere" by reading one array — matching the migration plan's stated goal for P0-4.

**Audit checklist**
- [ ] Confirms no adapter's `mode` is `"live"` — grep/test-asserted, not just read by eye.
- [ ] Confirms `lib/emis-staging.ts`/`lib/medplum-client.ts`/`lib/neo4j/*`/`lib/precision-health/connectors.ts` have zero diff (wrapping only, per the migration plan's explicit risk mitigation).
- [ ] Confirms `liveEmis: false` / `canFlipLiveEmisInCode(): false` remain untouched (grep clean).
- [ ] Confirms existing integration tests (`tests/emis-partner-sandbox.test.ts`, `tests/clinical-proof-medplum.test.ts`) pass unmodified.

**Functionality checks**
- [ ] `npm run typecheck`
- [ ] `npm run test:clinical-proof` (new `integration-adapter-contract.test.ts`; existing EMIS/Medplum suites green unmodified)

**Commit + Deploy gate**
- Commit: new `lib/data-interop/adapter-contract.ts` + `integration-boundary-contract.ts` additive field + test + plan update. Push to `main`. Confirm Vercel `READY`.

**Go/No-Go for C5:** **GO** only if C1–C4 are all individually GO (Patient State, Decision, Agent classification, Interop contract all landed clean, full clinical-proof chain green throughout). This is the explicit gate named in the task brief — C5 does not start otherwise.

---

## C5 — P1: Diabetes MVP loop slice (CONNECT→…→LEARN proof path) — only after C1–C4 GO

**Goal:** Prove one real, narrow CONNECT→…→LEARN slice for Diabetes using the new Patient State (C1) and Decision (C2) modules plus the *existing* diabetes tools and HITL contract — not a new diabetes feature, a proof that the architecture migration actually connects end to end. Corresponds to migration plan **P1-1** (learning-event wiring) as the minimum bar; P1-2/P1-3/P1-4 are stretch within this phase and may be split into a C6 if C5's own scope proves too large mid-phase.

**In scope (minimum bar — P1-1 only)**
- When a diabetes coaching draft (`buildDiabetesRiskContribution`'s `coachingDrafts`) is Accepted via the existing HITL Accept flow, call `recordLearningEvent` with a diabetes-labelled `agentLabel` (e.g. `"DIABETES_NUTRITION"`/`"DIABETES_EXERCISE"`/`"DIABETES_BEHAVIOUR"`), reusing `lib/clinical-spine/outcomes-loop.ts` exactly as-is.
- A test proving a diabetes coaching Accept produces a `learning_events` row with a diabetes `agentLabel`, and that `buildOutcomesLoopStatus` correctly buckets it (no double-counting, no new `loopStage`).

**Stretch (only attempted if C5's minimum bar lands clean and time/stability allow — otherwise deferred to a future C6, not forced)**
- P1-2 (real longitudinal glucose/HbA1c ingestion into C1's Patient State) — behind the same `OQ-DIAB-1` gate the B-tranche already respected; glucose stays `insufficient_data` if that clinical decision is still unmade.
- P1-3 (diabetes-specific `escalation` value on C2's `Decision` type, replacing the `"none"` placeholder for diabetes-flagged patients only, non-diabetes patients byte-identical).

**Out of scope**
- No new disease module beyond Diabetes.
- No UI change beyond what's needed to prove the loop (existing `DiabetesCoachingPanel.tsx`/`ClinicalOrchestratePanel.tsx` Accept flow is reused, not redesigned).
- No change to `ENABLE_DIABETES_MODULE`'s default (`false`).

**Exit criteria (DoD)**
- [ ] Accepting a diabetes coaching draft (flag on, diabetes-flagged patient) produces a `learning_events` row with a diabetes-specific `agentLabel`, verified by test.
- [ ] Non-diabetes-flagged patients and flag-off behaviour remain byte-identical (mirrors the B3 `FR-DIAB-022` guarantee).

**Audit checklist**
- [ ] Confirms this is additive to the existing Learning domain (Domain 5) — no new table, no new loop-stage value, no change to append-only invariants.
- [ ] Confirms HITL is still the only path to this learning event (no autonomous write).
- [ ] Confirms `autoRetrain`/`liveEmis` untouched.

**Functionality checks**
- [ ] `npm run typecheck`
- [ ] `npm run test:clinical-proof`

**Commit + Deploy gate**
- Commit only the scope actually completed (minimum bar, or minimum bar + whichever stretch items landed clean). Push to `main`. Confirm Vercel `READY`.

**Go/No-Go:** This phase's own stretch items are explicitly optional — landing the minimum bar (P1-1) alone is a successful C5 outcome. A "minimum bar only, stretch deferred" result is acceptable and should be recorded as such, not treated as a shortfall.

---

## One-page roadmap

| Phase | Migration-plan item | Rough effort | Depends on |
|---|---|---|---|
| **C0** | — (doc freeze + audit snapshot) | 0.5 | — |
| **C1** | P0-1 Patient State foundation | 1–2 | C0 |
| **C2** | P0-2 Decision module extraction | 0.5–1 | C1 (sequenced, not hard-blocked — Decision doesn't need Patient State to exist to be extracted, but this plan sequences it after C1 per the migration plan's own dependency note) |
| **C3** | P0-3 Agent directory classification | 0.5 | C0 (independent of C1/C2) |
| **C4** | P0-4 Interop adapter contract | 0.5–1 | C0 (independent of C1/C2/C3) |
| **C5** | P1 Diabetes MVP loop slice | 1–2 (minimum bar); more if stretch attempted | **C1–C4 all GO (hard gate)** |

## Demo GO vs Live NO-GO mapping

Every phase in this plan operates entirely inside **Track A** (demo/pilot, synthetic cohort, `liveEmis:false`). None of C0–C5 move **Track B** (live NHS EMR) closer.

| Phase | Effect on Track A | Effect on Track B |
|---|---|---|
| C0 | Freezes the architecture reference every later phase is graded against | None |
| C1 | Adds a real Patient State mechanism behind existing surfaces — no visible behaviour change yet | None |
| C2 | Internal refactor only — zero visible behaviour change | None |
| C3 | Metadata only — zero visible behaviour change | None |
| C4 | Internal contract only — zero visible behaviour change | None |
| C5 | Extends the existing Diabetes v1 (B3/B4) narrative with real Learning-domain wiring, still flag-gated/HITL/synthetic | None |

**No phase in this plan changes `liveEmis`, `autoRetrain`, or `canFlipLiveEmisInCode()`.**

---

## Cross-links

- [`docs/AKSH_FINAL_ARCHITECTURE_SPEC.md`](./AKSH_FINAL_ARCHITECTURE_SPEC.md) — frozen baseline this plan migrates the codebase toward
- [`docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md`](./AKSH_ARCHITECTURE_GAP_ANALYSIS.md) — gap analysis this plan's phases close
- [`docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md`](./AKSH_ARCHITECTURE_MIGRATION_PLAN.md) — P0–P3 item definitions C1–C5 implement
- [`docs/AKSH_ARCHITECTURE_AUDIT_C0.md`](./AKSH_ARCHITECTURE_AUDIT_C0.md) — snapshot audit produced by C0, baseline for judging C1–C5's actual effect
- [`docs/PHASED_BUILD_PLAN.md`](./PHASED_BUILD_PLAN.md) — prior, closed B0–B7 tranche this architecture tranche builds on top of, unmodified
- [`docs/PHASED_BUILD_AND_AUDIT_PLAN.md`](./PHASED_BUILD_AND_AUDIT_PLAN.md) — prior, closed P0–P7 tranche (do not reopen; unrelated "P0" numbering to the migration plan's P0 — do not confuse the two)
