# Built vs Remaining — Aksh Health (platform-uk)

**Date:** 2026-07-24 (BST)  
**Live:** https://akshhealth.com  
**Repo:** `gnaneshwer23/0ne-Health` · package `packages/platform-uk`  
**Audited SHA:** `b1399ff` (`main` · matches `origin/main` at audit time)  
**Sources:** `PRODUCTION_READINESS_AUDIT.md`, `NEXT_BUILD_STEPS.md`, `NEXT_UX_STAKEHOLDER_BUILD.md`, `DEMO_LAUNCH_WITHOUT_IM1.md`, `HOW_TO_BUILD_AKSH_HEALTH.md`, `BUILD_INSTRUCTIONS_GAP.md`, P0–P7 / N* / U1–U8 / D1 / design-refresh audits, feature scan

---

## Honesty first

**What you have is a polished synthetic HITL demo / pilot marketing product — not a live NHS EMR integration.**

| Claim | Truth |
| --- | --- |
| Demo on akshhealth.com | **Yes** — Capture → drafts → clinician Accept → BRIDGE stage / sim write → SHIELD |
| Live EMIS / SystmOne / IM1 write-back | **No** — `liveEmis:false` hard; Partner sandbox scaffold only |
| Certified / CSO-signed / DTAC / DCB0129 / CIS2 | **No** — templates + rehearsal only |
| PRISM / ATLAS / JSL live | **No** — Phase 2 / not wired |

**Demo launch ≠ live NHS clinical production.** Track A (demo) and Track B (live EMR) must stay separate in decks and sales calls.

---

## Verdict snapshot

| Track | Bar | Verdict |
| --- | --- | --- |
| **A — Polished demo / pilot marketing** | Synthetic HITL · honest marketing · rehearsable script · no live EMR claims | **GO WITH LIGHT POLISH** |
| **B — Live NHS clinical / EMR** | IM1/EMIS write-back · Medplum prod · CIS2 · CSO gates | **NO-GO** (by design until partners + signed N7) |

**Eng spine (P0–P7 paperwork, D1, N4, N5 scaffold, U1–U8):** largely **DONE**.  
**Remaining work** is demo ops polish, CI/hygiene, optional secrets, and **user/partner**-owned outreach — not rebuilding CONDUCTOR/SHIELD/NextAuth.

---

## 1. What’s built (grouped)

### Marketing / design

| Item | Status | Notes |
| --- | --- | --- |
| Clinical Signal design refresh (V1) | **Built** | Spruce/mist/signal tokens; Bricolage + Hanken; hero atmosphere — `DESIGN_REFRESH_V1_AUDIT.md` |
| Enterprise copy polish | **Built** | Linear/Stripe-style tone; jargon stripped on public surfaces |
| Home / how-it-works / platform / resources / security | **Built** | Agent pipeline story; honesty: drafts · not live feed · clinician gate |
| Audience `for-*` pages (U2) | **Built** | Role agent maps + HITL framing |
| Marketing honesty policy | **Built** | No homepage “100 patients” volume claim; no `liveEmis:false` leakage on public homepage; e2e-enforced |
| `/demo/script`, Patel / walkthrough | **Built** | Guided demo path |

### Auth / onboarding

| Item | Status | Notes |
| --- | --- | --- |
| NextAuth + Neon users | **Built** | Credentials (+ optional clinical OAuth hooks); **not** Supabase |
| Signup / signin / reset / verify | **Built** | Real forms, not Loading-only shells |
| 8-role onboarding (U3) | **Built** | role-select → identity → org → preferences → consent → tutorial → complete; Neon progress |
| Middleware role + onboarding gates | **Built** | Dashboard access gated on completion |

### Eight role dashboards (U4–U8)

