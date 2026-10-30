# Observability and Operations (Milestone A4)

**Branch:** `feat/milestone-a4-security-observability`  
**Depends on:** A2 durable runs + A3 ops visibility  
**Date:** 2026-10-30  

Extends the **existing** Agent Ops dashboard (`/dashboard/admin/agent-ops`) — no second monitoring product.

## Data sources (persisted)

| Signal | Source |
| --- | --- |
| Durable CONDUCTOR runs | `lib/agents/execution-run-store.ts` (`agent_intel_runs` / file mirror) |
| SHIELD-blocked enqueue | Derived in `ops-run-visibility` from gate fields |
| Care-episode open tasks | `listCareEpisodesForScope` (A4) |
| Agent readiness / loop funnel | Existing readiness + equity APIs (aggregates) |

## Alert signals (`lib/agents/ops-alerts.ts`)

| Code | Trigger (defaults) | Severity |
| --- | --- | --- |
| `REPEATED_AGENT_FAILURES` | ≥3 failed/timed_out durable runs in 60m | warning → critical at 2× |
| `SHIELD_BLOCK_RATE_HIGH` | SHIELD block rate ≥35% with ≥3 samples in 60m | warning → critical at ≥60% |
| `STUCK_DURABLE_RUNS` | Any `running` run older than 15m (A2 reclaim window visibility) | warning → critical at ≥3 |
| `STUCK_CARE_EPISODE_TASKS` | Open care-episode tasks older than 24h | warning → critical at ≥5 |

All alerts are **PHI-free** (hashed patient refs only). Not forwarded to generic third-party monitors with clinical content.

## Surfaces

- **API:** `GET /api/agents/ops-runs?alerts=1` — role-gated (`operations_lead` | `clinical_reviewer`), rate-limited; returns run summary + `alerts`.
- **UI:** Agent Ops section `data-testid="agent-ops-alerts"` renders active signals + window metrics.

## Operator response (lightweight)

| Alert | First checks |
| --- | --- |
| Repeated failures | Recent CONDUCTOR error codes; LLM gate / Neo4j / mock fallback; reclaim/finalize path |
| SHIELD block rate | Postgres configured? SHIELD audit write path; diabetes decide fail-closed (#92) |
| Stuck durable runs | Worker/process crash mid-run; claim/reclaim; finalize not called |
| Stuck episode tasks | Handoff ownership / assign API; overdue nurse→GP or GP→pharmacist tasks |

## Recovery notes

- A2 claim/reclaim recovers in-flight `running` rows on retry with same idempotency key.
- SHIELD fail-closed remains: no draft enqueue without durable audit when required.
- Alerts are **detection** only in A4 — no auto-remediation / page-out integration.

## Residual / next (A5+)

- Full browser booking→decide click-path (A5 adds role-landing + authz smoke only).
- Optional webhook / ops channel for critical alerts (still no PHI payload).
- Performance baselines / SLOs (Workstream H) measured, not invented.
