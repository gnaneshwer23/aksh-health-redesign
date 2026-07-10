# Aksh Health Platform — Overview Demo Implementation Plan

**Classification:** CONFIDENTIAL — Internal Use Only  
**Version:** 1.0  
**Date:** July 2026  
**Source document:** `Aksh_Health_Platform_Overview_Demo.docx` (v1.0, July 2026)  
**Cross-references (do not duplicate — extend and reconcile):**
- `docs/AKSH_PLATFORM_IMPLEMENTATION_PLAN.md` — TechDoc-aligned phases A–E, 90-day backlog T01–T25
- `akshhealth-uk-eu-platform/docs/PHASE_A_COMPLETE.md` — synthetic proof baseline (July 2026)
- `akshhealth-uk-eu-platform/docs/PHASE_B_COMPLETE.md` — UX/governance/Postgres scaffold (July 2026)
- `akshhealth-india-web/docs/INDIA_TECH_BUILD_STRATEGY.md` — India fork M11–24

---

## Executive summary

The Overview Demo document defines the **investor/clinical narrative**: a six-layer Healthcare OS with **twelve AI agents**, **eight role-specific interfaces**, and a **golden T2D + DVT patient journey** (Mr James Patel) from midnight EHR extract through GP consultation, referral, Day-3 Voice Care escalation, and ICS population view.

**What exists today:** Phases A and B deliver a credible **synthetic UK proof** in `akshhealth-uk-eu-platform` — GP 3-column dashboard, HITL review queue with six named clinical agents (VOICE, SYNTHESIS, DrASSIST, GUARDIAN, ORACLE, SHIELD), golden scenario **V-UK1** (T2D + DVT + Aspirin/Apixaban DDI), role dashboard stubs, `/pilot` + `/docs`, Postgres/Neon scaffold, and SHIELD FHIR AuditEvent export.

**What remains:** Five agents/surfaces from the Overview Demo are **greenfield** (REFERRAL AGENT as queue item, VOICE CARE, HEALTH COMPANION, HOSPITAL COMMAND, CAPACITY PREDICTION); the **midnight data pipeline**, **live orchestration**, **Neo4j graph**, **Medplum write-back**, **CIS2 production SSO**, **Voice Care Day-3 storyline**, and **ICS population intelligence** are not yet demo-ready. Neon `Aksh Health` has a rich `aksh.*` schema but **zero synced review cases**; `akeno health` has consent/ingestion skeleton only.

**Sequencing:** Complete **Phase C (UK Demo Parity)** before claiming the full Patel walkthrough. Run **Phase D/E** (backend + interoperability) per the TechDoc plan. Parallel **Phase F (India)** only after UK demo parity is stable. Do not run two full regulatory tracks simultaneously.

---

## 1. Document summary — what the Overview Demo mandates

### 1.1 Positioning (Sections 1–2)

| Mandate | Detail |
|---|---|
| **Product definition** | AI Healthcare OS — intelligence layer above existing EHRs; not replacement, not consumer-only |
| **Core moat** | Temporary AI insights → **persistent FHIR resources** with human approval on every write |
| **HITL principle** | Every output staged as **DRAFT**; GP Accept / Edit / Reject before record touch; **zero auto-write** |
| **North Star** | Healthcare outcomes per million patients (admissions prevented, GP hours saved, medication errors avoided, disparity gap reduced) |

### 1.2 Six architectural layers (Section 3)

| Layer | Mandate |
|---|---|
| **L1 — User experience** | Eight purpose-built interfaces (no generic dashboard) |
| **L2 — AI orchestration** | Agent Manager, Workflow Engine, Decision Engine, Safety Guardrails, Human Approval Gate |
| **L3 — AI agent ecosystem** | Twelve specialist agents with FHIR outputs and validation thresholds |
| **L4 — Knowledge graph** | Neo4j relationship reasoning; ORACLE/GUARDIAN graph traversal <200ms |
| **L5 — Health data platform** | Medplum FHIR R4; schema validation before any write |
| **L6 — EHR integration** | Mirth + EMIS/SystmOne (UK); Practo/HealthPlix + national health ID (India Phase 3) |

### 1.3 Twelve agents (Section 3, Layer 3)

| Agent | Type | FHIR output | Validation target |
|---|---|---|---|
| HEALTH COMPANION | Patient | CommunicationRequest, Observation | — |
| VOICE CARE | Patient | Encounter, Observation, Flag | Post-discharge outbound calls |
| SYNTHESIS | Clinical | DocumentReference (SOAP) | F1 ≥ 0.88 |
| DrASSIST | Clinical | Condition (coded) | ≥ 95% coding accuracy |
| GUARDIAN | Safety | Flag, MedicationRequest | Recall ≥ 98% |
| ORACLE | Risk | RiskAssessment | AUC ≥ 0.80 |
| EQUITY | Population | Observation (equity flag) | Disparity precision ≥ 0.80 |
| SHIELD | Compliance | AuditEvent | 100% audit completeness |
| VOICE | Documentation | DocumentReference (voice) | WER ≤ 8% |
| REFERRAL AGENT | Coordination | ServiceRequest | Pathway package completeness |
| HOSPITAL COMMAND | Operational | n/a | Real-time exec recommendations |
| CAPACITY PREDICTION | Operational | n/a | 14-day Digital Twin forecast |

### 1.4 Eight UX surfaces (Section 3, Layer 1)