| Role | Status | Hero demo beat |
| --- | --- | --- |
| GP | **Built** | Review → Accept → FHIR export (`GpHeroDemoPath`) |
| Nurse | **Built** | Obs → handover → GUARDIAN |
| Pharmacist | **Built** | Med review → GUARDIAN → HITL stage |
| Admin / practice-manager | **Built** | Integrations honesty → SHIELD → enquiries |
| ICS | **Built** | Population → COMPASS equity → forecast (synthetic) |
| Hospital | **Built** | Wards → capacity → staffing (synthetic PAS) |
| Patient | **Built** | My Health → plan → consent companion |
| Researcher | **Built** | Ethics → evaluation → data access; ATLAS Phase 2 labelled |

### Clinical spine (HITL / SHIELD / CONDUCTOR / agents)

| Item | Status | Notes |
| --- | --- | --- |
| HITL Accept / Edit / Reject | **Built** | Mandatory before staging / sim write |
| CONDUCTOR orchestrate | **Built** | Deterministic spine (`lib/clinical-spine/orchestrate.ts`); **not** LangGraph |
| NEXUS in default path | **Built** | Draft-only + SHIELD |
| Phase-1 12-agent directory | **Built** | SYNTHESIS, GUARDIAN, HORIZON, PATHWAY, COMPASS, CANVAS, BRIDGE, CONDUCTOR, SHIELD, NEXUS, … via AI Gateway + fallbacks |
| SHIELD hash-chained audit | **Built** | Neon `aksh.shield_audit_events` |
| `liveEmis:false` hard guards | **Built** | Types, API reject, sandbox never live-writes |
| VOICE / Dr.Assist | **Built as sub-caps** | Not peer Phase-1 agents; ASR simulated without Deepgram key |
| P0–P6 product spine + P7 paperwork | **Built / PASS** | Outreach pack + PartnerReadinessPanel; live flip still NO-GO |

### Neo4j

| Item | Status | Notes |
| --- | --- | --- |
| Driver + patient / guardian / ICS routes | **Built** | Live Aura when configured |
| Seed (incl. 100 cohort) | **Built** | `npm run data:seed:neo4j` / cohort `--with-neo4j` |
| Honest mock fallback | **Built** | Banner when offline — not a silent lie |

### Demo cohort (100 / 100)

| Item | Status | Notes |
| --- | --- | --- |
| Patients P001–P100 | **Built** | Fixtures P001–P026 + generator P027–P100 |
| 100 role-spread demo users | **Built** | `@demo.akshhealth.com`; seed scripts documented |
| Dashboard / outcomes use | **Built** | Cohort stays **off** marketing homepage (policy) |

### BRIDGE FHIR-in-Neon

| Item | Status | Notes |
| --- | --- | --- |
| D1 FHIR staging in Neon (+ file fallback) | **Built / PASS** | `aksh.fhir_staging_bundles` |
| Accept → FHIR Bundle / PDF export | **Built / PASS** | Handoff story, not live EMR |
| `ehr-writeback-sim` / emis-staging | **Built** | Simulated write only |
| Hosted Medplum OAuth / live sync | **Partial / paused** | Dry-run / degraded rehearsal; needs real Client Secret |

### Partner scaffolding

| Item | Status | Notes |
| --- | --- | --- |
| P7 outreach pack | **Built** | Ready to send — **not sent** (user) |
| N5 Partner sandbox client scaffold | **Built** | Flag-gated; without creds → `needs_partner` |
| Admin PartnerReadinessPanel | **Built** | Honesty: `liveEmis:false` |
| N5 live wire / N6 UAT / N7 flip | **Not started (blocked)** | Partner creds + signed go/no-go |

### CI / deploy (known at audit)

