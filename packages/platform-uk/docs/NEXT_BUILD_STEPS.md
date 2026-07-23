# Next Build Steps — After P0–P7 Paperwork

**Date:** July 2026  
**Scope:** `packages/platform-uk` on `main`  
**Prerequisite:** P0–P6 product spine **PASS**; P7 paperwork **PASS** / live EMIS **NO-GO**  
**Companion:** [`PHASED_BUILD_AND_AUDIT_PLAN.md`](./PHASED_BUILD_AND_AUDIT_PLAN.md) · [`HOW_TO_BUILD_AKSH_HEALTH.md`](./HOW_TO_BUILD_AKSH_HEALTH.md) · [`P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md) · [`DEMO_LAUNCH_WITHOUT_IM1.md`](./DEMO_LAUNCH_WITHOUT_IM1.md)

## Purpose

Ordered phases for **what to build next**. Do **not** rebuild DONE layers (NextAuth, Neon, SHIELD, Neo4j, AI Gateway agents, CONDUCTOR+NEXUS, HITL, Medplum dry-run, honesty banners, P0–P7 paperwork). Keep the working stack: **NextAuth + Neon + Vercel AI Gateway + deterministic CONDUCTOR** (no Supabase, no LangGraph, no required direct Anthropic SDK).

**Hard invariant:** `liveEmis: false` until a **signed** partner go/no-go + eng flip checklist. Presence of Partner env vars ≠ permission to flip.

---

## Demo path (no IM1)

**Verdict:** Demo launch on akshhealth.com / Vercel is possible **without** IM1, EMIS Partner credentials, or hosted Medplum OAuth. Use synthetic HITL + `ehr-writeback-sim`; keep `liveEmis:false`.

| Blocked partner phase | Status |
|---|---|
| **N3** BRIDGE vs Medplum staging | **Paused** — blocked on Medplum OAuth |
| **N5** live sandbox wire (beyond scaffold) | **Paused** — blocked on Partner creds |
| **N6** Partner UAT | **Paused** — blocked on Partner creds + clinical lead |
| **N7** `liveEmis` flip | **Paused** — blocked on signed go/no-go |

**Recommended next eng phase:** D1 demo hardening is **PASS** ([`DEMO_LAUNCH_D1_AUDIT.md`](./DEMO_LAUNCH_D1_AUDIT.md)). Resume N1 only if IM1/Partner credentials appear later. Full plan + alternatives: [`DEMO_LAUNCH_WITHOUT_IM1.md`](./DEMO_LAUNCH_WITHOUT_IM1.md).

---

## Priority stack

| Priority | Items |
|---|---|
| **Must (demo)** | Ship honest synthetic HITL demo on Vercel; keep `liveEmis:false`; no fake NHS write-back claims — see [`DEMO_LAUNCH_WITHOUT_IM1.md`](./DEMO_LAUNCH_WITHOUT_IM1.md) |
| **Should (eng now)** | Demo ops rehearsal on production; optional Deepgram for live VOICE ASR |
| **Later (partner)** | N1 outreach if creds appear; N2 Medplum secret; N3/N5–N7 when Partner + signed go/no-go; PRISM; ATLAS; CIS2 / Mirth; funded DTAC / DCB0129 / MHRA |
| **Done (demo eng)** | **D1 PASS** — FHIR-in-Neon BRIDGE, Accept→export, `/demo/script` ([`DEMO_LAUNCH_D1_AUDIT.md`](./DEMO_LAUNCH_D1_AUDIT.md)) |

---

## Baseline — already DONE (do not rebuild)

| Area | Status |
|---|---|
| Auth / onboarding | NextAuth + Neon |
| Product spine P0–P6 | Clinical-proof + workflow + typecheck + E2Es green |
| CONDUCTOR + NEXUS | Default orchestrate path · draft-only · HITL · SHIELD |
| SHIELD | Hash-chained Neon audit |
| Neo4j | Live + honest mock banner |
| BRIDGE / Medplum | Dry-run / degraded OAuth rehearsal · `liveEmis:false` |
| GP brand | CANVAS / BRIDGE / CONDUCTOR labels |
| P7 paperwork | Outreach pack + Admin PartnerReadinessPanel · **live flip NO-GO** |

**Fail any next phase if** someone proposes ripping NextAuth for Supabase, adding LangGraph as CONDUCTOR, flipping `liveEmis` without signed go/no-go, inventing MHRA/DCB/CSO signatures, or marketing PRISM/ATLAS/DrASSIST/JSL as live peer Phase-1 agents without an explicit product decision.

---

## Agent roster honesty (lock this language)

| Name | Status | Market / UI claim |
|---|---|---|
| **Phase-1 12-agent set** (SYNTHESIS, GUARDIAN, HORIZON, NEXUS, PATHWAY, COMPASS, CANVAS, BRIDGE, CONDUCTOR, SHIELD, … per `AGENT_DIRECTORY`) | **Live** as draft / orchestrate / audit capabilities | OK to say live drafts + HITL |
| **VOICE** | **Sub-capability** feeding CANVAS — not a 13th peer agent | Live ASR only when Deepgram key present; otherwise **labelled simulated** |
| **DrASSIST / JSL** | **Coding assist sub-capability** under SYNTHESIS / CONDUCTOR optional path — not a peer Phase-1 brand agent; **not** a live JSL product integration | Draft coding assist under HITL only; do **not** claim “DrASSIST/JSL live” as a 13th/14th agent |
| **PRISM** | Phase 2 roadmap · `live:false` · **not built** | Never claim live imaging intelligence |
| **ATLAS** | Phase 2 roadmap · `live:false` · **not built** | Never claim live clinical research agent |
| **LangGraph / Supabase** | **Not used** — do not adopt | Fail any plan that requires them |

---

## Phase roadmap (D1 + N1…N10)

```text
D1 Demo hardening (no IM1/EMIS/Medplum)           ← **PASS** 2026-07-23
N1 External outreach (user/partner)               ← deferred unless creds appear
 → N2 Staging secrets (Medplum / Deepgram)        ← optional
 → N3 BRIDGE staging rehearsal                    ← **PAUSED** (Medplum OAuth)
 → N4 Sub-capability honesty + coding assist      ← **PASS** (2026-07-22)
 → N5 Partner sandbox scaffold                    ← **PASS (scaffold)**; live wire **PAUSED**
 → N6 Partner UAT + rollback drill                ← **PAUSED** (partner)
 → N7 Signed go/no-go → controlled liveEmis flip  ← **PAUSED** until signed GO
 → N8 PRISM (Phase 2, product pull-in)
 → N9 ATLAS (Phase 2, product pull-in)
 → N10 CIS2 / Mirth / funded regulatory route     ← external parallel anytime
```

**Demo path:** D1 **PASS** — see [`DEMO_LAUNCH_D1_AUDIT.md`](./DEMO_LAUNCH_D1_AUDIT.md). N1/N10 remain optional parallel when org capacity exists. **N7 never starts** without signed artefacts.

Estimates are eng calendar days unless noted. Owners: **eng** = platform-uk engineering; **user/partner** = credentials, emails, IG/CSO, Partner Programme.

---

### N1 — External partner outreach (execute the pack)

| | |
|---|---|
| **Goal** | Turn P7 paperwork into real threads: IM1 feasibility + EMIS/Optum Partner Programme (+ SystmOne track if needed). |
| **Estimate** | Org calendar days–weeks (external) |
| **Owner** | **user / partner / IG** primary · eng supports questions only |
| **Work** | Send IM1 email from [`P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md) §B; apply/progress Partner Programme (§C); kick off CSO/IG note (§D); record thread refs in Admin `PartnerReadinessPanel` (`external_ref_noted` ≠ signed). |
| **Exit criteria** | IM1 (and/or Partner) email sent with reply or ticket ref; gate tracker notes updated; honesty flags still false. |
| **Fail if** | UI/API set `certified:true` or `liveEmis:true` because “email was sent”; Mirth mock sold as live. |
| **In-repo status** | **READY_TO_SEND / DEFERRED for demo** — pack ready · **NOT SENT** · not a demo-launch gate · audit [`NEXT_BUILD_N1_AUDIT.md`](./NEXT_BUILD_N1_AUDIT.md) · see [`DEMO_LAUNCH_WITHOUT_IM1.md`](./DEMO_LAUNCH_WITHOUT_IM1.md) |

