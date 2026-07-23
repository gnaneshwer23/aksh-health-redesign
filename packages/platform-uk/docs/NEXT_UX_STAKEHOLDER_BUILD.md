# Next UX / Stakeholder Surface Build (U-phases)

**Date:** July 2026  
**Scope:** `packages/platform-uk` product surface for **demo launch** — landing, onboarding, role dashboards  
**Companion:** [`DEMO_LAUNCH_WITHOUT_IM1.md`](./DEMO_LAUNCH_WITHOUT_IM1.md) · [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md) · [`DEMO_LAUNCH_D1_AUDIT.md`](./DEMO_LAUNCH_D1_AUDIT.md)

---

## Verdict

**Yes — enhance three areas next:** (1) landing / marketing that explains the **new agents and how they work**, (2) **personalised onboarding**, (3) **each stakeholder’s dashboard**. Do **not** rebuild the DONE clinical spine (NextAuth, Neon, SHIELD, CONDUCTOR+NEXUS, HITL, BRIDGE Neon staging, demo script, honesty flags). Keep `liveEmis:false`.

**Recommended start:** **U1** — deepen the agents + how-it-works story on marketing surfaces so demos open with a clear 12-agent narrative before any role login.

---

## Context (what is already DONE)

| Layer | Status | Implication for UX work |
|---|---|---|
| Clinical spine (orchestrate → HITL → SHIELD → sim write) | **DONE** | Do not re-architect |
| **D1** FHIR-in-Neon BRIDGE + Accept→export + `/demo/script` | **PASS** | Demo walkthrough works; UX polish is the gap |
| Phase-1 12-agent directory | **Live drafts** (HORIZON, PATHWAY, COMPASS, NEXUS, CANVAS, BRIDGE, CONDUCTOR, SHIELD, SYNTHESIS, GUARDIAN, …) | Marketing must stay honest |
| PRISM / ATLAS | Phase 2 · `live:false` · **not built** | Never claim live |
| VOICE / DrASSIST | **Sub-capabilities** under CANVAS / SYNTHESIS | Not peer agents |
| Partner / IM1 / Medplum OAuth / `liveEmis` | Paused or false | UX must keep honesty banners |

---

## 1. Honest gap — what’s already good vs thin

### Already good (keep; polish only)

| Surface | What’s solid |
|---|---|
| **Home** (`/`) | Hero, vision, scroll story, platform flow, roles grid, CTA — real composition, not a stub |
| **How it works** (`/how-it-works`) | `HowItWorksPageContent` + `EndToEndPipelineDiagram` + journey preview — honesty badges for staging / Phase 2 |
| **Platform** (`/platform`) | AgentGrid (12 agents, Phase 2 badges), HITL story, pipeline links |
| **Agent honesty (N4)** | `AGENT_DIRECTORY` · AgentGrid · marketing e2e — VOICE/DrASSIST not peers; PRISM/ATLAS not live |
| **GP dashboard** | **U4 PASS** — hero path + U1-aligned Agent Control; see [`NEXT_UX_U4_AUDIT.md`](./NEXT_UX_U4_AUDIT.md) |
| **Onboarding shell** | Multi-step flow for all 8 roles (`role-select` → identity → org → preferences → consent → optional tutorial → complete); Neon progress; role → dashboard routing |
| **Admin honesty** | System spine / Precision Health links, “EMIS write-back Not enabled”, rehearsal labelling |
| **Demo path** | `/demo/script`, `/walkthrough`, clinical-proof — eng demo is shippable |

### Thin / scaffolding (demo UX debt)

