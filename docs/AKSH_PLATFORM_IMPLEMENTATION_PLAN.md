# Aksh Health Platform — Implementation Plan

**Classification:** CONFIDENTIAL — Internal Use Only  
**Version:** 1.0  
**Date:** July 2026  
**Source document:** `Aksh_Platform_Interoperability_UX_TechDoc_v1.0.docx`  
**Author:** Engineering planning (founder internal)  
**Cross-reference:** `akshhealth-india-web/docs/INDIA_TECH_BUILD_STRATEGY.md`

---

## Executive overview

The TechDoc defines a **production NHS primary-care platform** (UK Phase 1) with five architectural layers, seven named clinical AI agents, role-scoped dashboards, CIS2-authenticated onboarding, and full interoperability (EMIS/SystmOne → Mirth → Medplum → LangGraph → HITL review queue). **What exists today is a credible synthetic proof** in `akshhealth-uk-eu-platform` (56 routes, review-first workflow, FHIR-shaped exports, human gates) — not the production stack the TechDoc describes.

**Honest baseline (July 2026):**

| Area | TechDoc target | Current reality |
|---|---|---|
| UX surfaces | 5 landing pages + 5 role dashboards + 5-step CIS2 onboarding | UK proof has 1 landing, 3 onboarding personas, 3 dashboard personas; India web has 4 marketing pages |
| Backend intelligence | Medplum + Neo4j + Weaviate + LangGraph on EKS | JSON file persistence; Medplum/FastAPI stubs behind env flags; local docker-compose only |
| Seven agents | Named agents with FHIR outputs and validation gates | Workflow modules (safety, validation, intake) — no LangGraph orchestrator |
| Interoperability | Mirth + Kafka + EMIS/SystmOne live | Placeholder registry; `ehr-connectors` status `planned` |
| Auth | Supabase Auth + Cognito + NHS CIS2 | next-auth credentials demo (2 roles) |
| India (M13+) | ABDM, Practo/HealthPlix, IndicBERT | Phase 0 scaffold in `akshhealth-india-app`; strategy doc complete |

**Sequencing principle (unchanged):** UK validates → India scales. Do not run two full production regulatory tracks on the ~$3M budget.

---

## 1. Document scope summary

### 1.1 Five mandated layers

| Layer | TechDoc mandate | Key deliverables |
|---|---|---|
| **L1 — Marketing & acquisition** | `aksh-health.com` conversion paths | Homepage, `/for-clinicians`, `/for-administrators`, `/pilot`, `/docs`; Navy/Emerald design system; SEO + MedicalOrganization schema |
| **L2 — Identity & onboarding** | Role-aware 5-step flow from `/signup?role=` | GP / Nurse / Pharmacist / Admin / ICS Lead; CIS2 SSO + GMC/NMC/GPhC validation; ODS practice config; agent preferences; sandbox tutorial |
| **L3 — Clinical dashboards** | Post-login role-scoped UIs | `/dashboard/gp`, `/nurse`, `/pharmacist`, `/admin`, `/ics` — three-column GP layout with central HITL review queue |
| **L4 — Backend intelligence** | FHIR R4 + graph + vector + agents | Medplum (EKS), Neo4j 5.x, Weaviate, LangGraph + Claude Sonnet 4, JSL Clinical NLP, Kafka `clinical.events.new` |
| **L5 — Interoperability & compliance** | NHS + India pathways | EMIS/SystmOne via Mirth; DCB0129, DTAC, DSPT, UK GDPR; India M13+ ABDM, DPDPA, Practo/HealthPlix |

### 1.2 Seven clinical AI agents (all HITL-gated)

| Agent | Function | FHIR output | HITL gate |
|---|---|---|---|
| SYNTHESIS | Encounter → SOAP | DocumentReference | GP Accept / Edit / Reject |
| DrASSIST | Diagnosis + SNOMED/ICD-10 | Condition | GP reviews code + confidence |
| GUARDIAN | Drug interaction / allergy | Flag on MedicationRequest | Review queue alert |
| ORACLE | CVD/T2D/frailty risk | RiskAssessment | GP sees score + factors |
| EQUITY | Disparity (IMD, ethnicity) | Observation | Admin monthly review |
| SHIELD | Compliance audit trail | AuditEvent | CSO quarterly sign-off |
| VOICE | Voice → SOAP | DocumentReference | GP listens + approves |

**Non-negotiable:** No agent writes to active FHIR record without human approval. All outputs staged as `status=draft` in review queue.

### 1.3 UX surfaces specified

**Landing (UK):** `/`, `/for-clinicians`, `/for-administrators`, `/pilot`, `/pilot/apply`, `/docs`, `/request-pilot`, `/contact`, `/signup?role=*`

**Onboarding:** 5-step flow with role variants (GP full 5-step; Nurse/Pharmacist 3-step; Admin 4-step; ICS 5-step enterprise)

**Dashboards:** GP (3-column: patient panel | review queue | agent control), Nurse (observations + handover), Pharmacist (medication review + BNF), Admin (integration health + SHIELD), ICS (population aggregates only)

### 1.4 Interoperability & data flow

