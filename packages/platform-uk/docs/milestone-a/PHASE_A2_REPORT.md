# Phase A2 Report — Orchestration Persistence & Reliability

**PR:** review-only (#98 — `feat/milestone-a2-orchestration-persistence`)  
**Stacked on:** A1 tip `b36c376` / PR #97 (includes verify typecheck fixture fixes)  
**Date:** 2026-10-30

## Implemented

1. Extended existing `aksh.agent_intel_runs` (migration 053) for CONDUCTOR correlation / idempotency / execution_metadata / result_snapshot — **no second registry**.
2. File + Postgres durable store (`execution-run-store.ts`) with claim / reclaim / finalize.
3. Clinical-spine wires durable idempotency + SHIELD audit-before-enqueue gate (beyond #92).
4. CONDUCTOR soft-fail for optional NEXUS/DrASSIST; required slots remain fail-closed; fault-inject hook for tests.
5. Docs: `ORCHESTRATION_RELIABILITY.md` + this report.
6. Contract tests: `tests/orchestration-reliability-a2.test.ts`.

## Base / CI note

- Rebased onto A1 tip `b36c376` (after A1 dropped accidental A2 files and fixed verify fixtures).
- Local `npm run test:milestone-a2` green after rebase (unit + typecheck).

## Tests run

| Command | Result |
| --- | --- |
| `npx tsx tests/orchestration-reliability-a2.test.ts` | PASS |
| `npm run test:milestone-a2` | PASS (A1 subset + A2 + typecheck) |

## Risks

- Durable recovery stores full spine JSON snapshot (size); acceptable for simulation.
- In-flight reclaim does not time-box stale `running` rows yet (A3 ops).
- Postgres ON CONFLICT is by `id` only; unique idempotency index still prevents double-insert races at DB level.

## Next

**Phase A3** — stakeholder/ops visibility for durable runs + SHIELD blocked enqueue; design care-episode outbox consumer. Review-only until merge policy allows.
