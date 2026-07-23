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
| **GP dashboard** | Strongest role surface: Agent Control, review queue, patient panel, pathways, Neo4j honesty, demo banners |
| **Onboarding shell** | Multi-step flow for all 8 roles (`role-select` → identity → org → preferences → consent → optional tutorial → complete); Neon progress; role → dashboard routing |
| **Admin honesty** | System spine / Precision Health links, “EMIS write-back Not enabled”, rehearsal labelling |
| **Demo path** | `/demo/script`, `/walkthrough`, clinical-proof — eng demo is shippable |

### Thin / scaffolding (demo UX debt)

| Surface | Gap |
|---|---|
| **Agent story depth** | **U1 PASS** — job-in-loop blurbs, stage groups, two-minute script |
| **Audience `for-*` pages** | **U2 PASS** — role agent maps + HITL/approve framing on every `for-*` route |
| **How-it-works ↔ product** | Diagram is strong; still weak bridge into **role-specific demo entry** (“I’m a nurse — show me my 90-second path”) |
| **Personalised onboarding** | Steps exist; **tutorial only for GP**; other roles jump to dashboard with thin `FirstRunGuidance`. Preferences / org capture don’t deeply reshape the first dashboard session |
| **Nurse dashboard** | Overview + observations / handover / alerts — mock-data, functional but **not demo-scripted** like GP |
| **Pharmacist** | Queue / interactions / BNF cards — usable rehearsal; thin clinical storytelling |
| **Admin** | Broad ops surface; partner-readiness exists; still feels like an **internal ops dump** more than a “practice manager demo” |
| **ICS** | Population / equity / benchmark / forecast sections — synthetic intelligence; COMPASS story under-sold for demos |
| **Hospital** | Ward / capacity / staffing + risk-state panels — synthetic command centre; easy to over-claim “live PAS” |
| **Patient** | Companion shell — lightest stakeholder surface |
| **Researcher** | Cohort KPIs + federated jobs + ethics empty-state — honesty good; ATLAS must stay Phase 2 / not claimed |

**Bottom line:** Clinical spine and GP demo path are ahead of marketing depth, onboarding personalisation, and non-GP role dashboards. Next build is **product surface for demo launch**, not more spine.

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

### U4 — GP dashboard demo polish

| | |
|---|---|
| **Goal** | GP remains the **hero clinical demo** — tighten story beats, not rebuild. |
| **Work** | Align Agent Control labels with U1 copy; one-click path from first-run → review queue → Accept → export/sim; keep DemoDataBanner / Neo4j mock honesty. |
| **Exit criteria** | `/demo/script` + GP path rehearsable in &lt;10 minutes; existing GP smoke/e2e green. |

### U5 — Nurse + pharmacist dashboards

| | |
|---|---|
| **Goal** | Two clinical supporting roles demoable without apologising for empty shells. |
| **Work** | Nurse: observations → handover → GUARDIAN alerts as a 3-beat demo. Pharmacist: med review → interaction check → stage (HITL) with GUARDIAN honesty. |
| **Exit criteria** | `smoke:nurse` / `smoke:pharmacist` (or equivalent) pass; demo script notes added for both roles. |

### U6 — Practice admin dashboard

| | |
|---|---|
| **Goal** | Practice manager can show **integrations honesty + SHIELD + users/enquiries** as an ops demo, not a developer console. |
| **Work** | Curate overview: status strip, partner-readiness (`liveEmis:false`), audit sample, clear CTAs; de-emphasise unfinished Precision Health as “scaffolding”. |
| **Exit criteria** | Admin smoke pass; demo host can say “not live EMIS” from the page itself. |

### U7 — ICS + hospital dashboards

| | |
|---|---|
| **Goal** | Population / command-centre stories that sell COMPASS / PATHWAY / HORIZON aggregates without over-claiming live feeds. |
| **Work** | ICS: one guided path population → equity (COMPASS) → forecast. Hospital: wards → capacity → staffing with synthetic PAS disclaimer front-and-centre. |
| **Exit criteria** | ICS + hospital smoke pass; banners state synthetic / not live PAS. |

### U8 — Patient + researcher dashboards

| | |
|---|---|
| **Goal** | Lightest stakeholders still look intentional in a multi-role demo. |
| **Work** | Patient companion: check-in + care-plan visibility with invite-by-practice framing. Researcher: cohort metrics + ethics empty-state; **no ATLAS-as-live**. |
| **Exit criteria** | Patient + researcher smoke pass; ATLAS remains Phase 2 in copy. |

---

## Suggested cadence

| Track | Phases | Notes |
|---|---|---|
| **Start now** | **U3** | Personalised onboarding (U1–U2 PASS) |
| **Then** | **U4 → U5 → U6** | Clinical + admin dashboards |
| **Then** | **U7 → U8** | Population / hospital / patient / research |
| **Do not block on** | N1–N3, N5–N7 | Partner/Medplum/`liveEmis` stay paused |
| **Keep locked** | D1, N4 | Demo hardening + roster honesty |

---

## 3. Per stakeholder — today vs target for demo

| Stakeholder | Today | Target for demo |
|---|---|---|
| **GP** | Rich dashboard + Agent Control + review queue; strongest clinical surface | Hero 10-min Accept→export path; first-run matches marketing agent names |
| **Nurse** | Overview + obs / handover / alerts on mock data | 3-beat demo (obs → handover → GUARDIAN) with SHIELD honesty |
| **Pharmacist** | Review / interactions / BNF card hub | Med-safety demo: queue → interaction → HITL stage |
| **Admin** | Ops overview + spine links + honesty metrics | Practice-manager narrative: status, audit, integrations — not eng console |
| **ICS** | Population / equity / benchmark / forecast sections | COMPASS-led equity + forecast walkthrough on synthetic cohorts |
| **Hospital** | Ward / capacity / staffing + risk-state panels | Command-centre demo with explicit “synthetic PAS” framing |
| **Patient** | Companion shell under DashboardShell | Invite-by-practice companion: check-in + plan visibility |
| **Researcher** | Cohort KPIs + ethics empty-state + export paths | Aggregate research demo; ATLAS Phase 2 only — never live |

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
2. **U3** — Every role gets a personalised path into their dashboard.  
3. **U4–U8** — Each stakeholder dashboard supports a short, rehearsable demo beat.  
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
- [`HOW_TO_BUILD_AKSH_HEALTH.md`](./HOW_TO_BUILD_AKSH_HEALTH.md) — honest product picture  
- [`PILOT_PACKAGE.md`](./PILOT_PACKAGE.md) — fixed demo cases  