| Surface | Gap |
|---|---|
| **Agent story depth** | **U1 PASS** — job-in-loop blurbs, stage groups, two-minute script |
| **Audience `for-*` pages** | **U2 PASS** — role agent maps + HITL/approve framing on every `for-*` route |
| **How-it-works ↔ product** | Diagram is strong; still weak bridge into **role-specific demo entry** (“I’m a nurse — show me my 90-second path”) |
| **Personalised onboarding** | **U3 PASS** — all 8 roles get tutorial + first-run (agents / approve / `liveEmis:false`); see [`NEXT_UX_U3_AUDIT.md`](./NEXT_UX_U3_AUDIT.md) |
| **Nurse dashboard** | **U5 PASS** — 3-beat hero (obs → handover → GUARDIAN); see [`NEXT_UX_U5_AUDIT.md`](./NEXT_UX_U5_AUDIT.md) |
| **Pharmacist** | **U5 PASS** — med-safety HITL path (review → GUARDIAN → stage); see [`NEXT_UX_U5_AUDIT.md`](./NEXT_UX_U5_AUDIT.md) |
| **Admin** | **U6 PASS** — practice-manager ops hero (integrations → SHIELD → enquiries); see [`NEXT_UX_U6_AUDIT.md`](./NEXT_UX_U6_AUDIT.md) |
| **ICS** | **U7 PASS** — COMPASS-led population → equity → forecast; synthetic / no patient-level spill; see [`NEXT_UX_U7_AUDIT.md`](./NEXT_UX_U7_AUDIT.md) |
| **Hospital** | **U7 PASS** — wards → capacity → staffing; synthetic PAS front-and-centre; see [`NEXT_UX_U7_AUDIT.md`](./NEXT_UX_U7_AUDIT.md) |
| **Patient** | **U8 PASS** — My Health → plan → consent companion; invite-by-practice · clinicians keep HITL; see [`NEXT_UX_U8_AUDIT.md`](./NEXT_UX_U8_AUDIT.md) |
| **Researcher** | **U8 PASS** — ethics → evaluation → data access; ATLAS Phase 2; COMPASS/SHIELD supporting; see [`NEXT_UX_U8_AUDIT.md`](./NEXT_UX_U8_AUDIT.md) |

**Bottom line:** U1–U8 product-surface track is **complete**. Clinical spine (D1/N4) stays locked; partner/`liveEmis` stay paused. Next is demo ops rehearsal, not more UX phases.

---

## 2. Prioritised phases **U1…U8**

Do these in order. Exit criteria must pass before starting the next. Fail any phase that flips `liveEmis`, claims PRISM/ATLAS live, promotes VOICE/DrASSIST as peer agents, or rebuilds CONDUCTOR/SHIELD/NextAuth.

### U1 — Landing: agents + how they work (start here)

| | |
|---|---|
| **Goal** | A visitor (or demo host) can explain the **12-agent roster** and the **capture → draft → approve → stage** pipeline in under two minutes from marketing pages alone. |
| **Work** | Deepen `/platform` AgentGrid + `/how-it-works` pipeline: short per-agent “job in the loop” blurbs; call out HORIZON (ex-ORACLE), PATHWAY, COMPASS, NEXUS, CANVAS, BRIDGE, CONDUCTOR, SHIELD; Phase 2 PRISM/ATLAS badges; VOICE/DrASSIST as sub-caps; CTAs into `/demo/script` and signup. |
| **Exit criteria** | Manual 2-minute script from home → how-it-works → platform without opening a dashboard; marketing e2e still green; no honesty regressions. |
| **Fail if** | “14 agents”, JSL live, PRISM/ATLAS live, or live EMR write claims. |
| **In-repo status** | **PASS** — audit [`NEXT_UX_U1_AUDIT.md`](./NEXT_UX_U1_AUDIT.md) |

**U1 audit gate**

- [x] Per-agent job-in-loop blurbs on `/platform` (AgentGrid staged by Capture→Draft→…→Phase 2)
- [x] `/how-it-works` two-minute script + agents-named-in-loop + Capture→Draft→Approve agent names
- [x] Home journey strip names agents + links to platform / demo script
- [x] HORIZON (ex-ORACLE); VOICE/Dr.Assist sub-caps; PRISM/ATLAS Phase 2; `liveEmis:false`
- [x] CTAs to `/demo/script` + signup
- [x] Marketing e2e green (honesty assertions extended)
- [x] No “14 agents” / JSL live / PRISM-ATLAS live / live EMR write claims