**Audit gate N1**

- [x] In-repo pack execution-ready (`P7_PARTNER_OUTREACH_PACK.md` §B + N1 send checklist; `liveEmis:false` documented)
- [ ] IM1 and/or Partner outreach **sent** (evidence: email/ticket ref in Partner panel) — **deferred** (demo does not wait)
- [x] `GET /api/clinical-spine/partner-readiness` → `honesty.liveEmis === false` (invariant; not flipped)
- [x] No marketing claim of live EMIS / certified (pack + audit language)

---

### N2 — Staging secrets: Medplum OAuth + local Deepgram

| | |
|---|---|
| **Goal** | Optional live **staging** rehearsal quality — still not Layer 15 EHR. |
| **Estimate** | 0.5–1 day eng after secrets available |
| **Owner** | **user** supplies real Medplum Client Secret + optional local `DEEPGRAM_API_KEY` · **eng** verifies smokes |
| **Work** | Set real Medplum Client Application secret in Vercel/local; copy Deepgram key to `.env.local` if desired; run `npm run smoke:medplum`; confirm SystemSpinePanel / VOICE banners match reality. **Never** set `liveEmis`. |
| **Exit criteria** | With secrets: Medplum OAuth smoke green (not `Invalid client`); without: dry-run / simulated paths still green and labelled. |
| **Fail if** | Medplum success used to claim live EMIS; missing-key path errors instead of honest fallback; secrets committed to git. |
| **In-repo status** | **PARTIAL** — honest dry-run / simulated ASR · Medplum OAuth still needs real Client Secret (user: Medplum App → Clients → regenerate) · audit [`NEXT_BUILD_N2_AUDIT.md`](./NEXT_BUILD_N2_AUDIT.md) |

