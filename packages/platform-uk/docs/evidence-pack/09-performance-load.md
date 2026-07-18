# Evidence artefact — performance / load

**Status:** Sprint C **perf smoke** defined (not a full load / soak test). Soft-fail friendly for CI / cold starts.

## SLO targets (from E2E clinical proof plan)

| ID | Path | Soft target | Hard ceiling | Notes |
| --- | ---: | ---: | ---: | --- |
| `dashboard_load` | Dashboard HTML TTFB | ≤ 3s | ≤ 8s | Probe `/dashboard/ics` (public allowlist) |
| `agent_draft` | Agent draft API | ≤ 5s | ≤ 15s | `POST /api/agents/guardian` (LLM-off preferred) |
| `review_action` | HITL accept→stage→sim | ≤ 2s | ≤ 6s | In-process chain in unit test |

Source of truth: `lib/clinical-proof/perf-slos.ts` · Test ID **CP-PERF-001**.

## How to run

```bash
cd packages/platform-uk

# Unit SLO contract + in-process review timing (always runs in clinical-proof suite)
npm run test:clinical-proof

# Optional HTTP probes (soft-skip if unreachable; soft-warn if above target)
PERF_SMOKE_BASE_URL=http://127.0.0.1:3000 npm run smoke:perf
PERF_SMOKE_BASE_URL=https://akshhealth.com npm run smoke:perf

# Hard-fail on soft misses only when explicitly requested:
PERF_SMOKE_STRICT=true PERF_SMOKE_BASE_URL=https://akshhealth.com npm run smoke:perf
```

## Honesty

- Soft targets may miss on cold serverless / shared CI — that is **not** production load PASS.
- Full load / pen-adjacent soak remains **GAP** until ops run (artefact still incomplete for Gate 3).
- Do not claim production-ready performance from smoke alone.

## Last filled

- Date: 2026-07-18
- Owner: Engineering
- Result: Smoke SLOs documented + automated contract PASS; formal load **GAP**