| Interface | Primary user | Core function |
|---|---|---|
| GP Dashboard | Clinician | 3-column: Patient Panel · AI Review Queue · Agent Control |
| Nurse Dashboard | Nurse / care coordinator | Vitals entry, GUARDIAN alerts, handover summary |
| Pharmacist Dashboard | Clinical pharmacist | Medication review queue, interaction checker, formulary reference |
| Admin Dashboard | Practice manager | Integration health, audit log, user mgmt, EQUITY reports, compliance |
| ICS / Regional Dashboard | Regional lead / informatics | Population intelligence, equity heatmap, benchmarking, Digital Twin |
| Hospital Command Centre | Hospital CEO / COO | Bed occupancy, ED waits, capacity forecast, staffing AI |
| Patient Companion | Patient (practice-invited) | Check-ins, medication tracker, plain-English care plan, Ask Aksh chat |

### 1.5 Golden demo journey — Mr James Patel (Section 5)

| Step | Scene | Agents / systems involved |
|---|---|---|
| **5.1** | Midnight UTC — EHR extract pipeline | EMIS → validation → anonymisation → FHIR bundle → Medplum → Neo4j → Weaviate → ORACLE pre-score |
| **5.2** | 08:47 — GP logs in via clinical identity SSO | CIS2-style SSO; appointment list sorted by ORACLE risk |
| **5.3** | 09:15 — Patient profile loads | Patient card, medications, Digital Twin 61%, GUARDIAN pre-alert, overnight ORACLE DRAFT |
| **5.4** | 09:16 — VOICE microphone | Real-time ASR transcription during consultation |
| **5.5** | 09:20 — Four agents fire in parallel | SYNTHESIS, DrASSIST, GUARDIAN (Aspirin + Apixaban URGENT), ORACLE 78→82 |
| **5.6** | Review queue — four DRAFT items | SOAP, coding, drug alert, risk update — all pending HITL |
| **5.7** | 09:22 — GP works queue (~52 sec) | Edit+Accept SYNTHESIS; Accept DrASSIST; Acknowledge+Pause Aspirin GUARDIAN; Accept ORACLE |
| **5.8** | 09:23 — REFERRAL AGENT | DVT urgent referral package → ServiceRequest → e-Referral |
| **5.9** | 09:24 — SHIELD closes audit | AuditEvent with all agents, GP actions, FHIR resource IDs; 0 auto-writes |
| **5.10** | Day 3 — Voice Care outbound call | SOB + DVT → PE risk; ORACLE 82→91; GP URGENT banner; Nurse escalation task |
| **5.11** | ICS population view | Aggregate metrics + EQUITY disparity insights across 23 practices |

### 1.6 Phase 1 pilot outcomes (Section 6)

Targets for 3 regional pilot sites (Oct 2026): GP documentation 14→3–4 min, −12% avoidable admissions, GUARDIAN ≥98% detection, −35% medication errors, T2D HbA1c monitoring ≥85%, Voice Agent contact ≥80%, ORACLE 2.3× high-risk identification, equity gap reduction.

### 1.7 Technology stack (Section 7)

Next.js 14 + shadcn/ui, Medplum (eu-west-2), Neo4j 5.x, Weaviate, LangGraph + Claude Sonnet 4, JSL Clinical NLP, Deepgram Medical ASR, ElevenLabs TTS, Mirth Connect, Kafka MSK, AWS EKS eu-west-2, Prometheus/Grafana.

### 1.8 Compliance pathway (Section 7)

Clinical safety governance (DCB0129-aligned), DTAC, data protection toolkit, medical device registration (UK Class IIa / EU MDR IIb), GDPR/UKDPA, clinical identity SSO, ISO 27001, India CDSCO Class B (separate track M23).

---

## 2. Feature inventory matrix

**Legend:** ✅ Built (proof-grade) · ⚠️ Partial / stub · ❌ Gap · **P0** = blocks Overview Demo walkthrough · **P1** = strengthens demo · **P2** = post-demo / production