**Audit gate N2**

- [x] `npm run smoke:medplum` documents with-creds **green** vs without **disabled_honest** — **PARTIAL 2026-07-22**: with-creds `degraded_rehearsal_oauth_failed` (`Invalid client`); without `disabled_honest`
- [x] VOICE: live ASR when key present · simulated banner when absent — **PASS (simulated locally)**; `DEEPGRAM_API_KEY` missing in `.env.local` (Vercel may already have key)
- [x] `npm run test:clinical-proof` exit 0 — **PASS** 2026-07-22
- [x] Honesty: `liveEmis:false` hard

---

### N3 — BRIDGE staging rehearsal hardening

| | |
|---|---|
| **Goal** | After Medplum OAuth works, prove Capture → Draft → HITL → **staging FHIR** path end-to-end in rehearsal (still sim / staging, not Partner live write). |
| **Estimate** | 1–2 days |
| **Owner** | eng |
| **Work** | Exercise staged-FHIR + write-back-sim against live Medplum staging; tighten SystemSpinePanel / Partner panels if modes change; keep `ehr-writeback-sim` off Partner network. |
| **Exit criteria** | Documented rehearsal script green; UI modes match API; clinical-proof still green. |
| **Fail if** | Staging FHIR marketed as live EMIS; autonomous write without HITL. |
| **In-repo status** | **PAUSED** — blocked on Medplum OAuth (N2). For demo, use **D1** FHIR-in-Neon / skip external FHIR instead ([`DEMO_LAUNCH_WITHOUT_IM1.md`](./DEMO_LAUNCH_WITHOUT_IM1.md)). |

**Audit gate N3**

- [ ] Manual rehearsal script: Orchestrate → HITL Accept → BRIDGE stage succeeds against Medplum staging
- [ ] `npm run test:clinical-proof` · `smoke:medplum`
- [ ] Partner readiness still `liveEmis:false`

---

### N4 — Sub-capability honesty + DrASSIST / coding assist clarity

