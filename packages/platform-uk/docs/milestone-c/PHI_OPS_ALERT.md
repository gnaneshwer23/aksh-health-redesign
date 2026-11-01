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

| Store | Dual-path residual |
| --- | --- |
| Durable CONDUCTOR runs (`execution-run-store`) | File mirror + optional Neon `aksh.agent_intel_runs` — list/merge still prefers file in test/local paths |
| SHIELD audit | File + Postgres dual-write when configured |
| Care-episode open tasks | File-scoped episode store unless Neon episode path is used |
| Ops alert **evaluation** | Reads the same dual-path durable-run list — channel does not invent a third store |
| Lab/pharmacy HITL (C3) | Practice-scoped file + SHIELD dual-write |

C4 documents this residual; it does **not** unify stores. Shared-sandbox Neon automation remains a later gap (C5+).

---

## What C4 is not

- **Not** clinical validation or device / pager certification.
- **Not** Milestone C5 COMPASS expansion, calendar booking, or live connectors.
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

## Gaps for C5+

- COMPASS product expansion / calendar booking (out of scope here).
- Unify durable-run + SHIELD file↔Neon dual-path.
- Broader client-panel PHI scrub beyond lifestyle + audit normaliser.
- Neon shared-sandbox automation; CSO exit-note workflow; live integrations.
