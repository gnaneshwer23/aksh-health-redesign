# Aksh Health — Vision (End-to-End) & Product Requirements Overview

**Document ID:** AKSH-VISION-PRD-OVERVIEW
**Version:** 1.4
**Date:** 2026-10-10
**Product:** Aksh Intelligence Platform (UK/EU) · first module: Aksh Diabetes
**Live:** https://akshhealth.com

---

## How to use this document

| Need | Use |
| --- | --- |
| **Readable vision + PRD summary** (investors, advisors, independent review) | **This document** |
| **Full functional PRD** (FR/AC IDs, Given/When/Then, all 22 chapters) | [`volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md`](./volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md) — **product source of truth** (draft-complete; not yet Accepted) |
| **Architecture / layers / agents** | [`ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md`](./ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md) |
| **Diabetes module detail** | [`DISEASE_INTELLIGENCE_DIABETES_SPEC.md`](./DISEASE_INTELLIGENCE_DIABETES_SPEC.md) |
| **REQ → test status** | [`QA_TRACEABILITY_MATRIX.md`](./QA_TRACEABILITY_MATRIX.md) |
| **Phase gates P0–P7** | [`PHASED_BUILD_AND_AUDIT_PLAN.md`](./PHASED_BUILD_AND_AUDIT_PLAN.md) |
| **Built vs remaining honesty** | [`BUILT_VS_REMAINING_AUDIT.md`](./BUILT_VS_REMAINING_AUDIT.md) |
| **Latest production QA** | [`reports/AKSH_E2E_PRD_QA_AUDIT_20261005.md`](./reports/AKSH_E2E_PRD_QA_AUDIT_20261005.md) |
| **Patient-access (staged)** | [`PATIENT_ACCESS_INTEGRATION.md`](./PATIENT_ACCESS_INTEGRATION.md) |

This overview **does not replace Volume I**. It restates vision and PRD structure for end-to-end reading. Where wording conflicts with Volume I or a hard ADR constraint, **Volume I / ADR / hard constraint wins**.

---

## 1. Vision (one page)

### 1.1 What Aksh is

Aksh Health builds the **Aksh Intelligence Platform**: a single, auditable, **human-in-the-loop** clinical intelligence layer that sits **beside** a practice’s EHR (EMIS, SystmOne, etc.) — not as a replacement system of record.

**Job of the platform:** turn scattered clinical signal (notes, labs, meds, self-report, population context) into **structured, explainable, clinician-reviewable drafts**. A named clinician decides. The platform never decides alone.

**First commercial module:** **Aksh Diabetes** — nine intelligence areas (glucose, HbA1c, insulin, GLP-1, nutrition, exercise, behaviour, complications, prevention) feeding the same orchestrator, audit, and review workflow as general clinical intake.

### 1.2 The problem

Two failure modes dominate “clinical AI” today:

1. **Point tools that don’t compose** — separate risk, coding, and coaching apps with separate trust and safety boundaries.
2. **Automation that oversteps** — auto-write to the record, auto-dose, diagnostic claims without a human in the loop.

Aksh’s answer: **one orchestrator (CONDUCTOR), one audit trail (SHIELD), one consent/identity model, one non-negotiable rule — nothing reaches a patient record or prescription without a human decision.**

### 1.3 End-to-end product loop

```text
Signal in (synthetic / pilot-consented)
    → Capture (CANVAS / VOICE / intake / patient-access events*)
    → Understand & draft (SYNTHESIS, Dr.Assist, disease signals)
    → Detect & reason (GUARDIAN, HORIZON, NEXUS, PATHWAY, …)
    → Clinician HITL (Accept / Edit / Reject + gates)
    → Stage (BRIDGE / FHIR R4 · liveEmis:false)
    → Simulate / rehearse (sim EMR chart · not live NHS write)
    → Audit (SHIELD hash-chain)
    → Governed learning only (G-ML-1/2/3 · autoRetrain:false)
```

\*Patient-access integration is a **staged, disabled** adapter (`patient-access-synthetic`): inbound referral/intake/booking/no-show → tagged FHIR → draft access-gap findings → clinician accept → one non-clinical outreach request. No live telephony. See `PATIENT_ACCESS_INTEGRATION.md`.

