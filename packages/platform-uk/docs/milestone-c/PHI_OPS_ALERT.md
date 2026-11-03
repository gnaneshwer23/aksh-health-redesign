# Milestone C4 — Residual PHI scrub + ops alert channel

**Audience:** Platform / ops engineers finishing A4 sandbox hygiene leftovers.  
**Depends on:** A4 PHI-safe refs + Agent Ops alerts; C1–C3 facilitator surfaces remain unchanged.  
**Companion:** [SECURITY_AND_PRIVACY.md](../milestone-a/SECURITY_AND_PRIVACY.md), [OBSERVABILITY_AND_OPERATIONS.md](../milestone-a/OBSERVABILITY_AND_OPERATIONS.md).

Synthetic / simulation honesty applies. Completing C4 does **not** flip `productionRbacEnforced`, certify a pager product, or enable live EHR / EPS / PACS.

---

## What was scrubbed

A4 left residual **label-shaped** SHIELD `resourceRef` values on lifestyle / non-critical agent routes (`Name (patientId)`). C4 replaces those with opaque `phiSafeResourceRef` / `pt_<hash>[:case_][:agent]` refs consistent with GUARDIAN / CONDUCTOR paths.

| Surface | Change |
| --- | --- |
| `/api/agents/sleep` | `resourceRef` → `phiSafeResourceRef(patientId, { agentLabel: "SLEEP" })` |
| `/api/agents/nutrition` | same · `NUTRITION` |
| `/api/agents/exercise` | same · `EXERCISE` |
| `/api/agents/mental-health` | same · `MENTAL_HEALTH` (same coaching family as A4 residual) |
| `/api/agents/referral` (PATHWAY) | same · `PATHWAY` + case id |
| `/api/agents/voice-care` | audit `resourceRef` hashed from case id; display label kept in payload only · GET fallback no longer treats `resourceRef` as a name |
| Coaching escalate UI | posts opaque patient id; server normalises |
| `POST /api/audit/shield` | **defence-in-depth** — `normaliseAuditResourceRef` rejects/coerces label-shaped client refs |

Helpers live in `lib/security/phi-safe-ref.ts` (`looksLikeLabelShapedResourceRef`, `normaliseAuditResourceRef`).

Draft **response bodies** may still include `patientLabel` for HITL UI — that is intentional. Audit / ops / webhook paths must not.

---

## Ops alert channel (optional, no PHI)

A4 alerts remain on Agent Ops (`GET /api/agents/ops-runs?alerts=1`). C4 adds an **optional** webhook / pager-lite notifier.

| Item | Detail |
| --- | --- |
| Module | `lib/agents/ops-alert-channel.ts` |
| Default | **OFF** |
| Trigger | `buildOpsAlerts` → `dispatchOpsAlertChannel` when env-enabled |
| Payload | alert `code`, `severity`, `count`, opaque `sampleRefs`, hashed `scopeKeyHash`, metrics — **no** names / NHS numbers / clinical free text |
| Throttle | in-process per fingerprint (default 60m) so dashboard polling does not flood |
| Honesty | `certificationClaim: false` · not an external certified pager / SOC |

### How to enable

```bash
# packages/platform-uk/.env.local (or Vercel env)
AKSH_OPS_ALERT_CHANNEL_ENABLED=true
AKSH_OPS_ALERT_WEBHOOK_URL=https://hooks.example/aksh-ops
# optional
AKSH_OPS_ALERT_MIN_SEVERITY=critical   # critical | warning | info
AKSH_OPS_ALERT_CHANNEL_TIMEOUT_MS=4000
AKSH_OPS_ALERT_CHANNEL_THROTTLE_MS=3600000
```

Webhook receivers should treat the body as operational telemetry only. Existing `OPS_ALERT_EMAIL` error-reporter path is unchanged (scrubbed application errors — separate from Agent Ops durable-run alerts).

---

## What is still dual-path (file vs Neon)

| Store | Dual-path residual (post–Milestone E1) |
| --- | --- |
| Durable CONDUCTOR runs (`execution-run-store`) | **D1 unified for ops reads** — Postgres-preferred list when `DATABASE_URL` set; file = hermetic / fallback. Claim/finalize may still mirror to file. See [DURABLE_OPS_UNIFY.md](../milestone-d/DURABLE_OPS_UNIFY.md). |
| SHIELD audit | **Neon-only** (no file mirror); fail-closed when Postgres required |
| Care-episode open tasks | **E1 unified for reads** — Postgres-preferred with `storeMode` honesty. See [SHARED_RUN_CORRELATION.md](../milestone-e/SHARED_RUN_CORRELATION.md). |
| Ops alert **evaluation** | Same Postgres-preferred durable-run list as Agent Ops (`storeMode` on summary) |
| Lab/pharmacy HITL (C3) | **E1 unified for reads** — dual-write + Postgres-preferred list (`storeMode`) |

C4 documented the residual; **Milestone D1** unifies durable-run **ops reads**; **Milestone E1** unifies care-episode + lab/pharmacy HITL reads.

---

## What C4 is not

- **Not** clinical validation or device / pager certification.
- **Not** Milestone C5 COMPASS product expansion / calendar booking / live connectors (C5 honesty polish — see [COMPASS_HONESTY.md](./COMPASS_HONESTY.md)).
- **Not** flipping `productionRbacEnforced`.
- **Not** scrubbing every dashboard panel `resourceRef` outside lifestyle + audit normaliser (other clinical UI posts may still send labels; audit route coerces them).
- **Not** autonomous Rx / live EHR / EPS / PACS.
- **Not** expanding PRISM/ATLAS product scope.

---

## Gate commands

From `packages/platform-uk`:

```bash
npm run test:milestone-c:phi-ops
npm run test:milestone-c
# includes: milestone-b + C1–C3 + C4 phi-ops + typecheck (via scripts)
```

---

## Gaps for D+

- COMPASS **product** expansion / calendar booking (C5 landed honesty labels only — see [COMPASS_HONESTY.md](./COMPASS_HONESTY.md)).
- Durable-run ops list unify — **shipped in Milestone D1** ([DURABLE_OPS_UNIFY.md](../milestone-d/DURABLE_OPS_UNIFY.md)); care-episode + lab/pharmacy HITL unify — **shipped in Milestone E1** ([SHARED_RUN_CORRELATION.md](../milestone-e/SHARED_RUN_CORRELATION.md)).
- Broader client-panel PHI scrub beyond lifestyle + audit normaliser.
- Neon shared-sandbox automation; CSO exit-note workflow; live integrations.
