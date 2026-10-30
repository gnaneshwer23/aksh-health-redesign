# Orchestration Reliability (Milestone A2)

**Branch:** `feat/milestone-a2-orchestration-persistence`  
**Depends on:** A1 execution metadata (`feat/milestone-a1-agent-runtime` / PR #97)  
**Date:** 2026-10-30

## Goal

Make CONDUCTOR / clinical-spine runs **durable and idempotent** without inventing a second orchestrator registry. Reuse Neon `aksh.agent_intel_runs`, SHIELD audit, and care-episode correlation.

## Architecture (extend, don’t duplicate)

| Concern | Store | Notes |
| --- | --- | --- |
| Run lifecycle + execution bundle | `aksh.agent_intel_runs` (+ migration `053`) | Same table as diabetes agent-intel; `source=clinical_spine` |
| File fallback (no Postgres) | `data/conductor-execution-runs*.json` | Mirrors care-episode / SHIELD local pattern |
| Audit-before-enqueue | `persistShieldAuditEvent` + `resolveShieldAwareEnqueue` | Parity with #92 diabetes decide |
| Care-episode correlation | existing `careEpisodeId` on run + outbox events | No new outbox consumer in A2 |
| Process-local dedupe | A1 `assertNotDuplicateRun` | Kept for single-instance; durable claim owns multi-instance |

**Not introduced:** CONDUCTOR registry table, Workflow DevKit consumer, second agent_runs schema.

## Failure scenarios

| Scenario | Behaviour |
| --- | --- | --- |
| Required slot timeout/throw (SYNTHESIS / GUARDIAN / ORACLE) | Fail-closed `AgentRuntimeError`; durable status `timed_out` / `failed` |
| Optional slot failure (NEXUS / DrASSIST) | Soft-fail by default → run status `partial`; required slots still present |
| Guardian BLOCK | `draftEnqueueAllowed=false`; execution `blocked` / `blocked_from_queue` |
| SHIELD unavailable + Postgres configured | Enqueue blocked (`shield_unavailable`) even if Guardian allows |
| SHIELD unavailable + file mode | Enqueue may proceed; `runAuditRecorded=false` remains honest |
| Duplicate idempotency key (terminal) | Return prior snapshot (`durableRecovered=true`) — no re-fan-out |
| Duplicate after failed terminal | Re-throw classified error from snapshot |
| Crash mid-run (`running`, no snapshot) | Reclaim same row and continue |

Fault injection for drills: set `AKSH_ORCH_FAULT_INJECTION=true` and pass `faultInject` on orchestration options (tests only).

## Idempotent recovery

1. Caller supplies `idempotencyKey` (+ optional `scopeKey` / `careEpisodeId` / `correlationId`).
2. `claimOrRecoverDurableAgentRun` inserts `running` or returns terminal prior row.
3. On success, `finalizeDurableAgentRun` writes A1 `execution_metadata` + JSON `result_snapshot`.
4. Retry with the same key returns the snapshot without re-invoking agents.

## SHIELD consistency beyond #92

Diabetes decide (#92) already fails closed before domain finalisation when durable audit is required.

A2 applies the same **audit-before-enqueue** rule to CONDUCTOR clinical-spine:

```text
Guardian allow ∧ (SHIELD persisted ∨ !durableRequired) → draftEnqueueAllowed
```

Implementation: `lib/agents/shield-orchestration-gate.ts` wired in `lib/clinical-spine/orchestrate.ts`.

Care-episode `outbox_enqueued` events remain available for a future durable consumer (Phase / A3+); A2 does not add a second outbox pipeline for agent runs.

## Key files

- `db/migrations/053_agent_intel_runs_conductor_metadata.sql`
- `lib/db/schema-sql.ts` (`AGENT_INTEL_RUNS_SQL`)
- `lib/agents/execution-run-store.ts`
- `lib/agents/shield-orchestration-gate.ts`
- `lib/clinical-proof/agent-orchestration.ts` (soft-fail optional + fault inject)
- `lib/clinical-spine/orchestrate.ts` (claim / recover / SHIELD gate)
- `tests/orchestration-reliability-a2.test.ts`

## Honesty invariants

- `ehrWrite: false`, `hitlRequired: true`, `physiologicalTwin: false`, `liveEmis: false`
- Clinical retries remain fail-closed (`maxRetries=0`)
- No silent enqueue when durable SHIELD is required and missing

## Next (A3)

Stakeholder / ops surfaces for durable run status, SHIELD blocked enqueue visibility, and care-episode outbox consumer design — still review-only until merge policy allows.