| Feature | In Overview Demo | Phase A status | Phase B status | Gap | Priority |
|---|---|---|---|---|---|
| **GP 3-column dashboard** | §5.2–5.7 | ✅ `/gp-dashboard`, agent control panel | ✅ `/dashboard/gp`, compliance labels | Digital Twin panel, appointment risk sort, live ASR | P1 |
| **HITL Accept/Edit/Reject** | §5.6–5.7 | ✅ Per queue item | ✅ SHIELD on actions | Inline SOAP editor polish | P1 |
| **Golden T2D+DVT scenario** | §5 (Patel) | ✅ V-UK1 (`case-v-uk1`, Margaret T.) | ✅ Seeded | Rename/align to Patel persona; add Digital Twin % | P0 |
| **VOICE real-time ASR** | §5.4 | ⚠️ Transcript boundary | ⚠️ Same | Deepgram integration; mic UI | P0 |
| **SYNTHESIS SOAP draft** | §5.5–5.6 | ✅ Queue item `soap_note` | ✅ | Production F1 gate | P2 |
| **DrASSIST coding panel** | §5.6 | ✅ ICD/SNOMED + confidence | ✅ | EMIS Read code equivalents in UI | P1 |
| **GUARDIAN DDI alert** | §5.6 | ✅ Aspirin+Apixaban HIGH | ✅ Pharmacist dashboard wired | Real formulary dataset; Acknowledge actions | P0 |
| **ORACLE risk update** | §5.5–5.7 | ✅ 78→82 with factors | ✅ | Neo4j-powered live recalc | P2 |
| **REFERRAL AGENT package** | §5.8 | ⚠️ `referral_pathway` human gate only | ⚠️ Same | Named queue item + ServiceRequest draft + Accept flow | **P0** |
| **SHIELD AuditEvent** | §5.9 | ⚠️ Per-item audit | ✅ FHIR AuditEvent on case Accept | Case-level agent manifest (6 agents listed) | P1 |
| **VOICE CARE Day-3 call** | §5.10 | ❌ | ❌ | Outbound call sim + escalation cascade | **P0** |
| **Nurse escalation task** | §5.10 | ❌ | ⚠️ Vitals stub | Task queue from Voice Care trigger | P0 |
| **ICS population + EQUITY** | §5.11 | ❌ | ⚠️ `/dashboard/regional` mock | EQUITY agent metrics, heatmap, Digital Twin forecast | P1 |
| **Midnight ETL pipeline** | §5.1 | ❌ | ❌ | Admin extraction job UI + simulated timeline | P1 |
| **Nurse dashboard** | Layer 1 | ❌ Placeholder | ⚠️ Patient list stub | Vitals entry, handover, GUARDIAN alerts | P1 |
| **Pharmacist dashboard** | Layer 1 | ❌ | ⚠️ GUARDIAN queue | BNF/formulary reference panel | P1 |
| **Admin dashboard** | Layer 1 | ❌ | ⚠️ SHIELD summary stub | Integration health, user mgmt, EQUITY reports | P1 |
| **Hospital Command Centre** | Layer 1 | ❌ | ❌ | Bed/ED/theatre live view + exec recommendations | P2 |
| **Patient Companion** | Layer 1 | ❌ | ❌ | Check-ins, med tracker, Ask Aksh chat | P2 |
| **HEALTH COMPANION agent** | Layer 3 | ❌ | ❌ | Patient-facing agent + CommunicationRequest | P2 |
| **HOSPITAL COMMAND agent** | Layer 3 | ❌ | ❌ | Operational recommendations | P2 |
| **CAPACITY PREDICTION agent** | Layer 3 | ❌ | ❌ | 14-day Digital Twin modelling | P2 |
| **LangGraph orchestration** | Layer 2 | ❌ | ❌ | Agent Manager + parallel activation | P2 |
| **Neo4j knowledge graph** | Layer 4 | ❌ | ❌ | Graph traversal for ORACLE demo narrative | P2 |
| **Medplum FHIR R4** | Layer 5 | ⚠️ Stub | ⚠️ Same | Staging write on Accept | P2 |
| **Weaviate embeddings** | §5.1 step 7 | ❌ | ❌ | Defer — pgvector interim per D-UK-06 | P3 |
| **EHR extract (EMIS/SystmOne)** | §5.1 | ❌ | ❌ | Phase E | P3 |
| **Mirth Connect bridge** | Layer 6 | ❌ | ❌ | Phase E | P3 |
| **Clinical identity SSO** | §5.2 | ⚠️ Proof-mode banner | ⚠️ OAuth stub | Sandbox federation | P1 |
| **5-role onboarding** | Layer 1 | ✅ 5 tiles | ✅ 5-step wizard (localStorage) | Persist to Postgres/Neon | P1 |
| **`/pilot` marketing** | Contact §8 | ⚠️ Stub copy | ✅ Compliance-neutral badges | `/pilot/apply` form + lead capture | P1 |
| **`/docs` portal** | §7 | ❌ | ⚠️ In-app stub | Public docs site v2 | P2 |
| **`/for-clinicians`** | Acquisition | ✅ Stub | ✅ | VOICE workflow demo video/embed | P1 |
| **Kafka event bus** | §4.2 | ❌ | ❌ | Phase D | P3 |
| **India ABDM fork** | §7 India row | N/A | N/A | Phase F — per INDIA strategy | P2 (parallel) |

### Gap scorecard (Overview Demo scope)

| Category | ✅ Proof | ⚠️ Partial | ❌ Greenfield |
|---|---|---|---|
| L1 UX surfaces | 1 (GP) | 4 (Nurse, Pharmacist, Admin, Regional) | 2 (Hospital Command, Patient Companion) |
| L2 Orchestration | HITL gate | — | Agent Manager, LangGraph, Decision Engine |
| L3 Agents (12) | 0 production | 6 clinical (synthetic) | 5 (Referral as agent, Voice Care, Health Companion, Hospital Command, Capacity) |
| L4 Graph | — | — | Neo4j entire layer |
| L5 FHIR | Export mapping | Medplum stub | Live write-back |
| L6 Integration | Contracts | — | Mirth, EMIS, live connectors |
| Demo journey §5.1–5.11 | §5.6–5.7 core | §5.2–5.5, §5.9 | §5.1, §5.8, §5.10, §5.11 |

---

## 3. Remaining features grouped by layer

### 3.1 Marketing & acquisition

| Item | Acceptance criteria | Repo |
|---|---|---|
| Overview Demo-aligned homepage narrative | One-sentence pitch + six-layer diagram; no certification overclaims | `akshhealth-uk-eu-platform` |
| `/pilot/apply` lead capture | ICS/regional lead fields; stores to Postgres or email webhook | `akshhealth-uk-eu-platform` |
| Investor demo landing (`/demo`) | Links to Patel walkthrough launcher; proof-mode disclaimer | `akshhealth-uk-eu-platform` |
| VOICE workflow embed on `/for-clinicians` | 60-sec product clip or interactive mic preview | `akshhealth-uk-eu-platform` |
| India GTM continuity | `akshhealth.in` links to waitlist; no PHI on marketing | `akshhealth-india-web` |

*Reconciles with AKSH_PLATFORM_IMPLEMENTATION_PLAN B1 (partially complete — apply form remains).*

### 3.2 Onboarding & identity