### U2 — Audience landing pages (`for-*`) agent-mapped

| | |
|---|---|
| **Goal** | Each audience page answers: “which agents help **me**, and what do I approve?” |
| **Work** | Enrich `audience-content` for clinicians, practices, patients, hospitals, administrators, ICS, research: role-relevant agent chips + one workflow that names agents; primary CTA → role-appropriate signup/onboarding or demo. |
| **Exit criteria** | Spot-check every `for-*` route; e2e marketing audience links still pass; honesty notes intact. |
| **In-repo status** | **PASS** — audit [`NEXT_UX_U2_AUDIT.md`](./NEXT_UX_U2_AUDIT.md) |

**U2 audit gate**

- [x] Agent chips + “what you approve” on every major `for-*` page
- [x] Workflow steps name role-relevant agents (CANVAS → HITL → BRIDGE / COMPASS / SHIELD as appropriate)
- [x] Honesty: PRISM/ATLAS Phase 2; VOICE/Dr.Assist sub-caps; `liveEmis:false`; synthetic PAS/ICS
- [x] CTAs to `/demo/script`, signup (valid role ids), and/or role dashboard
- [x] Marketing e2e audience + honesty assertions green
- [x] No “14 agents” / JSL live / PRISM-ATLAS live / live EMR write claims

### U3 — Personalised onboarding

| | |
|---|---|
| **Goal** | After signup, each role gets a **short, role-shaped** path that lands on a dashboard that already reflects org / preferences / first-run tips. |
| **Work** | Per-role tutorial or guided checklist (extend beyond GP-only); wire preferences into first dashboard empty/first-run states; keep Neon onboarding progress; optional skip for returning demo users. |
| **Exit criteria** | Smoke: each of 8 roles completes onboarding → correct dashboard; first-run guidance visible once; progress persists. |
| **Fail if** | Onboarding claims live EMIS connection or certification. |
| **In-repo status** | **PASS** — audit [`NEXT_UX_U3_AUDIT.md`](./NEXT_UX_U3_AUDIT.md) |

**U3 audit gate**

- [x] Tutorials for all 8 roles (nurse / pharmacist / admin / researcher added; skip available)
- [x] Role paths name agents + what you approve; complete preview + first-run tips
- [x] Preferences shape first-run body tips when set
- [x] Neon progress + `onboarding_complete` / role persist unchanged
- [x] Honesty: `liveEmis:false` onboarding banner + first-run; ATLAS Phase 2; VOICE/Dr.Assist sub-caps
- [x] Unit + route-smoke + clinical-proof rbac green
- [x] No live EMIS / certification claims

### U4 — GP dashboard demo polish

| | |
|---|---|
| **Goal** | GP remains the **hero clinical demo** — tighten story beats, not rebuild. |
| **Work** | Align Agent Control labels with U1 copy; one-click path from first-run → review queue → Accept → export/sim; keep DemoDataBanner / Neo4j mock honesty. |
| **Exit criteria** | `/demo/script` + GP path rehearsable in &lt;10 minutes; existing GP smoke/e2e green. |
| **In-repo status** | **PASS** — audit [`NEXT_UX_U4_AUDIT.md`](./NEXT_UX_U4_AUDIT.md) |

**U4 audit gate**

- [x] Agent Control uses U1 `AGENT_JOB_IN_LOOP` + VOICE/Dr.Assist sub-cap copy (CANVAS/BRIDGE/CONDUCTOR/HORIZON)
- [x] `GpHeroDemoPath` one-click: review queue → Accept (pilot) → FHIR Bundle export
- [x] First-run primary → review queue; secondary → `/demo/script`
- [x] DemoDataBanner + Neo4j honesty retained; Accept toast honest (`liveEmis:false`)
- [x] `/demo/script` GP hero panel + stop; U4 unit + route-smoke + clinical-proof green
- [x] No `liveEmis` flip / PRISM-ATLAS live / VOICE-Dr.Assist as peers

