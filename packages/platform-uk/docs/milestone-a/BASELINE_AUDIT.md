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
