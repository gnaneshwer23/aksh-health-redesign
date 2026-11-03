# Milestone E1 — Shared Run Correlation

**Audience:** Platform / ops engineers.  
**Depends on:** D1 durable ops unify, A2 durable runs, C3 lab/pharmacy HITL, care-episode repository.  
**Companion:** [DURABLE_OPS_UNIFY.md](../milestone-d/DURABLE_OPS_UNIFY.md), [OBSERVABILITY_AND_OPERATIONS.md](../milestone-a/OBSERVABILITY_AND_OPERATIONS.md).

Synthetic / simulation honesty applies. Completing E1 does **not** flip `productionRbacEnforced`, certify clinical use, or enable live connectors.

---

## Scope

| Item | Detail |
| --- | --- |
| P0.1 Orchestrate threading | `POST /api/agents/orchestrate` passes `careEpisodeId`, `idempotencyKey`, and tenant `scopeKey` into `runClinicalSpineOrchestrate` **before** fan-out so durable claim / SHIELD / `agent_intel_runs` share the client episode identity |
| P0.2 Care-episode reads | `listCareEpisodes*WithMode` / `getCareEpisodeWithMode` prefer Neon when `DATABASE_URL` set; `storeMode`: `postgres` \| `file` \| `file_fallback` |
| P0.2 Lab/pharmacy HITL | Dual-write + Postgres-preferred list (`migration 055`); APIs / panel expose `storeMode` honesty |
| Webhook residual | `dualPathResidual: shared_run_correlation_unified`; `residualDualPathStores: []` |
| HITL / adapters | HITL required · `ehrWrite: false` · `liveEmis: false` · no live adapters |

### Click-path (orchestrate)

1. Create / open a care episode; note `careEpisodeId`.
2. `POST /api/agents/orchestrate` with `patientId`, `careEpisodeId`, and `idempotencyKey`.
3. Confirm durable run (Agent Ops / `agent_intel_runs`) carries the same `careEpisodeId` and recovers on replay of the same key.
4. Post-hoc `correlateCareEpisodeStage` still links the episode spine (does not replace pre-fan-out claim).

### Click-path (HITL / episodes on shared Neon)

1. Shared Neon sandbox: set throwaway `DATABASE_URL`.
2. Stage a lab/pharmacy draft; open Agent Ops / lab queue — `storeMode: postgres`.
3. List care episodes for the patient — `storeMode: postgres` even if another instance's file mirror is empty.

---

## Non-goals

- **Not** flipping `productionRbacEnforced`.
- **Not** HCP facilitator `care_episode_id` deep-link product work (deferred to P1 — now [COORDINATION_INTEROP.md](./COORDINATION_INTEROP.md)).
- **Not** loop-outcomes dual-path unify (deferred to P1).
- **Not** PATHWAY/BRIDGE run-id lineage product expansion (deferred to P1).
- **Not** live EMIS / EPS / PACS / PRISM / ATLAS expansion.
- **Not** autonomous Rx or EHR write.
- **Not** clinical validation or device certification.
- **Not** adding a SHIELD file mirror (SHIELD stays Neon-only).

---

## Definition of done

1. Orchestrate HTTP path threads `careEpisodeId` + optional `idempotencyKey` + `scopeKey` into durable claim before agents run.
2. Care-episode and lab/pharmacy HITL lists report honest `storeMode` (`file` hermetic; `postgres` when Neon list succeeds; `file_fallback` on PG failure).
3. Agent Ops shows care-episode store mode; lab/pharmacy panel shows HITL store mode.
4. C4 webhook residual no longer names care-episode / lab_pharmacy_hitl as dual-path leftovers.
5. `npm run test:milestone-e` green; docs under `docs/milestone-e/`.
6. `productionRbacEnforced` remains false; `liveEmis` stays false.

---

## Gate commands

```bash
cd packages/platform-uk
npm run test:milestone-e:correlate
npm run test:milestone-e
# optional: keep D1 from regressing
npm run test:milestone-d:unify
```

---

## Remaining after E1 (P1 / P2)

| Track | Residual |
| --- | --- |
| P1 | **Shipped** — see [COORDINATION_INTEROP.md](./COORDINATION_INTEROP.md) (handoff `careEpisodeId`, loop-outcomes `storeMode`, PATHWAY/BRIDGE lineage) |
| P2 / ops | Facilitator calendar; CSO exit-note UI; Neon booking helpers; broader PHI scrub; Workstream H SLOs; BRIDGE adapter contract tests (`liveEmis:false`); production RBAC staged flip |

---

## Honesty copy (required)

- Orchestrate durable claims share the client `careEpisodeId` / `idempotencyKey` / tenant scope when supplied — not only post-hoc episode correlate.
- Care-episode and lab/pharmacy HITL reads prefer Neon when configured — file is hermetic / fallback, not the shared-sandbox source of truth.
- SHIELD audit is Neon-only; unavailable Postgres → fail-visible / fail-closed on consequential paths.
- Simulation / synthetic validation — not a clinical device certification.
- `productionRbacEnforced` remains false unless a separate governed flip lands.
- HITL required · `ehrWrite: false` · no autonomous Rx / live EHR write.
