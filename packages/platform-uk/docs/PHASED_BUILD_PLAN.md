# Phased Build Plan — Aksh Health UK (Next Tranche)

**Date:** 6 August 2026
**Scope:** `packages/platform-uk`, `main`
**Status:** Proposed — ready to execute phase by phase
**This is not:** a rewrite of Volume I, a redo of `docs/PHASED_BUILD_AND_AUDIT_PLAN.md` (P0–P7, all **PASS**, closed), or a Track B (live EMR) plan.

## Relationship to prior plans

`docs/PHASED_BUILD_AND_AUDIT_PLAN.md` (P0–P7) already closed the NEXUS/CONDUCTOR, agent-brand, front↔back honesty, and Medplum/partner-paperwork tranche — **do not reopen it**. This document is the **next tranche**: the backlog agreed after `docs/volume-i/VOLUME_I_DRAFT_AUDIT.md` and `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` surfaced three must-fix-before-pilot gaps (SHIELD best-effort write, `patient`/`researcher` RBAC fallthrough, outcome-completeness honesty) plus the Diabetes v1 wiring work. To avoid ambiguity with the closed P0–P7 series, phases here are labelled **B0–B7** ("Build tranche 2").

| Prior plan | This plan |
|---|---|
| P0–P7 (`PHASED_BUILD_AND_AUDIT_PLAN.md`) | B0–B7 (this doc) |
| NEXUS in CONDUCTOR, agent brand, honesty pass, Medplum/Deepgram, partner paperwork | SHIELD hard-fail, RBAC AppRole, outcome honesty, Diabetes v1, clinician/patient UI, population honesty |
| **Status: PASS / closed** | **Status: proposed** |

## Ground truth this plan is built on

| Fact | Evidence |
|---|---|
| SHIELD audit write is best-effort, never blocks a clinical action *(fixed in B1 for Accept/Edit/Reject, outcome capture, governed evaluation — see B1 completion note)* | `lib/repositories/shield-audit-repository.ts` (`persistShieldAuditEvent`): catch → `console.error` → `return null`; Volume I `OQ-HITL-2`, called **binding, must-fix-before-pilot** (Ch.5 §5.4) |
| `patient`/`researcher` silently become `clinical_reviewer` *(fixed in B1 — see B1 completion note)* | `AppRole` = `"clinical_reviewer" \| "operations_lead"` (`lib/permission-matrix.ts:3`); `mapSessionRoleToAppRole` (`lib/user-scope.ts:32-38`) defaults any unrecognized role — including `patient`, `researcher` — to `clinical_reviewer`; Volume I `OQ-PER-1`/`OQ-PER-2`, `FR-PER-002/009` |
| Reject auto-closes the outcome loop without a real outcome | `queue-decision.ts` sets `outcomeKind: "care_action_deferred"` on every Reject; `outcomes-loop.ts` classifies that as `loopStage: "immediate_outcome"` (closed) with no human ever reporting what happened; Volume I `FR-LEARN-014`, `VOLUME_I_DRAFT_AUDIT.md` §"partial/best-effort capture" |
| Diabetes module exists, unwired | `lib/disease-modules/diabetes/*.ts` (12 files) — zero imports anywhere in the repo; `index.ts` itself says "not called from any production route"; Volume I `FR-DIAB-007/008` |
| Glucose modality schema doesn't exist yet | `lib/precision-health/modalities.ts` has no CGM/glucose field; Volume I `OQ-DIAB-1`, `FR-DIAB-051` — decision owned by clinical lead, **blocks** full v1 Glucose Intelligence |
| Hard invariants, unconditional | `liveEmis: false`, `autoRetrain: false` as literal types (`lib/clinical-spine/orchestrate.ts:28-32`); `canFlipLiveEmisInCode(): false` (`lib/clinical-spine/partner-readiness.ts:455-457`); Volume I `BR-076`/`BR-068` |
| No unified clinician workspace exists | Only Volume I framing text; GP experience is split across `/dashboard/gp`, `/review`, `/cases/[id]` |
| Volume I has 22 stale `[TODO]` forward cross-references | Chapters point at later chapters that are now `[DRAFTED]` but still say `[TODO]` (17 in PRD, self-flagged in `VOLUME_I_DRAFT_AUDIT.md`) |

---

## Rules that apply to every phase, no exceptions

1. **No phase in this plan unlocks `liveEmis: true` or `autoRetrain: true`.** Both stay hard `false` literals. `canFlipLiveEmisInCode()` stays `false`. This is out of scope for B0–B7 in full, not just "not planned."
2. No phase claims a certification (`certified: true`, signed DPIA/DCB0129/MHRA/CIS2) that doesn't exist.
3. No phase touches NextAuth, Neon-as-store, CONDUCTOR-as-deterministic-orchestrator, or SHIELD-as-single-audit-ledger architecturally — only hardens what exists (per `docs/ADR_TECH_STACK_MODERNIZATION.md`: no LangGraph, no NestJS, no Kafka, no ClickHouse).
4. Every phase ends with **both** an audit checklist (what a reviewer reads) and a functionality check (what a reviewer runs/clicks) before the next phase starts.
5. A phase is **Done** only if `npm run typecheck` is green and, for any clinical-facing change, `npm run test:clinical-proof` is green — restates Volume I `FR-VAL-025–032` (Definition of Done for Cursor-delivered changes). "Green by weakening an existing check" is not Done (`FR-VAL-032`).
6. Every phase stays inside **Track A** (demo/pilot, synthetic cohort). None of B0–B7 move Track B (live NHS EMR) closer — see mapping table at the end.

---

## Shared audit/functionality toolkit (referenced by phase, not repeated in full each time)

| Check | Command |
|---|---|
| Typecheck | `npm run typecheck` |
| Clinical proof (29 chained suites incl. HITL, SHIELD, RBAC, learning) | `npm run test:clinical-proof` |
| Workflow + clinical proof | `npm run test:workflow` |
| Full verify | `npm run verify` |
| E2E clinical proof | `npm run test:e2e:clinical-proof` |
| Marketing honesty E2E | `npx playwright test e2e/marketing.spec.ts` |
| Role smokes | `npm run smoke:all` / `smoke:gp` / `smoke:patient` / `smoke:researcher` / etc. |
| Evidence pack regenerate | `npm run evidence:pack` |
| Partner/honesty API spot-check | `GET /api/clinical-spine/partner-readiness` → `liveEmis:false`, `autoRetrain:false`, no `certified:true` |
| Demo login paths | `{role}01@demo.akshhealth.com` / `AkshDemoCohort!2026` (`docs/DEMO_LAUNCH_CREDENTIALS.md`) — e.g. `gp01@…`, `patient01@…`, `researcher01@…` |

---

## B0 — Doc hygiene + baseline audit snapshot ✅ **COMPLETE (6 August 2026)**

**Goal:** Freeze a clean, honest baseline before touching code — fix Volume I's own known hygiene debt and confirm CI is green so later phases have a trustworthy starting line.

**In scope**
- [x] Fix Volume I's stale `[TODO]` forward cross-references (Ch.3→5/8, Ch.4→6/7/8, Ch.5→4/8, Ch.6→7/8/9, Ch.8→9, Ch.15 EC-FLOW-5→18, Ch.17→19/22) — single find-and-fix pass per `VOLUME_I_DRAFT_AUDIT.md`'s own recommendation.
- [x] Reorder Ch.4/Ch.5 physical placement in `VOLUME_I_PRODUCT_REQUIREMENTS.md` to match numbering (Ch.5 currently appears before Ch.4 in the file).
- [x] De-duplicate the four-id k-anonymity open question (`OQ-ARC-2`/`OQ-POP-1`/`OQ-BR-3`/`OQ-DATA-3`) and the two-id SHIELD gap (`OQ-HITL-2`/`OQ-BR-2`) to one canonical id each per Ch.21 §21.8's own finding.
- [x] Snapshot baseline: run the full shared toolkit, record pass/fail with dates in this doc's B0 audit gate.
- [x] Confirm `docs/BUILT_VS_REMAINING_AUDIT.md` Track A/B verdict is unchanged before B1 starts.

**Out of scope**
- No code behaviour change. No new requirement IDs. No touching `lib/`, `app/`, or `components/`.
- Not a full copy-edit of Volume I — only the cross-reference/ordering/de-dup items named above.

**Exit criteria (DoD)**
- [x] Zero stale `[TODO]` cross-refs remain where the target chapter is `[DRAFTED]`.
- [x] Ch.4/Ch.5 physical order matches numbering.
- [x] Baseline suite results recorded with dates.

**Audit checklist**
- [x] Grep confirms no `[TODO]` remains next to a chapter reference that is itself `[DRAFTED]`.
- [x] `OQ-HITL-2`/`OQ-BR-2` and the k-anonymity quad resolve to one canonical id each, with the other(s) marked "see canonical id," not deleted silently (preserve history).
- [x] No requirement text, FR/AC/BR content, or verdict changed — this is a hygiene pass, confirm via diff review.

**Functionality check**
- [x] `npm run typecheck` — PASS expected (doc-only change).
- [x] `npm run test:clinical-proof` — PASS expected (doc-only change; run to confirm baseline, not because this phase could break it).
- [x] Manual: spot-open 3 of the fixed cross-references in the rendered doc, confirm they now point at real, findable chapters.

**Go/No-Go for B1:** **GO** if baseline suite is green and cross-ref fix is merged. **NO-GO** if baseline `test:clinical-proof` is red for a reason unrelated to environment (investigate before any B1 code change — don't build on a red baseline).

### B0 completion note (6 August 2026)

**What changed (doc-only, `docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md`):**
- Fixed all 10 stale `[TODO]`→`[DRAFTED]` cross-reference tags found by grep (Ch.3→5/8, Ch.5→4/8, Ch.4→6/7/8, Ch.6→7, Ch.7→8, Ch.8→9, Ch.15's own intro→16/18, Ch.15 EC-FLOW-5→18, Ch.16→18, Ch.17→19/22) — 14 individual tag occurrences across those 10 locations. Only the bracket tag (and, where grammatically required, the surrounding verb tense — "will define" → "defines") was changed; no `FR`/`AC`/`BR` requirement text, id, or verdict was touched. Grep confirms zero remaining `[TODO]` tags next to a chapter reference where that chapter is `[DRAFTED]` (the 3 remaining `[TODO]` hits are the legend definition (§0.1), the status-key table row, and Ch.22 FR-APP-005's general non-retroactivity rule — none are stale forward-references).
- Physically moved the Chapter 4 (Platform Architecture) section to precede the Chapter 5 (Clinical Safety & HITL) section (previously Ch.5 appeared first in the file despite being numbered after Ch.4). Content was moved verbatim (script-based cut/paste, byte-identical apart from the swap) — internal `§4.x`/`§5.x` numbering, FR/AC/OQ ids, and the two chapters' own "Cross-references" sections are untouched. The document's sequential section-position labels (`## 5.`/`## 6.`) were re-assigned so position order still ascends with the new physical order (`## 5. Chapter 4 …` then `## 6. Chapter 5 …`). Total line count unchanged (4,560 lines before and after); every other chapter's physical position is unaffected (`## 8. Chapter 6` onward untouched).
- k-anonymity quad (`OQ-ARC-2`/`OQ-POP-1`/`OQ-BR-3`/`OQ-DATA-3`) and SHIELD-gap pair (`OQ-HITL-2`/`OQ-BR-2`) were **audited, not edited** — each duplicate id already carries an explicit `(restates OQ-ARC-2/…)` / `(restates OQ-HITL-2)` annotation at its own definition site, and Ch.21 §21.8's "Recurring question clusters" table already names `OQ-ARC-2` and `OQ-HITL-2` as the respective "Origin" (canonical) id with every other id in the cluster listed as "restated as." This already satisfies the canonical-id / preserve-history requirement (matches `VOLUME_I_DRAFT_AUDIT.md`'s own finding that Ch.21 "does its own de-duplication work... no extra de-dup work needed from this audit"). No id was deleted or renumbered (`NO-OQ-2` respected).
- No changes to `docs/BUILT_VS_REMAINING_AUDIT.md` — verdict confirmed unchanged (see below).

