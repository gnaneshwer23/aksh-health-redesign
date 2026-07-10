# Aksh Health India — Technology Build Strategy

**Version:** 1.0  
**Date:** June 2026  
**Status:** Engineering + product + regulatory sequencing plan  
**Source of truth:** `AkshHealth_India_StrategyGuide_v1.0.docx`  
**Audience:** Founder, CTO, India Country Head, engineering leads

---

## 1. Executive Summary

### What we're building

Aksh Health India is an **ABDM-native, review-first clinical documentation platform** that turns multilingual outpatient consultations (Hindi, Tamil, Telugu, Bengali, Kannada, English) into structured SOAP notes and ABDM-compliant FHIR R4 artifacts, with clinician sign-off before any write-back to Practo or HealthPlix. The stack reuses the UK/EU proof architecture—Medplum FHIR, LangGraph orchestration, human review gates, frozen evidence artifacts—while replacing UK-specific layers (NHS Login, EMIS, NICE/BNF) with India-specific ones (ABHA, Practo/HealthPlix, ICMR/Indian Pharmacopoeia, WhatsApp, DPDPA consent). Patient engagement (WhatsApp reminders) and federated learning (city + Tier-2 + PHC sites) are Month 16–22 differentiators, not launch blockers.

### Sequencing rule

**UK validates → India scales → EU expands.**  
UK Phase 1–2 produces the RCT evidence package (500 patients, ER reduction) that feeds the CDSCO Class B dossier. Shared FHIR workflow, review gates, and export mapping are built once in `akshhealth-uk-eu-platform` and `akshhealth-shared-uk-india-foundation`; India forks country-specific adapters and deploys to AWS Mumbai (ap-south-1). Never run two full regulatory tracks simultaneously on the ~$3M budget.

### Current state vs Month 13 launch gap

| Dimension | Today (June 2026) | Month 13 launch requirement | Gap |
|---|---|---|---|
| **Public surface** | Marketing site live (`akshhealth-india-web`) — synthetic-safe narrative, no PHI | Hindi-first GP dashboard, review queue, SOAP editor | **New app repo required** |
| **Clinical workflow** | UK synthetic proof (56 routes, JSON persistence) — not production | Production-grade intake → review → freeze → write-back on Postgres | Fork UK `lib/workflow/*`, replace persistence |
| **Data residency** | No AWS Mumbai deployment | DPDPA-compliant ap-south-1 stack before any live patient data | **4-week infra sprint (M11–12)** |
| **NLP/ASR** | English-only synthetic generation (`lib/intake-generation.ts`) | IndicBERT NER (Hi/Ta/Te) + Azure Speech + Deepgram EN | **Greenfield ML pipeline** |
| **FHIR/ABDM** | Medplum client stub, disabled by default (`ENABLE_MEDPLUM_SYNC`) | Medplum with ABDM profiles, HIP/HIU registration, ABHA identity | **Adapter + NHA registration** |
| **EHR integration** | EMIS/SystmOne placeholders (`integration-config.ts`) | Practo + HealthPlix sandbox → live write-back | **Greenfield connectors** |
| **Consent/DPDPA** | Akeno `identity-consent` service skeleton (Neon Postgres) | DPDPA consent manager, DPO, audit, India-only data plane | **Extend Akeno + legal sign-off** |
| **Patient engagement** | None | WhatsApp Business API + Vapi IVR | **Greenfield (M14)** |
| **Federated learning** | Akeno `l7-federated` orchestrator skeleton | 3-site secure aggregation loop | **Phase 3 (M19–24)** |
| **Regulatory** | Roadmap language only (marketing `proofNotice`) | CDSCO pre-consult done; Class B filed M15 | **Parallel regulatory track** |

**Bottom line:** The narrative and shared domain logic exist. The India **production clinical app**, **Mumbai infrastructure**, **multilingual AI**, and **ABDM/EHR adapters** do not. Month 11–12 is the critical prep window; slipping DPDPA architecture past Month 12 blocks launch.

---

## 2. Asset Inventory & Reuse Map

