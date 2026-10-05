# Aksh Health — Internal Testing Production QA Audit

**Audited:** 2026-10-05T15:40Z  
**Commit:** `6fcd38d`  
**URL:** https://akshhealth.com  
**Launch target:** Internal testing / synthetic clinic (not live PHI)

## Verdict

| Target | Decision |
|---|---|
| **Internal testing production (synthetic clinic)** | **GO** |
| **SIM-IG / SIM-EMR rehearsal** | **Pass** |
| Live patient PHI / DPIA (GOV-002) | Out of scope — still Blocked for *live PHI only* |
| Live EMIS / SystmOne partner write | Out of scope — still Blocked for *live EMR only* |

There are **no release blockers** for internal testing use. DPIA and live EMR remain correctly blocked as product honesty, not as stop-signs for this synthetic deployment.

## Evidence (this run)

| Check | Result |
|---|---|
| Vercel production | Ready (`0ne-health-5sqmjen16…`) |
| `GET /` + public smoke (10 pages) | PASS |
| `/platform` `/security` `/get-started` `/demo/patel` `/signin` `/dashboard/gp` | HTTP 200 |
| `/api/health` | Postgres **live** · Neo4j **mock** (`required:false`) |
| Unauth clinical/integration APIs | **401** (context, models, chat, simulated-ehr, emis-staging, bridge-staging, GraphRAG) |
| Homepage honesty copy | Clinical intelligence · Diabetes care · Request a Pilot · Human review |
| Demo cohort + simulated EHR unit suites | **10/10 PASS** |
| HITL → FHIR stage → sim write-back chain | PASS (`liveEmis:false`) |
| Master Journey (`AKSH_MASTER_SKIP_DURABLE=true`) | **PASS 34/41 · 7 skipped** (durable Neon steps intentionally skipped) |

## What “no blocks” means here

Allowed / expected for internal testing:
- Synthetic patients only (`realPatientData:false`)
- HITL Accept / Edit / Reject
- FHIR staging + simulated EMIS/SystmOne chart round-trip
- Neo4j mock / GraphRAG fallback
- Public demo dashboard prefixes with gated mutating APIs

Must still **not** claim:
- Live NHS/EHR write-back
- Real patient data handling
- MHRA / completed DPIA / autonomous clinical decisions

## Residual accepted for internal testing

1. Neo4j Aura paused → mock GraphRAG (acceptable; not required for demo clinic).
2. Durable Master Journey Neon steps skipped without full durable env in this gate run.
3. Unauthenticated GP demo UI loads by design; Ask Aksh / mutating APIs stay gated.

## Sign-off

**Internal testing production: GO.**  
Live PHI production and live EMR write-back remain Blocked until governance/partner work completes — by design, not as blockers for this release.