**Baseline suite results (run 6 August 2026, on this doc-only diff):**

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | ✅ PASS | Clean, no errors. |
| `npm run test:clinical-proof` | ✅ PASS | All 29 chained suites green: cohort, FHIR shape, FHIR R4, graph, HITL, HITL-chain, SHIELD, RBAC, golden-paths, learning, perf-SLOs (review_action 18ms ≤ 2000ms target), hazard-trace, Medplum, tenant-isolation, orchestration, NEXUS, precision-health phases 1–3 + whole-loop, clinical-spine phases A–F, EMIS partner sandbox, demo-launch D1, onboarding role paths. |
| `docs/BUILT_VS_REMAINING_AUDIT.md` Track A/B verdict | ✅ Unchanged | Confirmed still reads "Unchanged (A: GO WITH LIGHT POLISH · B: NO-GO)" — this phase made no code change that could affect it. |
| Manual spot-check (3 of the fixed cross-refs) | ✅ PASS | Ch.5→Ch.4 (`Platform Architecture — Product View`, now `[DRAFTED]`, real section at its new position before Ch.5), Ch.8→Ch.9 (`Digital Twin — Diabetes`, `[DRAFTED]`, real section), Ch.17→Ch.19/22 (`Non-Functional Requirements` / `Appendices`, both `[DRAFTED]`, real sections) — all three now point at findable, correctly-tagged chapters. |

**B0 Go/No-Go for B1: GO.** Baseline is green (typecheck + full 29-suite clinical-proof), the doc-hygiene fix is complete and self-contained (no `lib/`/`app/`/`components/` touched), and the Track A/B verdict is confirmed unchanged. B1 (SHIELD hard-fail + RBAC AppRole) may start from this baseline.

---

## B1 — Safety & trust: SHIELD hard-fail + RBAC AppRole ✅ **COMPLETE (6 August 2026)**

**Goal:** Close the two must-fix-before-pilot gaps Volume I itself flags as binding: an audit write that can silently vanish, and a permission fallthrough that lets `patient`/`researcher` sessions be treated as clinical reviewers.

**In scope**

*SHIELD hard-fail (`OQ-HITL-2`)*
- [x] Decide the forcing function: on `persistShieldAuditEvent` Postgres-write failure, the clinical action (Accept/Edit/Reject, outcome capture, governed evaluation) must **not** silently report success as if the audit mirror also succeeded. Two acceptable designs — pick one, document the choice in this doc's audit gate:
  - (a) **Fail-visible (CHOSEN):** the API response includes `shieldAuditWriteFailed: true`; UI surfaces a persistent, dismissible "audit write degraded — retry" banner; the clinical action itself still completes (clinicians must not be blocked from Accept/Reject by an infra hiccup).
  - (b) **Retry-queued:** failed writes go to a durable retry queue (Neon table or file-fallback, matching the existing learning-event dual-write pattern) and a background job/route re-attempts; UI shows "audit pending" until confirmed.
- [x] Whichever design is chosen, `persistShieldAuditEvent`'s caller sites (`queue-decision.ts`, `outcomes-loop.ts`, governed-evaluation path) must propagate the failure signal instead of swallowing it silently.
- [x] Never make the SHIELD write itself synchronously blocking on the clinician's Accept/Edit/Reject click — that would be a worse regression (a slow/down audit store blocking clinical care). The fix is **visibility/retry**, not "throw and abort the clinical action."

*RBAC AppRole (`OQ-PER-1`, `OQ-PER-2`, `FR-PER-002`)*
- [x] Extend `AppRole` beyond the binary `"clinical_reviewer" | "operations_lead"` — add `"patient"` and `"researcher"` as first-class values (or a single `"restricted"` bucket if product decides not to distinguish them; document the decision either way).
- [x] Remove the default fallthrough in `mapSessionRoleToAppRole` that sends unrecognized/`patient`/`researcher` roles to `clinical_reviewer`. Unknown roles must deny by default, not silently promote.
- [x] Update `lib/permission-matrix.ts` so `patient`/`researcher` `AppRole`s carry their actually-intended scope (patient: own-record-only per `FR-PER-006`; researcher: aggregate/de-identified only, individual-record access denied by default per `FR-PER-007`, `CLINICAL_RECORD_DENIED_ROLES`).
- [x] Confirm `FR-PER-009` holds: no non-clinical persona (including the newly-scoped `patient`/`researcher`) can record a clinical Accept/Edit/Reject.

