# Phased Build Plan — Aksh Health UK (Build Tranche E: P3 Advanced Capabilities, Safety-Scoped)

**Date:** 11 August 2026
**Scope:** `packages/platform-uk`, `main`
**Status:** In progress — phases marked below as they land.
**This is not:** a redo of `docs/PHASED_BUILD_PLAN_C.md` (C0–C6, closed), `docs/PHASED_BUILD_PLAN_D.md` (D0–D6, closed), or any earlier tranche. Those are frozen and are not reopened by this document.

## Relationship to prior plans and to the frozen architecture

| Prior plan | This plan |
|---|---|
| P0–P7 (`PHASED_BUILD_AND_AUDIT_PLAN.md`) | Closed. Not reopened. |
| B0–B7 (`PHASED_BUILD_PLAN.md`) | Closed. Not reopened. |
| C0–C6 (`PHASED_BUILD_PLAN_C.md`) | Closed (P0-1..P0-4, P1-1..P1-3 all landed). Not reopened. |
| D0–D6 (`PHASED_BUILD_PLAN_D.md`) | Closed (P2-1..P2-4 all landed, plus `PED-DIAB-1`/Glucose v1.1 and a Patient-State-deepening extension). Not reopened. |
| **E0– (this doc)** | **New tranche.** Executes `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` **P3** items, under an explicit, narrower safety scope than the migration plan's own P3 framing ("out of scope until... demonstrated need") — the product owner has now authorised entering P3 specifically as scaffolding/honesty/hardening work, never as a live-flip. See "Hard constraints" below, which are stricter than, and a superset of, every prior tranche's constraints. |

**Authoritative sources for this plan (read in this order):**
1. `docs/AKSH_FINAL_ARCHITECTURE_SPEC.md` — frozen baseline. Not redesigned by this plan.
2. `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` §P3 — the five P3 items (P3-1..P3-5) this plan sequences into phases.
3. `docs/BUILT_VS_REMAINING_AUDIT.md` — Track A (demo, GO) / Track B (live NHS, NO-GO) verdicts this plan does not change.
4. `docs/PHASED_BUILD_PLAN_D.md` (D0–D6, complete) — the P2 tranche this one builds on top of, unmodified.

**Explicit mapping — P3 item → E-phase → this plan's scope, not the migration plan's original (more cautious) framing:**

| Migration-plan item | E-phase | What this plan actually does (narrower than a full build) |
|---|---|---|
| P3-1 PRISM (Imaging) / ATLAS (Research) | E1 | Honest, additive **capability-status** module + read-only endpoint stating both are **not built**, `live:false`, Phase 2 roadmap — no imaging pipeline, no research-agent logic, no LLM wiring. |
| P3-2 Production RBAC / CIS2 | E2 | Additive **route-level RBAC enforcement** closing gaps between what `lib/permission-matrix.ts` already *documents* as the intended boundary and what the API layer *actually enforces* today. Does **not** flip `productionRbacEnforced` to `true`, does **not** claim CIS2, does **not** replace the dedicated pen-test-gated RBAC/CIS2 project the migration plan itself says this must not be bundled into. |
| P3-3 Live EMIS / NHS write path (Track B) | — (parking lot) | **Explicitly not touched by any E-phase.** See "Parking lot" below. |
| P3-4 Federated research pipeline productionisation | E3 | Additive **role-gate hardening** on the one federated-research route that was inconsistent with its own sibling (`/api/research/evaluation`) — no production federation infrastructure, no new statistics, no Owkin-style pipeline. |
| P3-5 Additional disease modules beyond Diabetes | E5 (optional) | A **typed-stub-only** second disease module (`lib/disease-modules/heart/types.ts`), zero wiring, zero flag, mirroring Diabetes's own original v0-stub phase before it was ever wired into CONDUCTOR. |

Partner readiness (EMIS/IM1) is **not** itself a numbered P3 item, but the user's own phase framing (E4) asks for a docs-only refresh of the existing partner-readiness pack in light of E1–E3 landing — kept as its own phase for review granularity.

## Hard constraints — apply to every phase in this document, no exceptions

Restates `docs/PHASED_BUILD_PLAN_D.md`'s own constraints verbatim (they do not lapse between tranches), **plus** the explicit HARD NO-GOs for this tranche specifically:

1. **HITL remains mandatory** for every clinical-facing draft. No phase removes or bypasses Accept/Edit/Reject.
2. **`liveEmis: false`, `autoRetrain: false`** stay hard literal-type invariants. No phase changes either default or `canFlipLiveEmisInCode()`. **No phase sets `liveEmis:true` anywhere, under any flag, for any reason.**
3. **No agent-directory deletions.** All 12 entries in `lib/agents.ts`'s `AGENT_DIRECTORY` stay present, named, and classified as `keepStatus: "keep"`. **No phase deletes any agent.**
4. **Diabetes signals stay tools, not agents.** No E-phase promotes any diabetes signal builder into `AGENT_DIRECTORY` or gives it agentic (multi-step/LLM) responsibility.
5. **No MHRA / DCB0129 / DCB0160 / CIS2 / DTAC certification claim, anywhere** — code, docs, or UI copy. E2 hardens RBAC *toward* a CIS2-ready posture; it does not claim CIS2 itself, and every artefact this tranche touches must say so explicitly if CIS2 is mentioned at all.
6. **`productionRbacEnforced` stays `false`** in `lib/permission-matrix.ts` — flipping it is its own dedicated, pen-test-gated project (migration plan P3-2's own text), not something E2 does as a side effect of tightening individual routes.
7. **No `autoRetrain: true`** anywhere — restates constraint 2 with its own line because P3-1 (PRISM/ATLAS) and P3-4 (federated research) are exactly the kind of "model self-updates from outcomes" surface where this mistake is easiest to make by accident.
8. **Partner-gated work (E4) is scaffold / honesty / prep-pack only.** No credentials are invented, no partner API is called, no `liveEmis`/`liveWriteBack` flag is flipped, no claim is made that outreach has been sent if it has not.
9. **Additive-only migration.** Every E-phase change is additive (new module/table/type/field) plus a call-site re-point or a *narrowing* of over-permissive access where explicitly scoped — never a rewrite of working functionality. No existing test may be weakened to go green.
10. **No big-bang.** Each phase is scoped to be independently reviewable, independently revertible, and gated on the previous phase's Go/No-Go.
11. **A phase is Done only if** `npm run typecheck` is green and, for any clinical-facing/behavioural change, `npm run test:clinical-proof` is green (and `npm run build` locally, for any phase touching a client-imported barrel).
12. **Git safety:** every phase commits via a HEREDOC message, never `--amend`/`--no-verify`/force-push/`git config`. No `.js` twins of `.ts` source are committed. No `.env.local`/secrets are committed.
13. **Database: Neon Postgres only, not Supabase.** Restated from D-tranche constraint 11 — this app's system of record remains Neon Postgres via the generic `pg` driver (`lib/db/client.ts`, `DATABASE_URL`). **No E-phase introduces a Supabase project, client, migration, or dual-DB pattern.** Any Supabase MCP tooling available in this environment is not used for this plan.
14. **No new modality schema, no `OQ-DIAB-1` resolution, no `OQ-ARC-4` resolution.** No E-phase edits `lib/precision-health/modalities.ts`, and E5 (if executed) explicitly does not resolve the still-open `OQ-ARC-4` ("should a second disease module get its own chapter/Volume?" — Product-owned, `docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md`).

**Explicit parking lot (never in scope for this plan or any single-pass agent instruction):**
- Any true live NHS write path (P3-3 / Track B) — partner credentials, Medplum production OAuth, CIS2, IM1 UAT, and the signed go/no-go per `docs/BUILT_VS_REMAINING_AUDIT.md` remain entirely outside this plan.
- Flipping `productionRbacEnforced` to `true`.
- Claiming MHRA/DCB/CIS2/DTAC certification.
- Building an actual imaging-analysis pipeline (PRISM) or a real multi-site federated-learning/research pipeline (ATLAS / federated research productionisation) — both stay honest stubs.

---

## Shared audit/functionality toolkit (referenced by phase, not repeated in full each time)

| Check | Command |
|---|---|
| Typecheck | `npm run typecheck` |
| Clinical proof (chained suites incl. HITL, SHIELD, RBAC, learning, C1–C6/D1–D6 suites) | `npm run test:clinical-proof` |
| Workflow + clinical proof | `npm run test:workflow` |
| Production build (only for phases touching a client-imported barrel) | `npm run build` |
| Hard-constraint grep | `grep -rn "liveEmis" lib/clinical-spine/orchestrate.ts` (confirm `false` literal unchanged); `grep -c "keepStatus: \"keep\"" lib/agents.ts` (confirms 12); `grep -n "productionRbacEnforced" lib/permission-matrix.ts` (confirm `false` literal unchanged) |
| Modality-schema grep | `git diff --stat -- lib/precision-health/modalities.ts` (must be empty for every E-phase) |
| Deploy status | `vercel ls` / Vercel dashboard / MCP `get_deployment` — confirm latest deployment for the pushed commit reaches `READY` |

**Baseline confirmed before E0 began (11 August 2026):** `npm run typecheck` — PASS. `npm run test:clinical-proof` — PASS, full chain green (exit code 0, 283.7s; same expected `postgres_not_configured`/circular-reference fail-open warnings seen in every prior tranche's baseline — no live `DATABASE_URL` loaded into this sandbox's plain `node`/`tsx` test runs, not a regression). This is the baseline every E-phase is diffed against.

---

## E0 — Plan freeze + P3 architecture-readiness audit snapshot (no code)

**Goal:** Freeze this plan into version control, and record a short audit snapshot of what P3 (PRISM/ATLAS, RBAC/CIS2, live EMIS, federated research, second disease module) looks like against the current, post-D6 codebase — before any E-tranche code change. Mirrors C0/D0's own role for their tranches.

**In scope**
- Commit this plan, `docs/PHASED_BUILD_PLAN_E.md`.
- Re-verify (not assume) the C0–D6 baseline is still green: `npm run typecheck` + `npm run test:clinical-proof` re-run fresh, output recorded above.
- Record, by direct repo inspection, the concrete current state of every P3 item this plan will touch (see "P3 readiness snapshot" below) — so later phases are diffed against a documented starting point, not a guess.

**P3 readiness snapshot (11 August 2026, pre-E1)**

| P3 item | Current state found in repo | E-phase |
|---|---|---|
| P3-1 PRISM/ATLAS | `AGENT_DIRECTORY` entries `live:false`, `phase:2`. Referenced honestly in marketing copy (`lib/chat/knowledge.ts`), researcher dashboard honesty banner (`app/dashboard/researcher/page.tsx`), onboarding copy. **No dedicated capability-status module or endpoint exists** (unlike EMIS/federated-research, which each have one) — this is the concrete gap E1 closes. | E1 |
| P3-2 RBAC/CIS2 | `lib/permission-matrix.ts` documents an intended boundary (`clinical_reviewer`/`operations_lead` allowed, `patient`/`researcher` denied, for governance/export actions) but **two `/api/system/*` routes accept fully unauthenticated requests** (`integration-contract`, `database-contract` via `resolveOptionalAuthenticatedUserScope`), and **three more require authentication but enforce no role check at all** (`audit-integrity`, `permission-matrix`, `clinical-safety-files`) — any authenticated role, including `patient`/`researcher`, can call them directly. This is the concrete gap E2 closes, using the matrix's own already-documented intended values. | E2 |
| P3-3 Live EMIS | `liveEmis:false` hard everywhere; Partner sandbox scaffold only (`lib/emis-staging.ts`, `lib/emis-partner-sandbox.ts`). Confirmed unchanged — parking lot, no E-phase touches this. | — |
| P3-4 Federated research | `lib/precision-health/federated-research.ts` is an honest ethics-gated stub (`blocked_ethics` default, `patientLevelExport:false`, `syntheticAggregatesOnly:true`). Its route, `/api/research/federated/jobs`, requires authentication but — unlike its sibling `/api/research/evaluation` (which restricts to `RESEARCH_EVALUATION_ROLES`) — **enforces no role check**, so any authenticated role (including `patient`) can create/list federated jobs. This inconsistency is the concrete gap E3 closes. | E3 |
| P3-5 Second disease module | `lib/disease-modules/` contains only `diabetes/`. `docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md` FR-ARC-002 anticipates a second module (e.g. cardiovascular/renal) repeating the same module shape; `OQ-ARC-4` (does a second module get its own chapter/Volume?) is explicitly **open, Product-owned**. E5 (optional) adds a typed-stub-only Heart module, mirroring Diabetes's own original v0-stub phase, without resolving `OQ-ARC-4`. | E5 |
| Partner readiness (EMIS/IM1) | `docs/PHASE2_PARTNER_CHECKLIST.md` (18 Jul 2026) and `docs/P7_PARTNER_OUTREACH_PACK.md` are comprehensive and current; `docs/BUILT_VS_REMAINING_AUDIT.md` (27 Jul 2026) confirms outreach still not sent (user-owned). E4 adds a dated addendum only — no code. | E4 |

**Out of scope**
- No `lib/`, `app/`, or `components/` change of any kind.
- No resolution of `OQ-DIAB-1` or `OQ-ARC-4`.
- No code claiming CIS2/MHRA/DCB certification, PRISM/ATLAS liveness, or a live EMIS path.

**Exit criteria (DoD)**
- [x] This plan is committed to `main`.
- [x] Baseline `typecheck`/`test:clinical-proof` re-confirmed green on this commit, not assumed carried-over from D6's own record.
- [x] P3 readiness snapshot recorded above, giving every later E-phase a documented starting point.

**Audit checklist**
- [x] Diff review: this commit touches only `docs/PHASED_BUILD_PLAN_E.md` — zero code paths.
- [x] `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` §P3 (P3-1..P3-5) re-read in full before drafting E1–E5 below — no P3 item is reworded or re-scoped by this plan beyond the explicit, narrower safety scope stated in "Relationship to prior plans" above.

**Functionality checks**
- [x] `npm run typecheck` — PASS.
- [x] `npm run test:clinical-proof` — PASS (see baseline output above).

**Commit + Deploy gate**
- Commit: this plan only (doc-only). Push to `main`. Confirm Vercel `READY`.

**Go/No-Go for E1: GO** — baseline reconfirmed green, plan committed, P3 readiness snapshot recorded.

---

## E1 — P3-1: PRISM/ATLAS honest capability-status module (no build-out)

**Goal:** Give PRISM (Imaging Intelligence) and ATLAS (Clinical Research) the same kind of single, authoritative, machine-readable "here is exactly what this is and is not" honesty surface that EMIS (`lib/emis-staging.ts`) and federated research (`lib/precision-health/federated-research.ts`) already have — without building any imaging pipeline, any research-agent logic, or any LLM wiring for either. This directly closes the gap E0 recorded: PRISM/ATLAS honesty today lives only as scattered copy strings, not as one queryable status object other surfaces (docs generators, admin panels, partner packs) can read from.

**In scope**
- New `lib/agents/phase2-capability-status.ts`: `getPrismCapabilityStatus()` and `getAtlasCapabilityStatus()`, each returning `{ agentId, label, phase: 2, live: false, built: false, wired: false, description, notBuiltReason, roadmapNote }` — read-only, no side effects, no env-driven behaviour (unlike EMIS/federated research, there is no "flip a flag to unlock a sandbox" state here at all — these two are simply not built). Also exports `getPhase2AgentCapabilityStatus()` returning both plus a shared `notes` array restating "Phase 2 roadmap only — build only against a concrete, funded use case, not speculatively" (the migration plan's own P3-1 language, quoted, not paraphrased into something stronger).
- New `GET /api/system/phase2-capability-status` — read-only, `requireAuthenticatedUserScope`-gated (any authenticated role; this is pure honesty/status information, not a governance export, so it is not added to the E2 role-restricted set below), returns `getPhase2AgentCapabilityStatus()`.
- New `tests/phase2-capability-status.test.ts` — proves `live: false` and `built: false` for both agents, proves the route requires authentication (401 unauthenticated), proves an authenticated call of any role succeeds, and proves the response contains neither a live-imaging claim nor a live-research claim.
- One-line cross-reference added to `lib/chat/knowledge.ts`'s existing PRISM/ATLAS line pointing at the new endpoint (documentation improvement only, no behaviour change to the chat knowledge content itself beyond the added path reference).

**Out of scope**
- No imaging ingestion, no DICOM/image handling of any kind, no research-agent LLM call, no wiring into `AGENT_DIRECTORY`'s `live` field (stays `false`), no wiring into CONDUCTOR/orchestrate.ts.
- No UI panel in this phase (a future phase's job if ever commissioned against a funded use case, per the migration plan's own P3-1 text) — this phase is the data/API layer only, exactly mirroring how EMIS's `getEmisIntegrationStatus()` and federated research's `getFederatedResearchStatus()` each predate any dedicated UI panel for themselves.

**Exit criteria (DoD)**
- [x] `getPrismCapabilityStatus()`/`getAtlasCapabilityStatus()` both report `live: false`, `built: false`, `wired: false`.
- [x] `GET /api/system/phase2-capability-status` requires authentication and returns both statuses plus the shared roadmap note.
- [x] `npm run typecheck` and `npm run test:clinical-proof` both green, including the new test file.
- [x] `AGENT_DIRECTORY` has zero diff (`git diff --stat -- lib/agents.ts` empty) — PRISM/ATLAS `live:false` unchanged, not touched by this phase at all.

**Audit checklist**
- [x] `git diff --stat -- lib/agents.ts lib/clinical-spine/orchestrate.ts` — confirmed empty; this phase adds a new, standalone status module and route only.
- [x] No agent-directory field changed; no `kind`/`layer`/`keepStatus` touched for PRISM or ATLAS.
- [x] No claim anywhere in the new module's strings that either agent is live, wired, or has any imaging/research output today.

**Functionality checks**
- [x] `npm run typecheck` — PASS.
- [x] `npm run test:clinical-proof` — PASS.

**Commit + Deploy gate**
- Commit: `lib/agents/phase2-capability-status.ts` + route + test + `lib/chat/knowledge.ts` cross-reference + `package.json` chain update + this plan's E1 section. Push to `main`. Confirm Vercel `READY`.

**Go/No-Go for E2: GO** (pending this phase's own functionality checks below).

---

## E2 — P3-2: Production RBAC hardening toward a CIS2-ready posture (no CIS2 claim, no flag flip)

**Goal:** Close the concrete gap E0 recorded — five `/api/system/*` routes whose actual access control does not match what `lib/permission-matrix.ts` already documents as the intended boundary — using the matrix's own already-existing intended values (`export_system_contracts`/`governance_pack_view`: `clinical_reviewer` allowed, `operations_lead` allowed, `patient` denied, `researcher` denied). This is additive route-level enforcement, not a redesign of the permission model, and it explicitly does **not** flip `productionRbacEnforced` or claim CIS2 — both stay exactly as documented today (a dedicated, pen-test-gated project per the migration plan's own P3-2 text).

**In scope**
- `lib/user-scope.ts`: new additive `requireAppRole(request, allowedRoles: AppRole[])` helper — wraps `requireAuthenticatedUserScope`, then denies (`403`) if `context.userRole` is not in `allowedRoles`. Existing exports (`requireAuthenticatedUserScope`, `resolveOptionalAuthenticatedUserScope`, `mapSessionRoleToAppRole`, etc.) are **not modified** — this is a new function, zero diff to any existing one's behaviour or signature.
- `app/api/system/integration-contract/route.ts` and `app/api/system/database-contract/route.ts`: switch from `resolveOptionalAuthenticatedUserScope` (currently allows fully unauthenticated "public" access) to `requireAppRole(request, ["clinical_reviewer", "operations_lead"])` — matching D6's own stated (but never-enforced) intent for the integration-contract's admin panel ("gated to an appropriate admin/operations role... never patient- or clinical-reviewer-visible without justification" — read here as: not *publicly* visible, and per the matrix's own `export_system_contracts` row, `clinical_reviewer` and `operations_lead` are the two allowed roles).
- `app/api/system/audit-integrity/route.ts`, `app/api/system/permission-matrix/route.ts`, `app/api/system/clinical-safety-files/route.ts`: switch from `requireAuthenticatedUserScope` (any authenticated role) to `requireAppRole(request, ["clinical_reviewer", "operations_lead"])` — closing the "any authenticated role including patient/researcher" gap, using the exact allow-list the matrix already documents for `governance_pack_view`/`export_system_contracts`.
- `lib/permission-matrix.ts`: additive `enforcedAt` field (an ISO date string, or `null`) on the `export_system_contracts` and `governance_pack_view` actions only, recording that these two documented boundaries are now route-enforced as of this phase — every other action's `enforcedAt` stays `null` (honest: this phase enforces exactly two documented actions' worth of routes, not the whole matrix).
- New `tests/system-routes-rbac.test.ts` — mirrors `tests/clinical-proof-rbac-decision-gate.test.ts`'s own pattern: for each of the five routes, asserts `patient`/`researcher`/`restricted`/unauthenticated all receive `401`/`403`, and `gp` (→`clinical_reviewer`) and `practice-manager` (→`operations_lead`) both succeed.

**Out of scope**
- No change to `productionRbacEnforced`'s literal `false` value (grep-checked).
- No CIS2/MHRA/DCB claim added anywhere.
- No change to any other `/api/*` route's auth behaviour — this phase touches exactly the five named `/api/system/*` routes.
- No change to `lib/permission-matrix.ts`'s existing `matrix`/`actions`/`roles` values — only the new, additive `enforcedAt` field.

**Exit criteria (DoD)**
- [x] `integration-contract` and `database-contract` no longer accept unauthenticated requests (previously fully public).
- [x] `audit-integrity`, `permission-matrix`, `clinical-safety-files` deny `patient`/`researcher`/`restricted` roles (previously any authenticated role succeeded).
- [x] `clinical_reviewer`- and `operations_lead`-mapped roles (`gp`, `nurse`, `clinical-pharmacist`, `practice-manager`, `ics-lead`, `hospital-executive`) still succeed on all five routes — zero regression for the roles the matrix always intended to allow.
- [x] `productionRbacEnforced` remains `false`; no CIS2 claim added.
- [x] `npm run typecheck` and `npm run test:clinical-proof` both green, including the new test file.

**Audit checklist**
- [x] `grep -n "productionRbacEnforced" lib/permission-matrix.ts` — confirmed `false` literal unchanged.
- [x] `grep -rn "CIS2\|MHRA\|DCB0129\|DCB0160\|DTAC" <files touched this phase>` — confirmed no certification claim introduced.
- [x] `liveEmis`/`autoRetrain`/agent-directory — grep-clean; this phase touches only `lib/user-scope.ts` (additive function), five `app/api/system/*` route files (auth-check swap only, zero business-logic diff), `lib/permission-matrix.ts` (one additive field), one new test file.
- [x] Every route's actual response body/shape for an *allowed* caller is unchanged — only the auth/role gate is added; verified in the test by asserting the 200 response body still matches the pre-existing contract shape for an allowed role.

**Functionality checks**
- [x] `npm run typecheck` — PASS.
- [x] `npm run test:clinical-proof` — PASS.

**Commit + Deploy gate**
- Commit: `lib/user-scope.ts` (`requireAppRole`) + five route files + `lib/permission-matrix.ts` (`enforcedAt`) + test + `package.json` chain update + this plan's E2 section. Push to `main`. Confirm Vercel `READY`.

**Go/No-Go for E3: GO** (pending this phase's own functionality checks below).

---

## E3 — P3-4: Federated-research role-gate hardening (no production federation infra)

**Goal:** Close the concrete gap E0 recorded — `/api/research/federated/jobs` (GET+POST) requires authentication but enforces no role check, unlike its sibling `/api/research/evaluation` (which already restricts to a `RESEARCH_EVALUATION_ROLES` allow-list). This phase reuses that existing allow-list, it does not invent a new one, and it does not touch `lib/precision-health/federated-research.ts`'s own ethics-gate logic (`FEDERATED_RESEARCH_ETHICS_APPROVED`, `blocked_ethics`) — that stays exactly as honest and exactly as gated as it already is.

**In scope**
- `app/api/research/evaluation/route.ts`: export the existing `RESEARCH_EVALUATION_ROLES` set (currently module-private) so it can be reused verbatim by the federated-jobs route rather than re-declared — a single source of truth for "who may touch research-workspace surfaces," additive (adding `export` to an existing `const` changes no behaviour).
- `app/api/research/federated/jobs/route.ts`: both `GET` and `POST` gain the same role check the evaluation route already has (`researcher`, `practice-manager`, `ics-lead`, `hospital-executive`, `operations_lead` — reused, not redefined), returning `403` for any other role (including `patient`, `gp`, `nurse`, `clinical-pharmacist`, and unrecognized roles).
- New `tests/federated-research-rbac.test.ts` — proves `patient` and an unrecognized role get `403` on both `GET` and `POST /api/research/federated/jobs`; proves `researcher` and `practice-manager` still succeed; proves the ethics gate (`blocked_ethics` when `FEDERATED_RESEARCH_ETHICS_APPROVED` is unset) is unaffected by the new role check — a `researcher` role still gets a `blocked_ethics` job, not a `403`, when the ethics env gate is closed (i.e., the two gates are independent and both must pass, neither silently overrides the other).

**Out of scope**
- No change to `lib/precision-health/federated-research.ts`'s ethics-gate logic, job shape, or `syntheticAggregatesOnly`/`patientLevelExport` literals.
- No new statistics, no real multi-site federation, no Owkin-style pipeline of any kind.
- No change to `FederatedJobsPanel.tsx` (the researcher-dashboard UI) — it already only renders on the researcher dashboard, so no UI change is needed for this phase's own gate to take effect.

**Exit criteria (DoD)**
- [x] `patient` (and any role outside the reused allow-list) receives `403` from both `GET` and `POST /api/research/federated/jobs`.
- [x] `researcher`/`practice-manager`/`ics-lead`/`hospital-executive`/`operations_lead` are unaffected (still succeed, subject to the pre-existing ethics gate).
- [x] The ethics gate (`blocked_ethics`) and the new role gate are independently testable and neither masks the other.
- [x] `npm run typecheck` and `npm run test:clinical-proof` both green, including the new test file.

**Audit checklist**
- [x] `git diff --stat -- lib/precision-health/federated-research.ts` — confirmed empty; ethics-gate logic untouched.
- [x] `RESEARCH_EVALUATION_ROLES` is reused (imported), not duplicated — a single grep for the role list resolves to one declaration.
- [x] `liveEmis`/`autoRetrain`/agent-directory — grep-clean; this phase touches only two route files, one `export` keyword addition, one new test file.

**Functionality checks**
- [x] `npm run typecheck` — PASS.
- [x] `npm run test:clinical-proof` — PASS.

**Commit + Deploy gate**
- Commit: `app/api/research/evaluation/route.ts` (export) + `app/api/research/federated/jobs/route.ts` (role gate) + test + `package.json` chain update + this plan's E3 section. Push to `main`. Confirm Vercel `READY`.

**Go/No-Go for E4: GO** (pending this phase's own functionality checks below).

---

## E4 — Partner readiness pack refresh for EMIS/IM1 (docs + flags only, no code)

**Goal:** A dated, docs-only addendum to the existing, already-comprehensive partner-readiness materials (`docs/PHASE2_PARTNER_CHECKLIST.md`, `docs/P7_PARTNER_OUTREACH_PACK.md`), reflecting what has changed since D-tranche/E1–E3 landed (a real diabetes glucose-ingest path now exists; PRISM/ATLAS now have a queryable honesty status; RBAC around system/governance exports is now route-enforced) — without sending any outreach, inventing any credential, or flipping `liveEmis`/`liveWriteBack`.

**In scope**
- `docs/PHASE2_PARTNER_CHECKLIST.md`: one dated addendum section noting (a) the diabetes glucose-ingest path (`POST /api/patients/[id]/diabetes/glucose`, C6/D2) is a second real (patient-reported) data path now flowing through Patient State, relevant to any future partner data-sharing-scope conversation — explicitly still not a partner-sourced or device-sourced stream; (b) `liveEmis:false` reconfirmed unchanged; (c) cross-reference to the new `/api/system/phase2-capability-status` (E1) for PRISM/ATLAS honesty.
- `docs/P7_PARTNER_OUTREACH_PACK.md`: one dated status line reconfirming outreach has **still not been sent** (user/org-owned, per `docs/BUILT_VS_REMAINING_AUDIT.md`) — restated, not contradicted.
- `docs/BUILT_VS_REMAINING_AUDIT.md`: no edit in this phase — it is the audit-of-record and is refreshed on its own cadence, not as a side effect of this plan; this plan's completion is instead reflected in this document's own phase checkmarks.

**Out of scope**
- No partner API call, no credential of any kind, no `liveEmis`/`liveWriteBack` flag change.
- No claim that outreach has been sent, that a partner has responded, or that any DPIA/DPA/CSO sign-off has occurred.
- No code change whatsoever — this phase is documentation-only.

**Exit criteria (DoD)**
- [x] Both docs carry a dated addendum; neither claims live partner integration, sent outreach, or any sign-off that has not actually happened.
- [x] `npm run typecheck` — PASS (docs-only, nothing to break, re-confirmed rather than assumed).

**Audit checklist**
- [x] `git diff --stat` for this commit touches only the two named docs files.
- [x] No `liveEmis`/`liveWriteBack`/credential-env value changed anywhere in the diff.

**Functionality checks**
- [x] `npm run typecheck` — PASS (doc-only change, no behaviour to break).

**Commit + Deploy gate**
- Commit: the two docs files + this plan's E4 section. Push to `main`. Confirm Vercel `READY` (doc-only, no functional diff expected).

**Go/No-Go for E5: GO** (pending this phase's own functionality checks below).

---

## E5 — P3-5 (optional): Heart module typed-stub scaffold (zero wiring, zero flag)

**Goal:** Prove the "module on a platform" pattern (`docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md` FR-ARC-002) generalises beyond Diabetes, by adding a second disease module directory containing **only** the same kind of typed-stub file Diabetes itself started with (`lib/disease-modules/diabetes/types.ts`'s original v0 form, before `ENABLE_DIABETES_MODULE` or any orchestrate.ts wiring existed) — with zero wiring, zero feature flag (none is needed, since nothing reads one yet), and without resolving the still-open, Product-owned `OQ-ARC-4` ("does a second disease module get its own PRD chapter or a new Volume?").

**In scope**
- New `lib/disease-modules/heart/types.ts` — mirrors `diabetes/types.ts`'s shape exactly: `HEART_MODULE_IDS` (illustrative cardiovascular signal areas — e.g. `BLOOD_PRESSURE`, `LIPIDS`, `RHYTHM`, `HEART_FAILURE_SIGNS`, `MEDICATION_ADHERENCE_CVD`, `LIFESTYLE_CVD` — explicitly labelled provisional/illustrative pending a real clinical-lead/product spec, exactly as Diabetes's own 9 areas were before `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` existed), `HeartModuleId`, `HeartFeedTarget` (`"HORIZON" | "GUARDIAN" | "coaching_surface"`, reusing the same three existing platform surfaces Diabetes feeds — no new agent, no new orchestrator path), `HEART_SIGNAL_HONESTY` (`hitlRequired: true; ehrWrite: false; autoRetrain: false; physiologicalTwin: false` — byte-identical shape to `DIABETES_SIGNAL_HONESTY`), and a file-header comment stating: v0 typed-stub only, nothing wired into `orchestrate.ts`/HORIZON/GUARDIAN, `OQ-ARC-4` remains open and unresolved by this file, no env flag exists because nothing consumes this module yet.
- Per FR-DIAB-006's own hard-boundary rule (module boundaries between diseases stay hard even before a second module existed): `lib/disease-modules/heart/types.ts` imports nothing from `lib/disease-modules/diabetes/*`, and nothing in `diabetes/*` imports from `heart/*` — verified by grep, not just by construction.
- New `tests/heart-module-stub.test.ts` — proves `HEART_MODULE_IDS` is a non-empty, deduplicated array; proves `HEART_SIGNAL_HONESTY` matches the literal shape (`hitlRequired: true`, `ehrWrite: false`, `autoRetrain: false`, `physiologicalTwin: false`); proves (via a source-text grep assertion, mirroring how other phases assert `git diff --stat` emptiness) that no file under `lib/disease-modules/heart/` imports from `lib/disease-modules/diabetes/`, and vice versa; proves the module is **not** imported anywhere under `lib/clinical-spine/`, `lib/agents.ts`, or any `app/api/**/route.ts` (i.e., genuinely zero wiring, not just "wiring not yet tested").

**Out of scope**
- No `heart/index.ts` barrel, no `fixtures.ts`, no signal-builder logic (`glucose.ts`/`hba1c.ts`-equivalent), no `ingest.ts`, no `decision-history.ts` — those were all built for Diabetes only after `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` existed and `ENABLE_DIABETES_MODULE` was introduced; none of that exists yet for Heart, and none of it is built in this phase.
- No wiring into `orchestrate.ts`, `AGENT_DIRECTORY`, HORIZON, or GUARDIAN.
- No new environment variable (an `ENABLE_HEART_MODULE`-style flag would be pure decoration with nothing reading it — deliberately not added until there is something to gate).
- No resolution of `OQ-ARC-4`.

**Exit criteria (DoD)**
- [x] `lib/disease-modules/heart/types.ts` exists, typed, zero runtime logic, zero wiring.
- [x] Zero cross-imports between `heart/` and `diabetes/` directories (grep-verified).
- [x] Zero references to the new module anywhere outside its own directory and its own test file.
- [x] `npm run typecheck` and `npm run test:clinical-proof` both green, including the new test file.

**Audit checklist**
- [x] `git diff --stat -- lib/disease-modules/diabetes lib/clinical-spine/orchestrate.ts lib/agents.ts` — confirmed empty; Diabetes and CONDUCTOR are provably untouched by this phase.
- [x] `OQ-ARC-4`'s own **Status: Open** entry in `docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md` is unchanged (not marked Decided) by this phase.

**Functionality checks**
- [x] `npm run typecheck` — PASS.
- [x] `npm run test:clinical-proof` — PASS.

**Commit + Deploy gate**
- Commit: `lib/disease-modules/heart/types.ts` + test + `package.json` chain update + this plan's E5 section. Push to `main`. Confirm Vercel `READY`.

**Go/No-Go:** E5 is the last phase in this tranche's initial scope; no E6 is pre-defined.

---

## One-page roadmap

| Phase | Migration-plan item | Rough effort | Depends on |
|---|---|---|---|
| **E0** | — (plan freeze + P3 readiness snapshot) | 0.5 | D0–D6 (all closed) |
| **E1** | P3-1 PRISM/ATLAS honest capability status | 0.5–1 | E0 |
| **E2** | P3-2 Production RBAC hardening (5 system routes) | 1–1.5 | E0 (independent of E1) |
| **E3** | P3-4 Federated-research role-gate hardening | 0.5–1 | E0 (independent of E1/E2) |
| **E4** | Partner readiness pack refresh (docs only) | 0.5 | E1 (cross-references it), E0 |
| **E5** | P3-5 Heart module typed-stub scaffold (optional) | 0.5–1 | E0 (independent of E1–E4) |

## Demo GO vs Live NO-GO mapping

Every phase in this plan operates entirely inside **Track A** (demo/pilot, synthetic + patient-companion-entered cohort data, `liveEmis:false`). None of E0–E5 move **Track B** (live NHS EMR) closer, and none resolve `OQ-DIAB-1` or `OQ-ARC-4`.

| Phase | Effect on Track A | Effect on Track B |
|---|---|---|
| E0 | Freezes this tranche's scope | None |
| E1 | Adds an honest "not built" status surface for two roadmap agents | None |
| E2 | Tightens who can read system/governance export routes — no behaviour change for allowed roles | None |
| E3 | Tightens who can create/list federated-research jobs — ethics gate unaffected | None |
| E4 | Documentation refresh only | None |
| E5 | Adds a typed stub with zero runtime wiring | None |

**No phase in this plan changes `liveEmis`, `autoRetrain`, `canFlipLiveEmisInCode()`, `productionRbacEnforced`, or resolves `OQ-DIAB-1`/`OQ-ARC-4`.**

---

## What's left in E / P3 (updated as phases land)

- **E0–E5:** see phase sections above for live status.
- **P3 items not covered by E0–E5:** P3-3 (live EMIS/NHS write path) is the explicit parking lot — governed entirely outside this plan, per the migration plan's own text and this plan's HARD NO-GOs.
- **Still blocked on partners/clinical lead (unchanged by this tranche):** IM1/EMIS partner outreach (user/org-owned, not sent), Medplum Client Secret (user-supplied), Partner sandbox live credentials (partner-owned), signed CSO/IG/Gate 1–3 sign-off, signed N7 `liveEmis` go/no-go, `OQ-DIAB-1` (clinical lead), `OQ-ARC-4` (Product) — none of these are, or can be, resolved by engineering work alone.

---

## Cross-links

- [`docs/AKSH_FINAL_ARCHITECTURE_SPEC.md`](./AKSH_FINAL_ARCHITECTURE_SPEC.md) — frozen baseline this plan operates within
- [`docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md`](./AKSH_ARCHITECTURE_MIGRATION_PLAN.md) — §P3 item definitions this plan's phases implement, under a narrower safety scope
- [`docs/BUILT_VS_REMAINING_AUDIT.md`](./BUILT_VS_REMAINING_AUDIT.md) — Track A/B verdicts this plan does not change
- [`docs/PHASED_BUILD_PLAN_D.md`](./PHASED_BUILD_PLAN_D.md) — prior, closed D0–D6 tranche this plan builds on top of, unmodified
- [`docs/PHASE2_PARTNER_CHECKLIST.md`](./PHASE2_PARTNER_CHECKLIST.md) / [`docs/P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md) — refreshed (docs-only) by E4
- [`docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md`](./volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md) — `OQ-ARC-4`/FR-ARC-002 E5 (if executed) respects without resolving
