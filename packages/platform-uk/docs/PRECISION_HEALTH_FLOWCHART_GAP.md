# Precision Health / Digital Twin Flowchart — Gap Audit (Aksh Health UK)

**Date:** 19 Jul 2026  
**Repo HEAD:** `main` (whole-loop demo on/after this date)  
**Live:** https://akshhealth.com  
**Health check (live):** `GET /api/health` → Postgres `mode: live`, Neo4j Aura `mode: live` (seeded synthetic cohort)

This document maps a full Precision Health / Living Digital Twin Mermaid flowchart against what Aksh Health UK **actually** ships today. It is deliberately customer-honest: no invented wearables, omics, digital-twin physics, certifications, or live NHS write-back.

Related internal docs: `docs/E2E_CLINICAL_PROOF.md`, `docs/FIGMA_10_LAYER_NHS_ARCHITECTURE_BUILD_MAP.md`, `docs/SAFETY_CASE_REHEARSAL.md`, `docs/CONTINUOUS_LEARNING.md`, `docs/PRECISION_HEALTH_DELIVERY_ROADMAP.md`, `README.md`.

**Delivery roadmap:** phased path from this baseline → Phase 1 scaffolding → Phase 2 live modalities → Phase 3 twin/regulatory — see [`PRECISION_HEALTH_DELIVERY_ROADMAP.md`](./PRECISION_HEALTH_DELIVERY_ROADMAP.md).

**Synthetic whole-loop demo (shipped):** `/demo/precision-health-loop` + `POST /api/precision-health/whole-loop` runs consent → ingest → timeline → Neo4j → agents → twin ranking → plan → safety route → HITL/sim → learning in one journey. Labels remain honest (`physiologicalTwin:false`, `liveEmis:false`, `autoRetrain:false`). Live modalities and EMR write-back remain Phase 2–3 partner work.

---

## 1. Verdict

**No — Aksh does not deliver this full Precision Health OS flowchart as live clinical software today.**  
What is live is a **HITL clinical workflow proof layer** plus a **synthetic whole-loop rehearsal** that exercises every major flowchart stage end-to-end on fixtures: synthetic multimodal samples → FHIR-shaped drafts → specialised agent drafts → mandatory clinician Accept/Edit/Reject (or labelled demo Accept) → staging/sim write (not live EMR) → SHIELD audit + learning *recorder*, with Neon Postgres and Neo4j Aura connected for a seeded demo graph. It is **not** a continuous multimodal ingestion platform, not a living digital twin with validated physiology, and not a closed-loop real-world outcomes / auto-learning OS.

---

## 2. Live infrastructure snapshot (evidence)

| Probe | Result (18 Jul 2026) |
| --- | --- |
| `https://akshhealth.com/api/health` | `status: ok`; `database.mode: live`; `neo4j.mode: live` |
| `GET /api/integrations/medplum-status` | Medplum sync **disabled**; `liveEmis: false` |
| Public / demo GP & ICS / hospital dashboards | HTTP 200 (demo allowlists) |
| Patient / nurse / pharmacist / researcher dashboards | Auth redirect (307) — surfaces exist behind sign-in |
| Neo4j patient API | Auth-required; graph seeded with synthetic P001–P100 when Aura live |

Positioning from product README: *synthetic-data, review-first clinical proof — not production clinical software, not live NHS integration, not real-patient-data platform.*

---

## 3. Stage-by-stage table