| Item | Acceptance criteria | Repo |
|---|---|---|
| Onboarding persist to Neon | `aksh.onboarding_progress` populated; survives refresh | `akshhealth-uk-eu-platform` + Neon |
| Clinical identity OAuth sandbox | Role-scoped JWT; proof banner when unset | `akshhealth-uk-eu-platform` |
| Practice tenancy (RLS) | `practice_id` on review_cases; demo practice isolated | `akshhealth-uk-eu-platform` |
| India clinician auth (NMC pattern) | Email + role verification for M13 pilots | `akshhealth-india-app` |

*Reconciles with B3–B5; Supabase vs Cognito decision D-UK-02 still open.*

### 3.3 Role dashboards

| Item | Acceptance criteria | Repo |
|---|---|---|
| **GP — Demo parity** | Patel/V-UK1 case; 4 queue items; referral draft slot; Digital Twin % | `akshhealth-uk-eu-platform` |
| **Nurse — escalation** | Voice Care triggers task; vitals form; handover summary stub | `akshhealth-uk-eu-platform` |
| **Pharmacist — GUARDIAN** | Medication queue filtered by severity; formulary reference panel | `akshhealth-uk-eu-platform` |
| **Admin — operations** | Midnight job status mock; SHIELD summary; integration health tiles | `akshhealth-uk-eu-platform` |
| **Regional — population** | EQUITY disparity cards; SYNTHESIS approval rate; ORACLE cohort counts | `akshhealth-uk-eu-platform` |
| **Hospital Command** | Bed/ED/theatre KPI cards; AI recommendation accept/reject (synthetic) | New module — `akshhealth-uk-eu-platform` |
| **Patient Companion** | Plain-English care plan; medication tracker; Ask Aksh chat (synthetic) | New — defer mobile; web PWA stub |

### 3.4 AI agents & orchestration

| Item | Acceptance criteria | Repo |
|---|---|---|
| **REFERRAL AGENT** (P0) | Queue item type `referral_package`; ServiceRequest draft; Accept → evidence export | `akshhealth-uk-eu-platform` |
| **VOICE CARE** (P0) | Day-3 scenario page/sim; creates Observation + Flag; re-scores ORACLE; nurse task | `akshhealth-uk-eu-platform` + Akeno engagement service |
| **VOICE ASR** (P0) | Mic button → streaming transcript (Deepgram or mock with latency); feeds SYNTHESIS | `akshhealth-uk-eu-platform` |
| **EQUITY** | Regional dashboard metrics; IMD quintile overlay on aggregate counts | `akshhealth-uk-eu-platform` |
| **HEALTH COMPANION** | Patient Companion chat; CommunicationRequest draft | Phase F |
| **HOSPITAL COMMAND + CAPACITY** | Hospital Command Centre widgets; 14-day forecast chart | Phase F |
| **LangGraph orchestrator** | Encounter event → parallel agent drafts → queue | `akeno_health_platform` or `services/agent-orchestrator/` |
| **Agent validation gates** | `/review/agent-gates` pass/fail vs Overview Demo thresholds | `akshhealth-uk-eu-platform` |

*Six clinical agents already named in `lib/agents.ts`; extend `ClinicalAgentId` for REFERRAL and VOICE_CARE when queue types added.*

### 3.5 Interoperability & data platform

| Item | Acceptance criteria | Repo |
|---|---|---|
| Midnight pipeline **simulation** | Admin UI timeline matching §5.1; CloudWatch-style status | `akshhealth-uk-eu-platform` |
| Medplum staging sync | Accepted case → FHIR bundle POST | `akshhealth-uk-eu-platform` + infra |
| Neo4j sync job | Patient→Condition→Medication edges; ORACLE factor text from graph | Akeno + infra |
| Neon app sync | `USE_POSTGRES=true` seeds V-UK1 to `aksh.review_cases` | `akshhealth-uk-eu-platform` |
| Mirth + EMIS live | Nightly extract <5 min / 5k patients | Phase E |
| India Practo/HealthPlix | Sandbox write-back | `akshhealth-india-app` |

### 3.6 Compliance & governance

| Item | Acceptance criteria | Repo |
|---|---|---|
| SHIELD case manifest | AuditEvent lists all activated agents (matches §5.9 table) | `akshhealth-uk-eu-platform` |
| Admin hazard log panel | DCB0129-aligned rehearsal status from governance-pack | `akshhealth-uk-eu-platform` |
| Neutral compliance copy | GDPR, HIPAA-ready design, ABDM-aligned, European data protection — no certification claims | `lib/compliance-labels.ts` |
| India DPDPA consent | Grant/withdraw + audit in ap-south-1 | Akeno `identity-consent` |

### 3.7 India fork (parallel track — Phase F)

Per `INDIA_TECH_BUILD_STRATEGY.md` — do not duplicate; key epics:

| Epic | Month | Repo |
|---|---|---|
| E01–E07 Foundation + DPDPA | M11–12 | `akshhealth-india-app`, Akeno |
| E08–E15 Hindi NLP + dashboard | M12–13 | `akshhealth-india-app` |
| E16–E25 Pilot readiness | M13–14 | `akshhealth-india-app`, Akeno |

UK Overview Demo agents port via `@akshhealth/foundation`; India replaces formulary (Indian Pharmacopoeia), identity (national health ID), and engagement (WhatsApp M14+).

---

## 4. Phased roadmap — Phases C, D, E, F

*Extends `AKSH_PLATFORM_IMPLEMENTATION_PLAN.md` Phases C–E. Phase C here is re-scoped to **UK Overview Demo parity** first; India moves to **Phase F** to avoid collision with existing plan's India Phase C label.*

