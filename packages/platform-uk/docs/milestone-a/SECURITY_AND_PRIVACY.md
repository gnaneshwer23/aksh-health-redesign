# Security and Privacy (Milestone A4)

**Branch:** `feat/milestone-a4-security-observability`  
**Depends on:** A3 stakeholder integration (PR #99)  
**Date:** 2026-10-30  
**Honesty:** Synthetic / simulation validation — not a production penetration test or DCB0129 closure.

## Authz matrix (enforced actions)

| Action ID | Routes | Allowed AppRoles | Denied |
| --- | --- | --- | --- |
| `agent_invoke` | `/api/agents/orchestrate`, guardian/nexus/synthesis/oracle | `clinical_reviewer` | patient, researcher, operations_lead, restricted |
| `agent_ops_inspect` | `/api/agents/ops-runs` | `operations_lead`, `clinical_reviewer` | patient, researcher, restricted |
| `review_queue_mutate` | `/api/gp/review-queue/assign` POST | `clinical_reviewer` | others |
| `capture_reviewer_decision` | `/api/review-cases/[id]/decision` | `clinical_reviewer` | others (pre-existing + rate limit) |

Documented in `lib/permission-matrix.ts`; allow-lists in `lib/security/agent-authz.ts`; enforced via `requireAppRole`.  
`productionRbacEnforced` remains **false** for the broader matrix (honest Track B residual).

## Findings and fixes (verified in code)

| Sev | Finding | Fix |
| --- | --- | --- |
| **High** | Agent Ops durable-run API authenticated but not role-gated — any signed-in role could read tenant ops aggregates | `requireAppRole(AGENT_OPS_ROLES)` + rate limit |
| **High** | Critical agent invoke APIs (orchestrate / GUARDIAN / NEXUS / SYNTHESIS / HORIZON) allowed any authenticated role | `requireAppRole(AGENT_INVOKE_ROLES)` |
| **High** | SHIELD audit `resourceRef` stored patient labels / raw ids on agent draft paths | `phiSafeResourceRef` / hashed `pt_*` refs (routes + CONDUCTOR audit) |
| **High** | No rate limits on agent invoke / review decision / ops-runs / assign mutate | `lib/agents/rate-limit-guards.ts` wired on those routes |
| **Med** | CROSS_TENANT error text echoed raw `patientId` | Message PHI-minimised in `assertRuntimeScope` |
| **Med** | Review-queue assign mutate lacked explicit AppRole gate | `REVIEW_QUEUE_MUTATE_ROLES` on POST |

## Cross-tenant denial

- Durable ops visibility is **scopeKey-partitioned** (file/Postgres store per tenant scope).
- Contract tests prove scope A cannot see scope B run ids / labels.
- Runtime `assertRuntimeScope` continues to raise `CROSS_TENANT` on CONDUCTOR paths (A1).
- Practice isolation for review cases remains via existing tenant helpers (pre-A4).

## PHI minimisation

- Agent Ops rows: hashed `patientRef` only (`ops-run-visibility`).
- Audit `resourceRef` on hardened agent routes: `pt_<hash>[:case_…][:agent]`.
- Alert samples use the same opaque refs — never names / NHS numbers.
- Residual: many lifestyle agent routes and UI event posts still use label-shaped refs (documented residual; not claimed fixed in A4).

## Residual risks

1. **`productionRbacEnforced: false`** — full matrix not claimed as production RBAC.
2. **Demo / test auth headers** — local E2E helpers can still inject roles; production must keep NextAuth as source of truth.
3. **File-backed stores** — scope isolation depends on correct `scopeKey` plumbing; care-plan / follow-up Neon RLS is **enforced** (migration **054**, fail-closed org match) when using `withOrgContext` / `aksh_tenant`. Owner-role pool still bypasses RLS — pass `organisationId` on list/create for tenant-bound reads.
4. **Incomplete PHI scrub on non-critical agent routes** (sleep/nutrition/exercise/referral/voice-care, client `resourceRef` posts).
5. **Rate limits disabled** when `DISABLE_RATE_LIMIT=true` or `CI=true` (intentional for gates).
6. **No dependency CVE scan artifact** in this PR — run `npm audit` / SCA in A5 readiness pack.

## Tests

- `tests/security-observability-a4.test.ts`
- `npm run test:milestone-a4`