| # | Flowchart stage | Status | What exists (evidence) | What does **not** exist |
| ---: | --- | --- | --- | --- |
| 1 | **Individual / Patient** | **Partial** | Synthetic cohort (100 patients); patient companion UI (`/dashboard/patient`); GP/nurse/pharmacist role views | Real PDS identity; live NHS number linkage; real patient-generated data loop |
| 2 | **Multimodal data** (wearables, lifestyle, clinical, labs/imaging, multi-omics, environment) | **Partial / synthetic** | L1 fixture catalog; Phase 1 modality contracts; Phase 2 **connector registry** (`/api/precision-health/connectors`, `/api/precision-health/ingest`) — synthetic/stub only; `liveStream:false` unless Fitbit env present | Live wearable streams, DICOM archives, multi-omics pipelines, environmental IoT, real EHR pull |
| 3 | **Consent & permissions** | **Partial** | Onboarding consent; Phase 1 purpose/modality grant registry; Phase 2 ingest **enforces** active grants before store/KG | NHS Login / CIS2; enforceable purpose-limitation on live streams |
| 4 | **Secure ingestion** (APIs, FHIR, HL7, DICOM, devices) | **Partial** | FHIR R4 schema CI; Medplum rehearsal + dry-run probe; EMIS staging + **partner checklist** (`/api/integrations/emis-partner-checklist`, `docs/PHASE2_PARTNER_CHECKLIST.md`); Phase 2 connector ingest | Live FHIR store sync; Mirth/HL7 v2; DICOM; device SDKs; Partner EMR credentials |
| 5 | **Data engineering pipeline** (validate→clean→identity→standardise→timeline→biomarkers) | **Partial / synthetic** | Intake generation, validation/safety rules, NHS number checksum in onboarding, FHIR shape gates, activity timelines on cases; Phase 1 **merged timeline API** (`GET /api/patients/[id]/timeline`) | Production ETL/ELT; master patient index; biomarker derivation engine; continuous clean/standardise jobs |
| 6 | **Unified foundation** (longitudinal record, imaging, omics, streams, knowledge base) | **Partial** | Simulated longitudinal profiles; Neo4j patient–condition–medication–interaction graph (live when Aura up); review-case + Postgres persistence | Unified imaging/omics/stream stores; production longitudinal FHIR repository; vector/time-series moat |
| 7 | **Living Health Web / knowledge graph** | **Partial** | Neo4j Aura live + seeded; Phase 2 ingest can **MERGE** `Observation` + `MEASURED` when live (skips when mock) | Continuously updating “Living Health Web”; population-scale knowledge base; ontology-backed reasoning graph beyond demo edges |
| 8 | **AI intelligence** (multimodal, predictive, causal, evidence, orchestrator) | **Partial / synthetic** | Shared-context orchestrator; ORACLE risk scores + **model card** (owner UNASSIGNED until CSO); eval harness; `autoRetrain:false`; **whole-loop** stitches stages | True multimodal fusion; causal inference; continuous predictive models trained on RWE; autonomous CDS |
| 9 | **Specialised agents** | **Partial** — see §4 | Clinical HITL agents; coaching stubs: Nutrition, Sleep, **Exercise**, **Mental-health** | Research-trial agents as flowchart boxes; clinical MH triage beyond coaching |
| 10 | **Digital twin + simulation + ranking** | **Partial / synthetic** | UI/API now labelled **Patient / Population risk state** (`PatientRiskStatePanel`, `GET /api/patients/[id]/risk-state`) — radial risk viz over mock/ICS aggregate; hospital nav | Physics-based / physiological twin; intervention simulation; counterfactual ranking; calibrated twin validation |
| 11 | **Personalised health plan** | **Partial / synthetic** | Care pathway tracker mock; L9 reviewer-confirmed action drafts; SYNTHESIS pathway copy; Phase 1 **HITL plan draft** (`POST /api/patients/[id]/health-plan`) | Adaptive personalised plan engine driven by twin + multimodal streams |
| 12 | **Clinical safety / HITL branching** | **Built / live (proof)** | Accept / Edit / Reject / Defer; red-flag human gates; GUARDIAN urgency priority; VOICE CARE → nurse task (synthetic); zero autonomous EHR write invariant | Live urgent pathway into NHS 111/ED; automatic coaching apps; real clinician rostering beyond demo |
| 13 | **Stakeholder ecosystem** | **Partial** | Role dashboards: GP, nurse, hospital, pharmacist, ICS, researcher, admin, patient companion; marketing audiences | Live hospital/pharmacy/lab/pharma/payer integrations; NHS App; multi-org production tenancy (Neo4j still shared demo graph) |
| 14 | **Care delivery interventions** | **Partial** | Staged FHIR → sim write after Accept; REFERRAL draft package; pharmacist med review; nurse vitals + escalation | Live e-Referral, e-prescribe, pharmacy dispense, lab order, care-home / community delivery |
| 15 | **Real-world outcomes** | **Partial / synthetic** | Learning-event outcome kinds; L10 synthetic outcome-capture schema; benchmark labels | Measured RWE from live care (admissions avoided, HbA1c change, etc.) at population scale |
| 16 | **Continuous learning loop** | **Partial** | Append-only `/api/learning/events` + eventual outcome link; admin UI; **`autoRetrain: false` always**; governed release SOP stub | Federated learning; auto model update; closed-loop improvement from RWE |
| 17 | **Governance overlay** | **Partial** | SHIELD append-only audit (Postgres when configured); governance pack / hazard template; evidence pack gates; tenant isolation scaffold; unsigned DCB0129 rehearsal | Signed clinical safety case; DTAC; MHRA; pen-test pack complete; formal CSO sign-off |

