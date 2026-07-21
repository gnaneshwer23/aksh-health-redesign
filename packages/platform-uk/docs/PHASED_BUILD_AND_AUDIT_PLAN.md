# Phased Build & Audit Plan — Remaining Work Only

**Date:** July 2026  
**Scope:** `packages/platform-uk` on `main` (post Clinical Spine Phases A–F)  
**Companion audits:** [`BUILD_INSTRUCTIONS_GAP.md`](./BUILD_INSTRUCTIONS_GAP.md) · [E2E approach audit canvas](file:///Users/gnaneshwerjadav/.cursor/projects/Users-gnaneshwerjadav-Workspace-0ne-Health-packages-platform-uk/canvases/aksh-e2e-approach-audit.canvas.tsx)

## Purpose

Build the **remaining** gaps in phases, each ending with an **audit gate**. Do **not** rebuild DONE layers (NextAuth, Neon users/onboarding, SHIELD hash-chain, Neo4j, SYNTHESIS/GUARDIAN/HORIZON, CONDUCTOR orchestrate, HITL, Medplum dry-run, Phases A–F). Keep the working stack: **NextAuth + Neon + Vercel AI Gateway + deterministic CONDUCTOR** (no Supabase, no LangGraph, no direct Anthropic SDK).

**Order (fixed):** product spine → agent completeness → front/back consistency → partner/EHR last.

---

## Baseline — already DONE (do not rebuild)

| Area | Evidence | Honesty |
|---|---|---|
| Auth / onboarding | NextAuth + Neon `aksh.users` / profiles / onboarding | Keep |
| Layers 1, 3–4, 6–12, 14 (adapted names) | See gap audit | Keep |
| Clinical spine A–F | `docs/CLINICAL_SPINE_PHASE_*.md` + spine tests in `test:clinical-proof` | `liveEmis:false` · HITL mandatory |
| SHIELD | Append-only hash-chained `shield_audit_events` | Exceeds doc |
| NEXUS API (standalone) | `lib/agents/llm-nexus.ts` · `POST /api/agents/nexus` · `tests/nexus-agent.test.ts` | Draft-only · not yet in CONDUCTOR default |
| Migrations authored | `009_practices.sql` · `010_consent_grants.sql` | **Apply** still required on target Neon |

**Fail any future phase if** someone proposes ripping NextAuth for Supabase, adding LangGraph as CONDUCTOR, flipping `liveEmis` without partner go/no-go, or inventing MHRA/DCB/CSO signatures in code.

---

## Global honesty rules (every phase)

Fail the phase (and do not merge as “done”) if any of the following appear:

1. **`liveEmis: true`** (or marketing “live EMIS write-back / SystmOne ready”) without signed partner go/no-go + eng flip checklist.
2. **Autonomous EHR write** — any path that stages or writes without Accept/Edit/Reject.
3. **Fake certifications** — `certified:true`, signed DPIA/DCB0129/MHRA/CSO invented in UI or APIs.
4. **PRISM / ATLAS claimed live** — remain Phase 2 / `live:false` until built.
5. **NEXUS marketed as “in CONDUCTOR”** while orchestrate still omits it (until P2 closes).
6. **Medplum / Neo4j / VOICE** claimed “live connected” when credentials absent — must show dry-run / mock / simulated banners.
7. **Clinical-proof or spine tests broken** without an explicit, temporary waiver documented in the PR.

### Shared audit toolkit

| Gate | Command / check |
|---|---|
| Clinical proof (unit + spine A–F + NEXUS) | `npm run test:clinical-proof` |
| Workflow + clinical proof | `npm run test:workflow` |
| Typecheck | `npm run typecheck` |
| Clinical proof E2E (optional heavier) | `npm run test:e2e:clinical-proof` |
| Marketing honesty E2E | `npx playwright test e2e/marketing.spec.ts` |
| Role / integration smokes | `npm run smoke:all` · `npm run smoke:medplum` · `npm run smoke:neo4j` |
| Partner honesty | `GET /api/clinical-spine/partner-readiness` → `honesty.liveEmis === false` · gates reject `certified:true` |
| Manual UI | GP Orchestrate → HITL → SHIELD; SystemSpinePanel / PartnerReadinessPanel banners; Neo4jMockModeBanner when mock |

---

## Phase roadmap

```text
P0 Baseline lock
 → P1 Neon durability (009/010)
 → P2 NEXUS ∈ CONDUCTOR
 → P3 Agent brand in GP UI
 → P4 Front ↔ back honesty
 → P5 Staging secrets (Medplum / Deepgram)
 → P6 Full regression audit
 → P7 Layer 15 partner / EHR (external)
```

Estimates are eng calendar days for one focused engineer unless noted. Owners: **eng** = platform-uk engineering; **user/partner** = credentials, org approvals, Partner Programme.

---

### P0 — Baseline lock & freeze DONE layers

| | |
|---|---|
| **Goal** | Snapshot green baseline; document what must not be touched. |
| **Estimate** | 0.5 day |
| **Owner** | eng |
| **Work** | Run `test:clinical-proof` + `typecheck`; confirm spine A–F docs still match code; link this plan from gap audit (optional one-line). No feature work. |
| **Exit criteria** | Clinical-proof green on `main`; inventory of DONE layers agreed; open gaps list matches table below. |
| **Fail if** | Plan proposes rebuilding auth/SHIELD/Neo4j/orchestrate from scratch; baseline suite red without known env cause. |

**Audit gate P0**

- [x] `npm run test:clinical-proof` — **PASS** 2026-07-21 (exit 0)
- [x] `npm run typecheck` — **PASS** 2026-07-21 (exit 0)
- [x] Spot-check: Partner readiness `liveEmis:false`; no `certified:true` in responses — **PASS**
- [x] Honesty checklist: HITL mandatory still true in orchestrate capabilities — **PASS** (`hitlRequired:true`)

**P0 exit:** **PASS** — see [`PHASED_BUILD_P0_AUDIT.md`](./PHASED_BUILD_P0_AUDIT.md). No blockers; no feature work.

---

### P1 — Product spine: Neon durability (009 / 010)

| | |
|---|---|
| **Goal** | Apply and verify practices lookup + durable consent grants (Layer 2 remainder). |
| **Estimate** | 1 day |
| **Owner** | eng (apply) · **user** (Neon connection / approval to migrate prod/staging) |
| **Work** | Apply `db/migrations/009_practices.sql` and `010_consent_grants.sql` to target Neon; confirm dual-write / mirror of consent grants; seed ODS practices if empty; smoke onboarding consent path still works with file fallback if Neon briefly unavailable. |
| **Exit criteria** | Tables exist in `aksh`; consent grant round-trip visible in Neon for a test practice; app still boots if mirror fails (best-effort). |
| **Fail if** | Migration drops SHIELD / users tables; consent claimed “only Neon” while still file-only with no dual-write; RLS/Supabase rewrite attempted. |

**Audit gate P1**

- [ ] SQL: `\dt aksh.practices` · `\dt aksh.consent_grants` (or equivalent)
- [ ] Manual: complete consent step in onboarding → row or mirror attempt logged
- [ ] `npm run test:clinical-proof` (tenant / HITL unchanged)
- [ ] Honesty: no claim that practices table = live EMIS practice sync

---

### P2 — Product spine: NEXUS in CONDUCTOR

| | |
|---|---|
| **Goal** | Close the top product gap — NEXUS runs in the default (or explicit opt-in) CONDUCTOR path with HITL + SHIELD. |
| **Estimate** | 2–3 days |
| **Owner** | eng |
| **Work** | Extend `lib/clinical-spine/orchestrate.ts` (+ clinical-proof orchestration) to include NEXUS after SYNTHESIS/GUARDIAN/HORIZON (order TBD: correlations after risk is fine); keep draft-only · `ehrWrite:false`; update `ClinicalOrchestratePanel` / pipeline diagram so “LIVE · API” becomes “LIVE · in CONDUCTOR” only after wiring; extend orchestration tests; keep internal ids stable. |
| **Exit criteria** | Orchestrate response includes NEXUS draft; review order respects urgency (GUARDIAN first when urgent); SHIELD event recorded; marketing/pipeline copy matches. |
| **Fail if** | NEXUS writes EHR; NEXUS bypasses HITL; LangGraph introduced; NEXUS marketed in CONDUCTOR before tests pass. |

**Audit gate P2**

- [ ] `npm run test:clinical-proof` (incl. orchestration + nexus-agent)
- [ ] Unit: orchestrate fixture patient returns `agents` / review items including NEXUS
- [ ] Manual UI: GP Precision Health → Orchestrate → NEXUS draft in queue → Accept/Reject
- [ ] Marketing: EndToEndPipelineDiagram NEXUS badge honest
- [ ] Honesty checklist: `liveEmis:false` unchanged on orchestrate payload

---

### P3 — Agent completeness: GP UI brand + VOICE / DrASSIST positioning

| | |
|---|---|
| **Goal** | CANVAS / BRIDGE / CONDUCTOR visible where clinicians work; VOICE & DrASSIST framed as intake/coding **sub-capabilities**, not rogue 13th/14th brand agents. |
| **Estimate** | 2 days |
| **Owner** | eng |
| **Work** | GP `AgentControlPanel` / intake surfaces: label intake as **CANVAS**; staging/FHIR path as **BRIDGE**; Orchestrate as **CONDUCTOR**; short copy that VOICE feeds CANVAS and DrASSIST supports coding drafts under HITL; do **not** add them to `AGENT_DIRECTORY` as peer Phase-1 agents unless product explicitly expands the 12. |
| **Exit criteria** | GP dashboard shows CANVAS/BRIDGE/CONDUCTOR names; VOICE/DrASSIST help text clarifies relationship; AgentGrid still 12 + Phase 2. |
| **Fail if** | VOICE/DrASSIST silently added as live 12-agent peers without product decision; PRISM/ATLAS marked live; ORACLE label regressions in GP UI. |

**Audit gate P3**

- [ ] Manual: GP dashboard agent panel — CANVAS / BRIDGE / CONDUCTOR visible
- [ ] Manual: VOICE / DrASSIST described as supporting capabilities
- [ ] `e2e/marketing.spec.ts` still green (12-agent grid)
- [ ] `npm run test:clinical-proof`
- [ ] Honesty: no “14 live agents” claim

---

### P4 — Front ↔ back consistency (honesty pass)

| | |
|---|---|
| **Goal** | Marketing, integrations, onboarding, and APIs tell the same Capture → Draft → Approve story. |
| **Estimate** | 1–2 days |
| **Owner** | eng |
| **Work** | Tighten `app/integrations/page.tsx` (“connected practices” → staging readiness); audit UK surfaces for COMPLIANCE_BADGES / HIPAA/ABDM leakage; re-scan TrustMarquee, How It Works, ConsentForm, Partner panels; align any remaining ORACLE/EQUITY/REFERRAL user-facing strings via `resolveClinicalAgentLabel`. |
| **Exit criteria** | Spot audit of `/integrations`, `/how-it-works`, `/platform`, GP + Admin Precision Health matches backend honesty flags. |
| **Fail if** | “SystmOne ready”, “live EMR pull”, or signed DCB language reappears; partner gates accept `certified:true`. |

**Audit gate P4**

- [ ] Manual UI honesty checklist (below)
- [ ] `npx playwright test e2e/marketing.spec.ts`
- [ ] `GET /api/clinical-spine/partner-readiness` + emis partner checklist → `liveEmis:false`
- [ ] Route smoke / `test:workflow` if copy changes touch asserted strings
- [ ] Diff review: no invented cert badges on UK pages

**Manual UI honesty checklist (P4+)**

1. Trust strip: “Designed for” not “ready” for EMIS/SystmOne.  
2. Pipeline: HITL before any staging language.  
3. Integrations: staging / sim only; `liveEmis:false` visible.  
4. Consent: rehearsal / staging — not signed DCB0129.  
5. Neo4j: mock banner when not live.  
6. Medplum: dry-run / credentials-needed when unset.  
7. Partner panel: unsigned / needs_partner — never certified unlock.

---

### P5 — Staging hardening: Medplum + Deepgram (secrets-gated)

| | |
|---|---|
| **Goal** | Optional live **staging** rehearsal for FHIR (Medplum) and ASR (Deepgram) — still not Layer 15 EHR. |
| **Estimate** | 1–2 days eng after secrets available |
| **Owner** | **user** supplies `MEDPLUM_CLIENT_ID` / `MEDPLUM_CLIENT_SECRET` · Deepgram key · eng verifies smokes |
| **Work** | Wire env in Vercel/local; run `npm run smoke:medplum`; confirm status API reports mode honestly; VOICE uses Deepgram when key present else simulated transcript; **never** set `liveEmis`. |
| **Exit criteria** | With secrets: Medplum rehearsal smoke green; without secrets: dry-run path still green. VOICE UI labels simulated vs live ASR correctly. |
| **Fail if** | Medplum success used to claim live EMIS; missing-key path errors instead of honest fallback; secrets committed to git. |

**Audit gate P5**

- [ ] `npm run smoke:medplum` (with and without credentials documented)
- [ ] `npm run test:clinical-proof` (Medplum clinical-proof piece)
- [ ] Manual: SystemSpinePanel Medplum row matches reality
- [ ] VOICE: simulated transcript banner when no Deepgram key
- [ ] Honesty: `liveEmis:false` hard

---

### P6 — Full regression audit (after P1–P5)

| | |
|---|---|
| **Goal** | Prove the phased build works as planned end-to-end on platform scope (not production-ready EHR). |
| **Estimate** | 1 day |
| **Owner** | eng |
| **Work** | Run full gates below; update gap audit “open gaps” to closed/deferred; optionally refresh E2E approach audit canvas statuses. |
| **Exit criteria** | All automated gates green (or waived with env reason); open register only P7 + Phase-2 PRISM/ATLAS. |
| **Fail if** | Any honesty rule violated; clinical-proof red; NEXUS still out of CONDUCTOR while marketing says otherwise. |

**Audit gate P6 (full)**

| Check | Pass bar |
|---|---|
| `npm run test:clinical-proof` | Exit 0 |
| `npm run test:workflow` | Exit 0 |
| `npm run typecheck` | Exit 0 |
| `npm run test:e2e:clinical-proof` | Exit 0 (CI or local against staging) |
| `e2e/marketing.spec.ts` | Exit 0 |
| `npm run smoke:all` | Soft-ok per env; hard failures investigated |
| Partner readiness API | `liveEmis:false` · `autoRetrain:false` · no certified unlock |
| Manual Capture→Draft→Approve | Orchestrate incl. NEXUS → HITL → stage/sim only |
| Gap doc | Remaining items = P7 / secrets / Phase 2 only |

---

### P7 — Partner / EHR (Layer 15) — external last

| | |
|---|---|
| **Goal** | Real EMIS/SystmOne Partner path — only after org/partner artefacts. |
| **Estimate** | Weeks–months (external critical path) · eng spike only after go/no-go |
| **Owner** | **user / partner / CSO** primary · eng implements flip when authorised |
| **Work (external)** | EMIS Partner Programme · CIS2 · Mirth on-prem · signed DPIA/DPA · CSO Gate 2 · write-back go/no-go · partner UAT · DTAC/DCB/MHRA route funded. Use `docs/PHASE2_PARTNER_CHECKLIST.md` · Phase F pack · evidence-pack templates. |
| **Work (eng, only after go/no-go)** | Controlled `liveEmis` flip checklist; partner write path behind feature flag; rollback drill; never auto-flip from gate tracker. |
| **Exit criteria** | Signed artefacts on file; partner UAT signed; eng flip checklist complete; monitoring + rollback rehearsed. |
| **Fail if** | Eng flips `liveEmis` because “code is ready”; UI shows certified without signatures; Mirth mock sold as live. |

**Audit gate P7**

- [ ] Partner checklist all human boxes signed (not just `external_ref_noted`)
- [ ] `canFlipLiveEmisInCode()` / flip SOP only after go/no-go
- [ ] Clinical-proof + partner UAT script green against staging partner endpoint
- [ ] Honesty: production claims match actual Partner connection state
- [ ] Residual risk + release/rollback docs updated in evidence pack

---

## Open gaps → phase map

| Gap | Phase | Notes |
|---|---|---|
| Neon 009/010 apply | **P1** | Files exist; apply to Neon |
| NEXUS not in CONDUCTOR | **P2** | API already live |
| CANVAS / BRIDGE thin in GP UI | **P3** | Naming adoption |
| VOICE / DrASSIST outside 12-agent brand | **P3** | Position as sub-capabilities |
| Integrations / residual copy honesty | **P4** | Front↔back |
| Medplum secrets | **P5** | User-owned |
| Deepgram / VOICE live ASR | **P5** | User-owned · optional |
| Layer 15 EMIS/SystmOne live | **P7** | External · deferred correctly |
| PRISM / ATLAS | Phase 2 roadmap | Out of P0–P7 build unless product pulls in |

---

## Suggested execution cadence

| Week | Phases | Focus |
|---|---|---|
| 0 | P0 | Lock baseline |
| 1 | P1 → P2 | Spine durability + NEXUS orchestration |
| 2 | P3 → P4 | Agent brand + honesty consistency |
| 3 | P5 → P6 | Secrets (if available) + full audit |
| Ongoing | P7 | Partner track in parallel — does not block P1–P6 |

P7 can run **in parallel as paperwork** from day one; **eng implementation** stays last.

---

## Definition of “works as planned”

For this plan, success means:

1. **Product spine:** Neon 009/010 applied; CONDUCTOR includes NEXUS; HITL + SHIELD + `liveEmis:false` intact.  
2. **Agent completeness:** 12-agent brand consistent in GP UI; VOICE/DrASSIST honestly positioned.  
3. **Front/back:** Marketing and integrations match APIs and honesty flags.  
4. **Partner/EHR:** Still deferred until external gates; staging Medplum/Deepgram optional and honest.

This is **not** a claim of production-ready live EHR write-back. That remains P7 only.

---

## Cross-links

- [`BUILD_INSTRUCTIONS_GAP.md`](./BUILD_INSTRUCTIONS_GAP.md) — Layers 1–15 vs reality  
- [`E2E_CLINICAL_PROOF.md`](./E2E_CLINICAL_PROOF.md) — proof harness DoD  
- [`CLINICAL_SPINE_PHASE_F.md`](./CLINICAL_SPINE_PHASE_F.md) — partner readiness (in-repo)  
- [`PHASE2_PARTNER_CHECKLIST.md`](./PHASE2_PARTNER_CHECKLIST.md) — external partner actions  
- [`PRECISION_HEALTH_DELIVERY_ROADMAP.md`](./PRECISION_HEALTH_DELIVERY_ROADMAP.md) — longer delivery context  
