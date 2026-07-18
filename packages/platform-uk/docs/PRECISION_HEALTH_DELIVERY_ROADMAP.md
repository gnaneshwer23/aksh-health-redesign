# Precision Health / Digital Twin — Delivery Roadmap (Aksh Health UK)

**Date:** 18 Jul 2026  
**Live:** https://akshhealth.com  
**Companion audit:** [`PRECISION_HEALTH_FLOWCHART_GAP.md`](./PRECISION_HEALTH_FLOWCHART_GAP.md)  
**Invariant (non-negotiable):** HITL mandatory · **zero autonomous clinical write** (no live EHR / e-Referral / prescribe without clinician Accept)

This roadmap maps the full Precision Health / Living Digital Twin Mermaid flowchart to **honest delivery phases**. It does not claim Phase 2–3 capabilities on the live product. Phase 1 ships scaffolding that can grow into real modalities only when consent, partners, and clinical owners exist.

---

## How to read this document

| Term | Meaning |
| --- | --- |
| **Outcome delivered** | What a customer / auditor can inspect at phase exit |
| **Dependencies** | People, partners, budget, or infra that must exist before exit |
| **Exit criteria** | Objective gates — not marketing language |
| **Scaffolding** | Schemas, stubs, APIs, fixtures — **not** live streams |

---

## Phase 0 — Now (UK clinical proof baseline)

**Horizon:** Already largely live on `main` / akshhealth.com  
**Flowchart coverage:** Stages 1 (partial), 9–12 (HITL clinical drafts), 16–17 (recorder + SHIELD) — synthetic / proof boundary

### Outcomes delivered

- HITL clinical workflow on synthetic cohort: intake → multi-agent drafts → Accept / Edit / Reject → staging/sim write only
- FHIR R4–shaped drafts + schema CI; Medplum rehearsal **off**; EMIS Partner write-back **blocked**
- Agent drafts: VOICE, SYNTHESIS, DrASSIST, GUARDIAN, ORACLE, REFERRAL, EQUITY; SHIELD audit; VOICE CARE synthetic escalation
- Neon Postgres + Neo4j Aura (when keep-alive) for seeded synthetic graph
- Learning event recorder with **`autoRetrain: false` always**
- Role dashboards (GP, nurse, pharmacist, ICS, hospital, researcher, patient companion) on demo/auth boundaries
- Honest gap audit published (`PRECISION_HEALTH_FLOWCHART_GAP.md`)

### Dependencies

- Aura Neo4j keep-alive for live graph demos (falls back to mock)
- Demo / pilot credentials for authenticated role surfaces
- No Partner EMR credentials required (staging-only by design)

### Exit criteria (baseline — treat as met when)

- [x] `GET /api/health` reports Postgres live; Neo4j live or honest mock
- [x] Clinical-proof suite green (`npm run test:clinical-proof`)
- [x] Zero autonomous EHR write invariant covered by tests / smoke
- [x] Public positioning does **not** claim Precision Health OS / physiological digital twin

**Status:** Baseline. Continue hardening Gate 1–3 evidence packs; do not regress invariants.

---

## Phase 1 — Near term (3–6 months)

**Horizon:** Foundations that extend HITL UK toward the flowchart **without fake wearables/omics/physiology**  
**Flowchart coverage:** Consent engine start · multimodal **contracts** · longitudinal timeline merge · personalised plan **draft** · risk-state (honest) · coaching stubs · stronger outcomes→learning · Gate 1–3 progress

### Outcomes delivered

1. **Consent / purpose registry** — purpose codes, modality grants, revoke; `GET/POST /api/consent/grants`; SHIELD on changes; readable by patient/admin surfaces
2. **Multimodal data contracts** — TypeScript + Zod for wearable, lifestyle, clinical, lab, imaging_meta, omics_meta, environment; JSON/Postgres store for **consented synthetic samples** + ingestion stubs (no live device streams)
3. **Longitudinal timeline service** — `GET /api/patients/[id]/timeline` merging case events + modality samples + learning outcomes
4. **Personalised health plan artifact** — structured prevention / treatment / meds / follow-up **draft** after HITL; stored as draft; never auto-writes EHR
5. **Risk-state model (honest naming)** — UI/API labelled “population / patient risk state” (ORACLE + graph signals); explicitly **not** a physiological twin
6. **Coaching agent stubs under HITL** — Nutrition + Sleep as **coaching drafts only** (“not clinical advice”); Care coordination remains REFERRAL; anything clinical stays HITL
7. **Outcomes → learning loop** — outcome link API exercised in pilot demos; still no auto-retrain
8. **Gate 1–3 progress** — evidence packs filled with honest GAP labels for Partner/EMIS/Mirth/CIS2