| | |
|---|---|
| **Goal** | Lock VOICE / DrASSIST(/JSL) as **sub-capabilities**; optional deepen coding-draft assist under HITL — **not** expand the live 12-agent peer set. |
| **Estimate** | 1–2 days (honesty pass) · more only if product funds coding depth |
| **Owner** | eng · **user** product decision if expanding coding scope |
| **Work** | Spot-audit GP/marketing copy for “14 live agents” / “JSL live”; keep `AGENT_DIRECTORY` Phase-2 PRISM/ATLAS `live:false`; optional: improve coding-draft quality behind existing CONDUCTOR opt-in — still draft-only + SHIELD. |
| **Exit criteria** | Roster honesty matches table above; marketing E2E still asserts 12-agent Phase-1 story; no silent peer-agent promotion. |
| **Fail if** | PRISM/ATLAS marked live; VOICE/DrASSIST added as peer Phase-1 agents without product decision; JSL claimed as integrated product. |
| **In-repo status** | **PASS** — VOICE/Dr.Assist sub-caps; JSL **not wired**; PRISM/ATLAS `live:false` · audit [`NEXT_BUILD_N4_AUDIT.md`](./NEXT_BUILD_N4_AUDIT.md) |

**Audit gate N4**

- [x] `e2e/marketing.spec.ts` green (12-agent honesty) — **PASS** 2026-07-22 (resources + AgentGrid assertions)
- [x] Manual: VOICE / DrASSIST copy = sub-capability; PRISM/ATLAS = Phase 2 / not live — **PASS**
- [x] `npm run test:clinical-proof` exit 0 — **PASS** 2026-07-22
- [x] JSL NLP explicitly **not wired** (no live product / peer-agent claim)

---

### N5 — Partner sandbox wire (feature-flagged; `liveEmis:false`)

| | |
|---|---|
| **Goal** | When Partner Programme issues **sandbox** credentials, wire env + client behind flags — still **no** production live write-back. |
| **Estimate** | 3–5 days after credentials |
| **Owner** | eng · **user/partner** supplies sandbox env (names in P7 pack §F) |
| **Work** | Implement Partner client against sandbox base URL; feature flag; Accept-only write scopes; never auto-flip `liveEmis`; keep sim path as default. |
| **Exit criteria** | Sandbox smoke documented; flag off = sim path; flag on = sandbox only; `canFlipLiveEmisInCode()` still false until N7. |
| **Fail if** | Env presence flips `liveEmis`; writes without HITL Accept; credentials in git. |
| **In-repo status** | **PASS (scaffold) · live wire PAUSED** — flag-gated client + honesty UI; Partner creds **not issued** → leave flag off for demo · audit [`NEXT_BUILD_N5_AUDIT.md`](./NEXT_BUILD_N5_AUDIT.md) |

**Audit gate N5**

- [x] Partner sandbox smoke (flag on) · sim path (flag off) — **PASS (scaffold)** 2026-07-23: flag off = sim; flag on without creds = `needs_partner`
- [x] `honesty.liveEmis === false` · `canFlipLiveEmisInCode() === false`
- [x] Clinical-proof + partner honesty tests green — **PASS** 2026-07-23

---

### N6 — Partner UAT + rollback drill

| | |
|---|---|
| **Goal** | Clinician + eng prove Accept → staging/sandbox → audit → disable/rollback before any production flip. |
| **Estimate** | 2–4 days (+ partner calendar) |
| **Owner** | eng + **clinical lead / CSO** |
| **Work** | UAT script from Phase F / P7; HITL Accept/Edit/Reject cases; rollback / kill-switch rehearsal; residual-risk notes for Gate 2. |
| **Exit criteria** | Signed UAT script + rollback evidence recorded in Partner panel (still `certified:false` until formal go/no-go). |
| **Fail if** | UAT skipped “because sandbox worked”; residual risk invented as signed. |
| **In-repo status** | **PAUSED** — blocked on Partner sandbox credentials + clinical lead calendar. |

**Audit gate N6**

