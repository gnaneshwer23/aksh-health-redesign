# Agent Implementation Roadmap (P0–P4)

**Date:** 2026-10-30  
**Status:** Planning only — **do not implement from this PR**  
**App:** `packages/platform-uk`  
**Principle:** Prefer extend existing / deterministic / integrate platform / defer over new agents. Preserve Guardian, SHIELD, tenant isolation, HITL, no autonomous Rx.

---

## Priority definitions

| Priority | Meaning |
| --- | --- |
| **P0** | Blocks honest HCP evaluation or creates dangerous confusion (wrong orchestrator / split worklists / no episode continuity) |
| **P1** | Required for credible pre-launch agent loop (lab handoff, SHIELD parity, eval harness, ops visibility, alias hygiene) |
| **P2** | Improves coherence and honesty (VOICE CARE naming, directory oversell, COMPASS UX) |
| **P3** | Cleanup / namespace / non-urgent polish |
| **P4** | Phase-2 / durable engines — only with funded trigger |

---

## Work-item schema

Each item includes: ID, title, priority, problem, evidence, approach, agents touched, files likely, deps, acceptance criteria, test plan, non-goals, risk, estimate.

---

## P0

### P0-ORCH-01 — Disambiguate dual `runAgentOrchestration`

| Field | Content |
| --- | --- |
| **Problem** | Diabetes-intel export shares name with clinical-proof CONDUCTOR runner; claims agent labels without calling LLM agents |
| **Evidence** | `lib/clinical-proof/agent-orchestration.ts`; `lib/diabetes-intelligence/agent-intel-assemble.ts`; audit G1 |
| **Approach** | Rename diabetes export (e.g. `runDiabetesAgentIntelAssemble`); update imports/APIs/docs; keep behaviour |
| **Agents** | CONDUCTOR (docs), diabetes drafts |
| **Files** | `agent-intel-assemble.ts`, `diabetes-intelligence/index.ts`, callers, tests |
| **Deps** | None |
| **Acceptance** | One symbol named `runAgentOrchestration` in clinical-proof; diabetes uses distinct name; tests green |
| **Test plan** | `diabetes-agent-intelligence`, `ci20` wiring, import grep CI check |
| **Non-goals** | Merging diabetes pipeline into spine in same change |
| **Risk** | Import breakage for external scripts |
| **Estimate** | S (1–2 days) |

### P0-UX-01 — Single GP review worklist for clinician-facing drafts

| Field | Content |
| --- | --- |
| **Problem** | Classic review cases, spine enqueue, and diabetes agent-intel worklists are separate clinician surfaces |
| **Evidence** | Volume I Ch.12; journey T04/T05; audit G2 |
| **Approach** | Adapter: diabetes drafts that should reach GP review map into spine `queueItemsFromRun` / review_cases with `mayEnqueueAgentDraft`; keep domain seed UI as prep |
| **Agents** | CONDUCTOR, SYNTHESIS-like drafts, GUARDIAN gateway |
| **Files** | `lib/clinical-spine/enqueue.ts`, agent-intelligence decide routes, GP review-queue UI |
| **Deps** | P0-ORCH-01 helpful |
| **Acceptance** | One primary GP queue shows spine + opted-in diabetes drafts; gateway BLOCK still prevents enqueue |
| **Test plan** | HITL tests; diabetes decide → review case fixture; e2e golden HITL |
| **Non-goals** | Deleting connected-diabetes UI |
| **Risk** | Duplicate items if both queues remain without dedupe |
| **Estimate** | M (3–5 days) |

### P0-EPISODE-01 — Care-episode correlation id