### Phase C — UK Overview Demo parity (Months 3–6 · Aug–Nov 2026)

**Goal:** Founder can run the **full Section 5 Patel walkthrough** in synthetic/staging mode without production claims.

| Epic | Month | Effort | Acceptance criteria |
|---|---|---|---|
| C1. Patel scenario alignment | M3 | S | V-UK1 renamed/duplicated as `case-patel-demo`; patient label, meds, ORACLE 78→82→91 paths |
| C2. REFERRAL AGENT queue item | M3 | M | §5.8 referral package DRAFT; Accept creates ServiceRequest in evidence export |
| C3. VOICE CARE Day-3 simulation | M3–4 | M | §5.10 call transcript UI; auto Observation/Flag; GP URGENT banner; nurse task |
| C4. VOICE mic / ASR preview | M4 | M | Mic activates transcript panel; feeds existing SYNTHESIS path (mock or Deepgram) |
| C5. Nurse escalation dashboard | M4 | S | Task from C3 visible; vitals entry form |
| C6. Regional EQUITY dashboard | M4–5 | M | §5.11 metric cards (synthetic); disparity insight strings |
| C7. Midnight pipeline simulation | M5 | M | Admin dashboard shows §5.1 timeline; extraction SUCCESS badge |
| C8. Demo script launcher | M5 | S | `/demo` or `/review/demo-mode` — ordered steps for Investor/Clinical/Regulatory |
| C9. Neon seed sync | M5 | S | `npm run data:seed` writes to `aksh.review_cases` when `USE_POSTGRES=true` |
| C10. `/pilot/apply` + onboarding persist | M5–6 | M | Lead capture; onboarding_progress in Neon |
| C11. GP dashboard polish (B6 deferred) | M6 | M | P95 <2s; appointment risk sort; Digital Twin % display |
| C12. CIS2 OAuth sandbox | M6 | L | Clinical identity login path (sandbox); proof banner fallback |

**Phase C exit:** External stakeholder completes §5.2→5.11 narrative in staging; zero auto-write demonstrated; SHIELD export matches §5.9 schema.

---

### Phase D — Backend intelligence layer (Months 4–9 · Sep 2026–Feb 2027)

*Unchanged from AKSH_PLATFORM_IMPLEMENTATION_PLAN Phase D.*

| Epic | Month | Acceptance criteria |
|---|---|---|
| D1. Medplum staging (eu-west-2) | M4–5 | Accepted bundles write to staging FHIR |
| D2. Kafka `clinical.events.new` | M5–6 | Case events published; Akeno consumer |
| D3. LangGraph 12-agent orchestrator | M6–8 | Parallel activation per §5.5; draft staging |
| D4. SYNTHESIS + VOICE production | M6–7 | F1 ≥0.88; WER ≤8% |
| D5. DrASSIST + GUARDIAN production | M7–8 | ≥95% coding; ≥98% GUARDIAN recall |
| D6. ORACLE + EQUITY production | M7–9 | AUC ≥0.80; equity precision ≥0.80 |
| D7. Neo4j sync | M6–7 | Graph traversal powers ORACLE factor list |
| D8. Vector store (pgvector interim) | M7 | Similar encounters in GP panel |
| D9. SHIELD automation | M6 | 100% audit completeness |
| D10. Nightly extraction job | M8–9 | Real or synthetic CronJob <5 min |
| D11. Agent validation harness | M8 | CI gates per Overview Demo thresholds |

**Phase D exit:** Encounter → orchestrator → HITL → Medplum write in staging.

---

### Phase E — Production interoperability (Months 6–12 · Nov 2026–Apr 2027)

*Unchanged from AKSH_PLATFORM_IMPLEMENTATION_PLAN Phase E.*

| Epic | Month | Acceptance criteria |
|---|---|---|
| E1. Mirth deployment playbook | M8 | Channel templates for EHR CSV + REST |
| E2. Primary EHR connector (EMIS-class) | M9–11 | Demographics + encounters ingest |
| E3. Secondary EHR connector | M10–11 | Medication + consultation sync |
| E4. Anonymisation pipeline | M9 | KMS hashing; zero PII in ML sets |
| E5. Wearables / IntelliProve SDK | M9 | FHIR Observation ingest |
| E6–E8. India write-back + national HIE | M13+ | See Phase F |
| E9. Regional pilot cutover (3 sites) | M10–12 | 150 clinicians; clinical safety submission prep |

**Phase E exit:** Live EHR data feeds midnight pipeline (§5.1) for pilot practices.

---

### Phase F — Extended surfaces + India production (Months 7–24)

| Track | Epic | Month | Acceptance criteria |
|---|---|---|---|
| **UK extended** | F1. Hospital Command Centre | M7–9 | Bed/ED/theatre synthetic dashboard |
| **UK extended** | F2. CAPACITY PREDICTION / Digital Twin | M8–10 | 14-day forecast on regional dashboard |
| **UK extended** | F3. Patient Companion + HEALTH COMPANION | M10–12 | Web companion; check-ins; med tracker |
| **UK extended** | F4. Voice Care production (ElevenLabs TTS + telephony) | M9–11 | Live outbound calls; ≥80% contact rate |
| **India** | F5. Mumbai infra + DPDPA | M11–12 | ap-south-1; legal sign-off |
| **India** | F6. `akshhealth-india-app` fork | M12–13 | Hindi dashboard; V-IN2 ABDM profiles |
| **India** | F7. Practo/HealthPlix adapters | M12–14 | Sandbox → live write-back |
| **India** | F8. CDSCO Class B dossier | M15–18 | Evidence from UK RCT + India pilot |
| **India** | F9. WhatsApp engagement | M14–16 | V-IN3 RCT |
| **India** | F10. Federated learning | M19–24 | 3-site loop |