### U5 — Nurse + pharmacist dashboards

| | |
|---|---|
| **Goal** | Two clinical supporting roles demoable without apologising for empty shells. |
| **Work** | Nurse: observations → handover → GUARDIAN alerts as a 3-beat demo. Pharmacist: med review → interaction check → stage (HITL) with GUARDIAN honesty. |
| **Exit criteria** | `smoke:nurse` / `smoke:pharmacist` (or equivalent) pass; demo script notes added for both roles. |
| **In-repo status** | **PASS** — audit [`NEXT_UX_U5_AUDIT.md`](./NEXT_UX_U5_AUDIT.md) |

**U5 audit gate**

- [x] Nurse `NurseHeroDemoPath`: observations → handover → GUARDIAN (vitals + timeline on beat 1)
- [x] Pharmacist `PharmacistHeroDemoPath`: med review → GUARDIAN interactions → HITL stage (SHIELD)
- [x] First-run primary CTAs start each path; secondary → `/demo/script`; agents match U1–U3
- [x] Honesty: synthetic banners · `liveEmis:false` · nurse-vitals / pharmacist-review spine named
- [x] `/demo/script` nurse + pharmacist panels + stops; U5 unit + route-smoke + clinical-proof green
- [x] Smoke scripts assert hero copy (`smoke:nurse` / `smoke:pharmacist` when app + credentials available)
- [x] No `liveEmis` flip / PRISM-ATLAS live / VOICE-Dr.Assist as peers

### U6 — Practice admin dashboard

| | |
|---|---|
| **Goal** | Practice manager can show **integrations honesty + SHIELD + users/enquiries** as an ops demo, not a developer console. |
| **Work** | Curate overview: status strip, partner-readiness (`liveEmis:false`), audit sample, clear CTAs; de-emphasise unfinished Precision Health as “scaffolding”. |
| **Exit criteria** | Admin smoke pass; demo host can say “not live EMIS” from the page itself. |
| **In-repo status** | **PASS** — audit [`NEXT_UX_U6_AUDIT.md`](./NEXT_UX_U6_AUDIT.md) |

**U6 audit gate**

- [x] `AdminHeroDemoPath`: integrations honesty → SHIELD audit → users/enquiries
- [x] Honesty: `liveEmis:false` · staging/sim · designed for EMIS/SystmOne · “Not live EMIS” on overview
- [x] BRIDGE / CONDUCTOR ops framing; Precision Health / partner readiness = scaffolding
- [x] First-run primary → integrations; secondary → `/demo/script`; onboarding tutorials name ops beats
- [x] `/demo/script` admin panel + `01:05` stop; U6 unit + route-smoke + clinical-proof green
- [x] Smoke script asserts ops hero copy (`smoke:admin` when app + credentials available)
- [x] No `liveEmis` flip / PRISM-ATLAS live / VOICE-Dr.Assist as peers

### U7 — ICS + hospital dashboards

| | |
|---|---|
| **Goal** | Population / command-centre stories that sell COMPASS / PATHWAY / HORIZON aggregates without over-claiming live feeds. |
| **Work** | ICS: one guided path population → equity (COMPASS) → forecast. Hospital: wards → capacity → staffing with synthetic PAS disclaimer front-and-centre. |
| **Exit criteria** | ICS + hospital smoke pass; banners state synthetic / not live PAS. |
| **In-repo status** | **PASS** — audit [`NEXT_UX_U7_AUDIT.md`](./NEXT_UX_U7_AUDIT.md) |

**U7 audit gate**

