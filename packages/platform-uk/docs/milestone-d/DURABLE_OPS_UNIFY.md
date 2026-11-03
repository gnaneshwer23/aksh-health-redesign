# Milestone D1 — Durable Ops Store Unify (vertical slice)

**Audience:** Platform / ops engineers.  
**Depends on:** A2 durable runs, A3 ops visibility, A4 alerts, C4 dual-path residual docs.  
**Companion:** [OBSERVABILITY_AND_OPERATIONS.md](../milestone-a/OBSERVABILITY_AND_OPERATIONS.md), [PHI_OPS_ALERT.md](../milestone-c/PHI_OPS_ALERT.md).

Synthetic / simulation honesty applies. Completing D1 does **not** flip `productionRbacEnforced`, certify clinical use, or enable live connectors.

---

## Scope

| Item | Detail |
| --- | --- |
| Postgres-preferred ops reads | `listDurableAgentRunsForScope` / patient list hydrate from `aksh.agent_intel_runs` when `DATABASE_URL` set |
| File fallback | Hermetic tests + PG list failure → scoped JSON under `data/` |
| `storeMode` honesty | `postgres` \| `file` \| `file_fallback` on Agent Ops / `GET /api/agents/ops-runs` / alerts |
| Webhook residual | `dualPathResidual` updated — durable-run ops list is unified; remaining dual-path stores named |
| SHIELD honesty | Documented as **Neon-only** (no file mirror); fail-closed when Postgres required |
| Write path | Claim/finalize still dual-write file + PG when configured (local debug mirror); **reads prefer PG** so shared Neon sessions see truth |

### Click-path (ops)

1. Shared Neon sandbox: set throwaway `DATABASE_URL`, run orchestration.
2. Open Agent Ops → Durable CONDUCTOR runs.
3. Confirm `storeMode: postgres` badge (or `file` when hermetic / no DB).
4. Alerts / optional C4 webhook sample the same PG-preferred list.

---

## Non-goals

- **Not** flipping `productionRbacEnforced`.
- **Not** unifying care-episode file store or lab/pharmacy HITL primary file store.
- **Not** adding a SHIELD file mirror (SHIELD stays Neon-only).
- **Not** CSO exit-note / calendar product / Neon booking wizard (human/ops thin helpers remain post-D).
- **Not** live EMIS / EPS / PACS / PRISM / ATLAS expansion.
- **Not** autonomous Rx or EHR write.
- **Not** clinical validation or device certification.
- **Not** Broader PHI scrub beyond C4 (separate candidate).
- **Not** Workstream H perf SLOs or BRIDGE live adapters (`liveEmis` stays false).

---

## Definition of done

1. With `DATABASE_URL` unset, ops lists file store and report `storeMode: "file"` (hermetic A2/A4/C gates stay green).
2. With Postgres configured, successful list uses Neon rows and reports `storeMode: "postgres"` even when the local file mirror is empty/stale.
3. PG list failure falls back to file and reports `storeMode: "file_fallback"`.
4. Agent Ops UI shows store-mode honesty; no `productionRbacEnforced: true`.
5. `npm run test:milestone-d` green; docs under `docs/milestone-d/`.
6. C4 webhook residual no longer claims unresolved `file_vs_neon_ops` for durable-run ops lists.

---

## Gate commands

```bash
cd packages/platform-uk
npm run test:milestone-d:unify
npm run test:milestone-d
# optional throwaway Neon:
MILESTONE_A5_USE_NEON=1 USE_POSTGRES=true npm run test:milestone-d:neon
```

---

## Remaining after D

| Track | Residual |
| --- | --- |
| Human / ops | Facilitator calendar; CSO written exit note / `targetsConfirmedBy` capture UI; Neon sandbox booking helpers |
| Deferred eng | Care-episode + lab/pharmacy HITL file↔Neon unify — **shipped in Milestone E1** ([SHARED_RUN_CORRELATION.md](../milestone-e/SHARED_RUN_CORRELATION.md)); broader PHI scrub; Workstream H SLOs; BRIDGE adapter contract tests (`liveEmis:false`); production RBAC staged flip |

---

## Honesty copy (required)

- Durable-run ops reads prefer Neon when configured — file is hermetic / fallback, not the shared-sandbox source of truth.
- SHIELD audit is Neon-only; unavailable Postgres → fail-visible / fail-closed on consequential paths.
- Simulation / synthetic validation — not a clinical device certification.
- `productionRbacEnforced` remains false unless a separate governed flip lands.
- HITL required · `ehrWrite: false` · no autonomous Rx / live EHR write.
