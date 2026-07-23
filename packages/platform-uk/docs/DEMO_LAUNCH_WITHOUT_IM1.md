# Demo Launch Without IM1 / EMIS Partner / Hosted Medplum

**Date:** July 2026  
**Scope:** `packages/platform-uk` on `main` · target surface: **akshhealth.com** (Vercel)  
**Companion:** [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md) · [`PILOT_PACKAGE.md`](./PILOT_PACKAGE.md) · [`P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md)

---

## Verdict

**Demo launch is possible without IM1, EMIS Partner Programme credentials, or working hosted Medplum OAuth.**

The product spine already supports a pilot-ready walkthrough: Capture → agent drafts → HITL Accept/Edit/Reject → SHIELD audit → **simulated** write-back (`ehr-writeback-sim` / emis-staging), with `liveEmis:false` hard. Partner and Medplum tracks stay deferred; they are not blockers for a synthetic HITL demo.

| Dependency | Needed for demo? | Status for demo launch |
|---|---|---|
| **IM1** | No | Defer partner track; resume N1 pack only if credentials / reply appear later |
| **EMIS Partner Programme** | No | Use **sim write-back only**; optional private PMS only for private-clinic demos (not NHS GP) |
| **Hosted Medplum OAuth** | No | Keep BRIDGE as in-app FHIR staging (Neon JSON / file) or skip external FHIR server |

**Hard honesty:** `liveEmis:false` · HITL required · synthetic/demo data · **no** fake NHS write-back claims.

---

## What “demo launch” means

A **demo launch** is a **pilot-ready synthetic HITL loop** on production hosting (akshhealth.com / Vercel), not live NHS GP integration.

| In scope | Out of scope |
|---|---|
| Seeded / synthetic patients and cases ([`PILOT_PACKAGE.md`](./PILOT_PACKAGE.md)) | Live EMIS / SystmOne / IM1 network write |
| NextAuth + Neon session + SHIELD hash chain | Claiming certified / partner-approved |
| CONDUCTOR + NEXUS draft orchestration | Autonomous clinical write without Accept |
| HITL Accept → `ehr-writeback-sim` / emis-staging | Medplum OAuth green as a launch gate |
| Demo banners + Partner readiness honesty UI | Flipping `liveEmis` or inventing CSO signatures |
| FHIR Bundle download / PDF export as **handoff** story | Marketing “connected to EMIS” |

**Success story for audiences:** “Clinician-governed assistive layer: agents draft, clinician Accepts, audit records the decision, write-back is **simulated** until partners say otherwise.”

---

## Alternatives by blocked dependency

### EMIS alternatives (demo)

| Option | Use when | Honesty rule |
|---|---|---|
| **A. Sim write-back only (default)** | NHS GP / general demo | HITL Accept → `emis-staging` → `ehr-writeback-sim`. Label sim/staging everywhere. **Not** live EMIS. |
| **B. FHIR Bundle download / PDF export** | “What would go into the record?” handoff | Export clinician-accepted payload as Bundle or PDF. Manual filing story only — **not** API write-back. |
| **C. Optional private PMS (Cliniko / Zanda)** | Private clinic / aesthetics / allied-health demo only | Third-party clinic PMS APIs if product wants that story later. **Not** an NHS GP / EMIS substitute. Do not market as GP write-back. |

**Do not** treat Partner sandbox scaffold (N5) as live until credentials + UAT + signed go/no-go (N6–N7).

### Medplum alternatives (demo)

| Option | Use when | Honesty rule |
|---|---|---|
| **A. BRIDGE in-app FHIR staging (preferred for demo)** | Launch without external FHIR server | Store staged FHIR in Neon JSON (or file) behind BRIDGE APIs; UI shows staging / dry-run. No Medplum OAuth required. |
| **B. Skip external FHIR server** | Minimal demo | Keep dry-run / degraded Medplum path labelled; do not block launch on `Invalid client`. |
| **C. Self-host later (HAPI FHIR / local Medplum)** | Post-demo staging quality | Optional eng follow-up; still not Layer 15 EHR. |

Hosted Medplum Client Secret remains **optional** (N2); N3 (Medplum-backed rehearsal) is **paused** until secrets exist.

### IM1 alternatives (demo)

| Option | Use when | Honesty rule |
|---|---|---|
| **None required** | Demo launch | Partner / NHSE track is organisational, not a demo gate. |
| **Defer N1** | No IM1 credentials / unlikely reply | Keep outreach pack ready; do not block eng on send. |
| **Resume N1 pack later** | Credentials or ticket appear | Follow [`P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md); still `liveEmis:false` until N7. |

---

## Leverage existing stack (do not rebuild)