- [x] ICS `IcsHeroDemoPath`: population → COMPASS equity → forecast
- [x] Hospital `HospitalHeroDemoPath`: wards → capacity → staffing
- [x] Honesty: synthetic cohorts / Not live PAS · `liveEmis:false` · no patient-level spill on ICS
- [x] PATHWAY / HORIZON / COMPASS framing; no live PAS / ICS feed claims
- [x] First-run primary → population / wards; secondary → `/demo/script`; onboarding tutorials name beats
- [x] `/demo/script` ICS + hospital panels + `01:15` / `01:25` stops; U7 unit + route-smoke + clinical-proof green
- [x] Smoke scripts assert hero copy (`smoke:ics` / `smoke:hospital` when app + credentials available)
- [x] No `liveEmis` flip / PRISM-ATLAS live / VOICE-Dr.Assist as peers

### U8 — Patient + researcher dashboards

| | |
|---|---|
| **Goal** | Lightest stakeholders still look intentional in a multi-role demo. |
| **Work** | Patient companion: check-in + care-plan visibility with invite-by-practice framing. Researcher: cohort metrics + ethics empty-state; **no ATLAS-as-live**. |
| **Exit criteria** | Patient + researcher smoke pass; ATLAS remains Phase 2 in copy. |
| **In-repo status** | **PASS** — audit [`NEXT_UX_U8_AUDIT.md`](./NEXT_UX_U8_AUDIT.md) |

**U8 audit gate**

- [x] Patient `PatientHeroDemoPath`: My Health → care plan → consent
- [x] Researcher `ResearcherHeroDemoPath`: ethics → evaluation → data access
- [x] Honesty: invite-by-practice · clinicians keep HITL · synthetic · `liveEmis:false` · ATLAS Phase 2
- [x] COMPASS / SHIELD supporting on researcher; no ATLAS-as-live
- [x] First-run primary → companion / ethics; secondary → `/demo/script`; onboarding tutorials name beats
- [x] `/demo/script` patient + researcher panels + `01:35` / `01:45` stops; U8 unit + route-smoke + clinical-proof green
- [x] Smoke scripts assert hero copy (`smoke:patient` / `smoke:researcher` when app + credentials available)
- [x] No `liveEmis` flip / PRISM-ATLAS live / VOICE-Dr.Assist as peers

---

## Suggested cadence

| Track | Phases | Notes |
|---|---|---|
| **Start now** | — | **U1–U8 complete** — UX stakeholder track done |
| **Then** | Demo ops | Rehearse `/demo/script` multi-role; create smoke accounts per [`DEMO_LAUNCH_CREDENTIALS.md`](./DEMO_LAUNCH_CREDENTIALS.md) |
| **Do not block on** | N1–N3, N5–N7 | Partner/Medplum/`liveEmis` stay paused |
| **Keep locked** | D1, N4, U1–U8 | Demo hardening + roster honesty + role heroes |

---

## 3. Per stakeholder — today vs target for demo

| Stakeholder | Today | Target for demo |
|---|---|---|
| **GP** | Rich dashboard + Agent Control + review queue; strongest clinical surface | **U4 PASS** — hero &lt;10 min Accept→export; Agent Control matches U1 names |
| **Nurse** | **U5 PASS** — 3-beat obs → handover → GUARDIAN; spine nurse-vitals | Keep rehearsable; no live PAS/EMR claims |
| **Pharmacist** | **U5 PASS** — review → GUARDIAN → HITL/SHIELD; pharmacist-review spine | Keep med-safety talk-track honest |
| **Admin** | **U6 PASS** — ops hero: integrations → SHIELD → enquiries; not eng console | Keep rehearsable; Precision Health stays scaffolding |
| **ICS** | **U7 PASS** — COMPASS-led population → equity → forecast; synthetic / no spill | Keep aggregate-only talk-track |
| **Hospital** | **U7 PASS** — wards → capacity → staffing; synthetic PAS honesty | Keep “not live PAS” from the page |
| **Patient** | **U8 PASS** — companion hero My Health → plan → consent; invite-by-practice | Keep rehearsable; clinicians keep HITL |
| **Researcher** | **U8 PASS** — ethics → evaluation → data access; ATLAS Phase 2 | Keep aggregate research talk-track; never claim ATLAS live |

---

## 4. Explicit non-goals (do not rebuild)

