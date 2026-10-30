# Milestone A — Baseline Audit (Phase A1)

**Date:** 2026-10-30  
**HEAD:** `9abf04c` (`origin/main` — includes merged PRs **#86–#96**; tip Merge PR #96 intake→booking handoff e2e)  
**App:** `packages/platform-uk`  
**Branch:** `feat/milestone-a1-agent-runtime`  
**Constraint:** Verified against current code — do **not** restate pre-#88 defects as open.

---

## 1. Functionality (current main)

| Area | State on `9abf04c` |
| --- | --- |
| 14-agent register | Complete (`lib/agents/register.ts`); VOICE/DrASSIST sub-capabilities; PRISM/ATLAS **in_validation scaffolds** (not CONDUCTOR auto-actors) |
| CONDUCTOR | Clinical-spine façade → clinical-proof parallel fan-out (SYNTHESIS/GUARDIAN/HORIZON-as-ORACLE/NEXUS + opt DrASSIST) |
| Guardian | Med-safety agent + independent **guardian-gateway** PASS/REVIEW/BLOCK; BLOCK never enqueues |
| SHIELD | Append-only audit; diabetes-domain dual-write + **fail-closed** integrity (#92 lineage) present |
| Care episode | `care_episode_id` threaded intake → booking → nurse → orchestrate → review (P0/P1/P2) |
| Unified GP worklist | Diabetes drafts map into spine review with gateway gate (post-#88) |
| HITL | Accept/Edit/Reject required; no autonomous Rx; BRIDGE `liveEmis: false` |
| LLM honesty | `llm-gate` forces off in real/production workspace; deterministic fallbacks |
| Workflow DevKit | **Not integrated** (intentional). `lib/workflow/` = HITL domain only |

---

## 2. Test commands (authoritative)

```bash
cd packages/platform-uk
# A1 runtime contracts
ENABLE_LLM_*=false npx tsx tests/agent-runtime-contract.test.ts

# Core agent / orchestration
npx tsx tests/agent-register.test.ts
npx tsx tests/orchestration-contracts.test.ts
ENABLE_LLM_*=false npx tsx tests/clinical-proof-orchestration.test.ts
npx tsx tests/clinical-spine-phase-c.test.ts
npx tsx tests/phase2-capability-status.test.ts
ENABLE_LLM_*=false npm run eval:agents   # 3/3 on main tip

# TypeScript
npm run typecheck
```

Broader gates (not all re-run every A1 commit): `npm run test:p1:agents`, `npm run test:clinical-proof`, platform unit gates.

---

## 3. Known failures / limitations (honest)

| Item | Status |
| --- | --- |
| Pre-#88 ORACLE eval mention fail | **Closed** on tip — `eval:agents` 100% |
| Dual `runAgentOrchestration` name (proof vs diabetes-intel) | Still exists; diabetes path is domain assemble — do not merge engines in A1 |
| Durable `agent_runs` table for CONDUCTOR metadata | **Partial** — A1 emits standardised metadata in-process + SHIELD payload; durable reuse of `agent_intel_runs` / shield / care_episode → **A2** |
| Clinical auto-retry | Intentionally **off** (fail-closed `maxRetries=0`); UPSTREAM classified retryable for opt-in only |
| PRISM/ATLAS | Scaffold only — no CONDUCTOR wiring, no live imaging/research enablement (**A1 does not expand**) |
| Formal HCP evaluation | **Milestone B** — out of scope except technical readiness |
| Vercel Workflow DevKit | Not adopted; prefer extend Neon/Postgres tables |

---

## 4. Config / DB dependencies

| Dependency | Role |
| --- | --- |
| Neon / Postgres (`USE_POSTGRES`) | review_cases, shield_audit_events, care_episodes, agent_intel_* |
| Neo4j (optional) | GUARDIAN/HORIZON/NEXUS graph; mock fallback when unset |
| `ENABLE_LLM_*` + AI Gateway / OpenAI | Opt-in LLM drafts in simulation only |
| `ENABLE_DIABETES_MODULE` | Additive HORIZON/GUARDIAN factors |
| Auth / RLS | Tenant `scopeKey` / practice isolation |

Local unit paths for A1 do not require live Postgres/Neo4j (SHIELD may report `postgres_not_configured` fail-visible).

---

## 5. Planned Milestone A changes (phased)

| Phase | Focus | This PR |
| --- | --- | --- |
| **A1** | Baseline + agent runtime reliability (metadata, honest modes, timeouts/error class, contract tests) | **Yes** |
| **A2** | Durable agent_runs metadata (reuse existing structures), CONDUCTOR failure scenarios, SHIELD consistency beyond #92 | Next (separate branch/PR) |
| **A3** | Stakeholder journey hardening | After A1/A2 review |
| **A4** | Security / ops readiness | After A1/A2 review |
| **A5** | E2E golden journey | After A1/A2 review |

---

## 6. A1 implementation summary

- `lib/agents/execution-metadata.ts` — standardised fields + version pins + error classification + scope/idempotency guards
- Wired into clinical-proof orchestration + clinical-spine orchestrate + `AgentRunSummary`
- Contract tests: valid / missing / timeout / Guardian BLOCK / duplicate / cross-tenant
- Evidence: `AGENT_RUNTIME_VERIFICATION.md`, `PHASE_A1_REPORT.md`

**Non-goals observed:** no rebuild; no parallel CONDUCTOR; no PRISM/ATLAS expansion; no auto-merge/deploy; no invented live AI claims.

---

## 7. Milestone status snapshot (post-#86–#96 + A1 PR)

| Ref | SHA / status | Notes |
| --- | --- | --- |
| `origin/main` tip | **`9abf04c`** | Merge PR **#96** intake→booking handoff e2e |
| Phase A1 branch | **`5f5a4c5`** `feat/milestone-a1-agent-runtime` | **PR [#97](https://github.com/gnaneshwer23/aksh-health-redesign/pull/97) OPEN** (review-only) |
| A1 CI | Partial | Unit gates + CI 2.0 **SUCCESS**; Playwright job **FAIL** on `npm run verify` typecheck (`agent-runtime-contract` schemaVersion cast; `decision-module` / `diabetes-decision-escalation` fixtures missing `execution`/`agentMetadata`) |
| Phase A2 | **`feat/milestone-a2-orchestration-persistence`** | Durable `agent_intel_runs` + SHIELD enqueue gate + reliability tests; review-only PR (stacked on A1) |
| Milestone A complete | **No** | Phases A2–A5 + most DoD §18 items still open |

Merged baseline PRs: **#86** foundation, **#87** agent audit docs, **#88** P0 safety, **#89** P1 agents/review, **#90** P2 care-episode, **#91** P4 PRISM/ATLAS scaffolds, **#92** SHIELD fail-closed diabetes, **#95** unified worklist honesty (supersedes closed #93), **#96** intake→booking + multi-account (supersedes closed #94).

---

## 8. Workstreams A–K — evidence matrix

Legend: **Done** / **Partial** / **Missing** / **Deferred (B)** — verified against `9abf04c` + A1 `#97` (not invented green).

| WS | Focus | State | Evidence | Gap / next phase |
| --- | --- | --- | --- | --- |
| **A** | Agent functional + reliable | **Partial** | Register 14 agents (`lib/agents/register.ts`); A1 metadata + critical contracts (`lib/agents/execution-metadata.ts`, `tests/agent-runtime-contract.test.ts`); `eval:agents` 3/3 on tip | Full 20-scenario reliability suite incomplete; VOICE/CANVAS/PATHWAY/BRIDGE/COMPASS deep samples thin; A1 CI typecheck red; durable metadata → **A2** |
| **B** | CONDUCTOR orchestration | **Partial** | Spine fan-out; A1 metadata; A2 durable claim/recover + soft-fail optional + failure drills | Dual `runAgentOrchestration` name remains; ops visibility → **A3** |
| **C** | Clinical context reliability | **Partial** | Context packages + diabetes modules exist; mock/synthetic provenance | Completeness/conflict/outdated discrimination not fully DoD-complete; no invented fills claimed |
| **D** | Persistent stakeholder workflows | **Partial** | Care episode threaded (#86/#88/#90); intake→booking (#96); nurse worklist (#90); unified GP queue (#88/#95); multi-account acceptance tests | Full delegation/escalation/pharmacy/lab/specialist/patient-approved visibility + closure → **A3** |
| **E** | DB + SHIELD integrity | **Partial** | `#92` diabetes + A2 CONDUCTOR audit-before-enqueue; migration 053 on `agent_intel_runs` | Broader transactional outbox consumer → **A3+** |
| **F** | Agent Ops + observability | **Partial** | `app/dashboard/admin/agent-ops/page.tsx` + review ops UI (#89) | Persisted operational metrics / alerting / execution inspection from durable runs → **A4** (needs A2 data) |
| **G** | Security / privacy | **Partial** | Tenant `scopeKey` guards (A1 contract); RBAC e2e helpers; honesty `liveEmis:false` | Full security review + crit/high fixes + agent abuse surface → **A4**; `productionRbacEnforced` still honest-false (Track B adjacent) |
| **H** | Performance / reliability | **Missing**→**Partial** | Some golden perf/security specs exist (`e2e/platform-golden-perf-security.spec.ts`) | Measured baselines, SLOs, outage/restart recovery → **A4/A5** |
| **I** | DB-backed multi-account E2E | **Partial** | Connected diabetes + platform golden journeys; #96 multi-account acceptance unit/e2e coverage | Full §11.2 golden (patient→FD→nurse→GP→CONDUCTOR→lab→pharm→patient→admin) + negative suite in CI → **A5**; PR #97 Playwright gate currently red |
| **J** | Frontend / UX completion | **Partial** | Stakeholder dashboards + worklist honesty (#95); draft-not-advice patterns | Agent transparency for A1 `executionMode` in UI Incomplete; full state matrix → **A3/A5** |
| **K** | FHIR / BRIDGE readiness | **Partial** | `lib/bridge-staging.ts` staged FHIR, `liveEmis:false` hard | Vendor adapters as contracts only; no live EMIS/TPP — correctly not fabricated |
| **§14** | PRISM / ATLAS | **Partial** (scoped) | `#91` L2 scaffolds `in_validation`; excluded from routine CONDUCTOR | Full imaging/research **Deferred** beyond scaffold hardening |

---

## 9. Definition of Done §18 checklist

| DoD item | State | Cite |
| --- | --- | --- |
| Core agents verified executable paths | **Partial** | Register + CONDUCTOR path; A1 critical contracts; not all 20 failure modes |
| Execution modes accurately reported | **Partial** | A1 metadata on CONDUCTOR fan-out; UI transparency Incomplete; PR #97 CI red |
| Model integrations verified or unavailable | **Partial** | `llm-gate` / `ENABLE_LLM_*=false` honesty; live provider optional |
| CONDUCTOR integration + failure tests | **Partial** | Orchestration tests on main; full failure matrix → A2 |
| GUARDIAN blocks unsafe downstream | **Done** (core path) | Gateway BLOCK → no enqueue (#88 lineage + A1 sample) |
| SHIELD recoverable audit integrity | **Partial** | #92 diabetes fail-closed; broader consistency → A2 |
| Clinical decisions persist | **Partial** | review_cases / agent-intel HITL (#89/#95) |
| Care episodes across stakeholders | **Partial** | #90/#96; remaining handoffs → A3 |
| Clinician review + task delegation | **Partial** | Review Accept/Edit/Reject Done-ish; full delegation → A3 |
| Lab / pharmacy / follow-up in scope | **Partial** | Drafts/scaffolds present; not full multi-role DoD |
| BRIDGE validated staged FHIR | **Partial** | Staging + provenance; not live sync |
| Agent Ops reliable operational data | **Missing**/Partial | UI exists; fixture/registry heavy until A2 persistence |
| Cross-tenant / unauthorised tests pass | **Partial** | A1 CROSS_TENANT sample; broader suite → A4 |
| DB-backed multi-account browser E2E | **Partial** | #96 + golden specs; full golden §11.2 → A5 |
| Crit/high security resolved or block | **Missing** | Explicit A4 security pass not done |
| Recovery from common failures verified | **Missing** | A2/A4 |
| CI passes on final implementation branch | **Missing** | main tip separate; A1 #97 Playwright/verify **FAIL** |
| Unresolved dependencies documented | **Partial** | This audit + A1 docs |
| Technical readiness report complete | **Missing** | A5 deliverable |

---

## 10. Prioritised remaining gaps (A1→A5)

### P0 (block phase exit / CI honesty)

1. **Fix A1 PR #97 verify/typecheck** so Playwright job can proceed — `ClinicalContextPackage.schemaVersion` fixture + `OrchestrationResult` test fixtures (`execution`, `agentMetadata`).
2. **Do not merge A1 until reviewer confirms** metadata honesty + Guardian BLOCK (PR checklist) and CI green.
3. **A2 durable persistence** (reuse `agent_intel_runs` / SHIELD / care_episode) — local WIP exists; finish with tests before claiming Done; open separate review-only PR after A1.

### P1 (Milestone A critical path)

4. CONDUCTOR failure-scenario drills + soft-fail optional slots with recorded recovery (**A2**).
5. SHIELD consistency beyond diabetes-domain decide (**A2** / Workstream E).
6. Stakeholder handoffs: pharmacy/lab/specialist/delegation/episode closure (**A3** / D).
7. Agent Ops fed by persisted run data + basic alerts (**A4** / F).
8. Security pass: authz matrix, cross-tenant e2e, dependency/secret scan (**A4** / G).
9. Golden multi-account browser journey + negatives in CI (**A5** / I).

### P2 (hardening / polish)

10. Expand agent contract samples (VOICE/CANVAS/PATHWAY/BRIDGE/COMPASS).
11. UX agent-transparency fields (`executionMode`, evidence, Guardian) on review surfaces (**J**).
12. Performance baselines / SLOs (**H**).
13. FHIR adapter contract tests for future EMIS/TPP (**K**) — no fake live connectors.
14. PRISM/ATLAS scaffold observability only (**§14**) — no PACS/research expansion.

---

## 11. Correctly deferred (Milestone B / out of Milestone A)

| Item | Why deferred |
| --- | --- |
| Formal HCP evaluation / clinical deployment approval | Explicit Milestone **B** |
| Live EHR writeback / `liveEmis: true` | Forbidden in A; BRIDGE staging only |
| Autonomous prescribing / final diagnosis | Hard non-goal |
| Full PRISM imaging / ATLAS recruitment-export | Beyond scaffold; §14 |
| `productionRbacEnforced: true` promotion | Separate governed workstream (Volume I OQ) |
| Vercel Workflow DevKit adoption | Intentional non-use; Neon/Postgres preferred |

---

## 12. Deliverables tracker (§17)

| Doc | Status |
| --- | --- |
| `BASELINE_AUDIT.md` | **Present** (this file; updated gap matrix 2026-10-30) |
| `AGENT_RUNTIME_VERIFICATION.md` | **Present** (A1) |
| `PHASE_A1_REPORT.md` | **Present** (A1) |
| `ORCHESTRATION_RELIABILITY.md` | **Missing** (A2) |
| `STAKEHOLDER_INTEGRATION.md` | **Present** (A3) |
| `SECURITY_AND_PRIVACY.md` | **Missing** (A4) |
| `OBSERVABILITY_AND_OPERATIONS.md` | **Missing** (A4) |
| `E2E_ACCEPTANCE_RESULTS.md` | **Missing** (A5) |
| `TECHNICAL_READINESS_REPORT.md` | **Missing** (A5) |