| Asset | What it provides | Reuse for India | Do NOT copy blindly |
|---|---|---|---|
| **`akshhealth-india-web/`** | Public marketing site; copy in `content/india-marketing.ts`; roadmap-safe claims | Continue as GTM surface; link to pilot waitlist; host strategy docs in `docs/` | No clinical logic; no PHI; no certification claims |
| **`akshhealth-shared-uk-india-foundation/`** | Reference types (`lib/types.ts`), feedback patterns (`lib/feedback-*.ts`), workflow regression tests, synthetic case data | Publish as `@akshhealth/foundation` npm package; import types + validation helpers into India app | `workflow.ts` barrel is UK-scoped; regulatory labels, pilot packaging, EHR assumptions stay UK |
| **`akshhealth-uk-eu-platform/`** | Full synthetic proof: intake, review queue, human gates, FHIR export, frozen artifacts, ops/roadmap dashboards (56 routes) | **Fork** into `akshhealth-india-app`: `lib/workflow/*`, `lib/export-mapping.ts`, `lib/human-gates.ts`, `lib/intake-generation.ts` (extend for Indic), `components/review/*`, test harness | JSON file persistence; NHS/DCB0129 language; EMIS connectors; synthetic-only auth; "not production" positioning |
| **`akeno_health_platform/`** | Multi-AMC L0–L10 skeleton: ingestion, identity-consent, AI safety guardrails, federated orchestrator; Neon Postgres; Docker (Neo4j, Kafka) | Deploy India instances in ap-south-1: `services/identity-consent/`, `services/l0-l2-ingestion/`, `services/l3-l4-ai-safety/`, `services/l7-federated/`; use `docs/kpi-framework.md` gates | AMC/hospital scale assumptions; US-centric consent scopes; Vercel-only web deploy — India needs AWS Mumbai for PHI |
| **`buildcopilot/`** | Execution intelligence: idea → strategy → PRD → Jira/Linear push | Optional: track India epics, phase gates, V-IN validation artifacts; push backlog to Linear | Not clinical software; do not embed in patient data path |
| **Strategy Guide (docx)** | Month-by-month plan, V-IN1–6 gates, commercial targets, regulatory costs | Sequencing source of truth for this document | Commercial/marketing numbers — engineering validates feasibility separately |

### Code paths worth explicit porting

```
UK/EU (port)                          →  India (adapt)
─────────────────────────────────────────────────────────────
lib/workflow/*                        →  Same structure; India validation stream names
lib/export-mapping.ts                 →  Add ABDM profile extensions
lib/human-gates.ts                    →  Add Indian Pharmacopoeia DDI gate
lib/types.ts (FhirBundleDraft, etc.)  →  Shared via foundation package
lib/medplum-client.ts                 →  Point to Mumbai Medplum; ABDM meta profiles
lib/integration-config.ts             →  Replace EMIS with Practo/HealthPlix registry
components/review/*                   →  Hindi-first UI skin
tests/workflow-scenarios.test.js      →  India synthetic cases + V-IN regression suite

Akeno (deploy)                        →  India instance
─────────────────────────────────────────────────────────────
services/identity-consent/            →  DPDPA consent scopes + ABHA proxy keys
services/l0-l2-ingestion/             →  Clinic intake events (Kafka → Postgres)
services/l3-l4-ai-safety/             →  DDI guardrails, Indic NLP scoring
services/l7-federated/                →  M19+ federated round orchestration
web/app/api/consent/grant/            →  Pattern for India dashboard consent API
```

---

## 3. Target Architecture (India)

### Layer model