- NextAuth / Neon / SHIELD hash chain  
- CONDUCTOR + NEXUS orchestration / HITL Accept path  
- BRIDGE Neon staging / D1 export / `/demo/script` (already PASS)  
- Partner sandbox live wire, Medplum OAuth, IM1, `liveEmis` flip  
- Building PRISM or ATLAS as live Phase-1 agents  
- Promoting VOICE or DrASSIST(/JSL) to peer directory agents  
- Supabase / LangGraph / “rewrite the spine” proposals  

---

## 5. Definition of success for this track

1. **U1–U2** — Marketing alone can sell the 12-agent + HITL story honestly.  
2. **U3** — Every role gets a personalised path into their dashboard. **PASS** — [`NEXT_UX_U3_AUDIT.md`](./NEXT_UX_U3_AUDIT.md)  
3. **U4–U8** — Each stakeholder dashboard supports a short, rehearsable demo beat. **U4–U8 PASS** — [`NEXT_UX_U4_AUDIT.md`](./NEXT_UX_U4_AUDIT.md) · [`NEXT_UX_U5_AUDIT.md`](./NEXT_UX_U5_AUDIT.md) · [`NEXT_UX_U6_AUDIT.md`](./NEXT_UX_U6_AUDIT.md) · [`NEXT_UX_U7_AUDIT.md`](./NEXT_UX_U7_AUDIT.md) · [`NEXT_UX_U8_AUDIT.md`](./NEXT_UX_U8_AUDIT.md)  
4. **Honesty** — `liveEmis:false`; Phase 2 agents labelled; sub-capabilities not peers.  
5. **No clinical-spine rebuild** — UX sits on D1/N4 foundations.

This is **not** a claim of production EHR write-back or certified DCB/MHRA readiness.

---

## Cross-links

- [`DEMO_LAUNCH_WITHOUT_IM1.md`](./DEMO_LAUNCH_WITHOUT_IM1.md) — demo path without IM1 / EMIS / Medplum · **UX track entry**  
- [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md) — N/D eng phases; U-phases are the parallel **product surface** track  
- [`DEMO_LAUNCH_D1_AUDIT.md`](./DEMO_LAUNCH_D1_AUDIT.md) — D1 PASS (do not redo)  
- [`NEXT_BUILD_N4_AUDIT.md`](./NEXT_BUILD_N4_AUDIT.md) — roster honesty lock  
- [`NEXT_UX_U1_AUDIT.md`](./NEXT_UX_U1_AUDIT.md) — U1 PASS (agents + how-it-works marketing depth)  
- [`NEXT_UX_U2_AUDIT.md`](./NEXT_UX_U2_AUDIT.md) — U2 PASS (audience `for-*` agent maps)  
- [`NEXT_UX_U3_AUDIT.md`](./NEXT_UX_U3_AUDIT.md) — U3 PASS (personalised onboarding)  
- [`NEXT_UX_U4_AUDIT.md`](./NEXT_UX_U4_AUDIT.md) — U4 PASS (GP dashboard hero demo polish)  
- [`NEXT_UX_U5_AUDIT.md`](./NEXT_UX_U5_AUDIT.md) — U5 PASS (nurse + pharmacist dashboard demos)  
- [`NEXT_UX_U6_AUDIT.md`](./NEXT_UX_U6_AUDIT.md) — U6 PASS (practice admin ops demo)  
- [`NEXT_UX_U7_AUDIT.md`](./NEXT_UX_U7_AUDIT.md) — U7 PASS (ICS + hospital dashboards)  
- [`NEXT_UX_U8_AUDIT.md`](./NEXT_UX_U8_AUDIT.md) — U8 PASS (patient + researcher dashboards) · **UX track complete**  
- [`HOW_TO_BUILD_AKSH_HEALTH.md`](./HOW_TO_BUILD_AKSH_HEALTH.md) — honest product picture  
- [`PILOT_PACKAGE.md`](./PILOT_PACKAGE.md) — fixed demo cases  
