# Milestone D — Durable Ops Store Unify

**Status:** engineering gate for shared Neon HCP sandbox honesty  
**Depends on:** Milestone A2–A4 durable runs + Agent Ops; Milestone C closed (`448d7e8` / PR #109)  
**Audience:** Platform / ops engineers preparing multi-user synthetic HCP sessions on throwaway Neon.

Completing D does **not** certify clinical use, flip `productionRbacEnforced`, enable live EMR/EPS/PACS, or expand PRISM/ATLAS.

---

## Why this phase

After Milestone C, Agent Ops still **listed durable CONDUCTOR runs from the file mirror only**, while claim/finalize dual-wrote Neon when `DATABASE_URL` was set. On shared Neon / serverless instances that under-counted failures and SHIELD-block rates — a material honesty gap for facilitator sessions.

**Milestone D** ships a **vertical slice**: Postgres-preferred durable-run **reads** for Agent Ops + alerts, with hermetic file fallback and an explicit `storeMode` badge. SHIELD remains Neon-only (no file mirror). Care-episode and lab/pharmacy HITL file primaries were deferred to **Milestone E1** ([SHARED_RUN_CORRELATION.md](../milestone-e/SHARED_RUN_CORRELATION.md)).

See [DURABLE_OPS_UNIFY.md](./DURABLE_OPS_UNIFY.md) for scope, non-goals, and definition of done.

---

## Gate commands

From `packages/platform-uk`:

```bash
npm run test:milestone-d
# includes: D1 durable-ops unify harness + typecheck
# optional shared Neon (throwaway DATABASE_URL only):
# MILESTONE_A5_USE_NEON=1 USE_POSTGRES=true npm run test:milestone-d:neon
```

Standalone:

```bash
npm run test:milestone-d:unify
```

---

## Hard rules preserved

- No autonomous Rx / live EHR write (`ehrWrite: false`, `liveEmis: false`)
- Synthetic / simulation data only
- HCP eval ≠ clinical validation
- Guardian / SHIELD / care-episode / tenant isolation preserved
- `productionRbacEnforced` **not** flipped
- No live EPS / EHR / PACS / PRISM / ATLAS product expansion
