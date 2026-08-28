# Aksh Health — Publication Ready Verdict

**Date:** 2026-08-28  
**Product:** Aksh Health (`packages/platform-uk`)  
**Production:** https://akshhealth.com  
**Branch / commit:** `main` (see deploy section below)  
**Framing:** Diabetes-specific simulated clinic · region-adaptable · honest LIVE vs SIMULATED vs NOT IMPLEMENTED

---

## Executive verdict: **YES — publication ready (demo / paired clinic)**

Aksh Health is **ready to publish as a simulated diabetes care-coordination clinic** with honest labelling. The Master Journey (35/35), stakeholder clinic, paired gp01 + patient01 on **P002 (Mr James Patel)**, production smokes, and typecheck all pass after this publication pass.

**Not ready for:** live clinical care, unconstrained external-user email, or claims that Neo4j graph / EMR / EPS / lab / voice are live.

---

## What was fixed in this pass

| Area | Change |
| --- | --- |
| **Email UX (P1 partial)** | Honest sandbox messaging on verify-email, forgot-password, and dashboard verification banner; resend-verification no longer leaks Resend errors; `NEXT_PUBLIC_EMAIL_DELIVERY_MODE=resend_sandbox` set in Vercel |
| **Resend domain prep** | `akshhealth.com` domain added in Resend (status: **not_started** — DNS records required, see user actions) |
| **Neo4j ops** | Added `scripts/resume-neo4j-aura.mjs` + `npm run aura:resume` for operator resume via Aura API |
| **Docs** | Committed E2E audit, Medblocks gap assessment, this publication verdict |
| **CI signal** | Fresh local validation + push to main triggers new E2E workflow run |

---

## Production health (post-pass)

```json
{
  "status": "ok",
  "database": { "configured": true, "connected": true, "mode": "live" },
  "neo4j": {
    "configured": true,
    "connected": false,
    "mode": "mock",
    "required": false
  }
}
```

| Component | Status | Class |
| --- | --- | --- |
| Postgres / Neon | **LIVE** | Platform auth, patient-state, consent, review queue |
| Neo4j Aura (`cbed9e8d`) | **MOCK / paused** | Graph panels use honest fallback until Aura resumed |
| NextAuth / sessions | **LIVE** | Demo cohort + signup |
| Honesty contract | `liveEmis:false` | Preserved |
| Transactional email | **PARTIAL** | Resend sandbox; UX now honest |

**Neo4j note:** Vercel env vars are correct (`NEO4J_URI=neo4j+s://cbed9e8d.databases.neo4j.io`). Local probe confirms Aura is **Paused** (empty routing table). Resume in [Neo4j Aura console](https://console.neo4j.io/) or `AURA_CLIENT_ID=... AURA_CLIENT_SECRET=... npm run aura:resume`, then `npm run data:seed:neo4j` if graph empty.

---

## Test results (2026-08-28)

| Suite | Result |
| --- | --- |
| `npm run typecheck` | **PASS** |
| `npm run test:workflow` | **PASS** (~82s) |
| Master Journey | **PASS** 35/35 · `aksh-master-20260812-4cc15d83` · P002 |
| Stakeholder clinic | **PASS** (10 roles) |
| `demo-patient-binding.test.ts` | **PASS** |
| `ask-aksh-patient-chat.test.ts` | **PASS** |
| `smoke:public` (production) | **PASS** 9/9 |
| `smoke:all` (production) | **PASS** 8/8 |

---

## Publication boundaries (honest)

### Ready to claim
- Simulated diabetes clinic loop end-to-end (CONNECT → LEARN)
- Paired gp01 + patient01 on P002 (HITL, consent, Ask Aksh, care plan visibility)
- 8 role dashboards with RBAC on akshhealth.com
- Postgres-backed auth, patient-state, consent grants, review queue
- HITL Accept/Edit/Reject → staging write-back (not live EMR)
- Organisation enquiry intake

### Simulated but complete
- Lab, pharmacy, nurse/coordinator, referral, CGM, appointments, VOICE→SYNTHESIS
- EHR adapter (`simulated_ehr_v1`)
- Population cohort (n=100 synthetic)
- Neo4j-dependent panels when Aura paused (mock fallback with banner)

### Not implemented / not claimed
- Live EMIS / SystmOne / EPS write-back
- Live lab / pharmacy vendor feeds
- Live microphone / ASR
- Transactional email to arbitrary external inboxes (until DNS verified)
- Clinical validation / MHRA / CQC sign-off
- Phase 2 PRISM/ATLAS (`live:false`)

---

## User actions remaining

### P1 — Resend DNS for akshhealth.com

Add these records at your DNS provider (domain created in Resend 2026-08-28):

| Type | Name | Value |
| --- | --- | --- |
| TXT | `resend._domainkey` | *(DKIM — see Resend dashboard → akshhealth.com)* |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (priority 10) |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |

After verification:
1. Set Vercel `EMAIL_FROM=Aksh Health <noreply@akshhealth.com>` (or `send@akshhealth.com`)
2. Set `NEXT_PUBLIC_EMAIL_DELIVERY_MODE=verified_domain` (or remove)
3. Redeploy and retest forgot-password to a non-owner inbox

### P2 — Neo4j Aura resume

1. [Neo4j Aura console](https://console.neo4j.io/) → instance `cbed9e8d` (Instance01) → **Resume**
2. Or: `AURA_CLIENT_ID=... AURA_CLIENT_SECRET=... npm run aura:resume`
3. `npm run data:seed:neo4j`
4. Confirm `curl -s https://akshhealth.com/api/health` → `neo4j.mode: "live"`

---

## Deploy

| Item | Value |
| --- | --- |
| Commit | *(filled after push — see git log)* |
| Vercel production | https://akshhealth.com |
| CI | E2E Tests workflow on push to main |

---

## Related documents

- `docs/e2e/AKSH-E2E-READINESS-AUDIT-20260828.md`
- `docs/e2e/AKSH-GO-LIVE-PRODUCTION-READY-20260813.md`
- `docs/architecture/MEDBLOCKS-GAP-ASSESSMENT.md`
- `docs/NEO4J_SETUP.md`
