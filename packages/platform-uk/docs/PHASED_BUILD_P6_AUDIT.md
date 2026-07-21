# P6 Audit — Full regression (after P1–P5)

**Date:** 2026-07-21  
**Branch:** `main`  
**Scope:** Prove phased build works end-to-end on platform scope (not production-ready EHR). Open register = P7 + Phase-2 PRISM/ATLAS + optional secrets only.

## Exit criteria — PASS (with documented soft/degraded gates)

| Criterion | Result | Evidence |
|---|---|---|
| All automated hard gates green (or waived with env reason) | **PASS** | See matrix below |
| Open register only P7 / secrets / Phase 2 | **PASS** | Gap map updated; no new product-spine gaps |
| Honesty rules intact | **PASS** | `liveEmis:false` · `autoRetrain:false` · `canFlipLiveEmisInCode():false` · no `certified:true`; fixed residual “SystmOne-ready” copy |
| Clinical-proof not red | **PASS** | Unit + E2E exit 0 |
| NEXUS ∈ CONDUCTOR matches marketing | **PASS** | Orchestrate agents include NEXUS; pipeline `LIVE · in CONDUCTOR` |

**P6 exit:** **PASS** — platform regression green; partner/EHR remains external (P7). Medplum OAuth stays degraded (P5 carry-forward). Role `smoke:all` soft-skipped (no `SMOKE_*` credentials).

## Pass/fail matrix

| Check | Pass bar | Result | Notes |
|---|---|---|---|
| `npm run test:clinical-proof` | Exit 0 | **PASS** | Spine A–F · NEXUS · orchestration · Medplum contract |
| `npm run test:workflow` | Exit 0 | **PASS** | Fixed stale route-smoke assert (PatientCompanion → `SafetyRouteCoachingGate` → `CoachingDraftPanel`) |
| `npm run typecheck` | Exit 0 | **PASS** | `tsc -p tsconfig.verify.json` |
| `npm run test:e2e:clinical-proof` | Exit 0 | **PASS** | 19 passed (HITL · Patel · multi-patient · orchestration · RBAC · Neo4j honesty) |
| `e2e/marketing.spec.ts` | Exit 0 | **PASS** | 35 passed (needs `DATABASE_URL` from `.env.local`) |
| `npm run smoke:medplum` | Soft-ok / degraded | **PASS (degraded)** | With creds: `passMode=degraded_rehearsal_oauth_failed` (Invalid client); without: `disabled_honest` |
| `npm run smoke:neo4j` | Soft-ok | **PASS** | Against `https://akshhealth.com` — honest `mode=mock` / `connected=false` |
| `npm run smoke:all` | Soft-ok per env | **SOFT-SKIP** | `SMOKE_GP_EMAIL` / `SMOKE_GP_PASSWORD` missing locally; not a code regression |
| `npm run smoke:public` (prod) | Soft | **N/A / drift** | Prod copy mismatch vs local marketing (local E2E green) — deploy lag, not P6 blocker |
| Partner readiness | `liveEmis:false` · `autoRetrain:false` · no certified unlock | **PASS** | `buildPartnerReadinessPack()` · `canFlipLiveEmisInCode()===false` · tracks `needs_partner` / `unsigned` |
| Manual Capture→Draft→Approve | Orchestrate incl. NEXUS → HITL → stage/sim | **PASS** (spot) | Unit orchestration + ClinicalOrchestratePanel + AgentControl CANVAS/BRIDGE/CONDUCTOR strip |
| Gap doc remaining | P7 / secrets / Phase 2 only | **PASS** | See open register |

## Spot-checks (honesty + brand)

| Spot | Result |
|---|---|
| Orchestrate includes NEXUS | **PASS** — `agents: ["SYNTHESIS","GUARDIAN","ORACLE","NEXUS"]`; clinical-proof order includes NEXUS |
| GP CANVAS / BRIDGE / CONDUCTOR | **PASS** — `gp-agent-brand-strip` + Agent Control labels |
| How-it-works honesty | **PASS** — “no live EMIS or SystmOne write-back”; Capture → draft → approve; `liveEmis:false` in journey copy |
| Pipeline NEXUS badge | **PASS** — `LIVE · in CONDUCTOR` |
| Residual “SystmOne-ready” | **FIXED** — WhatsNew Integrations card → “Designed for SystmOne coordination flows” |

## Regression fix shipped this gate

| File | Change |
|---|---|
| `tests/route-smoke.test.ts` | Assert coaching via `SafetyRouteCoachingGate` → `CoachingDraftPanel` (PatientCompanion no longer imports panel directly) |
| `components/marketing/WhatsNewSection.tsx` | Replace “SystmOne-ready” with “Designed for SystmOne…” |

## Known degraded / deferred (honest)

| Item | Status | Owner |
|---|---|---|
| Medplum OAuth live rehearsal | **Degraded** — UUID-shaped secret → `Invalid client` | user (real Client Secret) |
| Local Deepgram / live ASR | **Simulated** locally; Vercel has key | user (optional `.env.local`) |
| Role dashboard `smoke:all` | Soft-skip without `SMOKE_*` | eng (optional credentials) |
| Layer 15 live EMIS/SystmOne | **P7** — external | user / partner / CSO |
| PRISM / ATLAS | Phase 2 roadmap | product |

## Open register for P7

1. EMIS Partner Programme + CIS2 + Mirth on-prem (external).
2. Signed DPIA / DPA / CSO Gate 2 / DTAC-DCB-MHRA route funded.
3. Partner UAT + eng `liveEmis` flip checklist only after go/no-go (`canFlipLiveEmisInCode` stays `false` until then).
4. Optional: real Medplum Client Secret + local Deepgram for green live staging rehearsal (not Layer 15).

## Go / no-go — partner track

| Recommendation | Rationale |
|---|---|
| **GO for P7 paperwork / partner outreach** | Product spine P0–P6 complete; honesty invariants hold; Capture→Draft→Approve proven in tests |
| **NO-GO for eng `liveEmis` flip** | No signed partner artefacts; `canFlipLiveEmisInCode():false`; staging/sim only |
| **NO-GO for marketing “live / certified / ready” EHR claims** | Keep Designed-for / staging language until P7 exit |

## Commands re-run (2026-07-21)

```text
npm run test:clinical-proof          → exit 0
npm run test:workflow                → exit 0 (after route-smoke fix)
npm run typecheck                    → exit 0
npm run test:e2e:clinical-proof      → 19 passed
npx playwright test e2e/marketing.spec.ts → 35 passed
npm run smoke:medplum                → degraded_rehearsal_oauth_failed (exit 0)
SMOKE_SKIP_DOTENV=1 ENABLE_MEDPLUM_SYNC=false npm run smoke:medplum → disabled_honest
npm run smoke:neo4j                  → exit 0 (mock honesty)
```