```
┌─────────────────────────────────────────────────────────────────────────┐
│  L10  Engagement & Learning                                             │
│  WhatsApp Business API · Vapi IVR · Federated learning (l7-federated)   │
├─────────────────────────────────────────────────────────────────────────┤
│  L9   Clinician UI (Next.js — akshhealth-india-app)                     │
│  Hindi-first dashboard · SOAP editor · DrASSIST India · review queue    │
├─────────────────────────────────────────────────────────────────────────┤
│  L8   Review & Governance                                             │
│  Human gates · frozen artifacts · V-IN validation · CDSCO evidence pack │
│  (from UK lib/workflow + lib/human-gates)                               │
├─────────────────────────────────────────────────────────────────────────┤
│  L7   Clinical NLP / ASR                                                │
│  IndicBERT NER (Hi/Ta/Te/Bn/Kn) · JSL EN · Azure Speech · Deepgram EN   │
│  LangGraph orchestration (new Python service or extend l3-l4-ai-safety) │
├─────────────────────────────────────────────────────────────────────────┤
│  L6   Safety & DDI                                                      │
│  Indian Pharmacopoeia DDI · ICMR pathway hints · l3-l4 guardrails       │
├─────────────────────────────────────────────────────────────────────────┤
│  L5   Knowledge / RAG                                                   │
│  Weaviate: ICMR + Indian Pharmacopoeia + PubMed India (not NICE/BNF)     │
├─────────────────────────────────────────────────────────────────────────┤
│  L4   FHIR / Interop                                                    │
│  Medplum R4 (ABDM profiles) · ABHA identity · HIP/HIU gateway           │
├─────────────────────────────────────────────────────────────────────────┤
│  L3   EHR Adapters                                                      │
│  Practo API · HealthPlix · eVital (roadmap) · handwritten Rx OCR          │
├─────────────────────────────────────────────────────────────────────────┤
│  L2   Consent / Identity (DPDPA)                                        │
│  Akeno identity-consent · consent manager · DPO audit log · ABHA link   │
├─────────────────────────────────────────────────────────────────────────┤
│  L1   Data Foundation                                                   │
│  Neon Postgres (ap-south-1) · Neo4j patient graph · Kafka events        │
│  S3 (ap-south-1) for audio/transcripts — encrypted at rest              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mapping to existing codebases

| Layer | Primary codebase | Key files / services |
|---|---|---|
| Intake / NLP | New `services/india-nlp/` + UK `lib/intake-generation.ts` | Extend deterministic draft → LLM + IndicBERT pipeline |
| Review workflow | `akshhealth-uk-eu-platform/lib/workflow/*` | Fork to India app; Postgres repositories replace JSON |
| FHIR / ABDM | UK `lib/medplum-client.ts`, `lib/export-mapping.ts` | ABDM StructureDefinitions; NHA sandbox compliance tests (V-IN2) |
| Consent / DPDPA | Akeno `services/identity-consent/` | Add DPDPA-specific scopes, purpose limitation, erasure API |
| Integrations | Greenfield `services/india-ehr-adapters/` | Practo sandbox (M12), HealthPlix (M14) |
| WhatsApp | Greenfield `services/india-engagement/` | Meta Business API; template messages; V-IN3 RCT instrumentation |
| Federated | Akeno `services/l7-federated/app/orchestrator.py` | 3-site loop; no raw PHI leaves clinic VPC |
| Marketing | `akshhealth-india-web/` | Unchanged; add `/docs` or investor PDF exports later |

### AWS Mumbai deployment topology (high level)

```
                         Route 53 (akshhealth.in)
                                  │
                    ┌─────────────┴─────────────┐
                    │   CloudFront + WAF        │
                    └─────────────┬─────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
   ┌─────▼─────┐           ┌──────▼──────┐         ┌──────▼──────┐
   │ ECS/Fargate│           │ ECS/Fargate │         │  Vercel     │
   │ india-app  │           │ FastAPI     │         │ india-web   │
   │ (Next.js)  │           │ services    │         │ (marketing) │
   └─────┬─────┘           └──────┬──────┘         └─────────────┘
         │                        │
         │    ┌───────────────────┼───────────────────┐
         │    │                   │                   │
   ┌─────▼────▼─────┐    ┌───────▼───────┐   ┌───────▼───────┐
   │ Neon Postgres   │    │ Medplum FHIR  │   │ Weaviate      │
   │ ap-south-1      │    │ (ECS or       │   │ (ECS)         │
   │ (PHI metadata)  │    │  Medplum Cloud│   │ ICMR index    │
   └─────────────────┘    │  Mumbai*)     │   └───────────────┘
                          └───────────────┘
   ┌─────────────────┐    ┌───────────────┐   ┌───────────────┐
   │ S3 ap-south-1   │    │ Neo4j         │   │ Kafka (MSK    │
   │ audio/transcripts│   │ (EKS/ECS)     │   │  or Confluent)│
   └─────────────────┘    └───────────────┘   └───────────────┘

   * Decision: Medplum Cloud region availability vs self-hosted ECS — see §8
```

**DPDPA hard rules:** All PHI and sensitive personal data stays in ap-south-1. No cross-region replication to eu-west-2. UK synthetic proof data never commingles with India production. Audit logs immutable (S3 Object Lock or Postgres append-only).

---

## 4. Phased Build Plan (Months 11–24)

### Phase 0: Pre-launch prep (Months 11–12)

**Goals:** Legal/regulatory foundation, Mumbai infra ready, Hindi NLP baseline, Practo sandbox proven, India Country Head hired.

| Workstream | Engineering deliverables | Validation gate | Owner | Dependencies |
|---|---|---|---|---|
| **DPDPA architecture** | Consent data model in Akeno; AWS ap-south-1 Terraform/CDK skeleton; DPO runbook; no-PHI until audit checklist passes | Legal sign-off on architecture doc | CTO + Reg | DPO appointment |
| **Indic NLP v0** | 200 gold-standard Hindi/Tamil/Telugu NER cases; IndicBERT fine-tune pipeline; eval harness | **V-IN1** (partial): Hindi F1 >82% | AI/ML | Annotator budget (~Rs.2L) |
| **Azure Speech** | Streaming Hindi/Tamil ASR integration; 20-clip WER benchmark | Hindi WER <15% on test clips | AI/ML | Azure India region keys |
| **Practo sandbox** | `services/india-ehr-adapters/practo/` — auth, patient lookup, FHIR write-back POC | Sandbox write-back demo recorded | Backend | Practo partnership/sandbox access |
| **Repo bootstrap** | `akshhealth-india-app` forked from UK platform; `@akshhealth/foundation` extracted; CI on GitHub | `npm run verify` green on India fork | CTO | — |
| **CDSCO pre-consult** | Evidence requirements doc linking UK RCT → India dossier | CDSCO meeting minutes | India Reg | UK RCT interim data |
| **Country Head** | Sales playbook, pilot clinic list (Mumbai BKC/Lower Parel, Delhi) | Employment contract signed | CEO | — |

**Phase 0 exit criteria:** Mumbai VPC live (empty), DPDPA architecture signed, Hindi NER >82% F1, Practo sandbox FHIR POST succeeds in staging, India app repo builds.

---

### Phase 1: Launch core (Months 13–15)

**Goals:** DPDPA-compliant production pilot, ABDM registration, 5-clinic Mumbai/Delhi cohort, Hindi-first dashboard.

| Workstream | Engineering deliverables | Validation gate | Owner | Dependencies |
|---|---|---|---|---|
| **Mumbai deploy** | Medplum + app + Postgres in ap-south-1; secrets in AWS SM; penetration test (basic) | DPDPA data residency audit | DevOps | Phase 0 infra |
| **ABDM / ABHA** | HIP/HIU registration; ABHA identity resolution; ABDM FHIR profile validation suite | **V-IN2**: zero ABDM profile errors | Reg + Backend | NHA portal access |
| **EHR live** | Practo + HealthPlix write-back; Rx OCR v0 (if sandbox supports) | Pilot write-back success >95% | Backend | Phase 0 Practo POC |
| **Hindi dashboard** | `/intake`, `/review`, `/cases/[id]` with Hindi UI; SOAP editor; DrASSIST panel | GP NPS ≥40 Hindi usability (qual) | Frontend | India app fork |
| **Indian Pharmacopoeia DDI** | DDI rule engine in `l3-l4-ai-safety`; critical conflict blocking | **V-IN4**: zero false negatives on 100 cases | AI/ML + Clinical | Pharmacopoeia data license |
| **Pilot ops** | 3 Mumbai + 2 Delhi clinics onboarded; synthetic → live transition runbook | DAU >80% in pilot clinics | India Head + CS | Country Head |
| **6-language SOAP v1** | Hindi + English production; Ta/Te beta behind flag | **V-IN6** (partial): Hindi ≥85% acceptance | AI/ML | V-IN1 completion |

**Phase 1 exit criteria:** Live patients in Mumbai with consent, ABDM HIP registered, 5 pilots active, Hindi SOAP in daily use, V-IN2/V-IN4 passed.

---

### Phase 2: Regulatory + scale (Months 16–18)

**Goals:** CDSCO Class B filed/approved, DPDPA audit clean, 30 paying clinics, WhatsApp engagement live.

| Workstream | Engineering deliverables | Validation gate | Owner | Dependencies |
|---|---|---|---|---|
| **WhatsApp** | Business API integration; appointment/medication templates; opt-in consent | **V-IN3**: no-show <20% (RCT) | Backend + AI/ML | Meta Business verification |
| **Doc time study** | Instrumentation for time-motion; pre/post dashboard | **V-IN5**: ≥60% doc time reduction | Clinical + Product | Pilot data |
| **CDSCO dossier** | Automated evidence export from frozen artifacts; UK RCT + India pilot bundle | Submission receipt (M15–16) | India Reg | UK RCT complete |
| **DPDPA audit** | External auditor access; consent flow evidence; erasure demo | Clean auditor report (M16) | Reg + Legal | Phase 1 production |
| **Scale onboarding** | Multi-clinic admin; billing (Rs.20K/mo); referral workflow | 30 paying clinics | India Head + CS | CDSCO filed (sales confidence) |
| **ISO 27001 prep** | Control library from Akeno `docs/compliance/` mapped to ISO | ISMS documentation ready | CTO + Reg | Budget Rs.3L |
| **Tamil/Telugu GA** | Production ASR+NLP for Ta/Te | **V-IN1** full: Hi ≥90%, Ta ≥85%, Te ≥82% | AI/ML | Phase 1 Hindi stability |

**Phase 2 exit criteria:** CDSCO Class B approved (target M18), DPDPA audit passed, 30 paying clinics, WhatsApp RCT positive, V-IN5/V-IN6 complete.

---

### Phase 3: Federated + expansion (Months 19–24)

**Goals:** Federated learning moat, Tier-2/PHC sites, hospital SaaS path, Rs.5Cr Year-2 ARR trajectory.

| Workstream | Engineering deliverables | Validation gate | Owner | Dependencies |
|---|---|---|---|---|
| **Federated loop** | Deploy `l7-federated` to 3 site types; secure aggregation; model update pipeline | 3 sites active (M22) | AI/ML + DevOps | Phase 2 scale |
| **Bengali/Kannada** | Full 6-language production | V-IN6 all languages ≥85% | AI/ML | Annotator scale |
| **Hospital SaaS** | >5 doctor tier; RBAC; CDSCO Class B gating in product | 10 hospital contracts pipeline | Product + Sales | CDSCO approval |
| **ABDM Analytics API** | B2B API for ABDM data consumers | 20 integrations | Backend | HIP/HIU mature |
| **Pharma RWE** | Cohort export with consent; federated stats only | 2 study contracts | Clinical + BD | Federated loop |
| **NABH digital** | NABH-aligned audit exports | NABH alignment doc (M18) | Reg | ISO 27001 progress |

**Phase 3 exit criteria:** Federated learning operational, 6 languages live, hospital tier launched, path to Rs.5Cr ARR visible.

---

## 5. Repository & Team Structure Recommendation

### Repo strategy: **Separate app repo + shared package** (not full monorepo)

| Repository | Purpose | Relationship |
|---|---|---|
| `akshhealth-india-web` | Marketing (exists) | Standalone Vercel deploy |
| `akshhealth-india-app` | **New** — production clinical app | Fork UK platform; depends on `@akshhealth/foundation` |
| `akshhealth-shared-uk-india-foundation` | Shared types, validation, test fixtures | Publish as npm package (private GitHub Packages) |
| `akshhealth-uk-eu-platform` | UK synthetic proof (continues) | Upstream for workflow changes; merge shared fixes back to foundation |
| `akeno_health_platform` | Backend microservices | India fork or `india/` overlay branch; deploy to AWS Mumbai |
| `buildcopilot` | Optional program management | Linear/Jira epic sync only |

**Why not monorepo:** UK and India have different regulatory boundaries, deploy regions, and release cadences. Shared foundation as a versioned package prevents India production changes from breaking UK proof demos.

### Fork vs greenfield

| Component | Fork from UK | Greenfield |
|---|---|---|
| Review workflow UI + logic | ✅ | |
| FHIR export mapping | ✅ (extend) | |
| Human gates / frozen artifacts | ✅ | |
| Types + test harness | ✅ (via foundation) | |
| Persistence layer | | ✅ Postgres repositories |
| Auth (NMC clinician verification) | | ✅ |
| EHR adapters (Practo/HealthPlix) | | ✅ |
| Indic NLP/ASR pipeline | | ✅ |
| WhatsApp / Vapi engagement | | ✅ |
| DPDPA consent UI | | ✅ (extend Akeno service) |
| AWS Mumbai infra | | ✅ |

### Team shape (within ~$3M budget)

| Role | Phase 0 | Phase 1 | Phase 2+ | Notes |
|---|---|---|---|---|
| CTO / tech lead | ● | ● | ● | Architecture + U.K. sync |
| Backend (2) | ● | ● | ● | FHIR, adapters, Akeno services |
| Frontend (1) | ● | ● | ● | Hindi-first dashboard |
| AI/ML (1–2) | ● | ● | ● | IndicBERT, ASR, DDI |
| DevOps (0.5–1) | ● | ● | ● | AWS Mumbai, Medplum |
| India Country Head | ● | ● | ● | Not engineering but pilot gate |
| QA / clinical informatics (0.5) | | ● | ● | V-IN studies |
| Regulatory consultant | ● | ● | ● | External — CDSCO/DPDPA |

---

## 6. Critical Path & Risks

### Critical path (sequential dependencies)

```
DPDPA architecture (M11)
    └── AWS Mumbai deploy (M12–13) — blocks ALL PHI
            └── ABDM HIP registration (M13–14)
                    └── Pilot clinics live (M14–15)
                            └── V-IN4/V-IN5 evidence (M15–16)
                                    └── CDSCO dossier (M15) ← also depends on UK RCT
                                            └── 30 paying clinics (M18)
                                                    └── Federated loop (M19+)
```

**Parallel tracks that must NOT block launch:** WhatsApp (M14), Tamil/Telugu (M14–15), federated (M19), ISO 27001 (M15–18).

### Top 5 risks with mitigations

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | **DPDPA violation before Mumbai deploy** | Fines, reputational destroy, launch halt | No production PHI until residency audit passes; synthetic-only demos on india-web; legal sign-off gate |
| 2 | **CDSCO delay — UK RCT not ready** | Class B slips past M18; hospital SaaS blocked | Begin pre-consult M12 with synthetic + protocol evidence; India pilot generates supplementary data; parallel consultant engagement |
| 3 | **Multilingual NLP underperforms** | Core differentiator fails; Hindi NPS miss | Prioritize Hindi only for M13 launch; Ta/Te behind feature flags; 200-case gold set with clinician annotators; fallback to English+human edit |
| 4 | **Practo sandbox → production gap** | No write-back; pilots fail | Start HealthPlix as parallel adapter M12; design adapter interface in UK `integration-boundary-contract.ts` pattern; manual FHIR export fallback for pilot |
| 5 | **Budget overrun on infra + regulatory** | Engineering velocity drops M16+ | Cap AWS at ~$8–12K/mo Phase 1; Medplum Cloud vs self-host decision; defer Neo4j/Kafka to Phase 2 if needed; use Neon ap-south-1 + ECS only for launch |

### Additional constraints

- **Do not claim certifications** not yet achieved — product UI and marketing must mirror `india-marketing.ts` `proofNotice` pattern.
- **Telemedicine Guidelines 2020:** NMC-registered clinician retains oversight — enforce in review workflow (already aligned with UK human gates).
- **Patent #439306:** Architecture is protected; ensure India deployment documented for IP enforcement if needed.

---

## 7. 90-Day Engineering Sprint Backlog (Start Now)

Prioritized epics for the first 90 days (Months 11–12 + early M13). Each item has acceptance criteria.

### P0 — Launch blockers

| # | Epic | Acceptance criteria |
|---|---|---|
| E01 | **Extract `@akshhealth/foundation` package** | `types.ts`, `feedback-types.ts`, validation helpers published; UK + India apps import it; CI publishes on merge |
| E02 | **Bootstrap `akshhealth-india-app` from UK fork** | Repo created; `npm run verify` passes; UK NHS strings removed; India env template documented |
| E03 | **AWS ap-south-1 Terraform/CDK skeleton** | VPC, ECS cluster, S3 bucket (encrypted), Secrets Manager, Route53 zone; no app deploy yet |
| E04 | **DPDPA consent model extension** | Akeno `identity-consent` supports purpose, duration, withdrawal, audit log; API documented; unit tests pass |
| E05 | **Neon Postgres ap-south-1 project** | Database provisioned; migrations from Akeno applied; connection from local dev verified |
| E06 | **India Postgres repository layer** | Replace JSON repos in India app for review cases, consent refs; parity tests vs UK JSON behavior |
| E07 | **DPDPA architecture document + legal review** | Data flow diagram, residency proof, DPO contact, breach runbook; founder/legal sign-off |

### P1 — Core product path

| # | Epic | Acceptance criteria |
|---|---|---|
| E08 | **IndicBERT Hindi NER v0** | Training pipeline repo; 200 gold cases ingested; eval report shows F1 >82%; CI eval on PR |
| E09 | **Azure Speech Hindi streaming** | API wrapper service; 20 test clips transcribed; WER <15% documented |
| E10 | **Extend `intake-generation` for Indic input** | Hindi transcript → SOAP draft (deterministic or LLM); appears in `/intake` UI |
| E11 | **Practo sandbox adapter** | OAuth/API auth working; patient search; FHIR DocumentReference POST succeeds in sandbox |
| E12 | **Medplum Mumbai instance** | Medplum running in ap-south-1 (Cloud or ECS); `pushToMedplum` from India app succeeds |
| E13 | **ABDM FHIR profile validation** | Test suite against NHA examples; zero errors on Encounter, Patient, DocumentReference |
| E14 | **Indian Pharmacopoeia DDI v0** | 100-case test set loaded; critical interactions block finalization; V-IN4 harness ready |
| E15 | **Hindi UI shell** | `/review`, `/intake`, `/cases/[id]` with Hindi labels; language toggle; responsive on tablet |

### P2 — Pilot readiness

| # | Epic | Acceptance criteria |
|---|---|---|
| E16 | **ABHA identity stub** | Patient registration flow with ABHA ID field; validation against NHA sandbox |
| E17 | **Clinician auth (NMC)** | Email/password or OTP auth; role-based access; audit log on login |
| E18 | **Pilot clinic onboarding flow** | Admin can create clinic, assign doctors, configure Practo credentials |
| E19 | **Frozen artifact → CDSCO evidence export** | Accepted case exports JSON/PDF bundle matching dossier template |
| E20 | **HealthPlix adapter spike** | Sandbox connection documented; go/no-go decision recorded |
| E21 | **Deepgram EN medical ASR** | English consultation path works end-to-end for urban clinic pilot |
| E22 | **V-IN validation dashboard** | Internal page tracking V-IN1–6 status, scores, evidence links |
| E23 | **WhatsApp adapter spike** | Meta Business account created; template message sent in test sandbox |
| E24 | **CI/CD pipeline** | GitHub Actions: lint, test, deploy to staging ECS on merge to `main` |
| E25 | **Runbook: synthetic → live transition** | Checklist for first real patient; rollback plan; on-call contacts |

---

## 8. Decision Log

Decisions required from founder before or during Phase 0. Default recommendation in *italics*.

| # | Decision | Options | Recommendation | Deadline |
|---|---|---|---|---|
| D1 | **Medplum: Cloud vs self-hosted ECS** | Medplum Cloud (if ap-south-1 available) vs Docker on ECS | *Medplum Cloud if region available; else ECS Fargate with Helm* — saves 2–3 eng-weeks | M11 W2 |
| D2 | **India app repo location** | New repo under AkshHealth org vs subdirectory | *New repo `akshhealth-india-app`* — clean regulatory boundary | M11 W1 |
| D3 | **BuildCopilot role** | Program mgmt only vs integrated into ops | *Optional — use Linear directly for India epics; BuildCopilot for investor-facing roadmap exports* | M12 |
| D4 | **India Country Head hire timing** | M11 vs M12 vs M13 | *M11* — clinic intros needed before M13 deploy | M11 |
| D5 | **Neon vs RDS Postgres** | Neon ap-south-1 vs AWS RDS | *Neon for speed + serverless; RDS if hospital procurement requires AWS-native* | M11 W2 |
| D6 | **LangGraph hosting** | Extend Akeno l3-l4 vs standalone Python service | *Standalone `india-orchestrator` FastAPI service* — clearer CDSCO software boundary | M12 |
| D7 | **Weaviate: managed vs self-host** | Weaviate Cloud vs ECS | *Defer to M14 — ICMR index not launch-critical; use pgvector interim* | M13 |
| D8 | **Hindi-only launch vs 3-language** | Hi only vs Hi+Ta+Te | *Hindi + English at M13; Ta/Te beta flags* — reduces launch risk | M12 |
| D9 | **Pilot pricing enforcement** | Manual billing vs Stripe India | *Manual invoicing for first 30 clinics* — Stripe integration M17+ | M14 |
| D10 | **UK→India workflow sync process** | Manual cherry-pick vs automated foundation releases | *Foundation package semver; monthly sync meeting* | M11 W3 |
| D11 | **Audio storage retention** | 30 / 90 / 365 days | *90 days default, configurable per clinic consent* — DPDPA data minimization | M12 |
| D12 | **Federated learning framework** | Flower vs custom Akeno orchestrator | *Extend Akeno `l7-federated`* — already scaffolded | M18 |

---

## Appendix A: Validation Gate Reference (V-IN1–6)

| Gate | Method | Success | Target month | Engineering owner |
|---|---|---|---|---|
| V-IN1 | 200-case gold NER test set | Hindi F1 ≥85%, Tamil ≥80%, Telugu ≥82% | M12 (partial), M14 (full) | AI/ML |
| V-IN2 | NHA ABDM compliance suite | Zero profile errors | M13 | Backend |
| V-IN3 | WhatsApp RCT (100 vs 100) | No-show <20% | M15–16 | Backend + Clinical |
| V-IN4 | 100 Indian Pharmacopoeia DDI cases | Zero critical false negatives | M14 | AI/ML |
| V-IN5 | Time-motion (20 doctors) | ≥60% doc time reduction | M15–16 | Product + Clinical |
| V-IN6 | 50 consultations × 6 languages | ≥85% doctor acceptance | M15 | AI/ML + Frontend |

---

## Appendix B: Budget allocation guidance (~$3M total, India engineering slice)

Approximate India technology spend (Months 11–24):

| Category | Est. USD | Notes |
|---|---|---|
| Engineering salaries (6 FTE × 18 mo blended) | $900K–$1.1M | Includes AI/ML |
| AWS Mumbai infra | $100K–$150K | Phase 1 lean; scales with clinics |
| Regulatory (CDSCO, DPDPA, ISO) | $80K–$100K | Per strategy guide Rs. estimates |
| NLP/ASR/API costs (Azure, Deepgram) | $50K–$80K | Usage-based |
| Annotation + clinical validation | $40K–$60K | Gold sets, V-IN studies |
| Medplum + Neon + tooling | $30K–$50K | SaaS licenses |
| Contingency (15%) | $180K–$220K | Practo delays, CDSCO queries |

**Do not over-scope:** Neo4j, Kafka MSK, and federated infrastructure can slip to Phase 2–3. Launch core needs: app, Postgres, Medplum, NLP, one EHR adapter, consent service.

---

*Document maintained in `akshhealth-india-web/docs/`. Update after each phase gate review.*