**Legend:** **Built / live** = works on production with inspectable routes/APIs (still synthetic clinical data unless stated). **Partial / synthetic** = UI, fixtures, rehearsal, or recorder only. **Not built** = no meaningful implementation for that flowchart box.

---

## 4. Agent mapping (flowchart boxes → Aksh agents)

Flowchart “specialised agent” boxes vs current Aksh catalogue:

| Flowchart agent box | Aksh agent | Status | Evidence |
| --- | --- | --- | --- |
| Triage / intake | **CANVAS** (+ **VOICE** sub-capability) | Partial | VOICE feeds CANVAS dictation — not a peer directory agent; optional Deepgram; simulated ASR when key absent |
| Clinical documentation / coding | **SYNTHESIS** (+ **Dr.Assist** coding sub-capability) | Partial (draft APIs live) | `POST /api/agents/synthesis`, `/api/agents/dr-assist`; SOAP + coding drafts under HITL; **JSL NLP not wired** — not a peer Phase-1 agent |
| Med safety | **GUARDIAN** | Partial (draft APIs live) | `POST /api/agents/guardian`; Neo4j/mock DDI; HITL |
| Predictive / risk | **ORACLE** | Partial (draft APIs live) | `GET/POST /api/agents/oracle`; model card + CVD/T2D-style risk draft; HITL; no auto-retrain |
| Care coordination / referral | **REFERRAL** | Partial | `POST /api/agents/referral`; package draft; no e-Referral write |
| Population / disparity (not classic “patient agent”) | **EQUITY** | Partial | `POST /api/agents/equity`; ICS aggregate overlay |
| Audit / compliance (overlay, not clinical agent) | **SHIELD** | Built (when Postgres live) | `/api/audit/shield`; append-only; no DELETE |
| Post-contact / coaching escalation | **VOICE CARE** | Partial / synthetic | `POST /api/agents/voice-care`; Day-3 synthetic outbound; **no telephony** |
| Nutrition | **NUTRITION** (coaching stub) | Partial / coaching only | `POST /api/agents/nutrition` — wellness draft, **not clinical advice**, HITL, no EHR write |
| Exercise | **EXERCISE** (coaching stub) | Partial / coaching only | `POST /api/agents/exercise` — wellness draft, **not clinical advice**, HITL, no EHR write |
| Sleep | **SLEEP** (coaching stub) | Partial / coaching only | `POST /api/agents/sleep` — wellness draft, **not clinical advice**, HITL, no live wearable stream |
| Mental health (dedicated) | **MENTAL_HEALTH** (coaching stub) | Partial / coaching only | `POST /api/agents/mental-health` — wellbeing signposting only; crisis → HITL; not a psych assessment |
| Research / trial matching | — | **Not built** | Research evaluation **boundary** export only (`/api/research/evaluation`) |
| Orchestrator | Clinical-proof + **whole-loop** | Partial / synthetic | SYNTHESIS + GUARDIAN + ORACLE (+ DrASSIST); GUARDIAN first when urgent; **`runWholeLoop`** stitches consent→ingest→agents→twin→plan→HITL/sim→learning (`/demo/precision-health-loop`) |