| Field | Content |
| --- | --- |
| **Problem** | Intake, booking, nurse, GP, review lack shared episode key |
| **Evidence** | Journey T01–T05 disconnected/partial; audit G3 |
| **Approach** | Deterministic `care_episode_id` (or correlation) on review_cases, nurse vitals, orchestrate, front-desk booking when linked; no new agent |
| **Agents** | CONDUCTOR, CANVAS, SHIELD (propagate id) |
| **Files** | review-case repository, spine role-events, front-desk store schema, orchestrate input |
| **Deps** | Product decision on authoritative creator (intake vs booking) |
| **Acceptance** | Synthetic journey can thread one episode id across ≥3 stages with SHIELD events carrying it |
| **Test plan** | New integration test with synthetic ids only |
| **Non-goals** | Full Front Desk rewrite; live telephony |
| **Risk** | Schema migration complexity |
| **Estimate** | M–L |

---

## P1

### P1-LAB-01 — Accept → lab order draft (HITL)

| Field | Content |
| --- | --- |
| **Problem** | `missingLabs` advisory only; no ServiceRequest from Accept |
| **Evidence** | T06 disconnected; lab ingest OK |
| **Approach** | Deterministic draft order items from accepted case + clinician confirm; use PATHWAY-like packaging patterns |
| **Agents** | PATHWAY patterns; HORIZON signals as input only |
| **Files** | workflow finalization, labs catalog, new draft shape + review item type |
| **Deps** | P0-UX-01 preferred |
| **Acceptance** | Accept can create pending lab draft; no auto-send; SHIELD event |
| **Test plan** | Unit draft shape; HITL decide; no connector side effects |
| **Non-goals** | Live lab vendor integration |
| **Estimate** | M |

### P1-SHIELD-01 — SHIELD dual-write on diabetes domain decisions

| Field | Content |
| --- | --- |
| **Problem** | Medcare / journey / continuous-care decisions lack review-case SHIELD parity |
| **Evidence** | Journey SHIELD honesty table; audit G5 |
| **Approach** | Call `persistShieldAuditEvent` on domain decide routes; fail-visible |
| **Agents** | SHIELD |
| **Files** | diabetes-intelligence `**/decision` routes, repositories |
| **Deps** | None |
| **Acceptance** | Every Accept/Edit/Reject on medcare/journey/ccare writes SHIELD or surfaces failure |
| **Test plan** | Extend diabetes decision tests with shield spy/mock |
| **Non-goals** | Changing clinical draft content |
| **Estimate** | S–M |

### P1-ALIAS-01 — Canonical ids in REVIEW_ORDER + types

| Field | Content |
| --- | --- |
| **Problem** | HORIZON/COMPASS/PATHWAY/DrASSIST vs ORACLE/EQUITY/REFERRAL/DR_ASSIST drift |
| **Evidence** | `register.ts` REVIEW_ORDER; eval mention fail; audit G6/G12 |
| **Approach** | Alias map helper; migrate REVIEW_ORDER to canonical with legacy accept; keep API aliases |
| **Agents** | HORIZON, COMPASS, PATHWAY, DrASSIST |
| **Files** | register, orchestration review order, eval golden cases, UI posts |
| **Deps** | P1-EVAL-01 can land together |
| **Acceptance** | Register test still passes; APIs accept both; UI can show product names |
| **Test plan** | agent-register, orchestration, eval:agents |
| **Estimate** | S |

### P1-EVAL-01 — Fix golden eval HORIZON|ORACLE mentions

| Field | Content |
| --- | --- |
| **Problem** | `npm run eval:agents` EXIT 1 (67%) — missing mention ORACLE under deterministic |
| **Evidence** | Audit test run 2026-10-30 |
| **Approach** | Update `lib/eval/golden-cases.ts` / scorer to accept HORIZON or ORACLE |
| **Agents** | HORIZON |
| **Files** | `lib/eval/*`, `docs/AGENT_EVAL_HARNESS.md` |
| **Deps** | None (can precede P1-ALIAS-01) |
| **Acceptance** | `ENABLE_LLM_*=false npm run eval:agents` EXIT 0 |
| **Test plan** | eval:agents CI job |
| **Estimate** | XS |

### P1-OPS-01 — Agent Ops dashboard (read-only)