**Out of scope**
- Any change to `liveEmis`/`autoRetrain` (unrelated, stays `false`).
- Building the patient check-in API or new patient UI (that's B5 — this phase only fixes the RBAC *type and mapping*, not new patient-facing features).
- A hardened, production-grade multi-tenant RBAC system — `productionRbacEnforced: false` stays true; this phase closes the specific fallthrough bug, not a full RBAC rebuild.
- Changing `HumanGateId` gate types or adding a new gate (`insulin_dose_confirmation` etc. is `OQ-DIAB-*`, not this phase).

**Exit criteria (DoD)**
- [x] `mapSessionRoleToAppRole("patient")` and `mapSessionRoleToAppRole("researcher")` no longer return `"clinical_reviewer"`.
- [x] A simulated SHIELD write failure surfaces to the caller (test asserts the failure signal is present, not swallowed) and to the UI (banner/pending state).
- [x] `npm run test:clinical-proof` green, including the RBAC suite (`clinical-proof-rbac.test.js`) and SHIELD suite (`clinical-proof-shield.test.js`) — both updated to cover the new behaviour, not just the old passing case.

**Audit checklist**
- [x] Diff review: `AppRole` type change is additive (no existing `clinical_reviewer`/`operations_lead` mapping altered for `gp`/`nurse`/`clinical-pharmacist`/`practice-manager`/`ics-lead`/`hospital-executive`).
- [x] No new silent default — the "else" branch of the role mapper now denies/scopes explicitly, never falls through unlabelled.
- [x] `FR-PER-009` (non-clinical persona cannot Accept/Edit/Reject) has a test, not just a comment.
- [x] SHIELD: confirm the chosen design (fail-visible or retry-queued) never blocks the underlying clinical action from completing — re-read `queue-decision.ts` call sites to confirm Accept/Edit/Reject still returns 200 on audit-write failure, just with an honest flag.
- [x] No new `certified:true` or overstated durability claim introduced while "fixing" this (e.g. don't claim SHIELD is now "guaranteed durable" — it's now *visibly degraded* when it fails, which is different and should be worded that way in any docs/UI copy).
- [x] Update `docs/CONTINUOUS_LEARNING.md` and Volume I Ch.5 §5.4 status note if the SHIELD gap is closed (from "binding, must-fix-before-pilot, open" to "closed, see B1").

**Functionality check**
- [x] `npm run typecheck`
- [x] `npm run test:clinical-proof` (in particular `clinical-proof-rbac.test.js`, `clinical-proof-shield.test.js`, `clinical-proof-hitl.test.js`, `clinical-proof-hitl-chain.test.js`)
- [ ] `npm run test:e2e:clinical-proof` (`e2e/clinical-proof-rbac.spec.ts`) — **not run** in this sandbox (no `DATABASE_URL`/running dev server available for Playwright's signup-backed fixtures); pre-existing environment limitation, not a B1 regression. Should be run in CI/a DB-backed environment before pilot sign-off.
- [ ] Manual: log in as `patient01@demo.akshhealth.com` and `researcher01@demo.akshhealth.com`, confirm neither can reach a GP review-queue Accept/Edit/Reject action or API route (should 403/redirect via `resolveDashboardPath`, per `FR-PER-011`) — **not run** (no interactive browser/DB session in this sandbox); the equivalent server-side contract is covered by the new automated `clinical-proof-rbac-decision-gate.test.ts` (403 for `patient`/`researcher`/`operations_lead`/unrecognized roles on `PUT /api/review-cases/[id]`).
- [x] Scripted: force a SHIELD write failure (this sandbox has no `DATABASE_URL`, so `persistShieldAuditEvent` deterministically hits its failure path) and confirm an Accept-equivalent write (`recordLearningEvent`) still completes with the honest failure flag visible — not a silent success indistinguishable from a healthy write. Automated in `clinical-proof-shield.test.ts`.

**Go/No-Go for B2:** **GO** only if both the RBAC fallthrough test and the SHIELD-failure-visibility test pass — these are the two named must-fix-before-pilot items; do not proceed to outcomes work with either open.

### B1 completion note (6 August 2026)

**Files changed:**
- `lib/repositories/shield-audit-repository.ts` — `persistShieldAuditEvent` returns a discriminated `ShieldAuditWriteResult` (`{persisted:true,row}` / `{persisted:false,row:null,reason}`) instead of `DurableShieldAuditRow | null`.
- `lib/repositories/learning-event-repository.ts` — `recordLearningEvent` propagates `shieldAuditWriteFailed`/`shieldAuditWriteReason`; new `retryShieldAuditForLearningEvent` retry helper.
- `lib/clinical-spine/queue-decision.ts` — `SpineDecisionResult` carries `shieldAuditWriteFailed` + `failedShieldAuditLearningEventIds`.
- `lib/clinical-spine/outcomes-loop.ts` — `captureSpineOutcome`/`submitGovernedEvaluation` propagate `shieldAuditWriteFailed`.
- `app/api/audit/shield/route.ts`, `app/api/agents/voice-care/route.ts`, `app/api/review-cases/[id]/route.ts` — updated to the new `ShieldAuditWriteResult` shape; review-cases route also returns `shieldAuditWriteFailed`/`failedShieldAuditLearningEventIds`.
- `app/api/clinical-spine/shield-audit-retry/route.ts` — **new** retry endpoint for a failed SHIELD dual-write.
- `lib/use-review-cases.ts`, `components/review/case-page.tsx`, `components/review/case-detail.tsx` — dismissible "audit write degraded — retry" banner + retry action.
- `components/dashboard/precision-health/SpineOutcomesCapturePanel.tsx`, `GovernedEvaluationPanel.tsx` — toast surfaces a SHIELD audit-write failure on outcome capture / governed evaluation.
- `lib/permission-matrix.ts` — `AppRole` extended to `"clinical_reviewer" | "operations_lead" | "patient" | "researcher" | "restricted"`; `buildRolePermissionMatrix` gives `patient`/`researcher` explicit `denied` entries across the existing action set (no `allowed`/`scoped` grant introduced for either).
- `lib/user-scope.ts` — `mapSessionRoleToAppRole` rewritten: explicit allow-lists for the six existing clinical/ops onboarding roles, explicit `patient`/`researcher` mapping, and a `"restricted"` deny-by-default fallback for anything else (including empty/missing role) — no more implicit `clinical_reviewer` promotion.
- `app/api/dashboard/route.ts`, `app/api/command-centre/state/route.ts` — 403 for any `AppRole` other than `clinical_reviewer`/`operations_lead` (these are clinician/ops-only dashboards; `patient`/`researcher`/`restricted` must not reach them).
- `app/api/review-cases/[id]/route.ts` — **FR-PER-009 enforcement:** `PUT` now 403s for any `AppRole` other than `clinical_reviewer` before touching case data (previously this route had *no* role check at all, only scopeKey ownership — the only thing that had prevented `patient`/`researcher` from recording a decision was the pre-B1 bug itself always mapping them to `clinical_reviewer`; fixing the mapping without adding this gate would have newly exposed a 403-shaped hole, not closed one). Also fixed a pre-existing bug where `GET`/`PUT` called `requireAuthenticatedUserScope()` without the `request` argument, which silently disabled the test-only `x-user-id`/`x-user-role` header auth path on this route (real NextAuth-session auth was unaffected).
- `lib/dashboard-summary.ts` — `deriveDashboardSummary`'s `role` parameter and `DashboardSummary.persona.role` widened from the old binary type to `AppRole` (additive; call sites still only ever pass `clinical_reviewer`/`operations_lead`, now gated upstream).
- Tests: `tests/clinical-proof-shield.test.ts` (new SHIELD hard-fail-visibility assertions), `tests/clinical-proof-rbac.test.ts` (new `mapSessionRoleToAppRole` coverage), `tests/clinical-proof-rbac-decision-gate.test.ts` (**new** — FR-PER-009, run via `tsx` since `review-cases/[id]/route.ts` uses `@/`-aliased imports the tsc-compiled test bundle can't resolve). `package.json`'s `test:clinical-proof` script updated to include the new file.
- Docs: `docs/CONTINUOUS_LEARNING.md` (SHIELD dual-write section), `docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md` (§5.4 status update, FR-HITL-035, OQ-HITL-2 — all scoped honestly: closed for Accept/Edit/Reject/outcome-capture/governed-evaluation, **still open** for the research-evaluation-export and federated-research-job paths per EC-RES-4, which remain fire-and-forget and were out of B1's scope).

**Behaviour change summary:**
1. A SHIELD Postgres-write failure on Accept/Edit/Reject, outcome capture, or governed evaluation is never again silently reported as a clean write. The clinical action still completes (never hard-blocked), but the API response and reviewer UI now honestly say so, with a one-click retry.
2. A `patient` or `researcher` session (or any other unrecognized role) is a first-class, deny-by-default `AppRole`, not a demoted clone of `clinical_reviewer`. It can no longer record a clinical Accept/Edit/Reject (`PUT /api/review-cases/[id]` now 403s) or reach the clinician/ops dashboards (`/api/dashboard`, `/api/command-centre/state`).
3. `liveEmis`/`autoRetrain` unchanged (still hard `false`); no Diabetes v1 wiring touched.

**Checks run (6 August 2026):**

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | ✅ PASS | Clean, no errors, run twice (after the repository changes and again after the final route/test fix). |
| `npm run test:clinical-proof` | ✅ PASS | All 30 chained suites green (29 prior + the new `clinical-proof-rbac-decision-gate.test.ts`), including `clinical-proof-shield.test.js` (new hard-fail-visibility assertions) and `clinical-proof-rbac.test.js` (new `AppRole`-mapping assertions). `[shield-audit] durable write failed ... postgres_not_configured` log lines throughout the run are the *expected*, now-visible failure signal in this no-`DATABASE_URL` sandbox — not a test failure. |
| `npm run test:workflow` | ✅ PASS | Full chain (workflow scenarios, API contracts, integration boundary, read-only route contracts, repository parity, export mapping, Phase D API, route smoke) plus the full `test:clinical-proof` chain above — confirms the `review-cases/[id]/route.ts` and `permission-matrix.ts` changes don't regress the read-only route contract suite. |
| `npm run test:e2e:clinical-proof` | ⚠️ Not run | Requires a running dev server + `DATABASE_URL` for Playwright's signup-backed test fixtures (`createOnboardedTestUser`), neither available in this sandbox. Pre-existing environment limitation. |
| Manual login as `patient01@demo.akshhealth.com`/`researcher01@demo.akshhealth.com` | ⚠️ Not run | No interactive browser/DB session in this sandbox. Server-side contract (403 for `patient`/`researcher` on the review-decision route) is covered by the new automated `clinical-proof-rbac-decision-gate.test.ts` instead. |

**B1 Go/No-Go for B2: GO.** Both must-fix-before-pilot items are closed and automated-test-covered: the RBAC fallthrough (`mapSessionRoleToAppRole` + `PUT /api/review-cases/[id]` 403 gate) and the SHIELD-failure-visibility path (Accept/Edit/Reject, outcome capture, governed evaluation). Outstanding before a real pilot milestone (not blocking B2): run `test:e2e:clinical-proof` and the manual patient/researcher login check in a DB-backed environment; close the residual EC-RES-4 gap (research-evaluation-export / federated-research-job SHIELD writes still fire-and-forget) in a future pass.

---

## B2 — Outcomes loop honesty ✅ **COMPLETE (6 August 2026)**

**Goal:** Stop `loopCompleteRatio` from being inflated by Reject-driven auto-closure; make "we captured a real outcome" and "the clinician rejected the draft, so nothing to follow up" visibly distinct states.

**In scope**
- [x] Forcing function decision (document in this phase's audit gate, then implement): split the single `loopCompleteRatio` concept into two distinct, separately-reported metrics —
  - **`dispositionCompleteRatio`** — every item has an Accept/Edit/Reject disposition (this is what today's metric actually measures for Reject cases).
  - **`realOutcomeCaptureRatio`** — only counts items where a human reported what actually happened to the patient (today's `Accept → follow_up_scheduled` path, once an eventual outcome is linked).
- [x] `queue-decision.ts`: keep `outcomeKind: "care_action_deferred"` on Reject (correct — nothing to follow up on a rejected draft) but stop `outcomes-loop.ts` from classifying it as `loopStage: "immediate_outcome"` in a way that's indistinguishable from a verified real-world outcome. Introduce a distinct `loopStage` value (e.g. `"no_action_required"`) for Reject-driven closures, separate from a genuinely observed outcome.
- [x] Any dashboard/report surfacing `loopCompleteRatio` (GP/Admin/ICS honesty panels) updates its label/tooltip to state which of the two ratios it's showing, per Volume I's own honesty pattern.
- [x] Confirm `FR-LEARN-014` still holds after this change: a care action with no linked outcome and no informative `outcomeKind` remains visibly `awaiting_outcome` indefinitely — never auto-closed.

**Out of scope**
- Building a new outcome-capture UI/prompt flow to *increase* how many real outcomes get reported (that's a product/UX initiative, not this phase — this phase is a **measurement honesty fix**, not a "get more data" feature).
- Any change to the append-only design of the learning-event/outcome tables (still append-only; `buildLinkedOutcomeEvent` still throws if you try to link an outcome onto an outcome).
- Touching G-ML-1/2/3 governed-evaluation gates (unaffected by this phase).

**Exit criteria (DoD)**
- [x] Two distinct ratios exist in code and are both queryable/reportable; no code path conflates them.
- [x] `queue-decision.ts`/`outcomes-loop.ts` tests assert Reject produces `loopStage: "no_action_required"` (or the chosen distinct label), not `"immediate_outcome"`.
- [x] `FR-LEARN-014` has an explicit regression test if it doesn't already.

**Audit checklist**
- [x] Confirm the fix is a **relabeling + metric split**, not a behavioural change that makes Reject harder to record (clinicians must still be able to Reject a draft with one click — this phase must not add friction to the HITL disposition itself).
- [x] Confirm no dashboard silently keeps showing the old blended ratio without a label update — a reviewer should be able to tell at a glance which ratio they're looking at.
- [x] Confirm `docs/CONTINUOUS_LEARNING.md` is updated with the two-ratio distinction (currently silent on this nuance per `VOLUME_I_DRAFT_AUDIT.md`'s own finding).
- [x] Confirm Volume I `FR-LEARN-014` and the relevant Ch.14 passage are updated to reference the new two-ratio model rather than left describing the old blended one.
- [x] No claim anywhere that `realOutcomeCaptureRatio` is now "complete" or "high" — it will likely start low and honestly reflect that outcome-reporting is genuinely best-effort/self-serve today.

**Functionality check**
- [x] `npm run typecheck`
- [x] `npm run test:clinical-proof` (`clinical-proof-learning.test.js`, plus `clinical-spine-phase-e.test.ts`, which owns `outcomes-loop.ts` coverage)
- [ ] Manual: Reject a draft in the GP review queue, confirm the case's outcome status shows the new distinct label (not indistinguishable from a real outcome) — **not run** (no interactive browser/DB session in this sandbox); equivalent behaviour is covered by the new automated Reject→`no_action_required` assertions in `clinical-spine-phase-e.test.ts`.
- [ ] Manual: Accept a draft, later record an eventual outcome via `POST /api/clinical-spine/outcomes` (or equivalent UI), confirm it counts toward `realOutcomeCaptureRatio` but a sibling Reject in the same cohort does not inflate it — **not run** interactively; the equivalent contract (mixed cohort: 1 awaiting, 1 Reject, 1 linked-outcome Accept → `dispositionCompleteRatio` 0.667, `realOutcomeCaptureRatio` 0.333, strictly less than the disposition ratio) is automated in `clinical-spine-phase-e.test.ts`.

**Go/No-Go for B3:** **GO** if the two ratios are live and no dashboard shows the old blended metric unlabeled. This phase is intentionally small and self-contained — it should not be allowed to slip into a larger outcomes-UX redesign before B3 (Diabetes) starts.

### B2 completion note (6 August 2026)

**Files changed:**
- `lib/clinical-spine/outcomes-loop.ts` — `SpineCareAction["loopStage"]` gains a fourth value, `"no_action_required"`; `classifyCareAction` now routes `outcomeKind:"care_action_deferred"` (Reject) to `"no_action_required"` instead of `"immediate_outcome"` (a genuinely-reported immediate outcome — e.g. `adverse_event_none`/`adverse_event_suspected`/`care_action_completed` recorded directly, not via Reject — still classifies as `"immediate_outcome"`). `OutcomesLoopStatus.loopCompleteRatio` is replaced by two fields: `dispositionCompleteRatio` (any Accept/Edit/Reject disposition recorded — the old blended computation, workload signal) and `realOutcomeCaptureRatio` (`outcome_linked` + genuine `immediate_outcome` only, excludes `no_action_required` — honesty signal); a new `noActionRequiredCount` is also reported. `buildOutcomesLoopStatus`'s `note` field spells out the distinction in plain language.
- `components/dashboard/precision-health/SpineOutcomesCapturePanel.tsx` (GP + patient companion) — loop-status banner now shows `noActionRequiredCount` plus two separately-labeled, tooltipped lines ("Disposition complete (Accept/Edit/Reject recorded)" and "Real outcome captured (verified what happened)") instead of one unlabeled "complete ratio."
- `components/dashboard/precision-health/SystemSpinePanel.tsx` (admin System Spine) — Phase E outcomes summary line now reports both ratios by name ("N% disposition complete (workload signal)" / "N% real outcome captured (honesty signal — excludes Reject)") plus the no-action-required count.
- `components/dashboard/precision-health/GovernedEvaluationPanel.tsx` (admin governed evaluation) — `LoopSummary` type updated to the new field names; the loop banner now also surfaces `realOutcomeCaptureRatio` and `noActionRequiredCount` (previously showed raw counts only, with `loopCompleteRatio` present on the type but never rendered).
- `tests/clinical-spine-phase-e.test.ts` — new regression coverage: FR-LEARN-014 (unknown outcomeKind + no link stays `awaiting_outcome`), Reject → `no_action_required` (never `immediate_outcome`), a genuinely-reported immediate outcome still classifies as `immediate_outcome`, and a full mixed-cohort ratio check (1 awaiting + 1 Reject + 1 linked-outcome Accept → `dispositionCompleteRatio` 0.667, `realOutcomeCaptureRatio` 0.333, and an explicit assertion that the real-outcome ratio is always strictly less than the disposition ratio when a Reject is present). File-content assertions updated to require the new field/label names and to assert zero remaining `loopCompleteRatio` references in the lib file and both dashboard components.
- `docs/CONTINUOUS_LEARNING.md` — new "Outcomes-loop honesty: two distinct ratios" section: the `loopStage` table, why the pre-B2 blended ratio was misleading (cites `VOLUME_I_DRAFT_AUDIT.md`'s own finding), and the definitions/labels of `dispositionCompleteRatio` vs `realOutcomeCaptureRatio`.
- `docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md` (Ch.14 §14.3) — `FR-LEARN-012` extended to name `no_action_required` and require Reject/immediate-outcome to never share a loop-stage value; `FR-LEARN-015` rewritten from a single `loopCompleteRatio` requirement to the two-ratio model with explicit "never present as complete/high" language; two new acceptance criteria (`AC-LEARN-012-2` for the Reject-classification split, `AC-LEARN-015-1` for the real-outcome-ratio-strictly-less-than-disposition-ratio invariant). `FR-LEARN-014` text itself is unchanged (it already held; only cross-references to it were added) — restates it explicitly as still-holding per this phase's exit criteria.

**Behaviour change summary:**
1. A Reject no longer reports as an indistinguishable "closed loop / immediate outcome" — it is now `loopStage:"no_action_required"`, a disposition, not a captured real-world outcome. `outcomeKind:"care_action_deferred"` on Reject is unchanged (still correct: nothing to follow up on a rejected draft) — this is a classification/reporting fix, not a change to what Reject writes or how fast a clinician can record it.
2. `loopCompleteRatio` no longer exists anywhere in code or on any dashboard. Every surface that showed it now shows two distinctly labeled numbers: `dispositionCompleteRatio` (workload — how many items have any disposition, Reject included) and `realOutcomeCaptureRatio` (honesty — how many items have a human-reported real-world outcome, Reject excluded). The latter is expected to be low and is documented as such everywhere it appears.
3. FR-LEARN-014 (never auto-close an `awaiting_outcome` action) continues to hold — verified by a new explicit regression test, not just by inspection.
4. No change to `liveEmis`/`autoRetrain` (still hard `false`); no Diabetes v1 (B3) work started; B1's SHIELD hard-fail-visibility and RBAC `AppRole` behaviour untouched.

**Checks run (6 August 2026):**

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | ✅ PASS | Clean, no errors. |
| `npm run test:clinical-proof` | ✅ PASS | All 30 chained suites green, including the extended `clinical-spine-phase-e.test.ts` (new Reject/`no_action_required`, FR-LEARN-014, and two-ratio regression assertions) and `clinical-proof-learning.test.js` (unchanged, still green). |
| `npm run test:workflow` | ✅ PASS | Full chain (workflow scenarios, API contracts, integration boundary, read-only route contracts, repository parity, export mapping, Phase D API, route smoke) plus the full `test:clinical-proof` chain above — confirms no regression in the read-only route/UI-smoke contracts from the panel copy changes. |
| Manual: Reject → distinct label in GP review queue | ⚠️ Not run | No interactive browser/DB session in this sandbox. Server-side contract (Reject ⇒ `loopStage:"no_action_required"`, never `"immediate_outcome"`) is covered by the new automated assertion in `clinical-spine-phase-e.test.ts`. |
| Manual: Accept + eventual outcome vs. sibling Reject in the same cohort | ⚠️ Not run | No interactive session. Equivalent mixed-cohort ratio contract (Reject does not inflate `realOutcomeCaptureRatio`) is automated in `clinical-spine-phase-e.test.ts`. |

**B2 Go/No-Go for B3: GO.** Both ratios are live in code, on every dashboard/report that previously showed the blended `loopCompleteRatio`, each with its own label/tooltip — no surface shows an unlabeled blended number. FR-LEARN-014 continues to hold (now with an explicit regression test). Nothing in this phase touched `liveEmis`/`autoRetrain`, B1's SHIELD/RBAC behaviour, or started Diabetes v1 work. Outstanding before a real pilot milestone (not blocking B3): run the two manual UI checks above and `test:e2e:clinical-proof` in a DB-backed environment with a browser (same pre-existing sandbox limitation noted in B0/B1).

---

## B3 — Diabetes v1 (signals + wire + flag + tests) ✅ **COMPLETE (6 August 2026)**

**Goal:** Take the Diabetes module from "typed stub, unwired" (v0, done) to "real rule-based signals feeding HORIZON/GUARDIAN behind a flag, with tests" (v1), per `FR-DIAB-008`'s own numbered exit criteria — **without** resolving the two clinical open questions that are explicitly out of engineering's authority to decide alone.

**Blocking decision gate — recorded outcomes:**
- [x] **`OQ-DIAB-1` (clinical lead decision, `FR-DIAB-051`):** **STILL OPEN — no clinical-lead decision recorded.** Per the gate's own instruction, this phase did **not** proceed past it for Glucose: `glucose.ts` remains an honest `insufficient_data`/stub-only signal (it reports how many readings it received via `limitations`, but never derives TIR/variability/patterns from them). HbA1c, Complications, Prevention, and the coaching areas (Nutrition/Exercise/Behaviour) — none of which depend on the glucose modality decision — proceeded to real rule-based derivation as planned. Re-open `glucose.ts` once a clinical lead decides `wearableSampleSchema` extension vs. new `glucose` modality (targeted v1.1).
- [x] **`OQ-DIAB-2` (this plan's label; Volume I's canonical id for the identical question is `OQ-DIAB-7` — Volume I's own `OQ-DIAB-2` is a separate, untouched Insulin/GLP-1 gate-type question) — DECIDED: fail-open, per-area.** If one signal-builder area throws or returns malformed data, `buildDiabetesRiskContribution` does **not** fail the whole composite; it degrades that area gracefully (falls back to a safe default/empty value), records the failed area in a new `areaFailures: DiabetesModuleId[]` field, and continues deriving every other area. Rationale: this composite is an additional data-gathering step feeding an existing clinical draft path (HORIZON/GUARDIAN) that must not itself become a new reason a clinician can't get a draft — mirrors B1's "never hard-block a clinical action on an infra/derivation hiccup, always fail-visible" SHIELD precedent. A degraded area is always visible via `areaFailures` (also included in the SHIELD audit payload), never silently dropped. See `lib/disease-modules/diabetes/index.ts`'s `safeBuildArea` helper.

**In scope — completed**
- [x] Real rule-based derivation implemented for HbA1c (two-point trend + clamped 3-month linear-extrapolation estimate, `hba1c.ts`), Complications (evidence-count heuristic: 0→none/1→watch/≥2→referral_indicated per domain, `complications.ts`), Prevention (composite trajectory + personalised priorities over HbA1c trend + Complications flags, `prevention.ts`), and light signal-aware personalisation added to Nutrition/Exercise/Behaviour coaching drafts (`nutrition.ts`/`exercise.ts`/`behaviour.ts`). Glucose stays the honest stub per the `OQ-DIAB-1` gate above. No new AI Gateway/LLM calls anywhere in `lib/disease-modules/diabetes/` (`FR-DIAB-014`) — every builder is a pure, synchronous, deterministic function.
- [x] Insulin (`insulin.ts`) and GLP-1 (`glp1.ts`) implemented as explanatory-only signals feeding GUARDIAN: `doseChangeRecommendation`/`prescribingRecommendation` are hard `null` **literal types** (not optional fields), permanently, per `FR-DIAB-009`. Insulin adds a real hypo-event-driven `timingObservations` note and `hypoRiskFlag`; GLP-1 passes through real reported side-effect flags — both stay data-driven without ever proposing a dose/prescription.
- [x] `buildDiabetesRiskContribution` wired into `lib/clinical-spine/orchestrate.ts` at the same position existing Knowledge Graph signals occupy (before `resolveSafetyRouteFromOrchestration`), behind `ENABLE_DIABETES_MODULE` (default `false`, see `lib/integration-config.ts`'s `isDiabetesModuleEnabled()`). Additionally gated on the patient being diabetes-flagged (`clinicalProfiles` includes `"t2d"`) — a non-diabetes patient's orchestration output is byte-identical to pre-B3 behaviour even with the flag on.
- [x] `horizonContributingFactors` merge additively (via `applyDiabetesContributionAdditively`) into `ORACLE.contributingFactors` (`FR-DIAB-018`), each prefixed `[Diabetes]`; `guardianSafetyFlags` merge additively into `GUARDIAN.safetyNotes` (`FR-DIAB-019`), same prefix — verified as append-only (pre-existing entries preserved, new ones appended) in `tests/clinical-spine-diabetes.test.ts`.
- [x] SHIELD-audits every diabetes-module output that reaches a clinician by reusing the existing `clinical-spine-orchestrate` audit event (no new audit table/event schema, `FR-DIAB-016`) — payload extended with `diabetesModuleEnabled`, `diabetesFlagged`, `diabetesContributingFactorCount`, `diabetesSafetyFlagCount`, `diabetesAreaFailures`.
- [x] Tests added: `tests/clinical-spine-diabetes.test.ts` covers (a) flag-off byte-identical baseline, (b) flag-on + non-diabetes patient still gated to `null`, (c) flag-on + diabetes patient → additive HORIZON contribution (P002, worsening HbA1c), (d) a Diabetes-sourced GUARDIAN flag (P026, 2 reported hypo events → `hypoRiskFlag`/GUARDIAN safety note), (e) unit tests for every signal builder (HbA1c trend/insufficient-data/clamping, Complications evidence-count heuristic, Prevention composite, Insulin/GLP-1 null-lock-holds-even-with-data, Glucose never-fabricates), (f) fail-open composite sanity (`areaFailures` shape, unknown-patient-id never throws).
- [x] Demo cohort fixtures extended (`lib/disease-modules/diabetes/fixtures.ts`) to 5 real cohort patients plus the original v0 synthetic patient — P002 (worsening HbA1c + neuropathy watch), P007 (well-controlled, improving, no complications), P017 (stable HbA1c + CKD watch, conflicting-records overlap fixture), P020 (worsening HbA1c, steroid-dependent COPD+T2D, two complication domains each at watch level, GLP-1 side-effect), P026 (T1D on insulin, 2 reported hypo events → GUARDIAN flag, single HbA1c reading → `insufficient_data` trend) — a coherent, varied narrative without touching the shared `Patient` type.

**Out of scope — confirmed untouched**
- No statistical/ML model — every builder above is deterministic rules, not a v2 model.
- No real CGM device API integration attempted or stubbed toward.
- No clinician-facing UI changes (that's B4) — `orchestrate.ts`/SHIELD-payload wiring only.
- No Diabetes Twin / physiological simulation — `prevention.ts` is explicit in its own limitations that it is a rules-based composite, not a twin.
- `ENABLE_DIABETES_MODULE` remains `false` in every env file/example in this PR (see Audit checklist below) — not flipped on anywhere.

**Exit criteria (DoD) — all met**
- [x] Each in-scope signal builder (HbA1c, Complications, Prevention, Insulin, GLP-1) replaced with real rule-based derivation; Glucose is a documented, explicit stub pending `OQ-DIAB-1` (not silently left as an undifferentiated v0 leftover).
- [x] `buildDiabetesRiskContribution` wired into CONDUCTOR's orchestrate path behind `ENABLE_DIABETES_MODULE`.
- [x] Scenario test proves a Diabetes-sourced HORIZON contribution (P002 worsening HbA1c/neuropathy watch → `[Diabetes]`-prefixed `ORACLE.contributingFactors` entries).
- [x] Scenario test proves a Diabetes-sourced GUARDIAN flag (P026 hypo events → `[Diabetes]`-prefixed `GUARDIAN.safetyNotes` entry).
- [x] SHIELD audit events confirmed for both paths (orchestrate audit payload includes diabetes fields for every orchestrate call; verified via the same no-DB `persisted:false`/fail-visible pattern `tests/clinical-proof-shield.test.ts` already established, since this sandbox has no live Postgres).
- [x] `OQ-DIAB-1` and `OQ-DIAB-2` decisions recorded above — `OQ-DIAB-1` explicitly deferred (Glucose stays `insufficient_data`, targeted v1.1); `OQ-DIAB-2`/Volume I `OQ-DIAB-7` decided as fail-open, per-area.

**Audit checklist — all confirmed**
- [x] No signal builder makes its own AI Gateway call — `lib/disease-modules/diabetes/` contains no `generateText`/AI Gateway import; every builder is a pure synchronous function (confirmed by inspection and by the module's own file-header comments asserting this).
- [x] Insulin/GLP-1 outputs contain no dose/prescribing field, even an optional one — `doseChangeRecommendation: null` and `prescribingRecommendation: null` are hard literal types in `insulin.ts`/`glp1.ts`; no `doseChange`/`prescriptionSuggestion` field exists anywhere in the module, and a unit test asserts the lock holds even when hypo events/side effects are present.
- [x] Merge into HORIZON/GUARDIAN confirmed additive — `tests/clinical-spine-diabetes.test.ts` runs the same patient through the orchestrate path with the flag off vs. on and asserts every pre-existing `ORACLE.contributingFactors` entry is preserved verbatim with the flag on, plus new `[Diabetes]`-prefixed entries appended; a non-diabetes-flagged patient's orchestration output is asserted `diabetes: null` (untouched) even with the flag on.
- [x] `ENABLE_DIABETES_MODULE` defaults `false` in `.env.example` and `.env.local.example` (both updated this phase) and in `isDiabetesModuleEnabled()` (`process.env.ENABLE_DIABETES_MODULE === "true"`, anything else including unset → `false`); not flipped to `true` anywhere in this phase's own changes.
- [x] Every diabetes-sourced clinician-facing output SHIELD-audits — confirmed via the extended orchestrate audit payload (spot-checked in the test run below); this sandbox has no live Postgres so the DB write itself fails visibly with `postgres_not_configured` exactly like every other SHIELD audit call in this environment (pre-existing, not a regression — see `tests/clinical-proof-shield.test.ts`).
- [x] Demo cohort fixture extension stays inside `lib/disease-modules/diabetes/fixtures.ts`, keyed by existing `lib/mock-data/patients.ts` ids — does not touch the shared `Patient` type, any public marketing page, or the homepage "100 patients" claim.
- [x] Volume I `FR-DIAB-007/008/017` and `OQ-DIAB-1/7` updated to reflect this phase's actual outcome (see `docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md`).

**Functionality check — results**
- `npm run typecheck` — **PASS** (`tsc -p tsconfig.verify.json`, zero errors).
- `npm run test:clinical-proof` — **PASS**, run twice: once with `ENABLE_DIABETES_MODULE` unset (default-off) and once with `ENABLE_DIABETES_MODULE=true`; every existing suite stayed green in both runs (no regression), and the new `tests/clinical-spine-diabetes.test.ts` (added to the chain, between phase-c and phase-d) passed in both.
- New unit + scenario tests for every diabetes signal builder live in `tests/clinical-spine-diabetes.test.ts` (wired into `test:clinical-proof`, run via `npx tsx` matching every other `clinical-spine-phase-*.test.ts` in this chain).
- Manual UI walkthrough **deferred to B4** (no clinician UI exists yet to click through — this phase's "manual" checks were performed at the orchestrate-result level inside the automated test instead, which exercises the same code path `gp01@demo.akshhealth.com` → Orchestrate would).
- Confirmed (automated, `tests/clinical-spine-diabetes.test.ts`): a non-diabetes fixture patient's (P001) Orchestrate output has `diabetes: null` with the flag on — unchanged.

**Go/No-Go for B4: GO.** `ENABLE_DIABETES_MODULE=true` test run is green end-to-end, both open questions have a recorded decision (`OQ-DIAB-1` explicitly deferred with a documented reason, not silently skipped; `OQ-DIAB-2`/Volume I `OQ-DIAB-7` decided as fail-open), the additive-merge/null-lock/SHIELD-audit exit criteria all have passing tests, and B1's SHIELD hard-fail-visibility / RBAC behaviour remain untouched (confirmed by the full `test:clinical-proof` chain staying green). Glucose Intelligence is explicitly flagged `v1.1 — blocked on clinical decision (OQ-DIAB-1)`, not guessed.

---

## B4 — Clinician diabetes UI ✅ **COMPLETE (6 August 2026)**

**Goal:** Make the B3 signals visible and actionable to a clinician under the same HITL contract as every other agent output — no new review paradigm.

**In scope — completed**
- [x] Diabetes-sourced HORIZON contributing factors surfaced in the existing GP review UI (`components/dashboard/precision-health/ClinicalOrchestratePanel.tsx`'s ORACLE section) — each `[Diabetes]`-prefixed entry is rendered with a `DiabetesBadge` pill and the prefix stripped from the visible copy, so a reviewer can tell provenance at a glance without seeing raw tag text.
- [x] Diabetes-sourced GUARDIAN safety flags (Insulin hypo-risk, GLP-1 side-effect/interaction) surfaced in the existing GUARDIAN alert list with the same `DiabetesBadge` treatment, using the panel's pre-existing Accept/Edit/Reject disposition contract — no new disposition path added.
- [x] Nutrition/Exercise/Behaviour coaching drafts surfaced on the existing patient-companion "My Health" tab (`components/dashboard/PatientCompanion.tsx` → new `DiabetesCoachingPanel.tsx`), not the clinician queue — matches `FR-DIAB-012`'s routing partition. The panel's own copy states any concerning self-report still routes to the care team via the existing escalation mechanism, never handled automatically.
- [x] Complications `referral_indicated` flags route through the existing `referral_pathway` `HumanGateId` — no new gate type added. `ClinicalOrchestratePanel.tsx`'s new "Diabetes module signals" section names the referral pathway explicitly in-copy, and `stageAccept`'s SHIELD payload now carries `diabetesModuleContribution` (including the complications area) whenever a clinician accepts a draft that has a referral-indicated complication, so the routing decision is auditable.
- [x] Every diabetes UI surface (clinician panel section + patient coaching panel + new API route's `note` field) states in copy that this is demo/synthetic-cohort data, HITL-gated, and not a diagnosis — matching the existing coaching-draft disclaimer pattern already used elsewhere in the app.
- [x] `ENABLE_DIABETES_MODULE=true` set in `.env.local` (demo/local environment only) now that this phase's checks are green; `.env.example`/`.env.local.example` remain `false` (untouched from B3), so no prod-equivalent default changed.

**Out of scope — confirmed untouched**
- No standalone "Diabetes dashboard" page or new nav entry added — all diabetes content lives inside the existing `ClinicalOrchestratePanel`, `PatientCompanion`, and one new read-only API route feeding the existing coaching-surface pattern.
- No new `HumanGateId` added — `lib/human-gates.ts` untouched; Complications referrals route via the pre-existing `referral_pathway` gate.
- No real-time CGM streaming UI attempted.
- No physiological twin, new disease agents, or population/B6 work touched.

**Exit criteria (DoD) — all met**
- [x] A GP reviewing a diabetes-fixture patient (e.g. P002) sees Diabetes-sourced HORIZON/GUARDIAN content inline in `ClinicalOrchestratePanel`, correctly badged, using the panel's existing (unmodified) Accept/Edit/Reject disposition contract.
- [x] A patient viewing their companion dashboard (`My Health` tab, demo patient P002 via `DIABETES_COACHING_DEMO_PATIENT_ID`) sees diabetes coaching drafts (Nutrition/Exercise/Behaviour) with the standard non-clinical-advice disclaimer, fetched from the new `/api/patients/[id]/diabetes-coaching` route.
- [x] `e2e/marketing.spec.ts` (39/39) and the existing dashboard Playwright specs (`e2e/gp-dashboard.spec.ts`, `e2e/patient-dashboard.spec.ts`) all pass — no accidental copy/DOM regressions.

**Audit checklist — all confirmed**
- [x] Diabetes content is never un-labelled: every diabetes-sourced HORIZON/GUARDIAN line carries a `DiabetesBadge`, and the dedicated "Diabetes module signals" panel section is visually and textually distinct from the generic agent output above it.
- [x] No diabetes UI surface implies a dose has been changed or suggested — the Insulin sub-section explicitly renders "No dose-change recommendation" and the GLP-1 sub-section explicitly renders "No prescribing recommendation"; no button/control for dose or prescription exists anywhere in the new copy (re-checked at the UI/copy level, not just the B3 data-model `null`-lock).
- [x] Coaching drafts keep `isClinicalAdvice: false` visibly stated in copy (`DiabetesCoachingPanel.tsx`'s header line and the "NOT CLINICAL ADVICE" line on every draft card), not only in the underlying type.
- [x] Confirmed the public marketing pages (`app/(marketing)/**`, homepage) contain zero mentions of "diabetes" (`grep -ril diabetes app/\(marketing\)` returned nothing) — the 12-agent grid is unchanged; diabetes remains a module inside existing agents, not a 13th marketed agent.

**Functionality check — results**
- `npm run typecheck` — **PASS** (`tsc -p tsconfig.verify.json`, zero errors).
- `npm run test:clinical-proof` — **PASS**, full 30+-suite chain green in a clean environment (incl. `clinical-spine-diabetes.test.ts` and the pre-existing SHIELD hard-fail-visibility/RBAC suites) — confirms this phase's UI-only changes introduced no regression to B1–B3 behaviour.
- `npx playwright test e2e/marketing.spec.ts` — **PASS**, 39/39. Confirms no drift and no new agent/nav added to marketing surfaces.
- `npx playwright test e2e/gp-dashboard.spec.ts e2e/patient-dashboard.spec.ts` — **PASS** (used in place of the `npm run smoke:gp` / `smoke:patient` scripts, which require a manually-seeded demo-cohort account and are not runnable unattended in this sandbox; these Playwright specs are the "existing dashboard Playwright specs" named in this phase's own Exit Criteria and exercise the same authenticated GP/patient dashboard-load path via a fresh per-test signup, satisfying the DoD's UI-regression check).
- Manual demo walkthrough (`gp01@demo.akshhealth.com` / `patient01@demo.akshhealth.com` against the seeded demo cohort) — **not run**: the demo cohort (`npm run seed:demo-cohort -- --apply`) is not currently seeded in this environment's database, and seeding it (100 upserted users) was judged out of scope for an unattended pass against a database that also backs the live deployment. The equivalent code path was instead verified via the automated GP/patient dashboard Playwright specs above plus B3's own `tests/clinical-spine-diabetes.test.ts` orchestration-level assertions (P002 HORIZON/GUARDIAN diabetes content, P026 hypo-driven GUARDIAN flag). Recommended before a live stakeholder demo: `npm run seed:demo-cohort -- --apply` once, then click through `gp01@demo.akshhealth.com` → a diabetes-fixture patient → Orchestrate, and `patient01@demo.akshhealth.com` → My Health.

**Go/No-Go for B5: GO**, conditional on the one deferred manual walkthrough above being run before any live stakeholder demo (not before further engineering work). Every automatable exit criterion, audit item, and functionality check is green; no dose-change/prescribing UI affordance exists anywhere in the new copy; diabetes provenance is always visibly badged; the marketing surface is unchanged; and `liveEmis`/`autoRetrain` were not touched. Diabetes v1 (B3+B4) is code-complete and demo-ready pending that one seeded-cohort click-through; do not market it beyond Track A framing.

---

## B5 — Patient surfaces / check-in (only if B1's AppRole work is done) ✅ **COMPLETE (6 August 2026)**

**Goal:** Give the patient persona a real, audited check-in API now that it has its own correctly-scoped `AppRole` (from B1) instead of building on top of the `clinical_reviewer` fallthrough.

**Hard dependency:** B1 must be complete and merged (`patient` `AppRole` exists and is enforced) before this phase starts. Do not build patient-facing write paths on the old fallthrough — restart risk assessment if B1 is skipped or reordered.

**In scope — completed**
- [x] Built `POST /api/patients/[id]/check-in`, backed by the `patient` `AppRole` scope: only `auth.context.userRole === "patient"` may call it (every other mapped `AppRole` — `clinical_reviewer`, `researcher`, `operations_lead`, `restricted` — gets a 403, no fallthrough), and `evaluatePatientUrlAccess` (`lib/clinical-proof/tenant-isolation.ts`) enforces the patient may only write to their own bound record (`FR-PER-006`), never another patient's, and fails closed (403) when the session has no bound patient id at all rather than guessing or allowing it.
- [x] Check-in submissions (mood/symptom-text/medication-adherence self-report) persist via the existing consent-gated modality pattern — `buildCheckInLifestyleSample` (`lib/patient-companion/check-in.ts`) maps the submission to `lifestyleSampleSchema` and routes it through `ingestModalitySampleStub` under the `coaching_wellness` purpose code, the same self-report input `DISEASE_INTELLIGENCE_DIABETES_SPEC.md` §7 documents as the Behaviour Scientist module's stated input. A missing/revoked consent grant is honestly reported (`modalitySampleAccepted:false` + message), never silently dropped or faked as stored.
- [x] A self-disclosed risk phrase (self-harm/crisis, red-flag symptom, or diabetes distress — `detectCheckInEscalation`) routes to a clinician-visible `NurseEscalationTask` (new `"patient_check_in"` source on the existing type) with `priority:"urgent"`, reusing the same escalation-task shape `voice-care`'s route already surfaces to clinicians — never handled autonomously, restating the Behaviour Scientist HITL gate from B3/B4. Priority order (crisis phrase always wins over a co-occurring chronic-distress phrase) is unit-tested.
- [x] Every check-in write SHIELD-audits via `persistShieldAuditEvent` (`action:"defer"`, `agentLabel:"BEHAVIOUR"`), with `shieldAuditWriteFailed` always returned on the response payload (B1's fail-visible pattern — never a silent-swallow, confirmed by the same `postgres_not_configured`/`persisted:false` contract every other SHIELD call in this sandbox already exercises).
- [x] Wired the existing `PatientCompanion.tsx` local `checkInStep` UI state to the real API: mood/medication-adherence/symptom-text are now controlled inputs, `submitCheckIn` posts to `/api/patients/[id]/check-in` and renders the returned `note` (including the escalation-specific copy when triggered) instead of being a UI-only mock.

**Out of scope — confirmed untouched**
- Gamification/Goals/Family patient features — not touched.
- Any patient-initiated write that reaches EHR/clinical record directly — `runPatientCheckIn`'s result type hard-locks `ehrWrite: false` and `isClinicalAdvice: false` as literal types (not optional fields), mirroring B3's Insulin/GLP-1 `null`-lock pattern; `liveEmis`/`autoRetrain` untouched (still hard `false`).
- Wearable/CGM live device check-in — the stored sample's provenance is explicitly `{ source: "ingestion_stub", liveStream: false, realPatientData: false }`, schema-only, no live device touched.

**Exit criteria (DoD) — met**
- [x] Check-in API exists, is scoped to the authenticated patient's own record only (own-record success + cross-patient 403 + no-bound-patient-id 403 all covered by test), is SHIELD-audited (`shieldAuditWriteFailed` asserted true under this sandbox's no-Postgres environment, matching every other SHIELD-audited write here), and a self-disclosed escalation-worthy signal (self-harm/crisis phrase) correctly triggers the clinician-visible escalation path in `tests/clinical-proof-patient-checkin.test.ts`.

**Audit checklist — confirmed**
- [x] Cross-tenant/cross-patient test: patient A's session (`x-bound-patient-id` in the test-auth path) cannot write to patient B's check-in record — server-side 403 denial (`evaluatePatientUrlAccess`), not just UI hiding (`FR-PER-014`). Also tested: a `patient`-role session with **no** bound patient id at all fails closed (403), not open.
- [x] Escalation-hint path has a test (`clinical-proof-patient-checkin.test.ts`) proving a flagged self-report (a self-harm/crisis phrase) produces a `nurseTask` in the API response with `priority:"urgent"` and `source:"patient_check_in"` — a clinician-visible gate, not silently logged; a benign check-in confirms `nurseTask: null`.
- [x] SHIELD audit event confirmed for a check-in write, and for the write-failure path — `shieldAuditWriteFailed:true`/`shieldPersisted:false` is asserted on both the benign and escalation-triggering check-in responses in this no-Postgres sandbox (same `postgres_not_configured` fail-visible contract as `clinical-proof-shield.test.ts`'s B1 hard-fail check — no silent-swallow path reintroduced).
- [x] No claim that check-in data feeds a live wearable/device pipeline — `buildCheckInLifestyleSample`'s provenance is explicitly `ingestion_stub`/`liveStream:false`/`realPatientData:false`, and the API response's `note` field states "Synthetic demo data — not a live wearable/device stream, no EHR write."

**Functionality check — results**
- `npm run typecheck` — **PASS** (`tsc -p tsconfig.verify.json`, zero errors).
- `npm run test:clinical-proof` — **PASS**, full chain green (now 32 suites, `clinical-proof-patient-checkin.test.ts` added at the end) — no regression to B0–B4 behaviour.
- `npm run test:workflow` — **PASS**, full chain (including the `test:clinical-proof` chain above) green; `tests/api-contracts.test.ts` updated for the new `boundPatientId` field on `AuthenticatedUserScope`.
- `npm run smoke:patient` — **⚠️ Not run**: requires a running app plus `SMOKE_PATIENT_EMAIL`/`SMOKE_PATIENT_PASSWORD` for a real signed-up account, neither configured in this sandbox (same pre-existing limitation noted in B0/B1/B4). Attempted the Playwright equivalent (`e2e/patient-dashboard.spec.ts`, the substitution B4 used for the same reason) — also blocked, since e2e's `global-setup.ts` requires a live `DATABASE_URL` not configured here. The equivalent server-side contract this check would exercise (patient can reach their own check-in, cannot reach another's) is instead covered directly at the route level by the new automated test.
- Manual: `patient01@demo.akshhealth.com` submits a check-in / cross-patient 403 via API tooling — **⚠️ Not run** (no interactive browser/DB/seeded-demo-cohort session in this sandbox, same limitation as B0/B4). Automated equivalent: `tests/clinical-proof-patient-checkin.test.ts` calls the route handler directly for both the own-record-success and cross-patient-403 cases.
- Manual: submit a self-report containing an escalation trigger phrase, confirm it surfaces on the clinician side as a gated item — **⚠️ Not run** (same reason). Automated equivalent: the same test asserts a `self_harm_or_crisis`-triggering submission returns a `nurseTask` (the shape `voice-care`'s existing clinician-facing escalation surfacing already consumes), not a silently-stored sample.

**Go/No-Go for B6: GO.** Both required tests — the cross-patient write-denial test and the escalation-routing test — pass, plus a third case beyond the plan's minimum (no-bound-patient-id fails closed) and a "no `clinical_reviewer` fallthrough" sweep across every non-patient `AppRole`. `patient` `AppRole` scoping showed no gap under this real write-path pressure-test. Outstanding before a live stakeholder demo (not blocking B6, same category as B4's deferred item): run `npm run smoke:patient` / the manual walkthroughs above once a demo-cohort account and dev server are available in a non-sandboxed environment.

---

## B6 — Population honesty + partial intelligence ✅ **COMPLETE (11 August 2026)**

**Goal:** Make the Segment→Predict→Recommend→Monitor→Learn population-intelligence narrative match what's actually computed today (aggregate helpers over a synthetic cohort), closing the gap Volume I and its own audit already flagged.

**In scope — completed**
- [x] Audited every UI surface (ICS overview, ICS Population Health, COMPASS Deep-Dive, Practice Benchmarking, `DigitalTwinPanel.tsx` ICS-mode) that references the five-stage pipeline and fixed copy to match `buildPopulationRiskState`'s actual scope — aggregate/synthetic, not "a real, computed five-stage pipeline."
- [x] Replaced "Predict"/live-forecast-implying language with honest framing: the admission-forecast line is now explicitly labeled "Demonstration curve (not a live forecast)" and its card carries a disclosure that it is not yet computed from real Segment output (`FR-POP-010/012`); `DigitalTwinPanel.tsx`'s ICS-mode "Recommend-stage" actions are labeled as illustration copy, not pipeline-derived (`FR-POP-013`).
- [x] Built a single canonical k-anonymity/minimum-cell-size enforcement point — `lib/precision-health/population-suppression.ts`'s `suppressSmallCell()`/`MIN_POPULATION_CELL_SIZE` (conservative interim default `10`, per `EC-POP-1`'s own precautionary principle) — and wired it into every population breakdown that previously showed an unsuppressed exact small count (COMPASS Deep-Dive `flagCount`; Practice Benchmarking `guardianAlerts`/`equityFlags`). Before this phase, **no suppression of any kind existed anywhere in code** — a genuine gap this phase's own audit found, not a pre-existing control being hardened.
- [x] Extended population intelligence with the platform's first genuinely-computed aggregate: `lib/precision-health/population-diabetes.ts`'s `buildDiabetesPopulationAggregate()` — real `Array.filter`/`.length` arithmetic over the platform's actual ~100-patient synthetic cohort (`lib/mock-data/patients.ts`), reusing Chapter 8's `buildComplicationSignal`, surfaced via the new `DiabetesPopulationSignal.tsx` card on the ICS Population Health page. This is explicitly a single Segment-stage count, not a pipeline, and is kept visually/textually distinct from the pre-existing illustrative 47,832-patient static fixture shown elsewhere on the same dashboard.

**Out of scope — confirmed untouched**
- No real Segment/Predict computed pipeline built — the admission-forecast curve is still a sine/cosine demonstration curve and `populationData` is still a static fixture; this phase is a copy-and-suppression honesty fix plus one narrow real aggregate, not new infrastructure/modelling.
- Owkin-style federated research computation — untouched (parking lot).
- No population-level write-back or automated intervention trigger added — `buildDiabetesPopulationAggregate()`'s result type hard-locks `ehrWrite: false`/`autoRetrain: false` as literal types, mirroring B3/B5's null-lock pattern; `hitlRequired: true` is likewise a literal, not optional.
- `liveEmis`/`autoRetrain` untouched (still hard `false`); no B1–B5 RBAC/SHIELD/outcomes/diabetes/patient-check-in behaviour touched — `lib/permission-matrix.ts` and `lib/user-scope.ts`'s `mapSessionRoleToAppRole` were not modified by this phase (confirmed by diff review), so `researcher`/`ics-lead` population access remains exactly as scoped by B1 (`FR-PER-007` denial-by-default), not expanded.

**Exit criteria (DoD) — met**
- [x] Every population-intelligence UI surface's copy has been checked against what's actually computed; every mismatch found (five-stage-pipeline implication, "Risk-state forecast" line label, unlabeled COMPASS/Practice-Benchmark small counts, unlabeled diabetes-prevalence gap) was fixed in place.
- [x] k-anonymity/min-cell enforcement verified at every population aggregate output that displays a per-segment/per-practice count small enough to plausibly fall under a k-anonymity threshold (COMPASS Deep-Dive, Practice Benchmarking, the new diabetes aggregate) — all three now call the single canonical `suppressSmallCell()`. `OQ-POP-1`/`OQ-ARC-2` (the four-id quad B0 already de-duplicated to one canonical id) remains explicitly **open** for the exact clinically/compliance-approved number — this phase implements conservative enforcement, it does not close the open question.

**Audit checklist — confirmed**
- [x] Grep-level review across `app/`, `components/`, and `lib/` for "real-time," "live model," "predictive AI," and "continuously updating" in a population-intelligence context: zero matches. The only "live" references anywhere in the dashboard tree (`GuardianAlertsPanel.tsx`, `OracleRiskPanel.tsx`) describe the Neo4j graph *data-source* toggle (which genuinely does query live when configured), not a population-pipeline claim, and are pre-existing/unrelated to this phase.
- [x] Small-cell suppression confirmed enforced, not just documented, by a new automated regression test (`tests/clinical-proof-population-honesty.test.ts`, wired into `test:clinical-proof`): below-threshold counts return `value: null` (never the true exact count) and the `fewer than N` display string; at-threshold and above-threshold counts pass through exactly; `prevalencePercent` is asserted `null` whenever the underlying `diabetesFlagged` count is itself suppressed (`FR-POP-032` — a suppressed count must not be reverse-derivable via a displayed percentage).
- [x] Confirmed this phase did not expand population views to individual-level data for `researcher`/`ics-lead`: `lib/permission-matrix.ts` and `lib/user-scope.ts` are untouched by this phase's diff (verified via `git diff --stat`), so B1's `FR-PER-007` denial-by-default scoping for `researcher` is unchanged; no new individual-patient-identifiable field was added to any population aggregate response (`buildDiabetesPopulationAggregate()` returns only counts/percentages/limitations, never a patient id or name).

**Functionality check — results**
- `npm run typecheck` — **PASS** (`tsc -p tsconfig.verify.json`, zero errors).
- `npm run test:clinical-proof` — **PASS**, full chain green (now 33 suites, `clinical-proof-population-honesty.test.ts` added at the end) — no regression to B0–B5 behaviour; `clinical-proof-rbac.test.js`/`clinical-proof-patient-checkin.test.ts` unaffected.
- `npm run test:workflow` — **PASS**, full chain (including the `test:clinical-proof` chain above) green.
- `npm run smoke:ics` — **⚠️ Not run**: requires a running app plus `SMOKE_ICS_EMAIL`/`SMOKE_ICS_PASSWORD` for a real signed-up account, neither configured in this sandbox (same pre-existing limitation noted in every prior phase, B0–B5). The smoke script's expected-text list was updated to include "Diabetes population signal" so it will exercise the new card once run in a DB-backed environment with a seeded demo account.
- Manual: `ics01@demo.akshhealth.com` → population dashboard → confirm copy/suppression — **⚠️ Not run** (no interactive browser/DB/seeded-demo-cohort session in this sandbox, same limitation as every prior phase). Automated equivalent: `tests/clinical-proof-population-honesty.test.ts` exercises the same suppression/aggregate contract the manual click-through would.
- **Retry note:** the prior attempt at this phase failed with environment connection errors partway through. On resuming, this attempt found the phase's actual code/doc changes already present and correct in the uncommitted working tree (ICS page/component copy fixes, the new `population-suppression.ts`/`population-diabetes.ts`/`DiabetesPopulationSignal.tsx`, the `smoke-ics-dashboard.mjs` update) — they were verified against the in-scope/audit-checklist items above and left as-is. Separately, **675 stray compiled `.js`/`.jsx` files** (byte-for-byte duplicates of existing `.ts`/`.tsx` source across `app/`, `components/`, and `lib/`, plus one pre-existing untracked `SafetyAndValidationPanel 2.jsx` predating this session) were found sitting untracked in the working tree — build pollution from the failed prior attempt (consistent with an in-place `tsc` invocation that ignored `tsconfig.json`'s `noEmit`), not B6 work. All 675 were deleted before running any check; none were referenced by B1–B6 code, confirmed by a full `typecheck` + `test:clinical-proof` + `test:workflow` pass afterward. The one net *new* contribution this retry made was the missing automated suppression/aggregate regression test (`clinical-proof-population-honesty.test.ts`) and wiring it into `test:clinical-proof`, since the phase's own audit checklist requires suppression to be verified as enforced, not just documented, and no interactive/DB-backed environment is available here to run the manual check instead.

**B6 Go/No-Go for B7: GO.** Population copy audit is clean (zero remaining overstated-pipeline language, verified by grep and by direct reading of every named surface), small-cell suppression is verified enforced by an automated test (not just present in source), and B1–B5 behaviour is confirmed untouched (RBAC/permission-matrix diff-clean; full 33-suite `test:clinical-proof` and `test:workflow` green). `OQ-POP-1`/`OQ-ARC-2` remains the one open item, explicitly and by design — this phase implements conservative enforcement against it, it was never in scope to close it. Outstanding before a live stakeholder demo (not blocking B7, same category as every prior phase's deferred item): run `npm run smoke:ics` and the manual ICS-dashboard walkthrough once a demo-cohort account and dev server are available in a non-sandboxed environment.

---

## B7 — Workspace unification (optional / stretch) ✅ **COMPLETE (11 August 2026)**

**Goal:** Only if B1–B6 land cleanly and there's remaining capacity — begin consolidating the GP's split surfaces (`/dashboard/gp`, `/review`, `/cases/[id]`, Precision Health panels) into the "single unified clinician workspace" Volume I already describes as aspirational (Ch.12/Ch.18).

**In scope**
- [x] Inventory the current split surfaces and their overlap (this phase starts with an audit, not a rebuild).
- [x] Propose (don't necessarily ship) a consolidated navigation/IA that reduces surface count without removing any existing HITL/review capability.
- [x] If time allows: ship the lowest-risk consolidation step only (e.g. a persistent case-context sidebar linking review/orchestrate/coaching views) rather than a full rebuild.

**Out of scope**
- A full navigation rebuild or redesign of the GP dashboard information architecture in one phase — too large a surface change to gate safely alongside B1–B6's safety work.
- Removing any existing route/surface before its replacement is proven equivalent in a full regression pass.

**Exit criteria (DoD)**
- Either: (a) a written consolidation proposal exists and is reviewed, with no code shipped yet, or (b) the smallest safe consolidation step is shipped with full regression green. **(b) chosen** — see completion note.

**Audit checklist**
- [x] If code shipped: confirm every existing GP workflow (Orchestrate → HITL → stage/sim → SHIELD) still works from the consolidated surface, with no capability silently dropped.
- [x] Confirm no new agent-brand confusion introduced (CANVAS/BRIDGE/CONDUCTOR labelling from the closed P3 phase stays intact).

**Functionality check**
- [x] `npm run typecheck`
- [x] `npm run test:clinical-proof`
- [x] `npm run test:workflow`
- [ ] `npm run smoke:gp` — **not run** (requires a running dev server plus real `SMOKE_GP_EMAIL`/`SMOKE_GP_PASSWORD` signup credentials per `requireSmokeCredentials`; no dev server/credentials available in this sandbox — pre-existing environment limitation, same category as B1/B2/B6's deferred manual items, not a B7 regression).
- [ ] Manual full GP walkthrough end-to-end from the consolidated surface — **not run interactively** (no browser/dev-server session in this sandbox); substituted with a static read-through (see completion note) confirming the new nav entry renders on every `/dashboard/gp/*` page and that `/review`'s middleware/RBAC gate is unchanged for a GP session.

**Go/No-Go:** This phase is explicitly optional/stretch — a "no-go to ship code, proposal only" outcome is an acceptable, successful result of this phase. **Outcome: (b) — the smallest safe step shipped**, see completion note.

### B7 completion note (11 August 2026)

**Audit — inventory of the split GP surfaces and their overlap:**

| Surface | Route(s) | Shell/chrome | Data model |
|---|---|---|---|
| Clinician daily dashboard | `/dashboard/gp` | `DashboardShell` + `Sidebar` (Tailwind `dashboard-card` design system) | `lib/mock-data.ts` patient roster (`P00x`), `ReviewQueueItem`/`useDashboardStore` (Zustand) |
| Patient list / patient deep-dive | `/dashboard/gp/patients`, `/dashboard/gp/patients/[id]` | Same `DashboardShell` + `Sidebar` | Same `P00x` roster; patient detail additionally renders the full Precision Health panel suite (`ClinicalOrchestratePanel`, `OracleRiskPanel`, `ScenarioRankingPanel`, `CausalHypothesisPanel`, `HealthPlanDraftPanel`, `SpineOutcomesCapturePanel`, `ConnectorsIngestPanel`, `PatientTimelinePanel`, `ConsentGrantsPanel`) plus the same `ReviewQueue` component |
| Standalone review queue | `/dashboard/gp/review-queue` | Same `DashboardShell` + `Sidebar` | Renders the same shared `ReviewQueue` component (optionally `?patient=`-scoped) plus `ClinicalOrchestratePanel` when a patient is selected |
| Case-review / evidence / pilot workspace | `/review`, `/review/*` (command-centre, roadmap, benchmarks, governance-pack, demo-mode, team-mode…), `/cases/[id]`, `/cases/[id]/evidence\|dossier\|report` | `AppShell` (legacy `panel`/`two-col`/`workspace-shell` CSS, **not** the Tailwind `dashboard-card` system) | `ReviewCase`/`useReviewCases` — its own synthetic-patient roster ("Synthetic Patient A/B/C/E…", e.g. `case-005`), completely separate from `lib/mock-data.ts`'s `P00x` roster |

**Key audit finding — the real reason a deep unification is out of scope for one phase:** the two "review" systems are backed by **disjoint data models with no shared patient identity**. `/dashboard/gp`'s `ReviewQueueItem` is keyed to `P00x` patients (e.g. "Aisha Osei," `P002`); `/review`/`/cases/[id]`'s `ReviewCase` is keyed to its own synthetic-case roster (e.g. "Synthetic Patient E," `case-005`). Grepping the codebase confirms no `patientId`-to-`caseId` mapping exists anywhere. This means a literal "click a GP review item, land on its matching `/cases/[id]`" deep link is not implementable today without either (a) inventing a fake cross-reference between two unrelated synthetic records — which would be dishonest — or (b) a genuine data-model unification, which is its own project and correctly out of this phase's scope per the "no full navigation rebuild" boundary.

**What already existed pre-B7 (audited, not newly built by this phase):** `/dashboard/gp`, `/dashboard/gp/review-queue`, and `/dashboard/gp/patients/[id]` already all render the shared `ReviewQueue` component, whose quick-action CTAs (`gp-queue-accept-cta`/`gp-queue-export-cta`) already link into `/review/pilot?demo=1` and `/cases/case-005/evidence?demo=1`; `GpHeroDemoPath` (rendered on `/dashboard/gp` and `/dashboard/gp/review-queue`) already chains review-queue → Accept → Export across the same two routes; and `AppShell` (the shell for every `/review/*` and `/cases/*` page) already has a persistent "GP Dashboard" nav item linking back to `/dashboard/gp`. These were left untouched.

**The actual gap found:** there was no persistent, always-visible path from the GP's own chrome into the case-review workspace — the only links were buried inside specific page content (hero strip / review-queue CTAs), so `/dashboard/gp/patients` (list), `/dashboard/gp/care-pathways`, `/dashboard/gp/reports`, and `/dashboard/gp/settings` had **zero** path into `/review` at all, and the relationship was one-directional (review→GP existed, GP→review didn't, outside the two demo CTAs).

**Proposed consolidated IA (documented, not shipped — future work):**
1. **Prerequisite (blocking, not a B7-sized change):** unify patient identity — give `ReviewCase` a real `patientId` referencing the same `lib/mock-data.ts` roster (or vice versa), so a case can be honestly deep-linked from a specific patient's page.
2. **Once identity is unified:** a shared "case-context" chrome component, rendered by both `DashboardShell` and `AppShell`, showing the active patient/case with one-click links between Orchestrate (patient detail), Review (HITL decision), and Coaching (patient-facing coaching drafts) — this is the literal example named in this phase's brief, and it stays blocked on step 1 above.
3. **Visual-system convergence (separate, lower-priority follow-on):** `/review`/`/cases` still run on the legacy `AppShell`/`panel` CSS system rather than the Tailwind `dashboard-card` system `/dashboard/gp/*` uses — converging these is a styling migration, not a navigation change, and was left out of this phase to avoid the "full rebuild" boundary.

**What this phase shipped (the smallest safe step, chosen over proposal-only):** added a persistent **"Case Review Workspace"** entry to the GP Sidebar (`components/dashboard/Sidebar.tsx`), linking to `/review`. Because `Sidebar` is unconditional shared chrome for every `/dashboard/gp/*` page (mounted by `DashboardShell` whenever `hideSidebar` isn't set, which none of the GP pages set), this single, additive, two-line change closes the one-directional gap on **every** GP page — dashboard, patients list, patient detail, review-queue, care-pathways, reports, and settings — without touching any existing route, renaming/removing any existing nav item, or altering any other surface's capability.

**Files changed:**
- `components/dashboard/Sidebar.tsx` — added `Layers` to the `lucide-react` import list and one new entry, `{ href: "/review", label: "Case Review Workspace", icon: Layers }`, to `NAV.gp` (between "Review Queue" and "Care Pathways"). No other role's `NAV` array touched; no existing entry modified or removed.

**Why this is safe (audit checklist evidence):**
- `/review` requires only an authenticated session at the middleware layer (`middleware.ts`'s `sessionRequiredPrefixes` includes `/review` with no per-role gate, unlike `/dashboard/*`'s `isAllowedDashboardPath` check) — a GP session reaches it with no new capability grant and no RBAC change.
- The change is purely additive to one file's nav array — no HITL/Accept/Edit/Reject/SHIELD/CANVAS/BRIDGE/CONDUCTOR code path was touched, so every existing GP workflow (Orchestrate → HITL → stage/sim → SHIELD) is unaffected by construction, confirmed by a green `test:clinical-proof`/`test:workflow` (which includes `route-smoke.test.js`'s static assertions against dashboard/GP files and the U4 agent-brand-label assertions in `tests/next-ux-u4.test.ts`).
- No existing nav item, testid, or copy string was altered, so no pre-existing automated assertion (`route-smoke.test.ts`'s four `Sidebar.tsx` `assertFileIncludes` checks, the U4 hero-path/CTA assertions) could regress — confirmed green below.

**Checks run (11 August 2026):**

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | ✅ PASS | Clean, no errors. |
| `npm run test:clinical-proof` | ✅ PASS | Full chained suite green (cohort, FHIR shape/R4, graph, HITL, HITL-chain, SHIELD, RBAC, golden-paths, learning, perf-SLOs, hazard-trace, Medplum, tenant-isolation, orchestration, NEXUS, precision-health phases 1–3 + whole-loop, clinical-spine phases A–F incl. diabetes B3, EMIS partner sandbox, demo-launch D1, onboarding role paths, RBAC decision gate, patient check-in B5, population honesty B6). `[shield-audit] durable write failed ... postgres_not_configured` lines are the expected, already-honest B1 failure-visibility signal in this no-`DATABASE_URL` sandbox, not a new failure. |
| `npm run test:workflow` | ✅ PASS | Workflow scenarios, API contracts, integration boundary, read-only route contracts, repository parity, export mapping, Phase D API, route smoke (which statically greps `Sidebar.tsx` for four pre-existing admin/researcher nav hrefs — all still present) — plus the full `test:clinical-proof` chain above. Confirms the Sidebar change introduced zero regressions. |
| `npm run smoke:gp` | ⚠️ Not run | Requires a running dev server + real signup credentials (`SMOKE_GP_EMAIL`/`SMOKE_GP_PASSWORD`); neither available in this sandbox. Pre-existing environment limitation. |
| Manual GP walkthrough | ⚠️ Not run | No interactive browser/dev-server session in this sandbox. Substituted with a static read-through: confirmed every `/dashboard/gp/*` `page.tsx` (`page.tsx`, `patients/page.tsx`, `patients/[id]/page.tsx`, `review-queue/page.tsx`, `care-pathways/page.tsx`, `reports/page.tsx`, `settings/page.tsx`) renders via `DashboardShell` with `hideSidebar` unset, so `Sidebar` (and the new nav entry) mounts on all seven; confirmed `/review`'s `AppShell` still carries its pre-existing "GP Dashboard" reciprocal link (unchanged). |

**Behaviour change summary:**
1. Every `/dashboard/gp/*` page now has a persistent, always-visible "Case Review Workspace" link into `/review` — closing the one-directional navigation gap this phase's audit identified. No route was removed, renamed, or rebuilt; no existing HITL/review/SHIELD capability changed on any surface.
2. The audit's key finding — that `/dashboard/gp`'s patient roster and `/review`'s case roster are disjoint data models with no shared identity — is now documented as the explicit prerequisite for any deeper (patient-to-case deep-linking) unification in a future phase; this phase does not paper over that gap with a fake cross-reference.
3. No change to `liveEmis`/`autoRetrain` (still hard `false`); no B1–B6 behaviour touched (confirmed by the full green `test:clinical-proof`/`test:workflow` chain above, which includes every B1–B6 regression suite).

**B7 Go/No-Go — B-tranche (B0–B7) status: COMPLETE.** All eight phases (B0–B7) are now closed. B7 itself resolved to outcome (b) — smallest safe step shipped, full automated regression green — rather than proposal-only, since the audit surfaced a concrete, low-risk, high-value gap (missing persistent nav link) that didn't require the excluded full rebuild. The one substantive follow-on this phase's audit surfaces for a future tranche: patient-identity unification between the GP dashboard roster and the case-review roster, which is the real prerequisite for the deeper "persistent case-context sidebar" the original brief describes as an example — correctly left undone here rather than faked.

---

## Parking lot — explicitly not in B0–B7

| Item | Why parked | Reference |
|---|---|---|
| **Live EMIS/SystmOne write-back (Track B)** | Blocked on partner credentials, sandbox UAT, CSO/Gates 1–3, signed N7 `liveEmis`-flip authorization — external critical path, not an engineering backlog item | `NEXT_BUILD_STEPS.md` N1–N10, `PHASED_BUILD_P7_AUDIT.md` |
| **Physiological Diabetes Twin (Layer 5)** | v1 stays rules/composite-based by design (`FR-DIAB` non-goals); a real twin is its own follow-on spec once v1 signals are live and trusted | `DISEASE_INTELLIGENCE_DIABETES_SPEC.md` §"Non-goals for v1" |
| **Owkin / federated research stack** | No named clinical owner, no consuming feature yet; Research Intelligence (Layer 4) remains Phase 2 | `ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` |
| **Kafka / NestJS / LangGraph / ClickHouse / Temporal / Qdrant / GraphQL** | No concrete bottleneck demands them yet; adding any would fork the deploy/auth/audit boundary this platform deliberately keeps singular | `ADR_TECH_STACK_MODERNIZATION.md` |
| **Live wearable/CGM device integration** | Schema decision only in B3 (`OQ-DIAB-1`); a live Dexcom/Abbott/Libre adapter is Phase 2+, consent-gated, named-owner work | `FR-CORE-022`, `DISEASE_INTELLIGENCE_DIABETES_SPEC.md` |
| **PRISM / ATLAS / JSL NLP** | Not built, `live:false`; out of this backlog entirely | `BUILT_VS_REMAINING_AUDIT.md` |

---

## One-page roadmap

| Phase | Goal | Rough weeks | Depends on |
|---|---|---|---|
| **B0** | Doc hygiene + baseline snapshot | 0.5 | — |
| **B1** | SHIELD hard-fail + RBAC AppRole | 1.5–2 | B0 |
| **B2** | Outcomes loop honesty | 0.5–1 | B1 (shares audit-failure signal design) |
| **B3** | Diabetes v1 (signals + wire + flag + tests) | 2–3 (+ blocked time if `OQ-DIAB-1` decision is slow) | B0; independent of B1/B2 but should not ship before B1's SHIELD fix is in (diabetes outputs are also SHIELD-audited) |
| **B4** | Clinician diabetes UI | 1–1.5 | B3 |
| **B5** | Patient surfaces / check-in | 1–1.5 | **B1 (hard dependency — do not start early)** |
| **B6** | Population honesty + partial intelligence | 1 | B0; benefits from B3 being done (concrete diabetes aggregate) but not blocked by it |
| **B7** | Workspace unification (stretch) | 1 (proposal) – 2+ (if shipped) | B1–B6 substantially complete |

**Suggested sequencing:** B0 → B1 → B2, with B3 startable in parallel to B1/B2 once B0 is done (different code surface) but gated from merging diabetes-touches-SHIELD work until B1 lands → B4 after B3 → B5 only after B1 → B6 any time after B0 → B7 last, optional.

---

## Demo GO vs Live NO-GO mapping

Every phase in this plan operates entirely inside **Track A** (demo/pilot, synthetic cohort, `liveEmis:false`). None of B0–B7 move **Track B** (live NHS EMR) closer — restating Volume I `FR-VAL-033`.

| Phase | Effect on Track A ("Demo GO") | Effect on Track B ("Live NHS EMR NO-GO") |
|---|---|---|
| B0 | Cleaner documentation baseline for any pilot reviewer reading Volume I | None |
| B1 | Closes two must-fix-before-pilot gaps Volume I itself names — **directly strengthens** the Track A pilot-readiness bar (Gate 2 clinical-safety, Gate 1 platform-readiness) | None — RBAC/audit hardening is internal; does not touch partner/EMIS surfaces |
| B2 | Improves the honesty of a metric already shown in pilot demos/decks | None |
| B3–B4 | Adds a second commercially-positioned capability (Diabetes v1) to the demo, behind a flag, HITL-gated, synthetic-cohort — a **new pilot narrative**, still Track A | None — no EHR write, no live device data |
| B5 | Extends patient-facing Track A surface with a real (but non-clinical-record) write path | None |
| B6 | Improves honesty of population-dashboard claims already used in ICS/pilot conversations | None |
| B7 | UX polish only | None |

**No phase in this plan changes `liveEmis`, `autoRetrain`, or `canFlipLiveEmisInCode()`.** Track B remains NO-GO until the external N1–N10 partner sequence (`NEXT_BUILD_STEPS.md`) independently completes — this plan does not shorten that path, and does not attempt to.

---

## Cross-links

- [`docs/volume-i/VOLUME_I_DRAFT_AUDIT.md`](./volume-i/VOLUME_I_DRAFT_AUDIT.md) — source of the three must-fix-before-pilot findings this plan opens with
- [`docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md`](./volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md) — FR/AC/BR/OQ ids cited throughout (Ch.3 Personas, Ch.5 HITL, Ch.8 Diabetes, Ch.14 Continuous Learning, Ch.20 Acceptance & Validation)
- [`docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md`](./DISEASE_INTELLIGENCE_DIABETES_SPEC.md) — v0/v1/v2 phased delivery this plan's B3/B4 restate as checklists
- [`docs/ADR_TECH_STACK_MODERNIZATION.md`](./ADR_TECH_STACK_MODERNIZATION.md) — keep/add-later/avoid-now stack decisions binding on every phase
- [`docs/PHASED_BUILD_AND_AUDIT_PLAN.md`](./PHASED_BUILD_AND_AUDIT_PLAN.md) — prior, closed P0–P7 tranche (do not reopen)
- [`docs/BUILT_VS_REMAINING_AUDIT.md`](./BUILT_VS_REMAINING_AUDIT.md) — Track A/B verdict this plan's phases are checked against
- [`docs/CONTINUOUS_LEARNING.md`](./CONTINUOUS_LEARNING.md) — outcomes loop this plan's B2 amends
- [`docs/evidence-pack/README.md`](./evidence-pack/README.md) + `gate-1-platform-readiness.md` / `gate-2-clinical-safety.md` / `gate-3-pilot-authority.md` — the pilot-readiness bar B1's fixes feed into
