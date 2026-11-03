# Milestone E — Shared Run Correlation

**Status:** engineering gate for shared Neon HCP sandbox honesty  
**Depends on:** Milestone D1 durable-ops unify; Milestone A2 durable runs; care-episode + lab/pharmacy HITL (C3)  
**Audience:** Platform / ops engineers preparing multi-user synthetic HCP sessions on throwaway Neon.

Completing E does **not** certify clinical use, flip `productionRbacEnforced`, enable live EMR/EPS/PACS, or expand PRISM/ATLAS.

---

## Why this phase

After Milestone D1, durable CONDUCTOR **ops lists** preferred Neon, but:

1. **P0.1** — `POST /api/agents/orchestrate` accepted `careEpisodeId` yet only correlated **after** fan-out; `idempotencyKey` / tenant `scopeKey` were not passed into `runClinicalSpineOrchestrate`, so durable claim / SHIELD / `agent_intel_runs` did not share the client episode identity before agents ran.
2. **P0.2** — Care-episode and lab/pharmacy HITL remained **file-primary** for lists, under-counting shared Neon sandboxes (D1 residual).

**Milestone E1** threads orchestrate identity into the durable claim path and collapses care-episode + lab/pharmacy HITL onto the same Postgres-preferred `storeMode` pattern as D1.

See [SHARED_RUN_CORRELATION.md](./SHARED_RUN_CORRELATION.md) for scope, non-goals, and definition of done.

---

## Gate commands

From `packages/platform-uk`:

```bash
npm run test:milestone-e
# includes: E1 shared-run correlation harness + typecheck + cheap D1 residual check
```

Standalone:

```bash
npm run test:milestone-e:correlate
```

---

## Hard rules preserved

- No autonomous Rx / live EHR write (`ehrWrite: false`, `liveEmis: false`)
- Synthetic / simulation data only
- HCP eval ≠ clinical validation
- Guardian / SHIELD / care-episode / tenant isolation preserved
- `productionRbacEnforced` **not** flipped
- No live EPS / EHR / PACS / PRISM / ATLAS product expansion