| Check | Result |
| --- | --- |
| Latest `main` SHA | `b1399ff` — homepage hero pipeline board |
| Local vs `origin/main` | In sync at audit |
| Latest E2E on `main` | **Success** — [run 30023046151](https://github.com/gnaneshwer23/0ne-Health/actions/runs/30023046151) |
| Prior red `verify` (stale marketing asserts) | **Fixed** on later commits (see recent green runs) |
| Production | Vercel · akshhealth.com tracks `main` (confirm alias SHA on next deploy) |
| Hygiene debt | Large untracked `data/` dumps still a risk if present locally — broaden gitignore / prune |

---

## 2. What’s remaining (prioritised)

### Must — polished demo launch

1. **Demo ops rehearsal on production** — one full `/demo/script` walkthrough on akshhealth.com (Capture → HITL Accept → BRIDGE/sim → SHIELD); reset cohort before the live room.
2. **Keep CI green** — protect `npm run verify` + E2E from copy/assert drift after marketing tweaks.
3. **Repo hygiene** — gitignore / prune untracked `data/` dumps so status stays clean and secrets aren’t committed by accident.
4. **Talk-track lock** — every deck/call: synthetic HITL · sim staging · **not** live NHS EMR / certified.

### Should — pilot credibility

1. Optional Integrate / marketing wording pass where “staged to EMIS” could be misread as live write-back → prefer “sim / designed-for pathways.”
2. Optional Deepgram key in local/Vercel for live VOICE ASR (still labelled sub-capability).
3. Broader a11y / contrast beyond homepage axe coverage.
4. Rehearse 2–3 non-GP roles (nurse / admin / ICS) from `/demo/script` so multi-stakeholder pilots don’t apologise for empty shells.

### Blocked on user / partner

| Blocker | Why | Owner |
| --- | --- | --- |
| **IM1 / EMIS Partner outreach (N1)** | Pack ready; thread not sent | **User / org** |
| **Medplum Client Secret (N2)** | Unlocks hosted FHIR staging rehearsal (N3) | **User** supplies · eng verifies |
| **Partner sandbox credentials (N5 live)** | Scaffold exists; live wire paused | **Partner** |
| **CSO / IG / Gate 1–3 sign-off** | Safety case / DTAC / DCB templates only | **User / clinical safety** |
| **Signed N7 `liveEmis` go/no-go** | Hard invariant until then | **User + partner + eng checklist** |

### Later / Phase 2

| Item | Status |
| --- | --- |
| **PRISM** (imaging intelligence) | Not built · `live:false` |
| **ATLAS** (clinical research agent) | Not built · `live:false` |
| **JSL NLP** | Not wired · do not claim live |
| **Live VOICE ASR** as product default | Optional Deepgram; simulated path OK for demo |
| **CIS2 / Mirth / funded DTAC–DCB–MHRA** | External parallel · N10 |
| **Private PMS** (Cliniko/Zanda) | Optional non-NHS demo only — not EMIS substitute |

---

## 3. Clear status table

| Feature | Built | Partial | Not started | Notes |
| --- | :---: | :---: | :---: | --- |
| Marketing site (Clinical Signal) | ✓ | | | Design refresh + enterprise polish shipped |
| Auth (NextAuth + Neon) | ✓ | | | Do not switch to Supabase |
| Onboarding (8 roles) | ✓ | | | U3 PASS |
| GP dashboard | ✓ | | | U4 PASS · hero clinical demo |
| Nurse / pharmacist dashboards | ✓ | | | U5 PASS |
| Admin dashboard | ✓ | | | U6 PASS · ops honesty |
| ICS / hospital dashboards | ✓ | | | U7 PASS · synthetic aggregates |
| Patient / researcher dashboards | ✓ | | | U8 PASS · ATLAS not live |
| HITL review queue | ✓ | | | Accept required before stage |
| CONDUCTOR + NEXUS | ✓ | | | Deterministic; not LangGraph |
| Phase-1 12 agents (drafts) | ✓ | | | AI Gateway + fallbacks |
| SHIELD audit | ✓ | | | Hash chain in Neon |
| Neo4j graph | ✓ | | | Mock banner when offline |
| Demo cohort 100 patients / 100 users | ✓ | | | Demo/dashboard only · not homepage claim |
| BRIDGE FHIR-in-Neon + export | ✓ | | | D1 PASS |
| Sim write-back (`ehr-writeback-sim`) | ✓ | | | Never live EMIS |
| `/demo/script` + Patel | ✓ | | | Demo ops surface |
| `liveEmis:false` guards | ✓ | | | Correct for demo; must stay until N7 |
| Partner readiness UI + P7 pack | ✓ | | | Ready · outreach not sent |
| Partner sandbox scaffold (N5) | ✓ | | | Flag off without creds |
| CI E2E on `main` | ✓ | | | Latest run **success** (`b1399ff`) |
| Medplum hosted OAuth / sync | | ✓ | | Dry-run / Invalid client without real secret |
| Deepgram live VOICE | | ✓ | | Simulated without key · OK for demo |
| Marketing Integrate wording precision | | ✓ | | Risk of “staged to EMIS” misread |
| Untracked `data/` hygiene | | ✓ | | Local dump sprawl risk |
| IM1 / Partner outreach sent | | | ✓ | User-owned · deferred for demo |
| Partner live sandbox wire | | | ✓ | Blocked on creds |
| Partner UAT + rollback (N6) | | | ✓ | Blocked on partner |
| `liveEmis` flip (N7) | | | ✓ | Blocked on signed go/no-go |
| CIS2 / Mirth | | | ✓ | External |
| CSO-signed safety case / Gates 1–3 | | | ✓ | Templates only |
| PRISM | | | ✓ | Phase 2 |
| ATLAS | | | ✓ | Phase 2 |
| JSL NLP integration | | | ✓ | Not wired |
| Live NHS EMR production | | | ✓ | Track B NO-GO |

---

## 4. Recommended next 5 actions

| # | Action | Owner |
| --- | --- | --- |
| **1** | Rehearse production `/demo/script` end-to-end once; capture any broken CTA or honesty slip | **Eng** (run) + **User** (attend / sign talk-track) |
| **2** | Confirm Vercel production alias SHA = current `main`; keep E2E green after any marketing edit | **Eng** |
| **3** | Broaden `.gitignore` / prune local `data/` dumps; never commit secrets or cohort dumps | **Eng** |
| **4** | Optional: tighten Integrate copy to “sim / designed-for EMIS pathways — not live write-back” | **Eng** (copy) |
| **5** | When ready for Track B: send IM1/Partner email from P7 pack; supply Medplum Client Secret; kick CSO/IG note — still **do not** flip `liveEmis` without signed N7 | **User / partner** (primary) · eng supports |

**Do not** rebuild NextAuth, Neon SHIELD, CONDUCTOR, or invent certification. **Do not** market PRISM/ATLAS/JSL or live EMIS.

---

## Path to “demo GO” vs “live NHS GO”

```text
Demo GO (Track A)          Live NHS GO (Track B)
─────────────────          ─────────────────────
Spine + U1–U8 + D1 DONE    Partner creds
→ Rehearse /demo/script    → Medplum OAuth green
→ Keep CI green            → Sandbox UAT (N6)
→ Honest talk-track        → CSO / Gates 1–3
→ Optional copy/a11y       → Signed N7 liveEmis flip
                           → CIS2 / Mirth / funded regulatory
```

---

## Related docs

- [`PRODUCTION_READINESS_AUDIT.md`](./PRODUCTION_READINESS_AUDIT.md) — Track A/B (note: CI section may lag; this audit supersedes CI status as of 2026-07-24)
- [`DEMO_LAUNCH_WITHOUT_IM1.md`](./DEMO_LAUNCH_WITHOUT_IM1.md) — demo without partner
- [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md) — N1–N10 + D1
- [`NEXT_UX_STAKEHOLDER_BUILD.md`](./NEXT_UX_STAKEHOLDER_BUILD.md) — U1–U8 complete
- [`HOW_TO_BUILD_AKSH_HEALTH.md`](./HOW_TO_BUILD_AKSH_HEALTH.md) — plain-English stack truth
- [`BUILD_INSTRUCTIONS_GAP.md`](./BUILD_INSTRUCTIONS_GAP.md) — Layers 1–15 vs code
- [`DEMO_COHORT_SEED.md`](./DEMO_COHORT_SEED.md) — 100/100 synthetic cohort
- [`P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md) — when Track B starts

---

*Audit artefact only — does not change runtime flags, partner posture, or `liveEmis`.*