```
EMIS/SystmOne → Mirth Connect → CSV/HL7 validation → anonymisation → FHIR Bundle → Medplum
                                                                              ↓
                                                                    Kafka clinical.events.new
                                                                              ↓
                                                              LangGraph orchestrator → 7 agents
                                                                              ↓
                                                              HITL staging (draft FHIR) → GP queue
                                                                              ↓
                                                              Accept → final FHIR + SHIELD AuditEvent

Parallel: Medplum → Neo4j graph sync; SYNTHESIS output → Weaviate embeddings
```

### 1.5 Compliance surfaces

| Standard | UK | India (M13+) |
|---|---|---|
| Clinical safety | DCB0129 hazard log + Safety Case M12 | CDSCO Class B (per INDIA_TECH_BUILD_STRATEGY) |
| Procurement | DTAC M9 | — |
| Data governance | NHS DSPT M6, UK GDPR | DPDPA consent + ap-south-1 residency |
| Identity | NHS CIS2 OAuth 2.0 | ABHA / ABDM HIP-HIU |
| Infosec | ISO 27001 target M22 | ISO 27001 prep M15–18 |

### 1.6 Multi-tenancy model

- Practice-level: Supabase schema + RLS (`practice_id`), FHIR scoped to ODS, Neo4j `practice_id` on nodes, Weaviate namespace per practice
- ICS-level: Federated aggregate layer (pseudonymised counts); ICS token issued by CSO; no individual FHIR access

---

## 2. Gap analysis matrix

