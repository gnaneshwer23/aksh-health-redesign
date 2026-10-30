# Phase A1 Report — Agent Runtime Reliability

**PR:** review-only (`feat/milestone-a1-agent-runtime`)  
**Baseline HEAD:** `9abf04c`  
**Date:** 2026-10-30

## Implemented

1. Standardised execution metadata (`lib/agents/execution-metadata.ts`) with version pins for all 14 agents.
2. Wired metadata into CONDUCTOR clinical-proof orchestration + clinical-spine façade; SHIELD payload carries `correlationId` / `careEpisodeId` / enqueue outcome.
3. Honest execution modes (`deterministic` | `llm` | `rules` | `scaffold` | `orchestrator`).
4. Error classification (`TIMEOUT`, `MISSING_CONTEXT`, `CROSS_TENANT`, `DUPLICATE_RUN`, `GATEWAY_BLOCK`, …); clinical `maxRetries=0` fail-closed.
5. Process-local idempotency + scopeKey cross-tenant guard (durable persistence → A2).
6. Contract tests for critical subset + docs under `docs/milestone-a/`.

## Agents improved

| Agent | Change |
| --- | --- |
| CONDUCTOR | Run-bundle metadata, classified failures, careEpisode/correlation/idempotency/scope |
| SYNTHESIS / GUARDIAN / HORIZON / NEXUS / DrASSIST | Per-slot metadata with honest mode + versions |
| SHIELD | Audit payload enriched with A1 correlation fields |
| All 14 | Version registry pins (PRISM/ATLAS scaffold-only — not expanded) |

## Files touched (primary)

- `lib/agents/execution-metadata.ts` *(new)*
- `lib/clinical-proof/agent-orchestration.ts`
- `lib/clinical-spine/orchestrate.ts`
- `lib/clinical-spine/enqueue.ts`
- `lib/types.ts` (`AgentRunSummary` additive fields)
- `tests/agent-runtime-contract.test.ts` *(new)*
- `docs/milestone-a/*` *(new)*
- `package.json` (`test:milestone-a1` script)

## Tests run

| Command | Result |
| --- | --- |
| `npx tsx tests/agent-runtime-contract.test.ts` | **PASS** |
| `npx tsx tests/agent-register.test.ts` | **PASS** |
| `npx tsx tests/orchestration-contracts.test.ts` | **PASS** |
| `ENABLE_LLM_*=false npx tsx tests/clinical-proof-orchestration.test.ts` | **PASS** |
| `npx tsx tests/clinical-spine-phase-c.test.ts` | **PASS** |
| `npx tsx tests/phase2-capability-status.test.ts` | **PASS** |
| `ENABLE_LLM_*=false npm run eval:agents` | **PASS** 3/3 |
| `npm run typecheck` | **PASS** |

## Risks

- Process-local idempotency is not multi-instance durable (A2).
- Diabetes `runAgentOrchestration` name collision remains (document-only in A1).
- Metadata is in-memory / SHIELD payload until A2 persistence.

## Next

Open **Phase A2** on a new branch/PR: durable agent_runs metadata reusing existing Neon tables, CONDUCTOR failure scenarios, SHIELD consistency beyond #92 — still review-only, no merge/deploy.