**Phase F exit (India):** 5 pilot clinics live with consent; UK extended surfaces demo-ready for hospital market narrative.

---

## 5. 90-day backlog (July–September 2026)

Prioritized epics with acceptance criteria tied to Overview Demo sections. *Supersedes T01–T25 only where noted; otherwise extends.*

### P0 — Blocks Patel walkthrough (Phase C)

| # | Epic | Demo § | Repo | Acceptance criteria |
|---|---|---|---|---|
| OD-01 | Patel demo case | §5.3–5.7 | `uk-eu-platform` | `case-patel-demo` with Mr Patel label, T2D HbA1c 9.0, DVT, Wells 3, meds match doc |
| OD-02 | REFERRAL AGENT queue item | §5.8 | `uk-eu-platform` | 5th queue item `referral_package`; ServiceRequest in export; Accept in <10s demo |
| OD-03 | Voice Care Day-3 sim | §5.10 | `uk-eu-platform` | Route `/demo/voice-care-day3`; SOB trigger; ORACLE 91; GP urgent banner |
| OD-04 | Nurse escalation task | §5.10 | `uk-eu-platform` | Task appears on `/dashboard/nurse` when OD-03 triggered |
| OD-05 | GUARDIAN Acknowledge actions | §5.7 | `uk-eu-platform` | Acknowledge + Pause Aspirin / Continue Both / Reject on guardian alert |
| OD-06 | VOICE mic preview | §5.4 | `uk-eu-platform` | Mic button on GP dashboard; transcript populates VOICE queue item |
| OD-07 | Overview Demo walkthrough launcher | §5 all | `uk-eu-platform` | Single ordered script: midnight → login → consult → referral → voice care → regional |
| OD-08 | Neon review_cases seed | §5 | `uk-eu-platform` | Seed writes V-UK1/Patel to `aksh.review_cases`; verified row count >0 |

### P1 — Strengthens investor/clinical demo

| # | Epic | Demo § | Repo | Acceptance criteria |
|---|---|---|---|---|
| OD-09 | Regional EQUITY dashboard | §5.11 | `uk-eu-platform` | 8+ metric cards; disparity insight strings; no patient drill-down |
| OD-10 | Midnight pipeline admin UI | §5.1 | `uk-eu-platform` | 8-step timeline with timestamps; SUCCESS status |
| OD-11 | Digital Twin % on GP panel | §5.3, §5.6 | `uk-eu-platform` | 61%→73% display on patient card during demo |
| OD-12 | SHIELD agent manifest | §5.9 | `uk-eu-platform` | AuditEvent lists 6+ agents activated; 0 auto-write count |
| OD-13 | `/pilot/apply` form | §8 | `uk-eu-platform` | Fields: org, role, region, patient volume; submission stored |
| OD-14 | Onboarding → Neon persist | §5.2 | `uk-eu-platform` | Wizard completion writes `aksh.onboarding_progress` |
| OD-15 | Appointment list by ORACLE risk | §5.2 | `uk-eu-platform` | GP column A sorts patients by risk score descending |
| OD-16 | DrASSIST Read code display | §5.6 | `uk-eu-platform` | EMIS Read code row in coding panel (synthetic 8L87.) |
| OD-17 | Pharmacist formulary panel | Layer 1 | `uk-eu-platform` | BNF-style reference sidebar on `/dashboard/pharmacist` |
| OD-18 | Agent gates dashboard | §3 thresholds | `uk-eu-platform` | `/review/agent-gates` shows SYNTHESIS F1, GUARDIAN recall targets |

### P2 — India parallel (non-blocking UK demo)

| # | Epic | Ref | Repo | Acceptance criteria |
|---|---|---|---|---|
| OD-19 | Foundation package v0.2.0 | INDIA E01 | `shared-foundation` | UK + India CI green |
| OD-20 | India app bootstrap | INDIA E02 | `india-app` | Fork builds; NHS strings removed |
| OD-21 | DPDPA consent extension | INDIA E04 | Akeno | Grant/withdraw API + tests |
| OD-22 | ap-south-1 IaC skeleton | INDIA E03 | `india-app/infra` | VPC + ECS + S3 empty |
| OD-23 | Practo sandbox spike | INDIA E11 | `india-app` | One DocumentReference POST |

---

## 6. Demo script — end-to-end walkthrough

**Audience:** Investor · Clinical governance · Regional procurement  
**Duration:** ~25 minutes (live) or ~12 minutes (accelerated recording)  
**Prerequisites:** `npm run data:seed`; `case-patel-demo` loaded; proof-mode banner visible; no production claims

### 6.1 Investor narrative (recommended order)

