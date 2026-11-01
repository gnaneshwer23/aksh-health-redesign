# Milestone C2 — Review honesty strip

**Audience:** GP / MDT / pharmacist reviewers and facilitators during **synthetic** HCP evaluation.  
**Depends on:** Milestone A1 execution metadata (`executionMode`, evidence refs), Milestone B Agent Ops honesty copy, Milestone C1 facilitator session UI.  
**Companion:** [FACILITATOR_SESSION.md](./FACILITATOR_SESSION.md), [HCP_AGENT_EVALUATION_PLAN.md](../agents/HCP_AGENT_EVALUATION_PLAN.md), [EVAL_ENVIRONMENT.md](../milestone-b/EVAL_ENVIRONMENT.md).

This surface makes trust-relevant labels visible on the **review path**. Completing C2 does **not** certify the product for clinical use.

---

## What C2 is

| Item | Detail |
| --- | --- |
| Review honesty strip | `ReviewHonestyStrip` on GP review queue (+ CONDUCTOR run chips) and pharmacist medication review |
| executionMode | From A1 `orchestration.execution.agents[]` after CONDUCTOR — deterministic / LLM / hybrid / per-agent chips |
| LLM week visibility | Thin read of `ENABLE_LLM_*` via `GET /api/agents/orchestrate` capabilities (`llmSessionMode`) — deterministic week vs opt-in LLM week |
| Sim adapters | Lab / pharmacy / EHR / EPS labelled **simulation / not live** |
| HITL reminder | HITL required · `ehrWrite: false` · no autonomous Rx |
| Consistency with C1 | HCP eval session links to GP review queue; strip links back to HCP session + Agent Ops |

### What reviewers see

1. **Session mode chip** — “Deterministic week (ENABLE_LLM_*=false)” or “Opt-in LLM week (…)” when flags are on in simulation.
2. **HITL / no EHR write** badge on every review surface that mounts the strip.
3. **Honesty lines** — same trust copy as Agent Ops (simulation ≠ certification; acceptance ≠ accuracy; lab/pharmacy sim; PRISM/ATLAS scaffolds).
4. **Adapter sim labels** — lab, pharmacy, EHR write-back, EPS all `live: false`.
5. **After Run CONDUCTOR** — compact run honesty: overall mode + per-agent `executionMode` + evidence ref count / Guardian gateway outcome when present.

### Click-path (reviewer)

1. From C1 HCP eval session → **GP review queue · honesty strip (C2)** (patient query preserved when a case is selected).
2. Or open `/dashboard/gp/review-queue` directly (or pharmacist `/dashboard/pharmacist/reviews`).
3. Read the full honesty strip (session mode + adapters).
4. Select patient → Run CONDUCTOR → read run honesty chips on the agent brief before Accept/Edit/Reject.

---

## What C2 is not

- **Not** clinical validation or device certification.
- **Not** a full LLM policy admin product (no toggling flags from the UI; facilitator documents opt-in LLM week separately).
- **Not** Milestone C5 COMPASS product expansion (C5 is honesty polish only — see [COMPASS_HONESTY.md](./COMPASS_HONESTY.md)). Lab/pharmacy product HITL is **C3** — see [LAB_PHARMACY_HITL.md](./LAB_PHARMACY_HITL.md). C4 residual PHI scrub + ops alert channel — see [PHI_OPS_ALERT.md](./PHI_OPS_ALERT.md).
- **Not** flipping `productionRbacEnforced`.
- **Not** live EPS / EHR / PACS connectors.
- **Not** expanding PRISM/ATLAS product scope.
- **Not** autonomous Rx or EHR write (`ehrWrite` remains false).

---

## Gate commands

From `packages/platform-uk`:

```bash
npm run test:milestone-c
# includes: milestone-b + C1 UI + C2 honesty harness + typecheck (via milestone-b / c scripts)
```

Standalone C2 harness:

```bash
npm run test:milestone-c:honesty
```

---

## Honesty copy (required)

- Simulation / synthetic validation — not a clinical device certification.
- Acceptance rate is a workflow metric, not a clinical accuracy score.
- LLM calls are gated; deterministic fallbacks may be in use.
- HITL required · ehrWrite: false · no autonomous Rx / live EHR write.
- Lab / pharmacy remain simulation-labelled unless live connectors are explicitly enabled (they are not in C2).
- PRISM/ATLAS are scaffolds — never present as live CONDUCTOR actors.