| TechDoc requirement | UK platform status | India app status | Akeno status | Gap / action |
|---|---|---|---|---|
| **Landing homepage (`/`)** | ✅ `ProductLanding` in UK platform — synthetic-proof positioning, not NHS procurement copy | ✅ India web homepage — ABDM narrative | — | **UK:** Fork landing to separate `aksh-health.com` marketing repo OR extend UK platform public routes with TechDoc copy. **Do not** duplicate India web patterns for UK. |
| **`/for-clinicians`** | ❌ Not built | ✅ `/for-clinicians` (India copy) | — | **UK greenfield** — adapt India marketing component pattern with NHS/VOICE demo content |
| **`/for-administrators`** | ❌ Not built | ❌ (India has `/for-amcs`, `/for-partners`) | — | **UK greenfield** — multi-tenancy + SHIELD preview screenshots |
| **`/pilot` + application form** | ⚠️ Roadmap/pilot pages under `/review/pilot` (internal proof, not public ICS acquisition) | ❌ | — | **UK:** New public `/pilot` route; move internal pilot tooling to `/review/pilot` unchanged |
| **`/docs` portal** | ⚠️ `docs/` folder in repo only — not served as public portal | ⚠️ Strategy docs in `akshhealth-india-web/docs/` | ✅ Architecture docs in `docs/` | **UK:** Deploy docs site (Mintlify or Nextra) from `akshhealth-uk-eu-platform/docs/` + agent API specs |
| **Personalised onboarding (5 roles, CIS2)** | ⚠️ `/onboarding` — 3 personas (clinical reviewer, ops lead, leadership); no CIS2, no 5-step wizard | ❌ No onboarding route | — | **Phase B:** Extend onboarding to 5 NHS roles; CIS2 integration is **greenfield** |
| **GP dashboard (`/dashboard/gp`)** | ⚠️ `/dashboards` — aggregate KPI cards for 3 personas; `/review` + `/cases/[id]` is closer to review queue | ⚠️ `/review` only — Hindi labels partial | — | **Phase A audit:** Map `/review` → GP review queue. **Phase B:** Build 3-column GP layout per TechDoc §5.1 |
| **Nurse dashboard** | ❌ | ❌ | — | **Greenfield** — fork GP patterns; observation entry form |
| **Pharmacist dashboard** | ❌ | ❌ | — | **Greenfield** — GUARDIAN + BNF panel (UK) / Indian Pharmacopoeia (India) |
| **Admin dashboard** | ⚠️ `/review/ops` — ops/remediation, not integration health or SHIELD | ❌ | ⚠️ Akeno web has consent APIs | **Phase B:** New `/dashboard/admin` aggregating ops + integration status + user mgmt |
| **ICS dashboard** | ❌ | ❌ | — | **Greenfield** — aggregate layer only; depends on multi-tenancy + differential privacy |
| **Medplum FHIR (self-hosted EKS)** | ⚠️ `lib/medplum-client.ts` stub; `ENABLE_MEDPLUM_SYNC=false`; root `docker-compose.yml` has local Medplum | ❌ Not wired | — | **Phase D:** Deploy Medplum eu-west-2; enable sync on accepted cases; replace JSON repos gradually |
| **Neo4j knowledge graph** | ❌ Not in UK platform | ❌ | ✅ Docker compose skeleton; docs reference graph | **Phase D:** Sync job Medplum → Neo4j; wire ORACLE/GUARDIAN queries |
| **Weaviate vector store** | ❌ | ❌ | ❌ | **Phase D (deferrable):** Use pgvector interim per INDIA strategy D7; Weaviate M14+ |
| **LangGraph 7-agent orchestrator** | ❌ Deterministic `intake-generation.ts` + `fastapi-synthesis.ts` boundary | ❌ `lib/nlp/india-nlp.ts` stub | ⚠️ `l3-l4-ai-safety` guardrails skeleton | **Phase D greenfield:** `services/agent-orchestrator/` — map existing workflow modules to agent names |
| **John Snow Labs Clinical NLP** | ❌ | ❌ IndicBERT planned | ❌ | **Phase D:** JSL for UK SNOMED; IndicBERT for India (per INDIA strategy) |
| **EMIS Web integration** | ❌ `integration-config.ts` — `ehr-connectors` status `planned` | ❌ | ❌ | **Phase E:** EMIS Partner Programme; Mirth channels |
| **SystmOne integration** | ❌ Same placeholder | ❌ | ❌ | **Phase E:** OAuth 2.0 REST feed via Mirth |
| **Mirth Connect 4.4+** | ❌ | ❌ | ❌ | **Phase E:** On-prem at ICS + nightly extract CronJob |
| **Kafka event bus (MSK)** | ❌ | ❌ | ✅ Redpanda in local docker-compose | **Phase D:** Wire `clinical.events.new` topic; Akeno `l0-l2-ingestion` as consumer |
| **Auth: Supabase + Cognito + CIS2** | ❌ next-auth credentials (2 demo roles) | ❌ No auth | ⚠️ Akeno `identity-consent` — patient consent, not clinician SSO | **Phase B decision required:** Supabase EU vs Cognito vs hybrid; CIS2 OAuth greenfield |
| **SYNTHESIS agent** | ⚠️ `intake-generation.ts` produces SOAP-shaped drafts; not named/labeled as SYNTHESIS | ⚠️ Same pattern planned | — | **Phase D:** Rename surfaced UI + API; add F1 ≥0.88 validation harness |
| **DrASSIST agent** | ⚠️ Condition coding in draft; no confidence % UI | ❌ | — | **Phase D:** SNOMED/ICD-10 panel with confidence; ≥95% gate |
| **GUARDIAN agent** | ⚠️ Safety flags (`-ddi`, `-allergy`) in `human-gates.ts` | ⚠️ Indian Pharmacopoeia DDI planned (V-IN4) | ⚠️ `l3-l4-ai-safety/guardrails.py` | **Phase D:** Real-time BNF/Pharmacopoeia check; pharmacist dashboard |
| **ORACLE agent** | ❌ No risk stratification | ❌ | — | **Phase D greenfield** — needs Neo4j + cohort data |
| **EQUITY agent** | ❌ | ❌ | — | **Phase D greenfield** — IMD quintile overlay; admin monthly view |
| **SHIELD agent** | ⚠️ `governance-pack.ts`, audit in frozen artifacts; not live AuditEvent FHIR | ⚠️ Akeno `audit_events.py` skeleton | ⚠️ Partial | **Phase B:** SHIELD panel on admin dashboard; AuditEvent on every GP action |
| **VOICE agent** | ⚠️ `transcription-config.ts` boundary only; no ASR | ⚠️ Azure Speech stub | ❌ | **Phase D:** ASR integration; WER ≤8% gate |
| **HITL gates (Accept/Edit/Reject)** | ✅ Strong — accept/reject/defer, human gates, frozen artifacts, no auto-write | ⚠️ `human-gates.ts` ported; review UI partial | — | **Phase A:** Document parity — UK proof **already implements core HITL philosophy**. Extend to Edit + agent-type badges |
| **DCB0129 / DTAC / DSPT** | ⚠️ `governance-pack.ts`, hazard rehearsal, roadmap tracker — not live compliance system | ❌ Roadmap language only | ⚠️ `docs/compliance/control-library.md` | **Phase B:** SHIELD dashboard + evidence export; regulatory docs stay CONFIDENTIAL |
| **DPDPA / ABDM (India)** | N/A | ⚠️ Strategy complete; consent SQL stub in Akeno; no HIP/HIU | ⚠️ `identity-consent` service | **Phase C** per INDIA_TECH_BUILD_STRATEGY — do not start until UK M4+ stable |
| **Practo / HealthPlix** | N/A | ⚠️ `practo.ts` interface stub | ❌ | **Phase C/E India** — sandbox M12, live M14 |
| **React Native mobile** | ❌ | ❌ | ❌ | **Defer** — web-first; Expo after GP dashboard stable |
| **Multi-tenancy (Supabase RLS)** | ❌ JSON per-user store | ❌ | ⚠️ Postgres in Akeno | **Phase B:** Postgres + RLS; practice_id on all rows |
| **Redis cache (Upstash EU)** | ❌ | ❌ | — | **Phase B** when Medplum queries begin |
| **Clinical validation gates (§9)** | ⚠️ Benchmark scenarios (7) — different metrics than TechDoc agent gates | ❌ V-IN1–6 defined for India | — | **Phase D:** Agent-specific eval harnesses per TechDoc §9 |

### Gap summary scorecard

