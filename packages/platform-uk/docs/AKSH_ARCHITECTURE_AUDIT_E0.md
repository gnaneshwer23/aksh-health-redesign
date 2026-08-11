# Aksh Architecture Audit — E0 Snapshot (11 August 2026)

**Purpose:** A short, standalone snapshot of current codebase alignment against `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md` §P3 (P3-1..P3-5), taken at the start of Build Tranche E (`docs/PHASED_BUILD_PLAN_E.md`), before any E-tranche code change landed. This document mirrors `docs/AKSH_ARCHITECTURE_AUDIT_C0.md`'s own standalone-snapshot role for Build Tranche C, restated here as its own file per this run's scope (the same table was also embedded directly in `PHASED_BUILD_PLAN_E.md`'s own E0 section when that plan was drafted — this file does not contradict it, only extracts it for independent citation, exactly as C0 did for the gap analysis).

**Method:** Direct repo inspection of every file/route the migration plan's P3 items name, cross-checked against `PHASED_BUILD_PLAN_E.md`'s own E0 "P3 readiness snapshot" table. Where the two would ever disagree, the plan document is authoritative (it is the phase-gating document); this file is a citable extract, not a second independent analysis.

---

## Verdict summary — P3-1..P3-5 (migration plan §P3)

| P3 item | Current state found in repo | Verdict | E-phase |
|---|---|---|---|
| **P3-1. PRISM (Imaging) / ATLAS (Research)** | `AGENT_DIRECTORY` (`lib/agents.ts`) carries both as `live:false`, `phase:2` entries. Referenced honestly in marketing copy (`lib/chat/knowledge.ts`), the researcher-dashboard honesty banner (`app/dashboard/researcher/page.tsx`), and onboarding copy. **No dedicated capability-status module or endpoint existed** at E0 time — unlike EMIS (`lib/emis-staging.ts`) or federated research (`lib/precision-health/federated-research.ts`), which each already had one. | **Gap confirmed — honesty is scattered copy, not a queryable status object.** | E1 (now landed) |
| **P3-2. Production RBAC / CIS2** | `lib/permission-matrix.ts` already documents an intended boundary (`clinical_reviewer`/`operations_lead` allowed, `patient`/`researcher` denied, for governance/export actions) but at E0 time the API layer did not enforce it: three `/api/system/*` routes (`audit-integrity`, `permission-matrix`, `clinical-safety-files`) accepted any authenticated role with no role check; two more (`integration-contract`, `database-contract`) accepted fully unauthenticated requests. `productionRbacEnforced: false` confirmed unchanged. | **Gap confirmed on 3 of 5 routes** — the other 2 were later confirmed (during E2's build) to be *deliberately* public (linked from `app/resources/page.tsx`, locked in by `tests/readonly-route-contracts.test.ts`), so they are a correct exception, not a missed gap. | E2 (now landed) |
| **P3-3. Live EMIS / NHS write path (Track B)** | `liveEmis:false` hard literal type in `lib/clinical-spine/orchestrate.ts`; `canFlipLiveEmisInCode(): false` in `lib/clinical-spine/partner-readiness.ts`. Partner sandbox scaffold only (`lib/emis-staging.ts`, `lib/emis-partner-sandbox.ts`) — no production credentials, no CIS2, no signed go/no-go. | **Confirmed out of scope — explicit parking lot.** Not touched by any E-phase. | — |
| **P3-4. Federated research pipeline productionisation** | `lib/precision-health/federated-research.ts` is an honest ethics-gated stub (`blocked_ethics` default, `patientLevelExport:false`, `syntheticAggregatesOnly:true`). At E0 time, `/api/research/federated/jobs` required authentication but enforced no role check — inconsistent with its sibling `/api/research/evaluation`, which already restricts to `RESEARCH_EVALUATION_ROLES`. | **Gap confirmed** — role-gate inconsistency between two sibling routes, not a missing pipeline (the pipeline itself stays a stub by design). | E3 (now landed) |
| **P3-5. Additional disease modules beyond Diabetes** | `lib/disease-modules/` contains only `diabetes/`. `docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md` FR-ARC-002 anticipates a second module repeating the same shape; `OQ-ARC-4` ("does a second module get its own chapter/Volume?") is explicitly **open, Product-owned**. | **Confirmed absent — optional, not required for this tranche.** | E5 (optional, not yet executed) |

## Adjacent item — not itself numbered P3, but gated on P3-1..P3-4 landing

| Item | Current state found in repo | Verdict | E-phase |
|---|---|---|---|
| Partner readiness (EMIS/IM1) | `docs/PHASE2_PARTNER_CHECKLIST.md` and `docs/P7_PARTNER_OUTREACH_PACK.md` are comprehensive and current; `docs/BUILT_VS_REMAINING_AUDIT.md` confirms outreach still not sent (user/org-owned). | **No gap in the docs themselves** — E4 is a dated addendum reflecting E1–E3 landing, not a correction of a prior error. | E4 (now landed, docs-only) |

---

## Hard-constraint spot-check (as of this commit, before any E-tranche code change)

| Constraint | Status | Evidence |
|---|---|---|
| `liveEmis: false` | ✅ Hard literal type | `lib/clinical-spine/orchestrate.ts` (`ClinicalSpineOrchestrateResult.liveEmis: false`); `canFlipLiveEmisInCode(): false` (`lib/clinical-spine/partner-readiness.ts`) |
| `autoRetrain: false` | ✅ Hard literal type | Same file; also `lib/clinical-proof/learning-loop.ts`'s `assertNoAutoRetrain` |
| `productionRbacEnforced: false` | ✅ Unchanged | `lib/permission-matrix.ts` |
| HITL mandatory | ✅ Enforced | `hitlRequired: true` literal throughout `clinical-spine/*`, `disease-modules/diabetes/*`; `lib/clinical-proof/hitl-invariants.ts` |
| 12-agent directory, zero deletions | ✅ Intact | `lib/agents.ts` `AGENT_DIRECTORY` — 12 entries, every `keepStatus: "keep"` |
| Diabetes signals stay tools | ✅ Intact | `lib/disease-modules/diabetes/*` — 9 signal builders, none in `AGENT_DIRECTORY` |
| No MHRA/DCB0129/DCB0160/CIS2/DTAC claim | ✅ None found | Grep-clean across the repo at E0 time |

None of E0's own scope (this snapshot + the plan freeze) touches any row in this table — confirmed by `git diff --stat` at the E0 commit being docs-only.

---

## Baseline test/typecheck state confirmed at E0 (11 August 2026)

- `npm run typecheck` — PASS.
- `npm run test:clinical-proof` — PASS, full chain green (same expected `postgres_not_configured`/circular-reference fail-open warnings seen in every prior tranche's baseline — no live `DATABASE_URL` loaded into this sandbox's plain `node`/`tsx` test runs, not a regression).

This is the baseline every E-phase (E1–E5) is diffed against. See `docs/PHASED_BUILD_PLAN_E.md`'s own E0–E4 sections for each phase's own re-confirmation of this baseline after its own change.

---

## What "gap confirmed" / "confirmed out of scope" / "confirmed absent" means in this document

- **Gap confirmed** — the migration-plan item names a real, verifiable difference between documented/intended behaviour and actual enforced behaviour, which the corresponding E-phase closes additively.
- **Confirmed out of scope** — the migration plan's own text places this item behind a separate, dedicated process (partner credentials, pen-test, sign-off) that no E-phase attempts to substitute for.
- **Confirmed absent** — no implementation exists yet, and none is required for this tranche's safety-scoped goals; building it is optional (E5) and gated on Product resolving an open question first.

This snapshot is not edited retroactively as E1–E5 land — each phase's own commit and `PHASED_BUILD_PLAN_E.md` checkbox is the record of what changed. A future E-tranche-closing summary (mirroring B7's/D6's own closing notes) should compare against this file rather than rewrite it.
