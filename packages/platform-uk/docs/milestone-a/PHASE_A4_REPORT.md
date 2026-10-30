# Phase A4 Report — Security and Observability

**PR:** review-only (`feat/milestone-a4-security-observability`)  
**Stacked on:** A3 tip / PR #99  
**Date:** 2026-10-30

## Implemented

1. Authz allow-lists + permission-matrix rows for agent invoke, Agent Ops inspect, review-queue mutate.
2. Route enforcement: `requireAppRole` + rate limits on orchestrate / GUARDIAN / NEXUS / SYNTHESIS / HORIZON / ops-runs / review decision / assign POST.
3. PHI-safe SHIELD `resourceRef` on hardened agent + CONDUCTOR audit paths; CROSS_TENANT messages scrubbed of raw patient ids.
4. Agent Ops durable-run **alerts** from persisted runs + care-episode open tasks (`ops-alerts` + UI section).
5. Docs: `SECURITY_AND_PRIVACY.md`, `OBSERVABILITY_AND_OPERATIONS.md`, this report.
6. Tests: `tests/security-observability-a4.test.ts` (+ `npm run test:milestone-a4`).

## Security fixes (summary)

| Area | Change |
| --- | --- |
| Authz | Patient/researcher denied agent invoke & ops inspect |
| Rate limits | Agent invoke, review decision, ops reads, assign mutate |
| PHI | Hashed audit refs; ops/alerts never emit labels |
| Cross-tenant | Scope isolation contracts + CROSS_TENANT message hygiene |

## Ops metrics / alerts added

- Repeated durable failures  
- SHIELD enqueue block rate  
- Stuck `running` durable runs (>15m)  
- Stuck care-episode open tasks (>24h)

## Tests run

| Command | Result |
| --- | --- |
| `npx tsx tests/security-observability-a4.test.ts` | *(run in PR prep)* |
| `npm run test:milestone-a4` | A4 + Agent Ops static + typecheck |

## Risks / residuals

- Broader lifestyle agent routes still label-shaped in audit (documented).
- `productionRbacEnforced` remains false.
- Alerts are in-dashboard only (no external pager).

## Next

**Phase A5** — delivered on `feat/milestone-a5-e2e-readiness`: API/unit golden §11.2 + negatives (`npm run test:milestone-a5`), `E2E_ACCEPTANCE_RESULTS.md` + `TECHNICAL_READINESS_REPORT.md`. Browser multi-role E2E still open. Review-only until merge policy allows.