| Category | Built (proof-grade) | Partial | Greenfield |
|---|---|---|---|
| Landing & marketing | 1 UK landing | India web (4 pages) | UK `/for-*`, `/pilot`, `/docs` |
| Onboarding | 3-persona wizard | — | CIS2, 5 NHS roles |
| Clinical dashboards | Review queue + case detail | 3-persona dashboard hub | 5 role-specific dashboards |
| HITL / review workflow | **Strong** | Edit flow + agent badges | — |
| FHIR / Medplum | Export mapping + stub | Local docker | EKS production |
| Intelligence layer | Deterministic intake | FastAPI boundary | LangGraph, 7 agents, Neo4j, Weaviate |
| Interoperability | Contract placeholders | Mirth/Kafka local (Akeno) | EMIS/SystmOne/Practo live |
| Auth / tenancy | Demo next-auth | — | Supabase/Cognito/CIS2, RLS |
| Compliance UI | Governance rehearsal | SHIELD concept | Live audit + DSPT evidence |

---

## 3. Phased implementation roadmap

Aligned with TechDoc §10 (UK M1–M12) and INDIA_TECH_BUILD_STRATEGY (M13+). Phases A–E map to engineering epics, not calendar months — calendar alignment in parentheses.

---

### Phase A — Audit & surface alignment (Weeks 1–4) — **Effort: M**

**Goal:** Inventory what UK proof already satisfies; align naming, navigation, and HITL UX with TechDoc without building production backend.

| Epic | Effort | Dependencies | Acceptance criteria |
|---|---|---|---|
| A1. TechDoc ↔ codebase traceability matrix | S | — | Every TechDoc §3–5 requirement mapped to route or gap ticket |
| A2. HITL queue UX alignment | M | — | `/review` shows agent-type badges (SYNTHESIS/GUARDIAN/etc.); Accept/Edit/Reject parity with TechDoc §5.1 |
| A3. Onboarding role expansion (UI only) | M | — | 5 role tiles (GP/Nurse/Pharmacist/Admin/ICS); flows stub CIS2 with "proof mode" banner |
| A4. Dashboard route structure | S | A3 | Routes exist: `/dashboard/gp`, `/nurse`, `/pharmacist`, `/admin`, `/ics` — GP reuses review queue; others placeholder |
| A5. Public landing gap spec | S | — | Wireframes for missing UK pages (/for-clinicians, /for-administrators, /pilot) approved by founder |
| A6. `@akshhealth/foundation` semver release | S | E01 done | UK + India import foundation v0.2.0; CI green |
| A7. Agent naming in UI + docs | S | — | Internal modules labeled per TechDoc agent names in review queue and governance pack |

**Phase A exit:** Founder can walk TechDoc §5.1 GP dashboard flow in synthetic proof; gap list is ticketed; no production claims added.

---

### Phase B — Complete UK UX & governance surfaces (Weeks 5–12) — **Effort: L**

**Goal:** TechDoc UK marketing + onboarding + role dashboards + admin/SHIELD + auth/tenancy foundation. Still synthetic-capable; CIS2 may use sandbox.

| Epic | Effort | Dependencies | Acceptance criteria |
|---|---|---|---|
| B1. UK marketing site pages | L | A5 | `/for-clinicians`, `/for-administrators`, `/pilot`, `/pilot/apply` live on Vercel; MedicalOrganization schema |
| B2. Public `/docs` portal v1 | M | — | Architecture overview, FHIR resource list, HITL spec, integration placeholders; DTAC evidence links (internal) |
| B3. CIS2 OAuth integration (sandbox) | L | Founder auth decision | GP/Nurse/Pharmacist login via CIS2 test; GMC/NMC validation stubbed against Spine test |
| B4. Supabase Auth + practice RLS | L | B3 decision | `practice_id` on all rows; demo practice isolated; admin cannot see clinical FHIR |
| B5. 5-step onboarding wizard | M | B3, B4 | Full wizard per TechDoc §4; progress persisted; D7 completion metric in Grafana |
| B6. GP dashboard 3-column layout | L | A2, A4 | <2s P95 load on synthetic data; patient panel + review queue + agent control panel |
| B7. Nurse + Pharmacist dashboards v1 | M | B6 patterns | Observation entry (Nurse); medication queue + interaction checker UI (Pharmacist) — synthetic data |
| B8. Admin dashboard v1 | M | — | Integration status mock, user invite, extraction job monitor UI, SHIELD panel (governance-pack data) |
| B9. ICS dashboard v1 | M | B4 | Aggregate metrics only; no patient-level drill-down; equity heatmap mock |
| B10. SHIELD AuditEvent on GP actions | M | B6 | Every Accept/Edit/Reject creates audit record; exportable for DCB0129 rehearsal |
| B11. Postgres migration (replace JSON) | L | B4 | Repository parity tests pass against Postgres; JSON fallback flag for demos |
| B12. Redis cache layer | S | B11 | 30s TTL on dashboard FHIR reads |

**Phase B exit:** External NHS stakeholder can complete onboarding → GP dashboard → review queue → audit trail in staging; marketing site matches TechDoc §3.

---

### Phase C — India-specific fork (Months 11–15, overlaps UK M7+) — **Effort: L**

