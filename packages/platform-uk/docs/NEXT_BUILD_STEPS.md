# Next Build Steps — After P0–P7 Paperwork

**Date:** July 2026  
**Scope:** `packages/platform-uk` on `main`  
**Prerequisite:** P0–P6 product spine **PASS**; P7 paperwork **PASS** / live EMIS **NO-GO**  
**Companion:** [`PHASED_BUILD_AND_AUDIT_PLAN.md`](./PHASED_BUILD_AND_AUDIT_PLAN.md) · [`HOW_TO_BUILD_AKSH_HEALTH.md`](./HOW_TO_BUILD_AKSH_HEALTH.md) · [`P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md)

## Purpose

Ordered phases for **what to build next**. Do **not** rebuild DONE layers (NextAuth, Neon, SHIELD, Neo4j, AI Gateway agents, CONDUCTOR+NEXUS, HITL, Medplum dry-run, honesty banners, P0–P7 paperwork). Keep the working stack: **NextAuth + Neon + Vercel AI Gateway + deterministic CONDUCTOR** (no Supabase, no LangGraph, no required direct Anthropic SDK).

**Hard invariant:** `liveEmis: false` until a **signed** partner go/no-go + eng flip checklist. Presence of Partner env vars ≠ permission to flip.

---

## Priority stack

| Priority | Items |
|---|---|
| **Must** | Execute P7 external outreach (IM1 + EMIS Partner Programme); keep honesty / `liveEmis:false`; run partner UAT + signed go/no-go **before** any eng flip |
| **Should** | Real Medplum Client Secret (staging OAuth green); local Deepgram for live VOICE ASR; harden BRIDGE staging rehearsal once Medplum works; Partner sandbox wire **behind flags** when credentials exist |
| **Later** | Controlled `liveEmis` flip (only after N6–N7 gates); PRISM; ATLAS; CIS2 / Mirth on-prem; funded DTAC / DCB0129 / MHRA route |

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

## Phase roadmap (N1…N10)

```text
N1 External outreach execution (user/partner)     ← start immediately
 → N2 Staging secrets (Medplum / Deepgram)        ← optional but high leverage
 → N3 BRIDGE staging rehearsal green              ← eng after N2 Medplum
 → N4 Sub-capability honesty + coding assist      ← eng (small; can parallel N2–N3)
 → N5 Partner sandbox wire (flags on; liveEmis:false)
 → N6 Partner UAT + rollback drill
 → N7 Signed go/no-go → controlled liveEmis flip  ← LAST eng critical path
 → N8 PRISM (Phase 2, product pull-in)
 → N9 ATLAS (Phase 2, product pull-in)
 → N10 CIS2 / Mirth / funded regulatory route     ← external parallel anytime
```

N1 and N10 run **in parallel** with eng work. **N7 never starts** without signed artefacts.

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

**Audit gate N1**

- [ ] IM1 and/or Partner outreach sent (evidence: email/ticket ref in Partner panel)
- [ ] `GET /api/clinical-spine/partner-readiness` → `honesty.liveEmis === false`
- [ ] No marketing claim of live EMIS / certified

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

**Audit gate N2**

- [ ] `npm run smoke:medplum` documents with-creds **green** vs without **disabled_honest**
- [ ] VOICE: live ASR when key present · simulated banner when absent
- [ ] `npm run test:clinical-proof` exit 0
- [ ] Honesty: `liveEmis:false` hard

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

**Audit gate N4**

- [ ] `e2e/marketing.spec.ts` green (12-agent honesty)
- [ ] Manual: VOICE / DrASSIST copy = sub-capability; PRISM/ATLAS = Phase 2 / not live
- [ ] `npm run test:clinical-proof` exit 0

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

**Audit gate N5**

- [ ] Partner sandbox smoke (flag on) · sim path (flag off)
- [ ] `honesty.liveEmis === false` · `canFlipLiveEmisInCode() === false`
- [ ] Clinical-proof + partner honesty tests green

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
| **This week** | **N1** | Send IM1 / Partner emails from the pack |
| **When secrets land** | **N2 → N3** | Medplum + Deepgram → BRIDGE rehearsal |
| **Anytime (small)** | **N4** | Roster honesty / optional coding assist |
| **After sandbox creds** | **N5 → N6** | Flagged Partner wire → UAT + rollback |
| **Only after signed GO** | **N7** | Controlled `liveEmis` flip |
| **Product pull-in** | **N8 / N9** | PRISM / ATLAS |
| **Parallel external** | **N10** | CIS2 / Mirth / regulatory funding |

---

## Definition of success for “next”

1. **Outreach started** — N1 evidence in Partner panel.  
2. **Staging quality optional but honest** — N2–N3 Medplum/VOICE match banners.  
3. **Roster honesty locked** — VOICE / DrASSIST(/JSL) sub-capabilities; PRISM/ATLAS Phase 2 / not live.  
4. **Partner path gated** — N5–N6 before any N7 flip; `liveEmis:false` until signed go/no-go.  
5. **No rebuild** of NextAuth / Neon / SHIELD / CONDUCTOR / LangGraph-or-Supabase swap.

This is **not** a claim of production-ready live EHR write-back. Live Layer 15 remains **NO-GO** until N7.

---

## Cross-links

- [`PHASED_BUILD_AND_AUDIT_PLAN.md`](./PHASED_BUILD_AND_AUDIT_PLAN.md) — P0–P7 complete (paperwork)  
- [`PHASED_BUILD_P7_AUDIT.md`](./PHASED_BUILD_P7_AUDIT.md) — paperwork PASS / live NO-GO  
- [`P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md) — emails + external checklist  
- [`HOW_TO_BUILD_AKSH_HEALTH.md`](./HOW_TO_BUILD_AKSH_HEALTH.md) — plain-English honest picture  
- [`BUILD_INSTRUCTIONS_GAP.md`](./BUILD_INSTRUCTIONS_GAP.md) — layers 1–15 vs reality  
- [`PHASE2_PARTNER_CHECKLIST.md`](./PHASE2_PARTNER_CHECKLIST.md) — external partner actions  
- [`CLINICAL_SPINE_PHASE_F.md`](./CLINICAL_SPINE_PHASE_F.md) — partner readiness APIs / Admin panel  