| Step | Time | Route / action | Narrative beat | Demo § |
|---|---|---|---|---|
| 1 | 2 min | `/pilot` → `/for-clinicians` | Problem: data silos, documentation burden; six-layer OS pitch | §1–2 |
| 2 | 1 min | `/onboarding` → Clinician role | Role-aware onboarding; clinical identity proof banner | §5.2 |
| 3 | 1 min | `/dashboard/admin` → Midnight jobs | "Last night while patients slept" — ETL SUCCESS in 6m39s | §5.1 |
| 4 | 2 min | `/dashboard/gp` | Appointment list: Mr Patel ORACLE 78 HIGH at top | §5.2 |
| 5 | 3 min | Click Patel → patient panel | T2D poorly controlled, Digital Twin 61%, GUARDIAN pre-alert | §5.3 |
| 6 | 2 min | Click mic → dictate | VOICE transcribes calf swelling, sugars 12–14, polydipsia | §5.4 |
| 7 | 3 min | Review queue (4 items) | SYNTHESIS SOAP, DrASSIST codes, GUARDIAN URGENT, ORACLE 78→82 | §5.5–5.6 |
| 8 | 2 min | HITL actions | Edit+Accept SOAP; Accept codes; Acknowledge+Pause Aspirin; Accept ORACLE | §5.7 |
| 9 | 1 min | Referral queue item | Accept DVT package → ServiceRequest; "8 seconds" | §5.8 |
| 10 | 1 min | `/cases/case-patel-demo` → evidence | SHIELD AuditEvent: 6 agents, 0 auto-writes | §5.9 |
| 11 | 3 min | `/demo/voice-care-day3` | Day-3 call; SOB; ORACLE 91; GP URGENT; nurse task | §5.10 |
| 12 | 2 min | `/dashboard/regional` | Population metrics; EQUITY: T2D 3.2× Q1 vs Q5 | §5.11 |
| 13 | 1 min | Close | North Star metrics; Phase 1 pilot targets Oct 2026 | §6 |

### 6.2 Clinical governance narrative

Lead with **zero auto-write** and **SHIELD audit** (steps 10→7→8→9), then Voice Care escalation (step 11), then population EQUITY (step 12). Emphasize GUARDIAN prevented Aspirin+Apixaban co-prescription.

### 6.3 Accelerated recording mode

Use `/review/demo-mode` with pre-accepted items for steps 7–8; jump to Voice Care (11) and Regional (12). Enable `recordingMode` flag to hide dev chrome.

### 6.4 Fallback if REFERRAL / Voice Care not yet built

| Missing | Fallback |
|---|---|
| REFERRAL AGENT | Show `referral_pathway` human gate on case detail; narrate §5.8 verbally |
| Voice Care | Static transcript page + manual "Trigger escalation" button |
| Midnight pipeline | Slide or `/dashboard/admin` static timeline component |
| Regional EQUITY | `/dashboard/regional` mock counts with disclaimer |

---

## 7. Dependencies & blockers

### 7.1 Neon database sync state (July 2026)

| Project | ID | Region | Schema state | App sync state | Blocker |
|---|---|---|---|---|---|
| **Aksh Health** | `floral-salad-21467299` | eu-west-2 | Rich `aksh.*` (38 tables): patients, review_cases, medications, ai_agent_logs, etc. | `aksh.review_cases` = **0 rows**; 5 patients; 94 `public.users` | App still defaults to JSON adapter; seed script not writing to Neon |
| **akeno health** | `silent-violet-81283547` | eu-west-2 | `consent_grants`, `ingestion_events`, `patients` (skeleton) | 4 consents, 2 ingestion events, 2 patients | India DPDPA extension not deployed; no ap-south-1 project yet |

**Actions:** OD-08 (seed sync); wire `USE_POSTGRES=true` in Vercel staging; apply RLS policies before pilot PHI.

### 7.2 GitHub repositories

| Repo | State | Blocks |
|---|---|---|
| `akshhealth-uk-eu-platform` | Phase A+B complete; 56+ routes | OD-01–OD-18 |
| `akshhealth-india-web` | Marketing live | India GTM only |
| `akshhealth-india-app` | Scaffold / partial fork | Phase F India |
| `akshhealth-shared-uk-india-foundation` | Exists; package publish pending | OD-19 |
| `akeno_health_platform` | L0–L10 skeleton; Neon consent | LangGraph, Voice Care telephony, India consent |

### 7.3 Vercel / deployment

| Surface | Status | Action |
|---|---|---|
| UK platform staging | Assumed Vercel | Enable Neon `DATABASE_URL`; `USE_POSTGRES=true` |
| India marketing | Vercel | No change for UK demo |
| Medplum / Neo4j | Local docker only | Phase D infra decision (D-UK-04) |

### 7.4 Founder / architecture decisions

| ID | Decision | Blocks | Deadline |
|---|---|---|---|
| D-UK-02 | Auth provider (Supabase EU vs Cognito) | C12, RLS | Aug 2026 |
| D-UK-03 | Clinical identity sandbox timing | C12 | Sep 2026 |
| D-UK-04 | Medplum Cloud vs self-hosted | D1 | Sep 2026 |
| D-UK-05 | Orchestrator home (Akeno vs standalone) | D3 | Oct 2026 |
| D-ORG-01 | CSO appointment | DCB0129 Safety Case | Sep 2026 |
| D-ORG-02 | 3 regional pilot site commitments | E9 | Apr 2027 |
| D-IN-01–04 | Per INDIA strategy §8 | Phase F | Nov 2026 |
| **D-OD-01** | Patel vs V-UK1 naming in UI | OD-01 | Jul 2026 |
| **D-OD-02** | Voice Care: sim vs telephony vendor | OD-03 | Aug 2026 |
| **D-OD-03** | Neon as staging SSOT vs JSON for demos | OD-08 | Aug 2026 |

### 7.5 Regulatory / copy constraints

- Document is **CONFIDENTIAL** — do not distribute externally without founder approval.
- Marketing and new plan copy: **neutral compliance framing** (GDPR, HIPAA-ready design, ABDM-aligned, European data protection) — no certification claims.
- Existing Phase A files may retain legacy regional strings; Phase C copy pass optional, not blocking.

---

## 8. Repo assignment — remaining features