**Goal:** India production path per INDIA_TECH_BUILD_STRATEGY without duplicating UK work.

| Epic | Effort | Dependencies | Acceptance criteria |
|---|---|---|---|
| C1. Mumbai infra (ap-south-1) | L | DPDPA sign-off | VPC, ECS, S3, Secrets Manager; no PHI until audit |
| C2. India app production fork | M | Phase A foundation | `akshhealth-india-app` ports UK workflow; Postgres repos; NHS strings removed |
| C3. Hindi-first GP dashboard | M | C2, B6 patterns | `/intake`, `/review`, `/cases/[id]` production-grade; V-IN6 partial |
| C4. ABDM FHIR profiles + ABHA | L | C1, Medplum Mumbai | V-IN2 zero profile errors; HIP registration initiated |
| C5. DPDPA consent (Akeno extension) | M | C1 | Purpose, withdrawal, audit; legal sign-off |
| C6. IndicBERT + Azure Speech | L | — | V-IN1 Hindi F1 >82%; WER <15% |
| C7. Practo sandbox adapter | M | Partnership | FHIR DocumentReference POST succeeds in sandbox |
| C8. Indian Pharmacopoeia GUARDIAN | M | C2 | V-IN4 zero critical false negatives on 100 cases |
| C9. India marketing alignment | S | — | `akshhealth-india-web` links to app; no certification overclaim |

**Phase C exit:** 5 pilot clinics (M14–15); live patients with consent; UK platform unchanged.

*Cross-reference: INDIA_TECH_BUILD_STRATEGY §4 Phases 0–1 for detailed India epics E01–E25.*

---

### Phase D — Backend intelligence layer (Months 4–9 UK) — **Effort: XL**

**Goal:** Medplum production, event bus, agent orchestration, graph/vector — the TechDoc §6 stack.

| Epic | Effort | Dependencies | Acceptance criteria |
|---|---|---|---|
| D1. Medplum on EKS (eu-west-2) | L | AWS account, founder decision | HA deploy; <200ms P95 FHIR read; accepted cases sync from app |
| D2. Kafka MSK + `clinical.events.new` | M | D1 | New Encounter triggers orchestrator consumer |
| D3. LangGraph orchestrator service | XL | D2 | Routes to agents per TechDoc §6.4; parallel execution; draft staging |
| D4. SYNTHESIS + VOICE agents (production) | L | D3, ASR vendor | SYNTHESIS F1 ≥0.88; VOICE WER ≤8% on validation set |
| D5. DrASSIST + GUARDIAN agents | L | D3, JSL or rules | DrASSIST ≥95% coding accuracy; GUARDIAN ≥0.98 sensitivity |
| D6. ORACLE + EQUITY agents | L | D7 Neo4j | ORACLE AUC ≥0.80; EQUITY precision ≥0.80 |
| D7. Neo4j sync from Medplum | M | D1 | Graph queries <200ms P95; ORACLE/GUARDIAN consume graph |
| D8. Weaviate (or pgvector interim) | M | D4 | Similar encounters panel in GP review queue |
| D9. SHIELD agent automation | M | D3, B10 | 100% audit completeness gate (TechDoc §9) |
| D10. Nightly extraction job (synthetic → real) | L | Phase E Mirth | CronJob <5 min for 5k patients; CloudWatch metrics |
| D11. Agent validation harness | M | D4–D9 | CI runs agent gates; blocks promote to pilot without pass |

**Phase D exit:** End-to-end synthetic encounter → Kafka → agents → HITL queue → Medplum final write in staging.

---

### Phase E — Production interoperability connectors (Months 6–12 UK) — **Effort: XL**

**Goal:** Live EMIS/SystmOne; Mirth at ICS; India Practo/HealthPlix write-back.

| Epic | Effort | Dependencies | Acceptance criteria |
|---|---|---|---|
| E1. Mirth Connect deployment playbook | M | ICS partnership | On-prem install guide; channel templates for EMIS CSV + SystmOne REST |
| E2. EMIS Web Partner Programme integration | XL | E1, EMIS approval | Demographics + encounters ingest; Read → SNOMED map ≥93% |
| E3. SystmOne OAuth feed | L | E1 | Medication + consultation sync |
| E4. Anonymisation pipeline | M | E2/E3 | KMS encryption; NHS# hashed; ML training set zero PII |
| E5. IntelliProve SDK (M9) | M | Vendor contract | FHIR Observation ingest |
| E6. Practo production write-back | L | C7, CDSCO path | >95% pilot write-back success (India) |
| E7. HealthPlix adapter | M | E6 pattern | Second EHR adapter live |
| E8. ABDM HIP/HIU gateway | L | C4 | Production health information exchange |
| E9. ICS pilot cutover (3 sites) | XL | B*, D*, E1–E3 | 150 clinicians, 5,000 patients; DCB0129 submission M12 |

**Phase E exit:** TechDoc §10 M10–M12 pilot criteria met.

---

## 4. Repository strategy

