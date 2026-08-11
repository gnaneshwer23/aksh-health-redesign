# Phased Build Plan — Aksh Health UK (Build Tranche D: Intelligence & Workflow Improvements)

**Date:** 11 August 2026
**Scope:** `packages/platform-uk`, `main`
**Status:** D0 in progress at time of writing.
**This is not:** a redo of `docs/PHASED_BUILD_PLAN_C.md` (C0–C6, closed) or any earlier tranche. C0–C6 are frozen and are not reopened by this document.

## Relationship to prior plans and to the frozen architecture

| Prior plan | This plan |
|---|---|
| P0–P7 (`PHASED_BUILD_AND_AUDIT_PLAN.md`) | Closed. Not reopened. |
| B0–B7 (`PHASED_BUILD_PLAN.md`) | Closed. Not reopened. |
| C0–C6 (`PHASED_BUILD_PLAN_C.md`) | Closed (P0-1..P0-4, P1-1..P1-3 all landed). Not reopened. |
| **D0– (this doc)** | **New tranche.** Executes `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` **P2** items (P2-1..P2-4), plus a provisional resolution of the still-open `OQ-DIAB-1` gate scoped narrowly enough to unblock a v1.1 Glucose Intelligence slice without inventing clinical certainty. |

**Authoritative sources for this plan (read in this order):**
1. `docs/AKSH_FINAL_ARCHITECTURE_SPEC.md` — frozen baseline. Not redesigned by this plan.
2. `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md` — codebase-vs-spec mapping P2 closes gaps against (§4 summary table).
3. `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` — the P2 item definitions this plan's phases implement one-for-one (D1→P2-1, D2→(OQ-DIAB-1 provisional + Glucose v1.1, not itself a numbered P2 item — see "Relationship to OQ-DIAB-1" below), D3→P2-2, D4→(Patient State/Decision deepening, a natural extension of the already-closed P0-1/P1-3 rather than a new P2 number), D5→P2-3, D6→P2-4).
4. `docs/PHASED_BUILD_PLAN_C.md` (C0–C6, complete) — the architecture-migration tranche this one builds on top of, unmodified.

**Relationship to `OQ-DIAB-1`.** `OQ-DIAB-1` (`docs/PHASED_BUILD_PLAN.md` B3; Volume I `FR-DIAB-051`/§8.11) asks the clinical lead to decide whether CGM/glucose data should extend `wearableSampleSchema` or become a new `glucose` modality in `lib/precision-health/modalities.ts`. That question is **still open** and this plan does **not** answer it — no modality schema is invented or chosen here, and `lib/precision-health/modalities.ts` is not touched by any D-phase. Instead, D2 records a narrower, provisional **engineering** decision (`PED-DIAB-1`, see D2 below) that Glucose Intelligence can take one real step forward — deriving TIR/variability **only from patient-reported readings already flowing through C6's Patient-State ingest path** (a mechanism that has nothing to do with `modalities.ts`) — while `OQ-DIAB-1` itself stays open and owned by the clinical lead. This is explicitly a stop-gap, not a substitute for the clinical-lead decision, and is recorded as provisional in three places: this plan, `lib/disease-modules/diabetes/glucose.ts`'s own file header, and a new dated status line under Volume I's `OQ-DIAB-1` entry (§21.4 / §8.11).

## Hard constraints — apply to every phase in this document, no exceptions

Restates `docs/PHASED_BUILD_PLAN_C.md`'s own constraints verbatim — they do not lapse between tranches:

1. **HITL remains mandatory** for every clinical-facing draft. No phase removes or bypasses Accept/Edit/Reject.
2. **`liveEmis: false`, `autoRetrain: false`** stay hard literal-type invariants. No phase changes either default or `canFlipLiveEmisInCode()`.
3. **No agent-directory deletions.** All 12 entries in `lib/agents.ts`'s `AGENT_DIRECTORY` stay present, named, and classified as `keepStatus: "keep"`.
4. **Diabetes signals stay tools, not agents.** No D-phase promotes any diabetes signal builder into `AGENT_DIRECTORY` or gives it agentic (multi-step/LLM) responsibility.
5. **Additive-only migration.** Every D-phase change is additive (new module/table/type/field) plus a call-site re-point where explicitly scoped — never a rewrite of working functionality. No existing test may be weakened to go green.
6. **No big-bang.** Each phase is scoped to be independently reviewable, independently revertible, and gated on the previous phase's Go/No-Go.
7. **A phase is Done only if** `npm run typecheck` is green and, for any clinical-facing/behavioural change, `npm run test:clinical-proof` is green (and `npm run build` locally, for any phase touching a client-imported barrel — restates the concrete lesson from C5's `1a48ff1`/`696e14b` incident).
8. **Git safety:** every phase commits via a HEREDOC message, never `--amend`/`--no-verify`/force-push/`git config`. No `.js` twins of `.ts` source are committed. No `.env.local`/secrets are committed.
9. **No new modality schema, no `OQ-DIAB-1` resolution.** No D-phase edits `lib/precision-health/modalities.ts` or claims `OQ-DIAB-1` is decided — see "Relationship to `OQ-DIAB-1`" above.
10. **No fake clinical certainty.** Any provisional engineering decision that unblocks a previously-gated derivation (D2) must ship with explicit, visible "provisional/default band, pending clinical lead" language on every output it produces — never presented as a clinician-validated target range.
11. **Database: Neon Postgres only, not Supabase.** This app's system of record is Neon Postgres via the generic `pg` driver (`lib/db/client.ts`, `DATABASE_URL`), a decision already made and restated twice (`docs/ADR_TECH_STACK_MODERNIZATION.md`, `docs/BUILD_INSTRUCTIONS_GAP.md`: "we keep the working stack and implement gaps only"). Supabase is not used anywhere in this codebase (verified by repo-wide search before this plan was written — the only hits are ADR prose explicitly *rejecting* Supabase, plus a generic SSL-hostname-sniff string in `lib/db/client.ts` that matches `supabase.co` only to decide whether to enable TLS, not an actual dependency). **No D-phase introduces a Supabase project, client, or migration.** Any Supabase MCP tooling available in this environment is not used for this plan.

---

## Shared audit/functionality toolkit (referenced by phase, not repeated in full each time)

| Check | Command |
|---|---|
| Typecheck | `npm run typecheck` |
| Clinical proof (chained suites incl. HITL, SHIELD, RBAC, learning, C1–C6 suites) | `npm run test:clinical-proof` |
| Workflow + clinical proof | `npm run test:workflow` |
| Production build (only for phases touching a client-imported barrel) | `npm run build` |
| Hard-constraint grep | `grep -rn "liveEmis" lib/clinical-spine/orchestrate.ts` (confirm `false` literal unchanged); `grep -c "keepStatus: \"keep\"" lib/agents.ts` (confirms 12) |
| Modality-schema grep | `git diff --stat -- lib/precision-health/modalities.ts` (must be empty for every D-phase) |
| Deploy status | `vercel ls` / Vercel dashboard / MCP `get_deployment` — confirm latest deployment for the pushed commit reaches `READY` |

**Baseline confirmed before D0 began (11 August 2026):** `npm run typecheck` — PASS. `npm run test:clinical-proof` — PASS, full chain green (all C0–C6 suites, exit code 0, 228s). This is the baseline every D-phase is diffed against.

---

## D0 — Plan freeze + architecture audit snapshot (no code) ✅ **COMPLETE (11 August 2026)**

**Goal:** Freeze this plan into version control, and record a short audit snapshot of what P2 (and the still-open `OQ-DIAB-1`) look like against the current, post-C6 codebase — before any D-tranche code change. Mirrors C0's own role for the C-tranche.

**In scope**
- Commit this plan, `docs/PHASED_BUILD_PLAN_D.md`.
- Re-verify (not assume) the C0–C6 baseline is still green: `npm run typecheck` + `npm run test:clinical-proof` re-run fresh, output recorded above.
- Confirm, by direct repo search, that Supabase is unused (see hard constraint 11) — recorded above, not re-litigated per phase.

**Out of scope**
- No `lib/`, `app/`, or `components/` change of any kind.
- No resolution of `OQ-DIAB-1` (see "Relationship to `OQ-DIAB-1`" above — D2 records a narrower provisional engineering decision, this phase does not).

**Exit criteria (DoD)**
- [x] This plan is committed to `main`.
- [x] Baseline `typecheck`/`test:clinical-proof` re-confirmed green on this commit, not assumed carried-over from C6's own record.
- [x] Supabase-unused finding recorded (hard constraint 11).

**Audit checklist**
- [x] Diff review: this commit touches only `docs/PHASED_BUILD_PLAN_D.md` — zero code paths.
- [x] `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` P2 items (P2-1..P2-4) re-read in full before drafting D1–D6 below — no P2 item is reworded or re-scoped by this plan, only sequenced into phases.

**Functionality checks**
- [x] `npm run typecheck` — PASS.
- [x] `npm run test:clinical-proof` — PASS (see baseline output above; same expected `postgres_not_configured` fail-visible SHIELD warnings as every prior tranche — no `DATABASE_URL` in this sandbox, not a regression).

**Commit + Deploy gate**
- Commit: this plan only (doc-only). Push to `main`. Confirm Vercel `READY`.

**Go/No-Go for D1: GO** — baseline reconfirmed green, plan committed.

---

## D1 — P2-1: NEXUS deterministic-vs-LLM review (no code) ✅ **COMPLETE (11 August 2026)**

**Goal:** Deliver the review spike `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` P2-1 asks for — a single written recommendation on whether NEXUS should remain an agent or have a deterministic correlation-statistics tool extracted from it — without changing any code or its existing draft/HITL contract.

**In scope**
- Read `lib/agents/llm-nexus.ts` in full and record a recommendation as an addendum to `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md` §2.1 (NEXUS row) plus this plan's own D1 section.
- No `keepStatus` change in `lib/agents.ts` — P0-3 (C3) already set NEXUS to `"keep"`; this phase either reaffirms that or produces a **separate, future, explicitly-reviewed** recommendation to revisit it. It does not itself flip the field.

**Out of scope**
- No code change of any kind — this is the "review only" item the migration plan itself scopes P2-1 as.
- No change to NEXUS's draft output shape, its HITL gating, or `tests/nexus-agent.test.ts`.

**Findings (recorded 11 August 2026):**
- `lib/agents/llm-nexus.ts` calls the AI Gateway (`generateText`) to produce **draft-only cross-signal correlation flags** over an arbitrary, patient-specific mix of Patient State signals (labs, medications, lifestyle, disease-module contributions) — the set of signals considered, and which pairings are worth flagging, is not a fixed, enumerable statistic per the agent-vs-tool test in spec §13.1; it varies per patient and per available data, and the judgment of "is this correlation clinically worth a clinician's attention" is exactly the kind of multi-source investigation the spec reserves for agents, not tools.
- `tests/nexus-agent.test.ts`'s own deterministic-mode fallback (`mode=deterministic` in the baseline run above) already proves NEXUS *can* degrade to a rule-based path when the AI Gateway is unavailable — this is a resilience feature (mirrors every other LLM agent's fail-open pattern), not evidence that NEXUS's primary mode is a fixed calculation that should be extracted.
- **Recommendation: Keep NEXUS as an agent.** Its task is not yet a fixed, enumerable statistical correlation — it is genuine multi-signal investigation whose scope changes with what data is available for a given patient. `keepStatus: "keep"` (set in C3) is reaffirmed, not changed, by this review. Re-audit in a future tranche only if NEXUS's actual scope narrows to a literal fixed statistic (e.g. "flag if HbA1c and a specific single lab value both cross a fixed threshold together") — not observed today.
- This finding has been appended to `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md` §2.1's NEXUS row as a dated addendum (see that file's diff in this phase's commit).