| Layer | Demo role |
|---|---|
| NextAuth + Neon | Auth, sessions, durable audit |
| Neo4j | Graph demos with honest mock banner when offline |
| AI Gateway agents | Draft-only Phase-1 set under CONDUCTOR |
| CONDUCTOR + NEXUS | Orchestrate → draft → HITL |
| SHIELD | Hash-chained accept/reject audit |
| `ehr-writeback-sim` / emis-staging | Simulated Accept → write path |
| Medplum dry-run | Optional; OAuth broken ≠ demo blocker |
| Partner sandbox scaffold (N5) | Flag-gated; `needs_partner` without creds |
| Pilot / rehearsal pages | `/demo/precision-health-loop`, `/review/rehearsal`, `/review/demo-readiness` |

---

## Ordered demo launch checklist

### Eng

1. Confirm production deploy on Vercel (akshhealth.com) is current `main`.
2. Confirm env: NextAuth, Neon, AI Gateway; **no** `liveEmis` flip; Partner sandbox flag **off** (default sim).
3. Confirm honesty surfaces: DemoDataBanner, SystemSpinePanel, Partner readiness → `liveEmis:false`.
4. Smoke: `npm run test:clinical-proof` · walkthrough path / demo-readiness as used in CI.
5. Rehearse script once on production URL: Capture → Orchestrate → HITL Accept → sim write-back → SHIELD evidence.
6. (Optional D1) FHIR-in-Neon staging + Accept→export Bundle + short demo script page — see below.
7. **Audit gate:** record pass/fail in Partner panel notes or a short demo-readiness export; do **not** set `certified:true`.

### User / org

1. Pick audience (product / clinical / regulatory) from [`PILOT_PACKAGE.md`](./PILOT_PACKAGE.md).
2. Reset seeded demo dataset before the live walkthrough.
3. Run Product → Clinical → Regulatory sequence as needed; end on accepted frozen artifact + governance.
4. Capture feedback via `/review/feedback`.
5. Do **not** claim live EMIS, IM1, Medplum write-back, or certification in decks or sales calls.
6. Partner outreach (IM1 / EMIS) stays optional background; demo does not wait on it.

### Audit gate (demo launch)

- [ ] `GET /api/clinical-spine/partner-readiness` → `honesty.liveEmis === false`
- [ ] Walkthrough uses synthetic/demo data with visible demo labelling
- [ ] HITL Accept required before any write-back-sim call
- [ ] No marketing / UI claim of live NHS GP write-back or partner certification
- [ ] Clinical-proof (or equivalent smoke) green on the build being demoed

---

## What NOT to claim during demo launch

- Live EMIS / SystmOne / IM1 write-back or “connected to the GP record”
- Partner Programme approved / sandbox live / certified
- Medplum as production FHIR store or “EHR integration complete”
- MHRA / DCB0129 / DTAC / CIS2 / Mirth as live
- PRISM / ATLAS / DrASSIST-as-peer-agent / JSL as live Phase-1 agents
- Autonomous clinical decisions without clinician Accept

**OK to claim:** assistive drafts; clinician HITL; SHIELD audit; simulated staging write-back; pilot-ready synthetic demo on akshhealth.com.

---

## D1 — Demo hardening (recommended next eng phase)

Partner-blocked phases **N3 / N5 live wire / N6 / N7** stay paused. Preferred eng focus: **D1 demo hardening**.

| ID | Task | Estimate | Notes |
|---|---|---|---|
| **D1-a** | FHIR-in-Neon staging for BRIDGE | 1–2 d | Persist Accept-staged Bundle/JSON in Neon; label staging; no Medplum required |
| **D1-b** | Accept → export FHIR Bundle (and/or PDF) | 0.5–1 d | Download handoff for demos; not network write-back |
| **D1-c** | Demo script page / runbook polish | 0.5 d | Tie `/demo/precision-health-loop` + pilot cases to a 10–15 min script with honesty callouts |

**Say `D1`** to start eng on that phase.  
**Say `N1`** only if IM1/Partner credentials or a real outreach thread appear later.

---

## Partner track (paused, not cancelled)

| Phase | Demo-path status |
|---|---|
| N1 outreach | Optional / deferred — not a demo gate |
| N2 Medplum secret | Optional staging quality |
| **N3** Medplum BRIDGE rehearsal | **Paused** — blocked on Medplum OAuth |
| N4 roster honesty | **PASS** — keep locked |
| N5 sandbox scaffold | **PASS (scaffold)** — no creds → leave flag off |
| **N5 live sandbox / N6 / N7** | **Paused** — blocked on partner credentials + signed go/no-go |

Full partner path remains in [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md) and [`P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md).

---

## Cross-links

- [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md) — N1–N10 + Demo path (no IM1)  
- [`PILOT_PACKAGE.md`](./PILOT_PACKAGE.md) — fixed cases + rehearsal runbook  
- [`HOW_TO_BUILD_AKSH_HEALTH.md`](./HOW_TO_BUILD_AKSH_HEALTH.md) — honest product picture  
- [`PHASE2_PARTNER_CHECKLIST.md`](./PHASE2_PARTNER_CHECKLIST.md) — when partner track resumes  