**Principle:** UK platform owns clinical proof → production UK. India forks adapters only. Shared logic lives in foundation package. Backend services in Akeno. **Do not duplicate UK dashboard work in India app** — port patterns via `@akshhealth/foundation`.

| Repository | Owns | Does NOT own |
|---|---|---|
| **`akshhealth-uk-eu-platform`** | UK synthetic proof → UK production app; landing (or split later), onboarding, 5 dashboards, review queue, FHIR export, UK compliance UI, EMIS/Mirth integration client | India ABDM, Hindi UI, Practo, DPDPA |
| **`akshhealth-india-web`** | India marketing only (`akshhealth.in`); GTM, waitlist, strategy docs | Clinical logic, PHI, dashboards |
| **`akshhealth-india-app`** | India production clinical app; Hindi UI; ABDM profiles; Practo/HealthPlix adapters; Mumbai deploy | UK NHS routes, CIS2, EMIS |
| **`akshhealth-shared-uk-india-foundation`** | `@akshhealth/foundation` — types, workflow helpers, human gates, validation, synthetic fixtures, shared tests | Country-specific regulatory copy, EHR adapters |
| **`akeno_health_platform`** | Microservices: identity-consent, ingestion (Kafka), AI safety guardrails, federated orchestrator; Neo4j/Kafka local stack | Next.js clinical UI (stays in uk/india app repos) |
| **`akshhealth 2031/docker-compose.yml`** | Local Medplum + Postgres + Redis for dev | Production EKS (move to `infra/` per repo) |
| **New: `services/agent-orchestrator/`** (recommend inside Akeno or UK platform `services/`) | LangGraph 7-agent pipeline, Kafka consumer | UI |

### Suggested new repositories (only if needed)

| Repo | When |
|---|---|
| `akshhealth-uk-web` | If UK marketing must separate from clinical app for DTAC boundary — **defer until Phase B1** |
| `akshhealth-infra-uk` | Terraform/CDK for eu-west-2 EKS — **Phase D1** |
| `akshhealth-infra-india` | ap-south-1 — **Phase C1** (may live in `akshhealth-india-app/infra`) |

### Sync process

- Foundation package: semver release monthly; UK upstream, India consumes
- Workflow changes: fix in UK → extract to foundation → India cherry-pick
- Agent orchestrator: single deployment UK first; India fork for IndicBERT/Pharmacopoeia rules only

---

## 5. 90-day sprint backlog (prioritized epics)

**Window:** July–September 2026 (UK M2–M3 equivalent). 20 tickets mapped to TechDoc sections.

| # | Epic | TechDoc § | Repo | Effort | Acceptance criteria |
|---|---|---|---|---|---|
| **P0 — Foundation** |
| T01 | TechDoc traceability matrix (living doc) | All | `docs/` | S | 100% §3–7 requirements mapped to ticket IDs |
| T02 | Foundation package v0.2.0 release | — | `shared-foundation` | S | UK + India CI green on shared types |
| T03 | Agent naming in review queue UI | §2.2, §5.1 | `uk-eu-platform` | S | Queue items show SYNTHESIS/GUARDIAN/etc. badges |
| T04 | Accept/Edit/Reject HITL (add Edit) | §5.1, §6.4 | `uk-eu-platform` | M | Edit opens inline SOAP editor; audit captures diff |
| T05 | SHIELD audit on every reviewer action | §2.2, §6.4 | `uk-eu-platform` | M | Accept/Edit/Reject/Defer → immutable audit entry exportable JSON |
| **P0 — UK surfaces** |
| T06 | `/for-clinicians` marketing page | §3.2 | `uk-eu-platform` | M | VOICE demo placeholder, workflow timeline, CTA → `/signup?role=clinician` |
| T07 | `/for-administrators` marketing page | §3.3 | `uk-eu-platform` | M | Multi-tenancy explainer, integration diagram, DSPT table |
| T08 | `/pilot` + `/pilot/apply` | §3.4 | `uk-eu-platform` | M | Application form stores to DB/email; ICS lead fields |
| T09 | 5-role onboarding wizard (UI) | §4 | `uk-eu-platform` | L | 5 role tiles; 5-step progress; CIS2 placeholder with proof banner |
| T10 | Dashboard route scaffold (5 roles) | §5 | `uk-eu-platform` | M | Routes live; GP populated from review queue; others scaffolded |
| **P1 — GP dashboard** |
| T11 | GP 3-column layout v1 | §5.1 | `uk-eu-platform` | L | Patient panel + review queue + agent control panel on synthetic data |
| T12 | Agent control panel (VOICE/SYNTHESIS/DrASSIST/GUARDIAN/ORACLE) | §5.1 | `uk-eu-platform` | M | Panel shows agent status cards; links to queue filtered by agent |
| T13 | Evidence trail (FHIR resources used) | §5.1 | `uk-eu-platform` | M | Review item expandable: lists source FHIR refs from draft metadata |
| **P1 — Backend prep** |
| T14 | Postgres repository adapter | §7 | `uk-eu-platform` | L | `repository-parity.test.ts` passes on Postgres; feature flag `USE_POSTGRES` |
| T15 | Medplum staging deploy (eu-west-2 or local EKS kind) | §2.1, §6.1 | `infra` + uk | L | `ENABLE_MEDPLUM_SYNC=true` writes accepted bundle to staging Medplum |
| T16 | Kafka topic + event publisher stub | §6.4 | `akeno` l0-l2 | M | Case acceptance publishes `clinical.events.new` JSON; consumer logs only |
| T17 | LangGraph orchestrator spike | §6.4 | new service | L | Single Encounter in → SYNTHESIS draft out → draft status in queue |
| **P1 — Docs & compliance** |
| T18 | Public `/docs` v1 (Nextra) | §3.5 | `uk-eu-platform` | M | Getting started, FHIR resources, HITL spec, changelog |
| T19 | Clinical validation gate dashboard (internal) | §9 | `uk-eu-platform` | M | `/review/agent-gates` shows pass/fail per agent metric vs TechDoc thresholds |
| T20 | Admin SHIELD compliance panel | §5.4 | `uk-eu-platform` | M | DCB0129 hazard status, open tickets, next review date from governance-pack |
| **P2 — India parallel (non-blocking)** |
| T21 | India Hindi review queue parity | §5.1 (India) | `india-app` | M | T03/T04 patterns ported; Hindi labels |
| T22 | Practo sandbox connection | §10 M13 | `india-app` | M | Real sandbox credentials; one successful DocumentReference POST |
| T23 | DPDPA consent API extension | INDIA §4 | `akeno` identity-consent | M | Grant/withdraw endpoints; audit log; unit tests |
| T24 | AWS ap-south-1 IaC skeleton | INDIA §3 | `india-app/infra` | M | VPC + ECS + S3 provisioned empty |
| T25 | `@akshhealth/foundation` India workflow regression | — | `shared-foundation` | S | India-specific synthetic cases in test suite |