### 1.4 Track A vs Track B (binding commercial honesty)

| Track | Meaning | Status |
| --- | --- | --- |
| **A — Synthetic / internal clinic / pilot marketing** | Demo + HITL + sim EHR · no live PHI write | **GO** (audited Oct 2026 on akshhealth.com) |
| **B — Live NHS clinical / EMR write** | Real PHI · live EMIS/SystmOne · DPIA / partner | **NO-GO by design** until separately governed |

Never sell Track A as Track B. Never imply MHRA / DCB / DPIA complete from rehearsal artefacts.

### 1.5 Business objectives (summary)

From Volume I §1.3 (`BO-1`…`BO-9`):

1. One auditable intelligence layer (compose intake, safety, risk, coordination, disease modules).
2. Prove Diabetes as first module on shared infra (no per-disease SHIELD/CONDUCTOR).
3. Every clinical output explainable.
4. Human decision before anything is final.
5. Tamper-evident audit (SHIELD).
6. Synthetic / pilot-consented data until governance opens more.
7. Extensible to further disease modules.
8. Population ↔ individual ↔ clinician views over the same signal.
9. Improve only via governed continuous learning — never silent retrain.

### 1.6 Non-objectives (hard — cannot be relaxed by this overview)

| ID | Constraint |
| --- | --- |
| NO-1 | No autonomous clinical decisions |
| NO-2 | No automatic prescribing / executable dose change |
| NO-3 | Not an EHR replacement |
| NO-4 | No live EHR write (`liveEmis:false`) |
| NO-5 | No silent/automatic model retrain (`autoRetrain:false`) |
| NO-6 | No fake or implied certification (MHRA, DCB, DTAC, CIS2, …) |
| NO-7 | No un-explainable clinical output |
| NO-8 | No parallel safety/audit stack per disease module |
| NO-9 | No real PHI without explicit governed decision |
| NO-10 | No Diabetes-only lock-in of shared platform layers |

---

## 2. Product requirements overview (PRD structure)

### 2.1 Full PRD location

**Volume I** (`docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md`, v0.21) is the PRD:

- **Status:** Draft complete (22/22 chapters **[DRAFTED]**). **Not Accepted** until Product / Architecture / Clinical Safety sign-off (§21.10).
- **IDs:** `BO-*`, `NO-*`, `SC-*`, `FR-<CHAPTER>-nnn`, `NFR-*`, `BR-*`, `AC-*`, `OQ-*`, `DEC-*`.
- **Depth:** Purpose, responsibilities, inputs/outputs/triggers, business rules, Given/When/Then ACs.

### 2.2 Volume I map (what each part requires)

| Part | Chapters | PRD focus |
| --- | --- | --- |
| **A Foundations** | 1–5 | Vision, scope, 8 personas, product architecture view, HITL |
| **B Platform** | 6–7 | Identity/consent/interop/knowledge; 12-agent platform |
| **C Disease** | 8–9 | Diabetes 9 signals; digital twin (rules · not physiological) |
| **D Intelligence** | 10–14 | Population, patient, clinical, research, governed learning |
| **E Experience** | 15–18 | Journeys, BR catalogue (85), data dictionary, 59 screens |
| **F Quality** | 19–22 | NFRs, acceptance/validation, open questions, appendices |

### 2.3 Personas (8 roles)

| Role | Primary job in Aksh |
| --- | --- |
| GP | Accountable clinical decision-maker — review queue Accept/Edit/Reject |
| Nurse | Observations, handover, escalate safety — not prescribing |
| Clinical pharmacist | Medication safety / GUARDIAN review |
| Practice manager (admin) | Ops, access, practice settings — not clinical Accept |
| ICS lead | Population / equity views (aggregate honesty) |
| Hospital executive | System overview / coordination (synthetic) |
| Patient | My Health / coaching drafts — **never** self-prescribe |
| Researcher | Ethics-gated evaluation / federated stubs — not live discovery suite |

### 2.4 Platform agents (canonical 12, from `AGENT_DIRECTORY` in `lib/agents.ts`)