- [ ] UAT script executed and signed by clinical lead
- [ ] Rollback drill documented
- [ ] Gate tracker updated with refs (not fake certified unlock)

---

### N7 — Signed go/no-go → controlled `liveEmis` flip

| | |
|---|---|
| **Goal** | Only after P7-11 GO + DPIA/DPA/CSO artefacts: run eng flip checklist for controlled live Partner write-back. |
| **Estimate** | 1–2 days eng after signed GO |
| **Owner** | **CSO + release authority** decide · eng executes checklist |
| **Work** | Verify signed artefacts; enable production Partner path per SOP; monitoring + rollback ready; update honesty claims to match **actual** connection state. |
| **Exit criteria** | Signed go/no-go on file; flip checklist complete; production claims match reality; rollback rehearsed. |
| **Fail if** | Eng flips because “code is ready”; UI shows certified without signatures; flip without N6 UAT. |
| **In-repo status** | **PAUSED** — blocked on signed partner go/no-go. Demo launch must not flip. |

**Audit gate N7**

- [ ] All human partner checklist boxes **signed** (not only `external_ref_noted`)
- [ ] Flip SOP complete; monitoring + rollback live
- [ ] Clinical-proof + partner UAT against **live** Partner endpoint (scoped)
- [ ] Marketing/API honesty matches live connection state

**Until then:** keep `liveEmis:false` · `canFlipLiveEmisInCode():false`.

---

### N8 — PRISM (Phase 2 imaging intelligence)

| | |
|---|---|
| **Goal** | Build PRISM only when product pulls Phase 2 imaging in (consent, modality partner, clinical owner). |
| **Estimate** | Multi-week (product-dependent) |
| **Owner** | eng + **user** modality/partner decisions |
| **Work** | Imaging draft agent · HITL · SHIELD · honest `live:false` until wired; do not fake DICOM/partner feeds. |
| **Exit criteria** | Product brief + partner path; agent `live` only when real path exists; marketing updated honestly. |
| **Fail if** | PRISM marketed live before build; bypasses HITL. |

**Audit gate N8** — clinical-proof + marketing honesty + modality consent gates (define when pulled in).

---

### N9 — ATLAS (Phase 2 clinical research)

| | |
|---|---|
| **Goal** | Build ATLAS only when research / trial / evidence-synthesis use case is funded. |
| **Estimate** | Multi-week (product-dependent) |
| **Owner** | eng + **user** research owner |
| **Work** | Research-assist drafts under HITL; no fabricated citations as “certified evidence.” |
| **Exit criteria** | Same honesty bar as N8. |
| **Fail if** | ATLAS claimed live or peer Phase-1 without build. |

**Audit gate N9** — as for N8 when product starts.

---

### N10 — CIS2 / Mirth / funded regulatory route (external parallel)

| | |
|---|---|
| **Goal** | Organisational identity, on-prem HL7, and funded DTAC/DCB/MHRA — templates already in-repo. |
| **Estimate** | Months (external critical path) |
| **Owner** | **user / partner / CSO / sponsor** · eng implements only when topology/credentials exist |
| **Work** | CIS2 plan (no fake SSO); Mirth on-prem if required; fund consultant route for DTAC/DCB0129/MHRA; keep gates `certified:false` until signed. |
| **Exit criteria** | Architecture notes + funded plan; eng hooks only after real endpoints. |
| **Fail if** | NextAuth sold as CIS2; Mirth mock sold as live intake; invented cert badges. |

**Audit gate N10** — partner gate refs + honesty reject `certified:true` until signatures exist.

---

## Suggested cadence

| Track | Phases | Notes |
|---|---|---|
| **Done (demo)** | **D1** | **PASS** — FHIR-in-Neon, Accept→export, `/demo/script` ([`DEMO_LAUNCH_D1_AUDIT.md`](./DEMO_LAUNCH_D1_AUDIT.md)) |
| **Deferred** | **N1** | IM1 / Partner emails only if credentials / capacity appear |
| **When secrets land** | **N2 → N3** | Medplum + Deepgram → BRIDGE rehearsal (**N3 paused** until then) |
| **Done (small)** | **N4** | **PASS** — roster honesty locked ([`NEXT_BUILD_N4_AUDIT.md`](./NEXT_BUILD_N4_AUDIT.md)) |
| **After sandbox creds** | **N5 → N6** | N5 scaffold **PASS**; live wire + N6 **paused** until creds |
| **Only after signed GO** | **N7** | Controlled `liveEmis` flip (**paused**) |
| **Product pull-in** | **N8 / N9** | PRISM / ATLAS |
| **Parallel external** | **N10** | CIS2 / Mirth / regulatory funding |