| Field | Content |
| --- | --- |
| **Problem** | No unified ops view of runs, timeouts, A/E/R, gateway BLOCK, readiness |
| **Evidence** | readiness + loop-outcomes exist; audit G14; HCP eval plan |
| **Approach** | Admin/GP ops page aggregating loop tally, readiness, recent SHIELD CONDUCTOR events, gateway outcomes — synthetic/scoped |
| **Agents** | All runnable |
| **Files** | New dashboard page; reuse `evaluateReadiness`, `tallyLoop` |
| **Deps** | None |
| **Acceptance** | Authenticated role sees metrics; no PHI leakage; acceptance rate ≠ clinical accuracy labelled |
| **Test plan** | route-smoke; rbac; metric honesty copy tests |
| **Estimate** | M |

### P1-BOOK-01 — Booking → nurse worklist (deterministic)

| Field | Content |
| --- | --- |
| **Problem** | T02 disconnected |
| **Approach** | On verified appointment, create nurse observation task linked to episode/patient |
| **Agents** | None (deterministic) |
| **Deps** | P0-EPISODE-01 preferred |
| **Acceptance** | Synthetic booking appears on nurse worklist |
| **Estimate** | M |

---

## P2

### P2-VOICE-01 — Clarify VOICE vs VOICE CARE

Relabel docs/API descriptions; optional route comment; do not break demos. Estimate: XS.

### P2-DIR-01 — Align AGENT_DIRECTORY with register honesty

`live` / `kind` fields match `in_validation` / `modelFlag`. Estimate: S.

### P2-COMPASS-01 — Population brief UX for ICS/admin

Thin UI over equity API with small-cell honesty. Estimate: S–M.

### P2-INTAKE-01 — Optional CONDUCTOR from classic intake

Feature-flagged: after intake case create, offer orchestrate. Estimate: M.

---

## P3

### P3-NS-01 — Document coaching/causal as non-register services

Docs + optional route grouping; defer hard rename. Estimate: XS.

### P3-CANCEL-01 — AbortSignal for orchestrate route

Propagate client disconnect to agent timeouts. Estimate: S. Careful with fail-closed semantics.

---

## P4 / DEFER

### P4-PRISM-01 / P4-ATLAS-01 — L2 scaffolds (shipped evaluation path)

**Status (P4):** L2 synthetic scaffolds exist — typed contracts (`PRISM_AGENT_CONTRACT` /
`ATLAS_AGENT_CONTRACT`), fixture eval runners (`lib/agents/prism-eval.ts`,
`lib/agents/atlas-eval.ts`), Guardian + human-review hooks, register honesty
(`in_validation` / `on_request` / not in CONDUCTOR `LOOP` or `REVIEW_ORDER`),
and `/api/agents/prism` + `/api/agents/atlas` eval routes.

**Still deferred to funded use case:** live imaging deployment, PACS/pixel
ingestion, unapproved clinical research enablement, patient-level export, and
any CONDUCTOR auto-wiring. Honesty module remains authoritative
(`lib/agents/phase2-capability-status.ts`: `live:false`, `built:false`,
`wiredToConductor:false`, `scaffoldBuilt:true`).

### P4-DURABLE-01 — Durable workflow engine

Revisit Vercel Workflow DevKit / Temporal **only if** multi-day HITL pause/resume becomes a requirement. Current sync + optimistic review versions + shield-audit-retry are intentional. **Not required for P4 PRISM/ATLAS scaffolds.**

---

## Sequencing suggestion

```
P0-ORCH-01 ─┬─► P0-UX-01 ─► P1-LAB-01
            └─► P0-EPISODE-01 ─► P1-BOOK-01
P1-EVAL-01 ─► P1-ALIAS-01
P1-SHIELD-01 (parallel)
P1-OPS-01 (parallel with HCP eval)
P2… then P3…; P4 gated
```

---

## Explicit non-goals (all phases)

- Implementing this roadmap in the audit PR  
- New agents for booking/nurse/lab/outcomes  
- Autonomous prescribing or live EHR write  
- Weakening Guardian/SHIELD/tenant isolation  
- Auto-merge / production deploy from audit branch  
- Disabling failing tests to greenwash readiness  