VOICE and Dr.Assist are **sub-capabilities** of CANVAS and SYNTHESIS (N4 audit lock), not peer agents. Public pages lead with the human label; the codename is secondary (23 Jul 2026 marketing decision).

| Agent | Human label | Role (product) | Build honesty |
| --- | --- | --- | --- |
| CANVAS | Clinical intake | Capture / structured intake; includes VOICE dictation | Live |
| SYNTHESIS | Clinical documentation | SOAP / structured draft; includes Dr.Assist coding (SNOMED CT first) | Live · HITL |
| GUARDIAN | Medication safety | Med safety / interaction flags | Live · HITL |
| HORIZON (ex-ORACLE) | Predictive risk | Risk contribution with listed factors | Live · HITL |
| NEXUS | Clinical intelligence | Correlation into a draft clinical picture | Live in CONDUCTOR |
| PATHWAY (ex-REFERRAL) | Care coordination | Referral / pathway / follow-up package | Live · HITL |
| COMPASS (ex-EQUITY) | Population health | Population equity brief | Partial |
| BRIDGE | Interoperability | FHIR staging after Accept | Live · sim write only |
| SHIELD | Regulatory & audit | Audit / hash-chain | Live |
| CONDUCTOR | Supervisor | Deterministic orchestration | Live |
| PRISM | Imaging intelligence | Imaging review support | **`live:false` · not built** |
| ATLAS | Clinical research | Research / trial support | **`live:false` · not built** |

### 2.4a Patient access: Front Desk module and Asha (added 2026-10-10)

See `docs/PATIENT_ACCESS_AND_ASHA.md`. **Front Desk** is a module (like Aksh Diabetes), not new agents: the roster stays at 12. **Asha** is the patient-facing voice and chat channel of CANVAS.

| Workflow | What it does | Gate |
| --- | --- | --- |
| Answer (inbound) | Safety screen every turn → identity (name + DOB) → intent | Emergency / crisis → fixed 999 / 111 message + staff hand-off |
| Scheduling | Book, move, cancel; idempotent; Slot Fill offers cancellations to the waiting list | Admin; patient confirms |
| Referral Desk | Letter → matched patient → proposed slot | Urgent referrals go to a clinician first |
| Answers | Cited retrieval over a curated, non-clinical practice knowledge base | Clinical questions → hand-off, never answered |
| Health updates | Readings, symptoms, adherence → patient-reported, unverified FHIR drafts | GP Accept / Reject (EC-CLIN-3), SHIELD-audited |
| Recall campaigns | Missed, lapsed, annual recall, health check-ins (Asha calls) | GP approves check-ins; GP / practice manager approves rebooking; contact preference respected |
| Metrics | Baseline locked before go-live → lift | Labelled unverified until checked against practice data |

Track A only: synthetic patients, simulated telephony, no live EHR write. Thresholds await CSO sign-off. Live use needs a DPIA, DCB0129/0160, a PECR review for automated calls, and an MHRA opinion on whether symptom capture is a device function.

### 2.5 Core functional requirement themes

Grouped for reading; cite Volume I for exact `FR-*` text.

1. **HITL** — Every clinical draft needs Accept/Edit/Reject (or equivalent gate) before final; gates for red-flag, referral, medication decision.
2. **Interop** — FHIR R4 staging; EMIS/SystmOne **simulation** only; Medplum rehearsal optional.
3. **Diabetes** — Module feeds HORIZON/GUARDIAN; insulin/GLP-1 explanatory only (no executable dose); v0→v1→v2 phasing.
4. **Twin** — Scenario / rules twin first; `physiologicalTwin:false` until governance.
5. **Population / patient / research** — Complementary layers; research is offline/ethics-gated export boundary, not a full Owkin suite.
6. **Learning** — Append-only learning events; G-ML-1/2/3 before any model promote; `autoRetrain:false`.
7. **Identity** — NextAuth + Neon; 8-role onboarding; tenant/patient isolation.
8. **Honesty fields** — `liveEmis`, `ehrWrite`, `hitlRequired`, `autoRetrainTriggered`, etc. must stay literal and testable.