### Dependencies

| Dependency | Why |
| --- | --- |
| **CSO / clinical safety owner** | Scope coaching stubs + risk-state wording; Gate packs |
| **DPIA / purpose register owner** | Purpose codes must match real processing bases |
| **Aura keep-alive budget** | Live Neo4j demos for risk-state / KG narrative |
| **Pilot practice (optional)** | Real outcome linking beyond synthetic fixtures |
| **Engineering capacity** | ~1 FTE equivalent across APIs + UI honesty pass |

### Exit criteria

- [ ] Consent grants API + SHIELD dual-write covered by automated tests
- [ ] All seven modality schemas validate fixtures; ingestion stubs return `liveStream: false`
- [ ] Patient timeline returns merged, ordered events for at least one synthetic patient
- [ ] Health plan draft requires HITL; `ehrWrite: false` in API contract
- [ ] Risk-state UI copy nowhere claims physiological / simulation twin
- [ ] Nutrition + Sleep APIs: coaching-only disclaimer + HITL for clinical escalation path
- [ ] Gate 1–3 evidence pack rows exist with GAP or PASS (no silent invent)
- [ ] Clinical-proof suite remains green; marketing does not claim Phase 2–3

**Code start (this release):** scaffolding for items 1–6 above lands on `main` as schemas, repositories, APIs, and honest UI rename — synthetic fixtures only.

**UI slice (follow-on):** GP patient detail, patient companion, and admin consent registry surfaces call the Phase 1 APIs with HITL Accept/Edit/Reject where clinical, and explicit “not clinical advice” / “not a physiological twin” labels.

---

## Phase 2 — Mid term (6–18 months)

**Horizon:** Controlled real data + partner write-back rehearsal  
**Flowchart coverage:** 1–2 real modalities · Partner EMR write-back · living KG updates · predictive model with clinical owner · optional coaching under HITL · Medplum/FHIR live rehearsal

### Outcomes delivered

- **One or two** consented live modalities (e.g. GP EHR FHIR pull + labs) — not six at once
- Partner EMR write-back for **clinician-accepted** FHIR drafts only (or explicit stay staging-only with signed decision)
- Neo4j edges updated from new consented data (tenant-scoped if multi-practice)
- Predictive / risk model with named **clinical owner**, evaluation harness, change control
- Nutrition / sleep coaching may stay low-risk coaching; clinical claims require safety-case scope expansion
- Medplum (or equivalent FHIR server) **live rehearsal** against synthetic then pilot patients

### Dependencies

| Dependency | Why |
| --- | --- |
| **Partner / EMR vendor credentials** | Write-back or read path |
| **CSO sign-off** on modality scope + model owner | Safety case |
| **Budget** for device/lab connectors + FHIR hosting | Real ingestion |
| **DPIA + DPA with practice / ICS** | Lawful processing |
| **Identity path** (PDS or equivalent) under DPIA | Patient match |

### Exit criteria

- [ ] At least one live modality with revoke-effective consent enforcement
- [ ] Write-back path either production-safe under HITL **or** documented permanent staging decision
- [ ] Model card + clinical owner documented; eval harness gate on release
- [ ] Medplum (or FHIR store) rehearsal green in CI/smoke
- [ ] No Phase 3 claims (omics/imaging streams, causal AI, twin simulation)

---

## Phase 3 — Long term (18+ months)

**Horizon:** Flowchart completeness toward Precision Health OS  
**Flowchart coverage:** Imaging/omics/environment streams · causal AI · true digital twin simulation/ranking · federated research · pharma/payer pipes · DTAC / DCB0129 / regulatory path

### Outcomes delivered

- Continuous multimodal foundation (DICOM, omics, wearables, environment) with purpose-bound consent
- Living knowledge graph updated from care + evidence bases at population scale
- Causal / predictive models under regulated change control; federated or otherwise governed learning
- Validated digital twin **simulation + intervention ranking** (not risk-state metaphor alone)
- Stakeholder integrations (hospital, labs, pharma, payers) with measurable RWE closed loop
- Signed clinical safety case, DTAC, and applicable regulatory pathways **before** outcome marketing

### Dependencies

| Dependency | Why |
| --- | --- |
| **Multi-year budget** | Streams, validation studies, regulatory |
| **Research / academic partners** | Causal methods, twin validation |
| **Pharma / payer contracts** | Data pipes and governance |
| **CSO + legal + IG** | DTAC / DCB0129 / MHRA as applicable |
| **Federated infra** | If FL is in scope |

### Exit criteria