**Exit criteria (DoD)**
- [x] A short, dated recommendation exists for NEXUS, addended to the gap analysis §2.1 table.
- [x] `lib/agents.ts` has zero diff in this phase (grep-clean).

**Audit checklist**
- [x] Confirms this is a review, not a conversion — no code touched, `keepStatus: "keep"` unchanged.
- [x] Confirms COMPASS is not re-litigated (already decided "keep as agent" per the gap analysis's own correction — P2-1 was explicitly narrowed to NEXUS only, restated in the migration plan itself).

**Functionality checks**
- [x] `npm run typecheck` — PASS (doc-only change, no behaviour to break).
- [x] `npm run test:clinical-proof` — not re-run for this phase in isolation (no code changed); relied on D0's fresh baseline confirmation immediately prior. Re-run at the end of D2 covers this phase's zero-diff claim by inclusion.

**Commit + Deploy gate**
- Commit: gap-analysis addendum + this plan's D1 section. Push to `main`. Confirm Vercel `READY` (doc-only, no functional diff expected).

**Go/No-Go for D2: GO.**

---

## D2 — Provisional `OQ-DIAB-1` engineering decision (`PED-DIAB-1`) + Glucose Intelligence v1.1

**Goal:** Take one honest step forward on Glucose Intelligence — still gated on the unresolved `OQ-DIAB-1` for anything that would touch `lib/precision-health/modalities.ts` — by deriving TIR (time-in-range) and a variability estimate **only** from real, patient-specific readings already flowing through C6's Patient-State ingest path (`lib/disease-modules/diabetes/ingest.ts`), using a clearly-labelled **default, non-personalised, standard glycaemic band** (not a clinician-set target), and requiring a minimum reading count before computing anything. Fixture-sourced readings are explicitly **not** touched — they remain the pre-existing `insufficient_data` stub, preserving every existing byte-identical-regression guarantee C6 established.

**`PED-DIAB-1` (Provisional Engineering Decision, recorded here and in `glucose.ts`'s file header):**
> `OQ-DIAB-1` (extend `wearableSampleSchema` vs. new `glucose` modality) remains a clinical-lead decision and is **not** made by this phase. This decision is narrower and purely additive: for readings whose provenance is `patient_state_ingest` (i.e., a clinician or patient-companion flow explicitly recorded a real glucose value via `POST /api/patients/[id]/diabetes/glucose`, C6/P1-2) and where at least `MIN_READINGS_FOR_DERIVATION` (5) readings exist, `buildGlucoseSignal` may compute:
> - `tirPercent` — percentage of readings within a **default** target band (70–180 mg/dL, the standard ADA/NICE Type 2 non-pregnant adult glycaemic target range — a well-established, citable clinical convention, not an invented threshold, and not personalised to any individual patient's actual clinical target).
> - `variabilityScore` — coefficient of variation (%CV = standard deviation / mean × 100), a standard, widely-used glycaemic-variability statistic (ADA/ATTD consensus reporting metric), not a novel or fabricated formula.
> - `patternFlags` — `post_prandial_spike_suspected` (a `post_prandial`-context reading exceeds the band's upper bound by a fixed margin), `nocturnal_hypo_suspected` (a `bedtime`-context reading falls below the band's lower bound), `dawn_phenomenon_suspected` (a `fasting` reading is materially higher, by a fixed threshold, than the same day's or prior day's `bedtime` reading) — each a named, standard, rule-based glycaemic pattern, not a diagnosis.
> Fixture-sourced readings (`readingsSource: "fixture"`) and any ingested series below the minimum-count threshold continue to resolve to `insufficient_data`, byte-identical to pre-D2 behaviour — this phase changes what is possible for *real, ingested* data only, never for demo fixtures.
> Every output produced under this path carries an explicit `targetBand` field and a `provisional: true`-shaped limitation string stating the band is a default, non-personalised convention pending clinical-lead confirmation of `OQ-DIAB-1` and of per-patient target ranges — this is never presented as a clinician-approved target.
> This decision is engineering-scoped and reversible: no schema changed, no new modality, and Glucose's fixture-path output is unaffected. If the clinical lead later decides `OQ-DIAB-1` in a way that conflicts with this default band or the ingest-only gating, this phase's derivation logic is the only thing that needs revisiting — no data model change is implied.

**In scope**
- `lib/disease-modules/diabetes/glucose.ts` — real TIR/variability/pattern derivation, gated on `readingsSource === "patient_state_ingest"` AND `readings.length >= MIN_READINGS_FOR_DERIVATION`. New `targetBand: { lowMgDl: 70; highMgDl: 180 }` field (literal default, documented as provisional) and an explicit provisional limitation string on every derived (non-stub) output. Sub-minimum-count ingested readings and all fixture readings keep exactly the pre-D2 `insufficient_data` output shape (byte-identical).
- New `tests/diabetes-glucose-v1-1.test.ts` — proves: (a) fixture readings never derive, regardless of count (byte-identical to pre-D2); (b) ingested readings below the minimum count stay `insufficient_data`; (c) ingested readings at/above the minimum count derive `tirPercent`/`variabilityScore` correctly against a hand-computed expected value; (d) each of the three pattern flags fires on a constructed reading set designed to trigger it, and does not fire on one designed not to; (e) `targetBand` and the provisional limitation string are present on every derived output; (f) a regression check that `buildDiabetesRiskContribution`'s full composite output for every existing fixture-only cohort patient (P002/P007/P017/P020/P026/DEMO-DIABETES-P1) is unchanged (still `insufficient_data`) — the C6 regression guarantee extended, not weakened.
- Volume I `docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md` `OQ-DIAB-1` entry (§21.4 and §8.11) gets one additive, dated status line recording `PED-DIAB-1` as a provisional engineering stop-gap — `OQ-DIAB-1`'s own **Status: Open** is not changed, only annotated.
- Wired into `test:clinical-proof`.

**Out of scope**
- No change to `lib/precision-health/modalities.ts` (hard constraint 9 — grep-checked).
- No change to `hba1c.ts`'s derivation (already real since B3, untouched here).
- No personalised/per-patient target band (that is exactly what `OQ-DIAB-1` and a future clinical-lead decision would set) — the 70–180 mg/dL band is a fixed, documented default for every patient, not configurable in this phase.
- No UI surfacing of the new fields (a future phase's job, same deferral pattern C1/C6 used).
- No change to `ENABLE_DIABETES_MODULE`'s default (`false`).

**Exit criteria (DoD)**
- [ ] `buildGlucoseSignal` derives real `tirPercent`/`variabilityScore`/pattern flags only for `patient_state_ingest`-sourced readings at/above the minimum count, with an explicit `targetBand` + provisional-language limitation on every derived output.
- [ ] Fixture-sourced and below-minimum-count ingested readings remain byte-identical `insufficient_data` stubs.
- [ ] `npm run typecheck` and `npm run test:clinical-proof` both green, including the new test file.
- [ ] Volume I's `OQ-DIAB-1` entries carry the new provisional-decision status line; `OQ-DIAB-1`'s own **Status: Open** line is unchanged (not marked Decided).

**Audit checklist**
- [ ] `lib/precision-health/modalities.ts` has zero diff (`git diff --stat`) — `OQ-DIAB-1` genuinely untouched.
- [ ] No fixture-only cohort patient's composite output changes (byte-for-byte regression test, not spot-check).
- [ ] Every derived (non-stub) Glucose output visibly states the band is a default/provisional convention, not a clinical target — reviewed by reading the actual limitation strings in the test assertions, not just their presence.
- [ ] `liveEmis`/`autoRetrain`/agent-directory/HITL — grep-clean, this phase touches no orchestration/EMIS/agent-directory code and adds no new clinician-facing action (Glucose signal remains read-only intelligence feeding HORIZON, same as before).

**Functionality checks**
- [ ] `npm run typecheck` — PASS.
- [ ] `npm run test:clinical-proof` — PASS, full chain green including new `tests/diabetes-glucose-v1-1.test.ts`.
- [ ] `npm run build` — run locally if `glucose.ts`'s exported types change in a way that could affect the client-imported diabetes barrel (`GlucoseSignal` is already barrel-exported per C6 — confirm no new Node-only import is introduced into `glucose.ts` itself, since it's a pure, dependency-free module today and must stay that way to remain client-bundle-safe).

**Commit + Deploy gate**
- Commit: `glucose.ts` v1.1 derivation + new test file + Volume I OQ-DIAB-1 status line + this plan's D2 section. Push to `main`. Confirm Vercel `READY`.

**Go/No-Go for D3:** pending this phase's own functionality checks.

---

## D3 — P2-2: Unify Intervention-domain result shape (type-only, additive)

**Goal:** Implement `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` P2-2 exactly as scoped — a shared `InterventionDraft` base type that existing draft types (`health-plan.ts`, `coaching.ts`, diabetes coaching drafts, referral packages) satisfy additively, with **zero runtime behaviour change**.

**In scope**
- New `lib/intervention/types.ts` exporting `InterventionDraft = { id: string; domain: "health_plan" | "coaching" | "diabetes_coaching" | "referral"; patientId: string; status: "draft" | "accepted" | "rejected"; hitlRequired: true; ehrWrite: false }` (base shape only — each concrete draft type keeps its own richer fields, extending this base via a type-level `satisfies`/structural check, not a runtime wrapper).
- Additive `satisfies InterventionDraft`-style structural assertions (or equivalent type-only helper) added at each existing draft type's declaration site (`lib/precision-health/health-plan.ts`, `lib/precision-health/coaching.ts`, `lib/disease-modules/diabetes/types.ts`'s `DiabetesCoachingDraft`, PATHWAY's `ReferralPackage`/`ServiceRequestResource` in `lib/types.ts`) — proving each already satisfies the shared shape without modifying any of their existing fields or runtime construction logic.
- A single new read-only aggregator function, `lib/intervention/list-pending.ts`'s `describePendingInterventionDrafts(...)` (pure, synchronous, take-in-drafts-you-already-have — not a new data source), demonstrating "what interventions are pending for this patient" is answerable from one shared shape once each domain's drafts are mapped onto it — this is the concrete value P2-2 calls for, kept intentionally small (a mapper, not a new store).
- New `tests/intervention-draft-shape.test.ts` — asserts each existing draft-producing function's output structurally satisfies `InterventionDraft`, and that `describePendingInterventionDrafts` correctly aggregates a mixed set of drafts across domains without altering any individual draft's fields.

**Out of scope**
- No change to any existing draft type's actual fields, construction logic, or API/response shape — this is additive typing plus one new pure aggregator, not a refactor of `health-plan.ts`/`coaching.ts`/diabetes coaching/referral construction.
- No new persisted store of "pending interventions" — `describePendingInterventionDrafts` takes already-produced drafts as input; it does not query anything new.
- No UI change.

**Exit criteria (DoD)**
- [ ] All existing Intervention draft-producing types satisfy `InterventionDraft` without any of their own fields changing (verified by a type-level check, not just visual inspection).
- [ ] `describePendingInterventionDrafts` correctly aggregates drafts from at least three of the four domains (health plan, generic coaching, diabetes coaching) in a test.
- [ ] `npm run typecheck` and `npm run test:clinical-proof`/`test:workflow` (whichever suite covers the touched files) both green.

**Audit checklist**
- [ ] `git diff --stat` on every existing draft-producing file shows either zero change or an additive-only `satisfies`/type-annotation change — no field removed, renamed, or made optional-to-required (or vice versa).
- [ ] No HITL/`ehrWrite` literal weakened — every existing `hitlRequired: true`/`ehrWrite: false` literal is unchanged; `InterventionDraft`'s own base shape only restates these as required literal fields, it does not introduce a way to set them otherwise.

**Functionality checks**
- [ ] `npm run typecheck` — PASS.
- [ ] `npm run test:clinical-proof` — PASS (full chain, confirming zero regression to any consumer of the touched types).

**Commit + Deploy gate**
- Commit: `lib/intervention/*` + type-level satisfies annotations + test + this plan's D3 section. Push to `main`. Confirm Vercel `READY`.

**Go/No-Go for D4:** pending this phase's own functionality checks.

---

## D4 — Deepen Patient State in the diabetes/CONDUCTOR path: persist Decision outputs as Patient State facts

**Goal:** Extend C1/C6's Patient State usage from read-only input (glucose/HbA1c ingest feeding the composite) to also **recording the Decision domain's own diabetes-relevant output** (the `escalation` value from C6/P1-3, and a compact summary of `guardianSafetyFlags`/`horizonContributingFactors` counts) back onto Patient State as a new fact type — closing one more loop the frozen spec's Domain 1 principle asks for ("current state, previous state, and change... explicitly represented"), entirely additively, with **zero change to `route`/`priority`/existing orchestration output shape**.

**Rationale (why this, from the user's "wire Patient State more deeply into CONDUCTOR/diabetes path" steer):** today Patient State only ever flows *into* the diabetes composite (C6); nothing the composite or Decision produces flows back *out* into Patient State. Without this, "what did CONDUCTOR decide about this patient's diabetes control, and when" is not itself a queryable, versioned fact — it only exists transiently in an orchestration response and (best-effort) in a SHIELD audit event. This phase makes that decision outcome a first-class, append-only Patient State fact, the same durability/versioning guarantee C1 gives every other fact type.

**In scope**
- New factType `"diabetes_decision_snapshot"` recorded via the existing `recordPatientStateFact` (no new table, no schema change) with a value shape `{ escalation: DecisionEscalation; horizonContributingFactorCount: number; guardianSafetyFlagCount: number; areaFailures: DiabetesModuleId[]; orchestratedAt: string }` — written once per orchestration run for a diabetes-flagged patient with the module enabled, from `lib/clinical-spine/orchestrate.ts`'s existing diabetes branch (the same call site C6 already added `loadDiabetesPatientStateOverrides` to — this phase adds one additional write immediately after `resolveDecision` runs, in the same branch, not a new call site).
- New `lib/disease-modules/diabetes/decision-history.ts` — `recordDiabetesDecisionSnapshot` (thin wrapper, mirrors `ingest.ts`'s pattern exactly, including its client-bundle-safety note: NOT re-exported from the diabetes barrel) and `loadDiabetesDecisionHistory` (read-back, ordered, via `listPatientStateFacts`).
- `lib/clinical-spine/orchestrate.ts` — after computing `decision`/`diabetesEscalation` (C6), fire-and-forget (fail-open, mirrors every other best-effort Patient State/SHIELD write in this codebase — never blocks the clinician-facing response) a call to `recordDiabetesDecisionSnapshot`. On failure, log and continue — orchestration's response is never delayed or altered by this write's outcome.
- New `tests/diabetes-decision-history.test.ts` — proves a diabetes-flagged orchestration run produces exactly one new `diabetes_decision_snapshot` fact with the correct `escalation` value (matrixed across none/`routine_coaching`/`diabetes_nurse_review`, reusing C6's existing P002/P026 scenario patients), that repeated runs append (never overwrite) per C1's supersession model, and that a write failure (simulated) does not throw or alter `runClinicalSpineOrchestrate`'s return value (fail-open regression test, mirrors the pattern already used for SHIELD audit failures in this sandbox).

**Out of scope**
- No change to `Decision`'s type, to `route`/`priority`, or to the existing `diabetesEscalation` field on `ClinicalSpineOrchestrateResult` — this phase only adds a durable side-effect after Decision resolves, it does not change what Decision computes.
- No UI surfacing of the new fact type (a future phase's job).
- No change to `ENABLE_DIABETES_MODULE`'s default.
- No synchronous dependency — orchestration must not await this write in a way that could make it a new source of latency/failure for the clinician-facing response; mirrors the existing best-effort SHIELD-audit pattern (`persistShieldAuditEvent`'s own catch-and-continue).

**Exit criteria (DoD)**
- [ ] A diabetes-flagged, module-enabled orchestration run produces a readable `diabetes_decision_snapshot` Patient State fact matching that run's actual `escalation` value.
- [ ] A simulated Patient State write failure does not throw, does not change `runClinicalSpineOrchestrate`'s return value, and is logged (fail-open, tested).
- [ ] Non-diabetes-flagged patients and flag-off behaviour produce zero new facts and are otherwise byte-identical (mirrors every prior phase's own regression discipline).
- [ ] `npm run typecheck`, `npm run test:clinical-proof`, and a local `npm run build` (orchestrate.ts is server-only already, but re-run build as a sanity check per hard constraint 7) all green.

**Audit checklist**
- [ ] Confirms additive-only to Patient State (Domain 1) — new factType, existing `recordPatientStateFact`/`listPatientStateFacts` reused unmodified, append-only invariant unaffected (verified by test).
- [ ] Confirms Decision (Domain 3) is unaffected — `resolveDecision`'s own signature/output is unchanged; this phase's write happens strictly after Decision resolves, using its already-computed output as input, never influencing it.
- [ ] Confirms fail-open discipline — the new write cannot become a new reason a clinician doesn't get an orchestration response (mirrors OQ-DIAB-2/OQ-DIAB-7's fail-open precedent and SHIELD's own best-effort pattern).
- [ ] `liveEmis`/`autoRetrain`/agent-directory/HITL — grep-clean.

**Functionality checks**
- [ ] `npm run typecheck` — PASS.
- [ ] `npm run test:clinical-proof` — PASS, full chain green including new `tests/diabetes-decision-history.test.ts`.
- [ ] `npm run build` — PASS locally (orchestrate.ts touched; confirm no client-bundle regression, same discipline as C6).

**Commit + Deploy gate**
- Commit: `lib/disease-modules/diabetes/decision-history.ts` + `orchestrate.ts` write call-site + test + this plan's D4 section. Push to `main`. Confirm Vercel `READY`.

**Go/No-Go for D5:** pending this phase's own functionality checks.

---

## D5 — P2-3: Patient State timeline UI (read-only, additive)

**Goal:** Implement `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` P2-3 — a read-only view surfacing a patient's Patient State fact history (source/confidence/effective date per fact), reading C1's existing `GET /api/patients/[id]/state` endpoint. Deferred to a later session slot if D0–D4 consume the available session time (see "What's left" below) — sequenced here, not force-fit into this session.

**In scope (planned)**
- A read-only panel/route (additive to an existing patient/clinician dashboard surface — exact placement TBD against current dashboard routes at execution time) rendering `getDiabetesFixtureBundle`-independent Patient State fact history: fact type, value (rendered generically, not per-type-special-cased beyond what's needed for readability), source, confidence, effective/recorded timestamps, and a clear "superseded" marker for non-current facts.
- Must not overstate certainty — confidence/source shown as recorded, no invented default confidence for facts that don't carry one.
- Component/e2e smoke test confirming the panel renders for a patient with facts (including the new D4 `diabetes_decision_snapshot`/C6 glucose/HbA1c facts) and renders an honest empty state for a patient with none.

**Out of scope**
- No write path from this UI (read-only, per P2-3's own scope).
- No new API endpoint — reuses C1's existing `GET /api/patients/[id]/state` verbatim.

**Status at time of writing:** not yet started — sequenced after D4. See "What's left in D/P2/P3" at the end of this document for current status.

---

## D6 — P2-4: Data & Interoperability audit view (admin panel, additive)

**Goal:** Implement `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` P2-4 — an admin-facing, read-only panel answering "is anything live anywhere" by reading C4's `buildIntegrationAdapterRegistry()`/`hasAnyLiveIntegrationAdapter()` directly, with no new business logic.

**In scope (planned)**
- New read-only endpoint (or reuse of `buildIntegrationBoundaryContract()`'s existing `formalizedAdapters` field, C4) + an admin panel table listing every adapter's `systemId`/`resourceType`/`mode`/`consentScopeRequired`, with a single prominent "any live?" banner backed by `hasAnyLiveIntegrationAdapter()`.
- Gated to an appropriate admin/operations role per `lib/permission-matrix.ts` — never patient- or clinical-reviewer-visible without justification.
- Smoke test confirming the panel reflects registry state (all `"staged"` today).

**Out of scope**
- No change to any adapter's actual mode/behaviour.
- No new registry — reads C4's existing one verbatim.

**Status at time of writing:** not yet started — sequenced after D5. See "What's left in D/P2/P3" at the end of this document for current status.

---

## One-page roadmap

| Phase | Migration-plan item | Rough effort | Depends on |
|---|---|---|---|
| **D0** | — (plan freeze + audit snapshot) | 0.5 | C0–C6 (all closed) |
| **D1** | P2-1 NEXUS review (docs only) | 0.5 | D0 |
| **D2** | `OQ-DIAB-1` provisional decision (`PED-DIAB-1`) + Glucose Intelligence v1.1 | 1–1.5 | D0 (independent of D1) |
| **D3** | P2-2 Unify Intervention-domain result shape | 0.5–1 | D0 (independent of D1/D2) |
| **D4** | Deepen Patient State in diabetes/CONDUCTOR path (Decision-output write-back) | 1 | D2 (reuses its escalation output), C1/C6 |
| **D5** | P2-3 Patient State timeline UI | 1–1.5 | C1 (read endpoint), ideally after D4 so the UI has decision-history facts to show |
| **D6** | P2-4 Data & Interoperability audit view | 0.5–1 | C4 (registry) — independent of D1–D5 |

## Demo GO vs Live NO-GO mapping

Every phase in this plan operates entirely inside **Track A** (demo/pilot, synthetic + patient-companion-entered cohort data, `liveEmis:false`). None of D0–D6 move **Track B** (live NHS EMR) closer, and none resolve `OQ-DIAB-1` itself.

| Phase | Effect on Track A | Effect on Track B |
|---|---|---|
| D0 | Freezes this tranche's scope | None |
| D1 | Documentation only — zero visible behaviour change | None |
| D2 | Extends Glucose Intelligence for real ingested readings only, behind existing flags, still HITL/read-only intelligence — `OQ-DIAB-1` stays open | None |
| D3 | Internal typing only — zero visible behaviour change | None |
| D4 | Extends Patient State with a durable diabetes-decision history fact, fail-open, no clinician-facing change | None |
| D5 (planned) | Adds a read-only clinician-facing view — still Track A, no new write path | None |
| D6 (planned) | Adds an admin-only read-only view — still Track A | None |

**No phase in this plan changes `liveEmis`, `autoRetrain`, `canFlipLiveEmisInCode()`, or resolves `OQ-DIAB-1`.**

---

## What's left in D / P2 / P3 (updated as phases land)

- **D0–D1:** complete (see phase sections above for detail).
- **D2:** in progress/complete per its own Go/No-Go — see phase section for current status.
- **D3–D6:** planned, not yet executed as of this document's initial commit; status tracked per-phase above and updated in place as each lands (not rewritten retroactively, per C-tranche convention).
- **P2 items not covered by D0–D6:** none — P2-1 through P2-4 are all sequenced above (P2-1→D1, P2-2→D3, P2-3→D5, P2-4→D6). The `OQ-DIAB-1`/Glucose v1.1 work (D2) and the Patient State deepening (D4) are additive extensions the user specifically asked for, layered on top of, not instead of, the four numbered P2 items.
- **P3 (unchanged, still out of scope):** PRISM/ATLAS build-out, production RBAC/CIS2, live EMIS/NHS write path, federated research productionisation, additional disease modules beyond Diabetes — none of these are touched by this plan, per the migration plan's own P3 framing ("out of scope until P0–P2 are substantially delivered and there is demonstrated need").
- **`OQ-DIAB-1` itself:** still open, still owned by the clinical lead. D2's `PED-DIAB-1` is a provisional, reversible engineering stop-gap, not a resolution — this is restated, not contradicted, by D2's own commit.

---

## Cross-links

- [`docs/AKSH_FINAL_ARCHITECTURE_SPEC.md`](./AKSH_FINAL_ARCHITECTURE_SPEC.md) — frozen baseline this plan migrates the codebase toward
- [`docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md`](./AKSH_ARCHITECTURE_GAP_ANALYSIS.md) — gap analysis P2 items close; §2.1 carries D1's NEXUS addendum
- [`docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md`](./AKSH_ARCHITECTURE_MIGRATION_PLAN.md) — P2 item definitions D1/D3/D5/D6 implement
- [`docs/PHASED_BUILD_PLAN_C.md`](./PHASED_BUILD_PLAN_C.md) — prior, closed C0–C6 tranche this plan builds on top of, unmodified
- [`docs/PHASED_BUILD_PLAN.md`](./PHASED_BUILD_PLAN.md) — B3's original `OQ-DIAB-1` gate record, restated (not overridden) by D2
- [`docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md`](./volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md) — `OQ-DIAB-1` entries (§8.11, §21.4) D2 annotates with the provisional-decision status line