---

## Definition of success for “next”

1. **Demo launch ready** — synthetic HITL loop on akshhealth.com with honesty banners; see [`DEMO_LAUNCH_WITHOUT_IM1.md`](./DEMO_LAUNCH_WITHOUT_IM1.md).  
2. **D1 hardening PASS** — BRIDGE without Medplum; export handoff; demo script ([`DEMO_LAUNCH_D1_AUDIT.md`](./DEMO_LAUNCH_D1_AUDIT.md)).  
3. **Roster honesty locked** — VOICE / DrASSIST(/JSL) sub-capabilities; PRISM/ATLAS Phase 2 / not live.  
4. **Partner path gated / paused** — N3/N5–N7 wait on creds + signed go/no-go; `liveEmis:false`.  
5. **No rebuild** of NextAuth / Neon / SHIELD / CONDUCTOR / LangGraph-or-Supabase swap.

This is **not** a claim of production-ready live EHR write-back. Live Layer 15 remains **NO-GO** until N7.

---

## Cross-links

- [`DEMO_LAUNCH_WITHOUT_IM1.md`](./DEMO_LAUNCH_WITHOUT_IM1.md) — **demo path without IM1 / EMIS / Medplum** · D1 tasks  
- [`DEMO_LAUNCH_D1_AUDIT.md`](./DEMO_LAUNCH_D1_AUDIT.md) — **D1 PASS** (BRIDGE Neon staging · export · demo script)  
- [`DEMO_LAUNCH_CREDENTIALS.md`](./DEMO_LAUNCH_CREDENTIALS.md) — signup / smoke credentials  
- [`PHASED_BUILD_AND_AUDIT_PLAN.md`](./PHASED_BUILD_AND_AUDIT_PLAN.md) — P0–P7 complete (paperwork)  
- [`PHASED_BUILD_P7_AUDIT.md`](./PHASED_BUILD_P7_AUDIT.md) — paperwork PASS / live NO-GO  
- [`P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md) — emails + external checklist  
- [`NEXT_BUILD_N1_AUDIT.md`](./NEXT_BUILD_N1_AUDIT.md) — N1 READY_TO_SEND (not SENT)  
- [`NEXT_BUILD_N2_AUDIT.md`](./NEXT_BUILD_N2_AUDIT.md) — N2 PARTIAL (OAuth Invalid client; Deepgram simulated local)  
- [`NEXT_BUILD_N4_AUDIT.md`](./NEXT_BUILD_N4_AUDIT.md) — N4 PASS (sub-capability honesty; JSL not wired)  
- [`NEXT_BUILD_N5_AUDIT.md`](./NEXT_BUILD_N5_AUDIT.md) — N5 PASS (scaffold) (Partner sandbox flag; needs_partner until creds)  

- [`HOW_TO_BUILD_AKSH_HEALTH.md`](./HOW_TO_BUILD_AKSH_HEALTH.md) — plain-English honest picture  
- [`BUILD_INSTRUCTIONS_GAP.md`](./BUILD_INSTRUCTIONS_GAP.md) — layers 1–15 vs reality  
- [`PHASE2_PARTNER_CHECKLIST.md`](./PHASE2_PARTNER_CHECKLIST.md) — external partner actions  
- [`CLINICAL_SPINE_PHASE_F.md`](./CLINICAL_SPINE_PHASE_F.md) — partner readiness APIs / Admin panel  
- [`PILOT_PACKAGE.md`](./PILOT_PACKAGE.md) — fixed demo cases + rehearsal runbook  