- [ ] Published twin validation study (or equivalent) with limitations
- [ ] Signed safety case; DTAC (or successor) submitted/approved as required for claimed use
- [ ] RWE metrics from live care (not synthetic-only) in learning loop with governed release SOP
- [ ] Marketing claims match certified / signed scope only

---

## Flowchart → phase map (summary)

| Flowchart stage | Phase 0 | Phase 1 | Phase 2 | Phase 3 |
| --- | :---: | :---: | :---: | :---: |
| Individual / patient | Partial | Harden | Real identity | Full |
| Multimodal data | Synthetic fixtures | **Contracts + stubs** | 1–2 live | Full streams |
| Consent & permissions | Onboarding checkboxes | **Purpose/modality registry** | Enforce on live ingest | Purpose OS |
| Secure ingestion | FHIR shape / rehearsal | Stub APIs | Partner + FHIR store | Full pipelines |
| Data engineering / timeline | Case activity | **Merged timeline API** | Continuous jobs | Production ETL |
| Unified foundation | Neo4j seed + cases | Samples store | Living updates | Full foundation |
| Living Health Web | Demo graph | Risk-state honesty | Tenant KG updates | Continuous KG |
| AI intelligence | Orchestrator drafts | Plan + coaching stubs | Owned predictive | Causal + twin sim |
| Specialised agents | Clinical HITL set | **+ Nutrition/Sleep coaching** | Scoped expansions | Full set |
| Digital twin + sim/rank | Misnamed risk UI | **Risk-state rename** | Narrow validated model | True twin |
| Personalised health plan | Pathway mock / SOAP plan | **HITL plan artifact** | Adaptive under HITL | Twin-ranked plans |
| Clinical safety / HITL | **Built** | Preserve | Preserve | Preserve |
| Stakeholder ecosystem | Role demos | Same | Partner pipes | Full ecosystem |
| Care delivery | Staging only | Staging + plan draft | HITL write-back | Live delivery |
| Real-world outcomes | Synthetic recorder | Stronger linking | Pilot RWE | Population RWE |
| Continuous learning | Recorder, no auto-retrain | Same + outcomes | Governed release | Federated / governed |
| Governance overlay | SHIELD + rehearsal | Gate 1–3 | Signed packs | DTAC / regulatory |

---

## Milestone checklist (trackable)

### Phase 0 / baseline

- [x] Gap audit published
- [x] HITL + zero-write invariants enforced in proof suite
- [x] Health + Neo4j honesty on live site

### Phase 1

- [x] Consent purpose registry live (API + SHIELD) — scaffolding
- [x] Modality Zod contracts + synthetic sample store
- [x] Patient timeline API
- [x] Personalised plan draft after HITL
- [x] Risk-state UI/API (no physiological twin claim)
- [x] Nutrition + Sleep coaching stubs
- [x] Consent / purpose grants UI (patient companion + admin registry + GP patient page)
- [x] Patient timeline UI (GP patient page + patient companion)
- [x] Health plan draft UI with HITL Accept/Edit/Reject (GP patient page; SHIELD stage only)
- [x] Risk-state panel wired to `GET /api/patients/[id]/risk-state` (honest label)
- [x] Nutrition / Sleep coaching stubs UI (patient companion; not clinical advice + HITL escalate)
- [ ] Gate 1–3 evidence rows complete (PASS or GAP)
- [ ] CSO review of Phase 1 wording + coaching scope
- [ ] Pilot outcome-link demo (optional but recommended)

### Phase 2

- [ ] DPIA for first live modality
- [ ] Partner credentials + first consented ingest
- [ ] Clinical owner named for predictive model
- [ ] Medplum/FHIR rehearsal in staging
- [ ] Write-back decision signed (go / no-go)

### Phase 3

- [ ] Twin validation study plan funded
- [ ] Regulatory path selected and funded
- [ ] Federated / pharma-payer governance designs
- [ ] Marketing freeze until signed safety case

---

## What the user / org must do next (operations)

1. **CSO** — Review Phase 1 coaching stubs + risk-state naming; assign Gate 1–3 owners  
2. **Partners** — Identify 1 EMR + 1 labs (or wearable) path for Phase 2; do not fake streams now  
3. **Aura keep-alive** — Budget Neo4j Aura so live graph demos do not silently mock  
4. **Budget** — Reserve Phase 2 connector + FHIR hosting; Phase 3 is multi-year  
5. **IG / DPIA** — Align purpose codes in consent registry with real processing bases before any live modality  

---

## One-line positioning (unchanged honesty)

> **Aksh Health UK is delivering a phased path toward Precision Health — today a HITL clinical proof layer; Phase 1 adds contracts and honest risk-state scaffolding, not a living physiological digital twin.**