| Remaining feature | Owning repo | Phase | Notes |
|---|---|---|---|
| Patel demo case + walkthrough launcher | `akshhealth-uk-eu-platform` | C | OD-01, OD-07 |
| REFERRAL AGENT queue + ServiceRequest | `akshhealth-uk-eu-platform` | C | OD-02 |
| Voice Care Day-3 simulation | `akshhealth-uk-eu-platform` | C | OD-03; telephony in Akeno Phase F |
| VOICE ASR mic UI | `akshhealth-uk-eu-platform` | C | OD-06 |
| Nurse / Pharmacist / Admin / Regional dashboards | `akshhealth-uk-eu-platform` | C | OD-04, OD-09, OD-17 |
| Midnight pipeline admin UI | `akshhealth-uk-eu-platform` | C | OD-10 |
| `/pilot/apply`, onboarding persist | `akshhealth-uk-eu-platform` | C | OD-13, OD-14 |
| Neon seed + Postgres adapter default | `akshhealth-uk-eu-platform` | C | OD-08 |
| LangGraph 12-agent orchestrator | `akeno_health_platform` (or new `agent-orchestrator`) | D | D3 |
| Medplum staging sync | `akshhealth-uk-eu-platform` + infra | D | D1 |
| Neo4j sync job | `akeno_health_platform` | D | D7 |
| Kafka clinical.events | `akeno_health_platform` | D | D2 |
| Agent validation harness | `akshhealth-uk-eu-platform` | D | OD-18 |
| Mirth + EHR connectors | New `services/ehr-adapters/` or Akeno | E | E1–E3 |
| Hospital Command + Capacity Prediction | `akshhealth-uk-eu-platform` | F | F1–F2 |
| Patient Companion + Health Companion | `akshhealth-uk-eu-platform` (web PWA) | F | F3 |
| Voice Care production telephony | `akeno_health_platform` | F | F4 |
| India clinical app | `akshhealth-india-app` | F | F5–F7 |
| India marketing | `akshhealth-india-web` | F | F5 GTM |
| DPDPA consent production | `akeno_health_platform` | F | F5; Neon ap-south-1 |
| Shared types + workflow | `akshhealth-shared-uk-india-foundation` | C–F | OD-19 |
| Public docs site v2 | `akshhealth-uk-eu-platform` or split `akshhealth-uk-web` | D | B2 v2 |
| AWS eu-west-2 EKS / infra | New `akshhealth-infra-uk` | D | D1 |
| AWS ap-south-1 infra | `akshhealth-india-app/infra` | F | OD-22 |

---

## Appendix A — Agent mapping: Overview Demo → codebase

| Overview Demo agent | Code module today | Gap |
|---|---|---|
| VOICE | `lib/agents.ts`, transcript intake | Live ASR |
| SYNTHESIS | `lib/intake-generation.ts` | Named in queue ✅ |
| DrASSIST | Review queue `diagnosis_codes` | Read codes in UI |
| GUARDIAN | `lib/workflow/safety.ts` | Acknowledge actions; real formulary |
| ORACLE | `oracleRiskScore` on case | Neo4j factors |
| EQUITY | Agent meta only | Regional dashboard data |
| SHIELD | `lib/shield-audit.ts` | Agent manifest |
| REFERRAL AGENT | `lib/human-gates.ts` (`referral_pathway`) | **Not a named queue agent** |
| VOICE CARE | — | **Greenfield** |
| HEALTH COMPANION | — | **Greenfield** |
| HOSPITAL COMMAND | — | **Greenfield** |
| CAPACITY PREDICTION | — | **Greenfield** |

---

## Appendix B — Reconciliation with existing phase labels

| This document | AKSH_PLATFORM_IMPLEMENTATION_PLAN | Resolution |
|---|---|---|
| Phase C (UK Demo Parity) | Phase B deferred items (B6, B3 prod) + new OD epics | **Do first** — unblocks Overview Demo |
| Phase D | Phase D | Unchanged |
| Phase E | Phase E | Unchanged |
| Phase F (India + extended UK) | Phase C (India) | India relabeled **Phase F** here to avoid phase ID collision |
| 90-day OD backlog | T01–T25 | OD items **extend** T-items; T03–T05,T09–T11 largely **done** per Phase A/B |

---

## Appendix C — Neon `aksh` schema inventory (unused by app today)

Tables provisioned in **Aksh Health** Neon project but not yet wired to UK platform UI:

`agent_workflow_executions`, `ai_agent_logs`, `ai_clinical_insights`, `ai_suggestions`, `care_plans`, `clinical_notes`, `compliance_alerts`, `diagnoses`, `documents`, `drug_allergy_cross_reactions`, `drug_disease_contraindications`, `ehr_records`, `encounters`, `follow_up_tasks`, `guardian_communications`, `lab_orders`, `lab_results`, `llm_validation_log`, `medication_interactions`, `medications`, `notifications`, `onboarding_progress`, `patient_communications`, `patients`, `prescriptions`, `quality_metrics`, `review_cases`, `synthesis_processing_log`, `vital_signs`, `voice_recordings`

**Recommendation:** Phase C wires `review_cases`, `onboarding_progress`, `patients`; Phase D wires `ai_agent_logs`, `medication_interactions`, `agent_workflow_executions`; avoid building UI for billing tables (`invoices`, `claims`) until hospital market Phase F.

---

*Next review: October 2026 — after Phase C exit criteria met, or on Patel demo walkthrough rehearsal.*

*Approved for internal planning only. CONFIDENTIAL — do not distribute without written permission from Dr Gnaneshwer Jadav.*