---

## 6. Founder / architecture decisions needed

Decisions **block** downstream work if unresolved. Recommended default in *italics*.

| # | Decision | Options | Recommendation | Blocks | Deadline |
|---|---|---|---|---|---|
| **D-UK-01** | UK marketing: same repo vs `akshhealth-uk-web` | Monolith vs split | *Stay in `uk-eu-platform` until Phase B1 complete* — split only for DTAC boundary | T06–T08 | Aug 2026 |
| **D-UK-02** | Clinician auth provider | Supabase Auth EU / Cognito / next-auth → Supabase migration | *Supabase Auth EU* for RLS + practice tenancy; Cognito if enterprise SSO required later | B3, B4 | Aug 2026 |
| **D-UK-03** | NHS CIS2 integration timing | Sandbox now vs post-Postgres | *CIS2 sandbox in Phase B* — keep demo credentials for investor demos | B3, B5 | Sep 2026 |
| **D-UK-04** | Medplum hosting | Self-hosted EKS / Medplum Cloud eu-west-2 | *Medplum Cloud if EU region available* — saves 2–3 eng-weeks | D1, T15 | Sep 2026 |
| **D-UK-05** | Agent orchestration home | Akeno `l3-l4` extend vs standalone `agent-orchestrator` | *Standalone Python service* — clearer CDSCO/SaMD boundary for India too | D3, T17 | Oct 2026 |
| **D-UK-06** | Vector store | Weaviate EKS / pgvector interim | *pgvector in Postgres for Phase D* — Weaviate M14+ | D8 | Oct 2026 |
| **D-UK-07** | JSON → Postgres cutover | Big bang vs feature flag | *Feature flag `USE_POSTGRES`* — JSON fallback for demos until M6 | B11, T14 | Sep 2026 |
| **D-UK-08** | EMIS partnership priority | EMIS first vs SystmOne first | *EMIS Web Partner Programme first* per TechDoc §6.1 | E2 | Jan 2027 |
| **D-UK-09** | Mirth hosting | Aksh-hosted vs ICS on-prem | *ICS on-prem Mirth* per TechDoc — Aksh provides channel templates | E1 | Feb 2027 |
| **D-UK-10** | Mobile app (Expo) | M6 vs post-pilot | *Defer to post-M12* — web-first GP dashboard | — | 2027 |
| **D-IN-01** | India app auth | NMC OTP / ABHA-linked / email | *Email + NMC verification* for M13 pilots | C2 | Nov 2026 |
| **D-IN-02** | Medplum Mumbai | Cloud vs ECS | *Per INDIA strategy D1* | C4 | Nov 2026 |
| **D-IN-03** | Hindi-only vs 3-language launch | Hi / Hi+Ta+Te | *Hindi + English M13; Ta/Te beta flags* | C3 | Dec 2026 |
| **D-IN-04** | LangGraph India fork | Shared orchestrator vs India-specific | *Shared orchestrator; India tool nodes for IndicBERT/Pharmacopoeia* | C6, C8 | Jan 2027 |
| **D-ORG-01** | CSO appointment | Hire vs interim | *Required before DCB0129 Safety Case draft (M6)* | B10, D9 | Sep 2026 |
| **D-ORG-02** | ICS pilot site selection | 3 ICS commitments | *Required before E9* | E9 | Apr 2027 |

---

## 7. What NOT to build yet