### 2.6 End-to-end journeys (Volume I Ch.15)

| # | Journey | Maturity label |
| --- | --- | --- |
| 1 | Clinician encounter → CONDUCTOR → review → Accept/Edit/Reject → learning | `[LIVE]` Track A |
| 2 | Clear human gate (red-flag / referral / medication) | `[LIVE]` |
| 3 | Patient consent → coaching / health-plan draft | `[PARTIAL]` |
| 4 | CGM/lab → diabetes signal → HORIZON/GUARDIAN → review | `[FUTURE]` until v1 wiring complete |
| 5 | ICS Segment→Predict→Recommend→Monitor→Learn | `[PARTIAL]` (Recommend strongest) |
| 6 | Researcher ethics-gated evaluation/export | `[PARTIAL]` |
| 7 | Demo vs live identity (always Track A unless Track B opened) | Binding |
| 8 | Twin what-if + HITL (incl. withhold stop-insulin results until gated) | Binding |

### 2.7 Measurable success criteria (summary)

From Volume I §1.5.1 — engineering/pilot gates:

- **SC-1** 100% clinical drafts require recorded clinician decision (clinical-proof).
- **SC-2** Zero live EHR writes (`liveEmis:false`).
- **SC-3** 100% clinical outputs in SHIELD.
- **SC-4** Zero auto-retrain outside G-ML gates.
- **SC-5–SC-6** Diabetes v0/v1 scope + non-diagnostic labels.
- **SC-7–SC-8** Honest Volume status + evidence-pack gates.

SC-1 and SC-3 apply to authenticated sessions. Public demo dashboards label every decision "Demo only, not audited" and send no audit write (fixed 2026-10-10, guarded by `e2e/clinical-proof-hitl.spec.ts`).

Aspirational commercial/clinical outcomes (SC-9–SC-13) need baselines — **do not quote externally as achieved**. SC-13 (clinical outcome claims) requires a formal clinical evaluation that does not exist today.

### 2.8 Non-functional bar (summary)

Performance smoke SLOs exist (`CP-PERF-001`). WCAG 2.1 AA is the named a11y target (partial axe coverage today). No formal uptime SLA, pen-test, or DR drill claimed. Stack remains Next.js + NextAuth + Neon + Vercel AI Gateway + deterministic CONDUCTOR (see Tech Stack ADR Keep/Avoid).

---

## 3. Current delivery state (honest · Oct 2026)

### 3.1 Production (akshhealth.com) — updated 2026-10-12

Production is the **real workspace only**: no sample patients, demo menus or synthetic dashboards. Source of truth for
what is built and what is missing: [`AKSH_PLATFORM_STATE_AND_PLAN_20261011.md`](./AKSH_PLATFORM_STATE_AND_PLAN_20261011.md).

| Area | State |
| --- | --- |
| Public site | Live: vision, two pillars (Patient Access available now; clinical intelligence in validation), country-neutral |
| Patient Access (Track A) | Live in **shadow mode**: cancellation-slot fill, staff decide every step, Aksh never sends messages or books; read-back confirms bookings |
| Pilot controls | Go-live review, pilot stages (shadow → staff-assisted, Aksh reviewer only), approved offer wording, weekly review and sign-off, pilot readout, capability register |
| Degraded state | A step that cannot be persisted with its audit row returns `NOT_RECORDED` with the alternate route; nothing changes |
| Care network + CGM monitoring | Live under row-level security; clinician-only worklists |
| Clinical agents (Track B) | **Closed** in production: `/api/agents`, `/api/clinical-spine`, `/api/precision-health`, `/api/patients`, `/api/front-desk` and related synthetic APIs return 403 `TRACK_B_NOT_OPEN` |
| Postgres | Neon production project (separate from the simulation project) |
| Live PHI to AI / live EMR write | **NO-GO** |

Simulation (separate database) keeps the full synthetic estate: the 100-patient cohort, legacy role dashboards,
Front Desk / Asha, and the Track B link (care-network patient → CONDUCTOR + Aksh Diabetes with trusted CGM).

### 3.2 Engineering phases