Marketing/resources historically said “seven agents”; the canonical story is the **12-agent Phase-1 directory** (`AGENT_DIRECTORY`) with **PRISM / ATLAS** Phase 2 (`live:false`) and **VOICE / Dr.Assist** as intake/coding **sub-capabilities** (not peers). Live draft APIs also include PATHWAY and VOICE CARE escalation paths. All clinical agent outputs remain **draft ≠ record** until HITL Accept.

---

## 5. Outcomes Aksh **can** deliver today (honest)

For advisors, pilots, and internal critique — **not** as a Precision Health OS claim:

1. **Demonstrate a safe HITL clinical documentation loop** on synthetic consultations (intake → draft → safety flags → Accept/Edit/Reject → frozen evidence).
2. **Show multi-agent draft orchestration** on a shared patient context with urgency prioritisation (GUARDIAN first when urgent).
3. **Exercise FHIR R4-shaped staging** and prove **zero autonomous EMR write** (EMIS Partner write-back blocked; Medplum off).
4. **Query a live Neo4j knowledge graph** of the synthetic cohort (conditions, meds, interactions) when Aura is running; fall back honestly to mock if not.
5. **Persist durable SHIELD audit events** and **learning recorder** events (prediction → clinician decision → optional eventual outcome) without auto-retrain.
6. **Walk role-based demos**: GP review queue, nurse escalation, pharmacist interaction checks, ICS EQUITY overlay, hospital capacity / “digital twin” viz, researcher data-access UI, patient companion (mock Q&A / check-ins).
7. **Produce evidence artefacts** for a future safety case (hazard template linked to tests, evidence pack skeleton, governance rehearsal) — **unsigned**, not DTAC/DCB0129 complete.

What it **cannot** claim today: continuous wearable/omics ingestion, living digital twin simulation, personalised plan optimisation from twin ranking, live NHS care delivery, measured population RWE, or autonomous continuous learning.

---

## 6. What would be required to move toward the vision (phased)

No fake certifications; each phase gates the next.

### Near term (UK pilot proof hardening) — see Phase 1 in delivery roadmap

- Keep HITL + zero-write invariants; complete Gate 1–3 evidence packs with honest GAP labels for Partner/EMIS/Mirth/CIS2.
- **Phase 1 scaffolding (started):** consent purpose registry, multimodal contracts + stubs, patient timeline, health-plan draft, risk-state rename, Nutrition/Sleep coaching stubs — details in `PRECISION_HEALTH_DELIVERY_ROADMAP.md`.
- Partner UAT for **one** EMR write-back path (or explicitly stay staging-only) — Phase 2.
- Strengthen Neo4j beyond shared demo graph (tenant scoping) if multi-practice pilots proceed.
- Expand learning events with real pilot outcome linking — still **no** auto-retrain; follow governed release SOP.
- Patient companion: replace mock Q&A with approved content / clinician-approved coaching only.

### Mid term (controlled multimodal + plan layer) — Phase 2 scaffolding started