Scope boundaries to protect the ~$3M budget and regulatory credibility.

| Do NOT build | Why | Build instead |
|---|---|---|
| **Production India PHI before DPDPA audit** | Legal/reputational halt risk | Synthetic demos on `india-web` + local India app |
| **Full Weaviate + Neo4j + Kafka MSK before Medplum live** | Infra cost without clinical data | Medplum + Postgres first; graph/vector when encounters flow |
| **All 7 agents at production quality simultaneously** | Validation cost; DCB0129 gates are per-agent | SYNTHESIS + GUARDIAN first; ORACLE/EQUITY later |
| **React Native mobile app** | TechDoc lists it; web GP dashboard not stable | Responsive web; Expo post-pilot |
| **ICS federated dashboard with real cross-practice data** | Needs multi-tenancy + DP + legal agreements | Mock aggregate dashboard (Phase B9) |
| **IntelliProve integration** | TechDoc M9 — premature before EMIS ingest | Placeholder Observation type in FHIR mapping |
| **ISO 27001 certification work** | Target M22 | Control library mapping only (Akeno docs) |
| **Federated learning (L7)** | India M19–24 per strategy | Keep Akeno orchestrator skeleton dormant |
| **WhatsApp / Vapi engagement** | India M14+ | Not UK Phase 1 |
| **G-Cloud listing / billing automation** | Post-pilot procurement | Manual invoicing; `/pilot` lead capture only |
| **Autonomous agent write-back** | Violates core HITL principle | Always stage → review queue → explicit Accept |
| **Duplicate UK review workflow in India from scratch** | Wastes budget | Fork via `@akshhealth/foundation` |
| **Second full regulatory track (UK DCB0129 + India CDSCO) in parallel** | Budget exhaustion | UK RCT feeds India dossier (INDIA strategy rule) |
| **NHS certification claims on marketing** | DTAC/MHRA not awarded | "Pending" / "aligned" language only (match `proofNotice` pattern) |
| **Mirth + EMIS before synthetic agent pipeline works** | Integration without intelligence is empty | Phase D before Phase E |
| **Supabase + Cognito dual auth** | Complexity without ICS pilot need | Pick one (D-UK-02) |

---

## Appendix A — What UK platform already implements (reuse, don't rebuild)

These are **production-quality proof patterns** to extend, not replace:

| TechDoc concept | UK implementation | Path |
|---|---|---|
| HITL review queue | `/review`, `/cases/[id]` | Add agent badges + Edit flow (T03, T04) |
| Human gates | `lib/human-gates.ts` | Map to GUARDIAN/ORACLE gates |
| FHIR-shaped drafts | `lib/export-mapping.ts`, `lib/types.ts` | Enable Medplum push (T15) |
| Frozen evidence artifacts | `lib/workflow/finalization.ts` | SHIELD AuditEvent wrapper (T05) |
| Role-based surfaces | `/onboarding`, `/dashboards` | Expand to 5 NHS roles (T09, T10) |
| Governance / DCB0129 rehearsal | `/review/governance-pack` | Wire to admin SHIELD panel (T20) |
| Safety flags / GUARDIAN-like checks | `lib/workflow/safety.ts` | Connect to BNF dataset (Phase D) |
| Integration boundaries | `lib/integration-config.ts` | Implement EMIS adapter behind same registry |
| Benchmark / validation gates | `/review/benchmarks` | Align metrics to TechDoc §9 (T19) |
| 56-route product surface | Full App Router tree | Audit in Phase A1 |

---

## Appendix B — India cross-reference map

| TechDoc mention (M13+) | INDIA_TECH_BUILD_STRATEGY section | India repo |
|---|---|---|
| ABDM-native clinics | §1, §3 L4 | `india-app`, Akeno consent |
| Practo/HealthPlix | §3 L3, §4 Phase 1 | `india-app/lib/integrations/` |
| IndicBERT | §4 Phase 0, V-IN1 | `india-app/lib/nlp/` |
| DPDPA | §4 Phase 0, §6 risk #1 | Akeno `identity-consent` |
| Hindi UI | §4 Phase 1, E15 | `india-app/lib/i18n/` |
| CDSCO Class B | §4 Phase 2 | Evidence export from frozen artifacts |
| 90-day backlog | §7 E01–E25 | T21–T25 align with E04, E11, E03, E15 |

---

## Appendix C — TechDoc milestone alignment

| TechDoc milestone | This plan phase | Key tickets |
|---|---|---|
| M1: EKS, Medplum, SYNTHESIS baseline | Phase D1, D4, T15, T17 | |
| M2–M3: 7 agents, FHIR complete, DTAC pre-sub | Phase D, T19, T18 | |
| M4–M6: EMIS, SystmOne, Safety Case | Phase E1–E3 | |
| M7–M9: IntelliProve, SHIELD live, ICS pre-qual | Phase B10, D9, E5 | |
| M10–M12: ICS pilot | Phase E9 | |
| M13+: India | Phase C | T21–T25 |

---

*Next review: October 2026 (pre-pilot), or on any material architecture change. Approved by CTO + CSO before external distribution.*