| Phase | Intent | Audit |
| --- | --- | --- |
| P0–P6 | Baseline → durability → NEXUS → UI honesty → secrets → regression | Recorded **PASS** |
| P7 | Partner / live EHR | **Open / external** |
| Clinical spine A–F | CONDUCTOR path | In `test:clinical-proof` |
| PRD v1.1 Track A | Patient Access end to end (§10, §14 negative cases incl. audit failure and hand-off queue down) | In `test:clinical-proof` |
| Track B link (G1/G2) | One patient spine; care-network CGM into Aksh Diabetes; simulation only | `tests/patient-spine-db.test.ts` |
| One slot fill (G3) | `lib/access` is the only slot fill in the real workspace; Front Desk's calendar offer is demo-only and closed in production | Middleware + real-workspace e2e |
| Patient-access outreach adapter | Staged · disabled · 22 tests (outreach proposals, not slot fill) | Code + docs; not a live vendor |

### 3.3 Traceability snapshot (REQ matrix · 37 requirements)

| Status | Count | Examples |
| --- | ---: | --- |
| PASS | 30 | HITL, SHIELD, Patel path, tenant isolation, RBAC cross-role denial (REQ-021) |
| PARTIAL | 0 | — |
| BLOCKED: partner | 3 | Live EMIS write-back (REQ-017/019), CIS2 (REQ-025) |
| GAP | 2 | Mirth HL7 (REQ-024), pen-test report (REQ-027) |
| MANUAL | 2 | Gate 1–3 sign-off (REQ-030), model release SOP (REQ-037) |

(Matrix summary previously read 30 PASS against 29 PASS rows; corrected 2026-10-10. REQ-021 moved PARTIAL → PASS the same day after server-side EC-CLIN-3 enforcement.)

### 3.4 Known product–vision gaps (do not overclaim)

- Unified clinician workspace (Timeline → Evidence → Agents → Approvals → Twin → Research in one place) is still **multiple surfaces**.
- Research “Owkin suite” (literature, trial matching, scientific writer, etc.) largely **unbuilt** — evaluation + ethics gate are the real pieces.
- Population ICS numbers include **illustrative fixtures** vs 100-patient synthetic cohort.
- Diabetes: care-network CGM now feeds Aksh Diabetes in simulation (Track B link); drafts from that path into the review queue, and any production use, remain open.