- Real consented ingestion for **1–2** modalities still needs partners/DPIA; in-repo: connector registry + consent-gated ingest (synthetic/stub).
- Identity resolution against PDS (or equivalent) under DPIA — still GAP.
- Risk-state UI remains honest; ORACLE **model card** present (clinical owner UNASSIGNED until CSO).
- Coaching stubs expanded (exercise + mental-health) under HITL / not clinical advice — clinical MH triage still needs safety-case scope.
- Care delivery: EMIS partner checklist + staging only (`liveEmis:false`) until signed write-back decision.
- See `docs/PHASE2_PARTNER_CHECKLIST.md` and Phase 2 section in delivery roadmap.
### Long term (Precision Health OS — flowchart completeness) — Phase 3 scaffolding started

- Advanced modality **contracts + stubs** in-repo (DICOM meta / omics panel / environment OpenWeather stub) — not live streams.
- Synthetic twin **scenario ranking** (`physiologicalTwin:false`, `simulationMode:synthetic_rules`) — not a living twin.
- Causal hypothesis stub + federated ethics-gated jobs + pharma/payer read-only placeholders.
- Regulatory path templates: `docs/PHASE3_REGULATORY_PATH.md` (unsigned).
- Still blocked for exit: twin validation study, signed DTAC/DCB0129/MHRA, live FL / payer / pharma pipes.

---

## 7. One-line positioning for customers

> **Aksh Health UK today is a HITL clinical intelligence and evidence layer on synthetic (and eventually pilot) data — not yet a Precision Health / Digital Twin operating system.**

---

## 8. Source checklist (for auditors)

| Claim area | Where to look |
| --- | --- |
| Product boundary | `README.md` |
| Clinical proof DoD | `docs/E2E_CLINICAL_PROOF.md` |
| 10-layer map | `docs/FIGMA_10_LAYER_NHS_ARCHITECTURE_BUILD_MAP.md` |
| Agents / HITL | `docs/SAFETY_CASE_REHEARSAL.md`, `app/api/agents/*`, `lib/agents.ts` |
| Synthetic multimodal L1 | `lib/synthetic-source-profiles.ts` |
| Neo4j | `docs/NEO4J_SETUP.md`, `/api/health`, `lib/neo4j/queries.ts` |
| Learning (no auto-retrain) | `docs/CONTINUOUS_LEARNING.md` |
| Digital twin UI | `components/dashboard/DigitalTwinPanel.tsx` (labels: risk state) |
| Risk-state API | `GET /api/patients/[id]/risk-state` |
| Consent registry | `GET/POST /api/consent/grants` |
| Modality contracts | `lib/precision-health/modalities.ts`, `/api/precision-health/modalities` |
| Phase 2 connectors / ingest | `/api/precision-health/connectors`, `/api/precision-health/ingest` |
| Phase 3 twin sim (synthetic) | `/api/precision-health/twin/simulate`, `/api/precision-health/twin/status` |
| Causal stub | `/api/agents/causal` |
| Federated research stub | `/api/research/federated/jobs` |
| Pharma / payer stubs | `/api/integrations/pharma-rwe`, `/api/integrations/payer-vbc` |
| Phase 3 regulatory templates | `docs/PHASE3_REGULATORY_PATH.md` |
| EMIS partner checklist | `/api/integrations/emis-partner-checklist`, `docs/PHASE2_PARTNER_CHECKLIST.md` |
| ORACLE model card | `GET /api/agents/oracle`, `lib/precision-health/oracle-model-card.ts` |
| Patient timeline | `GET /api/patients/[id]/timeline` |
| Health plan draft | `POST /api/patients/[id]/health-plan` |
| Consent / timeline / plan / coaching UI | GP patient detail · patient companion · `/dashboard/admin/consent` |
| Delivery roadmap | `docs/PRECISION_HEALTH_DELIVERY_ROADMAP.md` |
| Synthetic whole-loop demo | `/demo/precision-health-loop`, `GET/POST /api/precision-health/whole-loop`, `lib/precision-health/whole-loop.ts` |
| Roadmap honesty (MH/biomarkers/FL) | `lib/roadmap.ts` |