**Found in the 2026-10-09 independent production audit — fixed 2026-10-10 (redesign branch / PR #3, not yet on akshhealth.com):**

- **Public demo audit claims.** Dashboard decisions now report the real SHIELD outcome (`lib/shield-client.ts`): "SHIELD logged" only on a successful durable write; "Demo only, not audited" without a session; attribution is the signed-in user or "Demo viewer (not signed in)", never a hard-coded clinician.
- **UK coding.** Dr.Assist proposes SNOMED CT first with WHO ICD-10 secondary (DVT lower limb I80.2, T2DM E11.9); the prompt forbids US ICD-10-CM. **Needs clinical coding sign-off** before external use.
- **P002 consistency.** HORIZON contributors sum to the 78 → 82 change; risk bands derive from score in one place (82 = Very High); HbA1c shown as mmol/mol (51 → 68) in UK-facing text; Patel voice stub and PATHWAY package use the right limb.
- **Synthetic cohort.** Titles follow first-name gender; generated appointments use distinct 10-minute slots.
- **REQ-021.** Nurse/pharmacist disposition limits enforced server-side (EC-CLIN-3).

**Still open:** Patel narrative mixes "suspected DVT → urgent duplex + D-dimer" (walkthrough, PATHWAY) with "newly diagnosed right popliteal DVT" (SOAP, HORIZON, Dr.Assist coding a confirmed DVT). Pick one clinical story; this is a clinical-content decision, not a code fix.

---

## 4. End-to-end vision diagram (layers)

```text
┌─────────────────────────────────────────────────────────────┐
│  Continuous Learning (governed · G-ML-1/2/3 · no auto-retrain) │
├─────────────────────────────────────────────────────────────┤
│  Clinical Intelligence │ Patient Intelligence │ Population │
│  (GP / nurse / Rx HITL) │ (My Health / coach*) │ (ICS / COMPASS) │
├─────────────────────────────────────────────────────────────┤
│  Research Intelligence (offline eval · ethics gate · not live discovery) │
├─────────────────────────────────────────────────────────────┤
│  Disease Digital Twin (rules / scenarios · physiologicalTwin:false)     │
├─────────────────────────────────────────────────────────────┤
│  Disease Intelligence — Diabetes first (9 signals → HORIZON / GUARDIAN) │
├─────────────────────────────────────────────────────────────┤
│  Platform Agents (12) · CONDUCTOR · SHIELD · BRIDGE                         │
├─────────────────────────────────────────────────────────────┤
│  Core: Identity · Consent · Interop (FHIR) · Knowledge · Observability     │
└─────────────────────────────────────────────────────────────┘
         ▲ beside EHR (system of record) — no live write until Track B
```

\*Patient-facing medication actions: view/coach only — never self-prescribe or stop insulin via the app.

---

## 5. PRD acceptance & validation (how we know “done”)

Hierarchy (Volume I Ch.20): Unit → Integration → E2E → Clinical-proof → Agent eval → Manual clinical safety → Partner gate.

**Primary commands (from `packages/platform-uk`):**

```bash
npm run test:clinical-proof          # HITL, spine, SHIELD, RBAC, patient-access, …
npm run test:patient-access          # 22 access-adapter invariants
AKSH_MASTER_SKIP_DURABLE=true npm run test:master
npm run smoke:public && npm run smoke:all
npm run test:aksh20:eval
npx playwright test e2e/marketing.spec.ts e2e/clinical-proof-*.spec.ts
```

Notes: `smoke:public` targets `SMOKE_BASE_URL` (default `http://127.0.0.1:3000`). Playwright global setup requires `DATABASE_URL` even for read-only marketing specs.

**Pilot readiness:** evidence-pack Gates 1–3 (`docs/evidence-pack/`) remain binding — not replaced by this overview.

---

## 6. Open decisions (pointers only)

Volume I records **100+ open questions** and **22 closed decisions** (`DEC-001`…`DEC-022`). Highest-impact closed decisions:

- HITL mandatory · CONDUCTOR not LangGraph · `liveEmis:false` · `autoRetrain:false`
- Diabetes = 9 signals not 9 agents · HORIZON/COMPASS/PATHWAY rename
- Track A demo GO / Track B NO-GO · WCAG 2.1 AA target

For the full backlog: Volume I Chapter 21.

---

## 7. Document control

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-09 | Initial consolidated Vision + PRD overview for independent review; points to Volume I v0.21 as full PRD; reflects Oct 2026 production GO (Track A) and staged patient-access. |
| 1.4 | 2026-10-10 | Added §2.4a Patient access: Front Desk module and Asha (Track A build). |
| 1.3 | 2026-10-10 | §2.4 corrected to the code roster: PRISM/ATLAS are within the canonical 12; VOICE and Dr.Assist are sub-capabilities, not peers. Added human labels. |
| 1.2 | 2026-10-10 | Audit findings fixed on the redesign branch: honest SHIELD outcomes on demo dashboards, SNOMED CT + WHO ICD-10 coding, P002 risk/HbA1c/laterality consistency, cohort titles and slots, REQ-021 → PASS. Patel suspected-vs-confirmed DVT narrative left open for clinical decision. |
| 1.1 | 2026-10-10 | REQ snapshot corrected to 29 PASS of 37 (matrix summary fixed); added redesign review build and its shared-database status; replaced design-debt line with PR #3 status; added open findings from the 2026-10-09 production audit (public-demo SHIELD claim, US coding, P002 fixture inconsistencies, cohort titles); clarified SC-1/SC-3 scope. |

**Owners for Acceptance of Volume I chapters:** Product · Architecture · Clinical Safety Lead (mechanism in Volume I §21.10 — Proposed, not ratified).

**Commercial / marketing rule:** Quote only Track A capabilities, measurable SC-1–SC-8, and labelled rehearsal artefacts. Never imply Track B, certifications, or outcome claims without the named evaluations in SC-9–SC-13.
