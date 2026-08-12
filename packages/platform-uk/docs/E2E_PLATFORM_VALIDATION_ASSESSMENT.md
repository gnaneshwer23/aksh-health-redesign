# Aksh Health — End-to-End Platform Validation Assessment (Stage 1)

**Status:** Stage 1 complete — **inspect only**. No broad code changes authorised by this document.  
**Date:** 2026-08-12  
**Package:** `packages/platform-uk`  
**Branch:** `main`  
**Authoritative architecture:** `docs/AKSH_FINAL_ARCHITECTURE_SPEC.md`  
**Related:** `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md`, `docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md`, `docs/PHASED_BUILD_PLAN_{B,C,D,E}.md`, `docs/BUILT_VS_REMAINING_AUDIT.md`

**Hard invariants (unchanged):** HITL mandatory · `liveEmis:false` · `autoRetrain:false` · synthetic-only demo data · no fake MHRA/DCB/CIS2 claims · keep all 12 named agents · deterministic calculations remain tools/services.

---

## 1. Executive verdict (before any new E2E build)

| Question | Answer today |
| --- | --- |
| Does a polished **demo / Track A** HITL loop exist? | **Yes** — CONDUCTOR → agents → Accept/Edit/Reject → SHIELD → learning events |
| Does a **100-patient + 100-user** synthetic cohort exist? | **Yes** — `seed:demo-cohort` / `lib/mock-data/demo-cohort-generator.ts` |
| Does the full requested ecosystem (≥50 doctors, 10 labs, 10 pharmacies, dietitians, CSOs as first-class orgs) exist? | **No** — 8 `UserRole`s only; labs/pharmacies are not stakeholder systems |
| Does versioned **Patient State** exist? | **Partial** — `aksh.patient_state_facts` + `lib/patient-state/*` (C1+); not yet full longitudinal engine for all modalities |
| Does CONNECT→…→LEARN close for diabetes? | **Partial** — ingest + signals + decision escalation + coaching Accept→learning (C5/C6/D*); not full lab/pharmacy multi-stakeholder journeys |
| Ready for controlled real-world clinical pilot? | **NO** — Track B remains NO-GO by design |
| Ready for **internal E2E expansion** of synthetic ecosystem tests? | **YES** — strong test harness exists; gaps are data model + stakeholder surfaces |

**Recommended readiness label after Stage 1:** `READY FOR INTERNAL TESTING` of expanded synthetic E2E infrastructure — **not** `READY FOR CONTROLLED PILOT`.

---

## 2. Current architecture discovered

### 2.1 Runtime stack

| Layer | Reality |
| --- | --- |
| Frontend | Next.js 14 App Router, React 18, Tailwind 3.4, role dashboards under `app/dashboard/*` |
| Auth | NextAuth (`lib/auth*`), bcrypt users in Neon `aksh.users` / `aksh.profiles` |
| DB | **Neon Postgres** (`aksh` schema) — **not Supabase** |
| Graph | Neo4j Aura with honest mock-fallback |
| AI | Vercel AI Gateway (flag-gated LLM agents) + deterministic fallbacks |
| Orchestration | Deterministic CONDUCTOR (`lib/clinical-spine/orchestrate.ts`) |
| Decision | Named module `lib/decision/` (C2) wrapping safety-route + queue-decision |
| Disease modules | Diabetes (wired behind `ENABLE_DIABETES_MODULE`); Heart (E5 types-only stub) |
| Interop | FHIR staging, Medplum, EMIS partner sandbox — staged/`liveEmis:false` |
| Hosting | Vercel production → https://akshhealth.com |

### 2.2 Frozen loop vs implementation

```
CONNECT → UNDERSTAND → DETECT → REASON → PREDICT → RECOMMEND → DECIDE → ACT → MONITOR → LEARN
```

| Stage | Status | Primary code |
| --- | --- | --- |
| CONNECT | Partial | precision-health ingest, diabetes glucose/HbA1c POST, FHIR staging, check-in |
| UNDERSTAND | Partial | Patient State facts, timeline, mock patients |
| DETECT | Partial | Diabetes rules, twin simulation (rules), risk-state — not a unified Change Detection Engine |
| REASON | Partial | NEXUS / SYNTHESIS / GUARDIAN (LLM or deterministic) |
| PREDICT | Partial | HORIZON (ORACLE id) risk |
| RECOMMEND | Partial | PATHWAY, coaching drafts, intervention draft adapters (D3) |
| DECIDE | Exists (module) | `lib/decision` + HITL Accept/Edit/Reject + HumanGateId |
| ACT | Partial | Stage/sim write-back only; nurse escalation tasks; no real lab/pharmacy actors |
| MONITOR | Partial | follow-up / outcomes capture optional |
| LEARN | Strong | `aksh.learning_events`, G-ML gates, `autoRetrain:false` |

---

## 3. Existing roles

### 3.1 Implemented `UserRole` (`lib/onboarding/roles.ts`)

| Role | Dashboard | Approx demo-cohort users |
| --- | --- | --- |
| `gp` | `/dashboard/gp` | 20 |
| `nurse` | `/dashboard/nurse` | 15 |
| `clinical-pharmacist` | `/dashboard/pharmacist` | 12 |
| `practice-manager` | `/dashboard/admin` | 12 |
| `ics-lead` | `/dashboard/ics` | 10 |
| `hospital-executive` | `/dashboard/hospital` | 10 |
| `patient` | `/dashboard/patient` | 15 |
| `researcher` | `/dashboard/researcher` | 6 |

**AppRole** (`lib/permission-matrix.ts`): `clinical_reviewer` | `operations_lead` | `patient` | `researcher` | `restricted`  
`productionRbacEnforced: false` (honest).

### 3.2 Not implemented as first-class roles (requested by E2E brief)

Laboratories, Pharmacies (as orgs), Dietitians, Diabetes Specialists (as distinct from GP), Clinical Safety Officers, Care Coordinators (folded into nurse), ≥50 specialty doctors across orgs.

These must be **designed as synthetic extensions** — either new roles or organisation-scoped personas — without inventing live NHS prescribing.

---

## 4. Existing agents (authoritative names)

From `lib/agents.ts` `AGENT_DIRECTORY` (all `keepStatus: "keep"`):

| Agent | Kind | Layer(s) | Live |
| --- | --- | --- | --- |
| CANVAS | intelligence_llm | intelligence, patient_state | yes |
| SYNTHESIS | intelligence_llm | intelligence | yes |
| BRIDGE | data_interop | data_interop | yes |
| NEXUS | intelligence_llm | intelligence | yes |
| GUARDIAN | safety_governance | safety_governance, intelligence | yes |
| PRISM | intelligence_llm | intelligence | **no** (Phase 2) |
| HORIZON (id ORACLE) | intelligence_llm | intelligence | yes |
| PATHWAY (id REFERRAL) | intervention | intervention | yes |
| COMPASS (id EQUITY) | intelligence_llm | decision, intervention | yes |
| ATLAS | intelligence_llm | intelligence | **no** (Phase 2) |
| SHIELD | safety_governance | safety_governance | yes |
| CONDUCTOR | orchestration | intelligence, decision | yes |

Sub-capabilities (not peer directory entries): VOICE, DrASSIST, VOICE CARE.  
**Tools (not agents):** diabetes 9 signal builders under `lib/disease-modules/diabetes/*`.

---

## 5. Existing database models (Neon `aksh`)

| Table / area | Purpose | Domain |
| --- | --- | --- |
| `users`, `profiles` | Auth + role | Safety/Governance |
| `onboarding_progress` | Onboarding | Experience |
| `review_cases` | Case JSON per scope | Decision / Intervention |
| `practices` | Synthetic practices | Data |
| `consent_grants` | Consent | Consent |
| `shield_audit_events` | Hash-chain audit | Safety |
| `learning_events` (+ `scope_key`) | Outcomes / learning | Learning |
| `fhir_staging_bundles` | Staged FHIR | Data/Interop |
| `patient_state_facts` | Append-only facts | Patient State |
| tokens / pilot_applications | Auth / ops | Governance |

**Missing for full E2E brief:** lab_orders, lab_results as stakeholder workflows, pharmacy_dispenses, care_team membership tables, organisation-level labs/pharmacies, recommendation lifecycle table, intervention lifecycle table (today partly encoded in review-case JSON + learning events).

---

## 6. Existing APIs (representative)

| Area | Routes |
| --- | --- |
| Auth | `/api/auth/*` (NextAuth, signup, verify, reset) |
| Review / HITL | `/api/review-cases`, clinical-spine aggregates/outcomes/partner-gates/shield-audit-retry |
| Agents | `/api/agents/{synthesis,guardian,oracle,horizon,nexus,pathway,compass,equity,referral,dr-assist,…}` |
| Patients | `/api/patients/[id]/state`, `check-in`, `diabetes/{glucose,hba1c}`, `diabetes-coaching` |
| Precision health | ingest, modalities, twin, whole-loop, connectors |
| Neo4j | health, patient, guardian, ics-population |
| Research | evaluation, federated |
| Learning | `/api/learning/events` |
| System | integration-contract, command-centre, evidence |

---

## 7. Existing dashboards / routes

`/dashboard/{gp,nurse,pharmacist,admin,patient,ics,hospital,researcher}` (+ regional)  
Review workspace: `/review`, `/cases/[id]`  
Marketing/demo surfaces under `app/` (for-*, demo/script, etc.)

**Disjoint identity (known):** GP patient roster (`P00x`) vs review-case `patientLabel` — deep unification still blocked (B7 finding).

---

## 8. Existing FHIR / interop capabilities

| Capability | Status |
| --- | --- |
| FHIR-shaped export / staging bundles | Exists (staged) |
| Medplum | Partial (client; secrets may be invalid) |
| EMIS partner sandbox | Scaffold; `liveEmis:false` |
| Simulated EHR write-back | Test double only |
| Lab/Pharmacy FHIR actors | **Missing** as workflows |
| Terminology server (live SNOMED) | **Missing** — DrASSIST suggestions only |

---

## 9. Existing test framework

| Layer | What exists |
| --- | --- |
| Unit / clinical-proof | Large `tests/*` chain via `npm run test:clinical-proof` |
| Workflow / API contracts | `npm run test:workflow` |
| Playwright E2E | `e2e/*` + `test:e2e:clinical-proof` |
| Role smokes | `smoke:{gp,nurse,pharmacist,admin,patient,ics,hospital,researcher}` |
| Agent eval | `eval:agents` |
| Demo cohort | `seed:demo-cohort`, `test:demo-cohort` |
| Perf smoke | `smoke:perf` + clinical-proof perf SLOs |
| A11y | `e2e/accessibility.spec.ts` (limited routes) |

**Missing vs brief:** `seed:e2e` / `cleanup:e2e` / `report:e2e` dedicated pipeline; golden-scenario pack of ~20; `/admin/e2e` dashboard; lab/pharmacy E2E; 500–5000 patient scale suite; systematic prompt-injection suite.

---

## 10. Component map (abbrev.)

| Existing component | Current function | Architecture domain | Status | Dependencies | Testing required |
| --- | --- | --- | --- | --- | --- |
| CONDUCTOR / `orchestrate.ts` | Deterministic multi-agent run | Intelligence + Decision | Exists | Agents, Decision, diabetes flag | Golden orchestration |
| `lib/decision` | Route/priority/escalation | Decision | Exists | safety-route, diabetes contribution | decision-module tests |
| `lib/patient-state` | Append-only facts | Patient State | Partial | Neon 013 | timeline + ingest tests |
| Diabetes module | Signals + coaching tools | Intelligence (tools) | Partial | ENABLE_DIABETES_MODULE | clinical-spine-diabetes + glucose v1.1 |
| Heart module | Types stub | Intelligence (future) | Stub | none | heart-module-stub |
| SHIELD audit | Hash-chain events | Safety | Exists (fail-visible B1) | Neon | clinical-proof-shield |
| Learning / outcomes-loop | Care-action + outcome events | Learning | Strong | Neon scope_key | phase-e + diabetes-learning |
| HITL queue-decision | Accept/Edit/Reject | Decision | Exists | SHIELD, learning | hitl tests |
| GUARDIAN | Safety flags | Safety + Intelligence | Exists | LLM flag | guardian tests |
| HORIZON | Risk | Intelligence | Exists | LLM flag | oracle/horizon |
| COMPASS | Population equity drafts | Intelligence / Decision | Partial | ICS fixtures honesty | population-honesty |
| BRIDGE / FHIR staging | Interop | Data/Interop | Staged | Medplum/EMIS flags | fhir + medplum + emis tests |
| Permission matrix | RBAC | Safety | Partial | AppRole | rbac + system-routes |
| Demo cohort generator | 100 pts / 100 users | Data | Exists | Neon/Neo4j optional | demo-cohort-generator |
| Precision-health twin | Rules what-if | Intelligence (sim) | Partial `physiologicalTwin:false` | — | twin tests |
| Lab/Pharmacy orgs | — | Intervention | **Missing** | — | Design + seed + journeys |
| Change Detection Engine | Unified | Intelligence | **Missing** (scattered rules) | Patient State | New |
| Recommendation lifecycle DB | — | Decision | **Missing** (case JSON) | — | New |
| `/admin/e2e` | — | Observability | **Missing** | — | New (dev-only) |

---

## 11. Missing infrastructure (for the requested E2E brief)

1. **E2E environment contract** — `E2E_TEST_MODE` / `SYNTHETIC_DATA` + `batchId` / `scenarioId` / `source: AKSH_E2E_TEST` on all generated rows.  
2. **Cleanup command** — extend `--reset` pattern to full E2E batch delete.  
3. **Cohorts A–H** as first-class scenario tags on patients (today: clinical profiles exist but not the named cohorts).  
4. **Longitudinal series** for all 100 patients (6–24 months) persisted in Patient State (today: mix of mock + partial ingest).  
5. **Stakeholder expansion** — labs, pharmacies, specialty doctors, CSOs (roles and/or org entities).  
6. **Lab order → result → state → orchestrate** journey (simulated).  
7. **Pharmacy dispense / adherence** journey (simulated; no real prescribing).  
8. **~20 golden scenarios** registry with expected DecisionType / Safety.  
9. **E2E report generator** + optional `/admin/e2e` (blocked in production).  
10. **Scale harness** (500 / 1k / 5k) — after 100-patient path is green.

---

## 12. Proposed synthetic data schema (additive)

Keep Neon `aksh` as SoT. Add only what Stage 3 needs:

| Entity | Proposal | Notes |
| --- | --- | --- |
| `e2e_batches` | batchId, seed, generatedAt, scenarioDistribution | Cleanup anchor |
| Patient facts | reuse `patient_state_facts` + `is_synthetic` / `batch_id` columns | Prefer additive columns |
| Users | reuse `users`/`profiles` with `@e2e.akshhealth.com` or tagged demo domain | Separate from marketing demo emails if needed |
| `organisations` / `care_teams` | new optional tables **or** JSON seed artifacts first | Start file-backed if faster |
| `lab_orders` / `lab_results` | simulated workflow tables | Never live NHS lab |
| `pharmacy_events` | simulated | Never live prescribing |
| Scenario tags | `cohort: A|B|…|H` on patient seed | Drives golden tests |

**Deterministic seed:** `seed = 20260812` (or CLI `--seed`).

---

## 13. Proposed test cohorts (map to generator)

Reuse / extend `generateExtendedDemoPatients` + Patient State series:

| Cohort | n | Expected decision bias |
| --- | --- | --- |
| A Stable | ~20 | OBSERVE / INFORM |
| B Gradual deterioration | ~20 | REQUEST_APPROVAL |
| C High-risk | ~15 | escalate / high priority |
| D Hypoglycaemia patterns | ~10 | SAFETY → ESCALATE |
| E Adherence | ~10 | engagement / pharmacy sim |
| F Missing info | ~10 | acquire data; no fabrication |
| G Multimorbidity | ~10 | multi-factor reasoning |
| H Improving | ~5 | detect positive change |

---

## 14. Proposed end-to-end workflows (master journeys 1–15)

Implement as automated scenarios **against existing surfaces first**, then expand:

1. Stable → OBSERVE  
2. Deterioration → HITL → intervention → outcome  
3. Critical lab (sim) → escalate  
4. Patient check-in → nurse task  
5. Adherence → engagement  
6. Missing info → gap → update  
7. Nurse follow-up  
8. PATHWAY referral draft  
9. Lab delay (sim)  
10. Pharmacy failure (sim)  
11. Clinician Reject  
12. Clinician Modify  
13. Outcome improved  
14. Outcome not improved  
15. Safety BLOCKED  

Each maps to CONNECT→…→LEARN where applicable.

---

## 15. Files likely to change (Stage 2+)

| Area | Paths |
| --- | --- |
| Generator | `lib/mock-data/demo-cohort-generator.ts`, new `lib/e2e/*` |
| Seed/cleanup | `scripts/seed-e2e*.ts`, `scripts/cleanup-e2e*.ts` |
| Migrations | additive columns / e2e_batches / optional lab_pharmacy tables |
| Tests | `tests/e2e-platform/*`, `e2e/journeys/*` |
| Report | `scripts/report-e2e.mjs`, `docs/reports/` |
| Dev dashboard | `app/dashboard/admin/e2e/*` (dev/test only) |
| Docs | this assessment + Stage reports |

**Unlikely to change in early stages:** CONDUCTOR core control flow, SHIELD hash algorithm, `liveEmis` defaults, agent directory membership.

---

## 16. New files required (proposed)

```
lib/e2e/types.ts
lib/e2e/generator.ts          # seeded population + cohorts A–H
lib/e2e/personas.ts           # e2e.gp / e2e.patient.* credentials helpers
lib/e2e/golden-scenarios.ts   # ~20 deterministic scenarios
lib/e2e/lab-sim.ts            # optional Stage 9
lib/e2e/pharmacy-sim.ts       # optional Stage 9
scripts/seed-e2e.ts
scripts/cleanup-e2e.ts
scripts/report-e2e.mjs
tests/e2e-platform/...
docs/reports/E2E_PLATFORM_REPORT_<date>.md
app/dashboard/admin/e2e/page.tsx   # Stage 12-ish; production-gated off
```

---

## 17. Database migrations required

| Priority | Change |
| --- | --- |
| P0 for E2E | Additive `batch_id` / `is_synthetic` / `scenario_id` on `patient_state_facts` (and maybe learning_events) |
| P1 | `aksh.e2e_batches` |
| P2 | Optional `lab_orders`, `lab_results`, `pharmacy_events` (sim only) |
| Avoid | Dual Supabase schema; destructive drops of demo cohort without `--reset` |

---

## 18. Risks

| Risk | Mitigation |
| --- | --- |
| Scope explosion (80-section brief) | Strict 12-stage gate; Stage 1 stops here |
| Polluting production Neon with E2E rows | Dedicated email domain + batchId cleanup; never run against prod without flag |
| Inventing lab/pharmacy “live” behaviour | Simulated states only; `liveEmis:false` |
| Breaking demo cohort | Separate `@e2e.` domain or tagged batch; don’t overwrite `@demo.` without opt-in |
| Client-bundle Node leaks | Keep seed/report in scripts/; no barrel export of pg into client (C5 lesson) |
| Claiming clinical readiness | Report labels: NOT READY / INTERNAL / CONTROLLED PILOT only |

---

## 19. Estimated implementation stages (from brief §78)

| Stage | Focus | Est. effort | Depends on |
| --- | --- | --- | --- |
| **1** | This assessment | Done | — |
| **2** | Test infra (`seed/cleanup/report:e2e`, env flags) | S | Review |
| **3** | Generator + cohorts A–H + longitudinal series | M | Stage 2 |
| **4** | Roles/auth negative tests (existing 8 roles); design lab/pharmacy personas | M | Stage 2 |
| **5** | Patient State assertions at scale | M | Stage 3 |
| **6** | Agents + tools vs agents report + orchestration scenarios | M | Stage 5 |
| **7** | Decision + Safety golden scenarios | M | Stage 6 |
| **8** | Intervention / HITL journeys | M | Stage 7 |
| **9** | Lab/pharmacy/care-team **simulations** | L | Stage 8 + schema |
| **10** | Learning/outcomes + state versioning proofs | M | Stage 8 |
| **11** | Perf/security/failure (non-destructive) | M | Stage 5+ |
| **12** | Final report + optional `/admin/e2e` | S | All |

**Do not start Stage 2 until this document is reviewed and an explicit go-ahead is given.**

---

## 20. Tools vs agents (preliminary finding — no auto-refactor)

Already correct:

- Diabetes builders = tools  
- CONDUCTOR/GUARDIAN/HORIZON/… = agents  

Watch for unnecessary agentisation if new “Lab Agent” / “Pharmacy Agent” are proposed — prefer **services** invoked by PATHWAY / Engagement / CONDUCTOR.

---

## 21. Honesty boundaries for the E2E programme

| May simulate | Must not pretend |
| --- | --- |
| Lab result delivery | Live NHS lab network |
| Pharmacy dispense status | Legal prescribing / EPS |
| Multi-specialty doctor personas | CIS2 / smartcard auth |
| Critical alerts | Autonomous treatment |
| Population analytics on synthetic cohort | Real ICS panel of 47k patients as live truth |

---

## 22. Definition of done (for the eventual programme)

Per brief §77: synthetic people → data in → Patient State → change over time → detect → intelligence → evidence → risk → safety → decision → HITL → intervention → stakeholders → follow-up → outcome → state update → provenance.

**Today:** demo HITL + partial diabetes loop prove a **slice**.  
**E2E programme goal:** prove that slice **across cohorts, roles, and simulated stakeholders**, with a written report classifying P0–P3 findings.

---

## 23. Stage 2–3 implementation status (2026-08-12)

**Completed** with defaults (user approved "go ahead"):

| Decision | Choice |
| --- | --- |
| Email domain | `@e2e.akshhealth.com` (demo cohort untouched) |
| Lab/pharmacy | File-backed sim in `data/e2e/{batchId}/` |
| Admin dashboard | `/dashboard/admin/e2e` — blocked in production |

**New commands:**

```bash
E2E_TEST_MODE=true npm run seed:e2e              # artifacts only
E2E_TEST_MODE=true npm run seed:e2e -- --apply   # Neon upsert
npm run db:migrate:e2e                           # 014_e2e_batches
npm run test:e2e:platform
npm run report:e2e
npm run cleanup:e2e -- --batch=e2e-20260812 --apply
```

**Next:** Stage 5+ (Patient State assertions at scale, more golden Playwright journeys, performance).

### Stage 4 complete (2026-08-12)

- `tests/e2e-platform-rbac.test.ts` — 7 API negative RBAC cases
- `e2e/platform-golden-journey.spec.ts` — **AKSH-E2E-0002** (2 Playwright tests passing)
- Admin E2E API: `requireAppRole` for operations_lead + clinical_reviewer
- Neon applied: **112** `@e2e.akshhealth.com` users · **3190** patient_state_facts (`e2e-20260812`)

### Stage 5 complete (2026-08-12)

- `lib/e2e/patient-state-assertions.ts` — cohort trajectory assertions for all 100 patients
- `tests/e2e-platform-patient-state.test.ts` — **100/100** generator assertions + artifact parity + API RBAC
- `evaluateAppRoleClinicalReadAccess` on `GET /api/patients/{id}/state` (researcher/patient/cross-patient denied)
- `e2e/platform-golden-cdf.spec.ts` — **AKSH-E2E-0003, 0004, 0006** (4 Playwright tests)
- **6/6** platform golden journeys passing (`npm run test:e2e:platform-journeys`)

```bash
npm run test:e2e:platform-state
npm run test:e2e:platform-journeys
```

### Stage 6 complete (2026-08-12)

- `lib/e2e/agent-orchestration-assertions.ts` — structured validators for orchestration invariants + golden scenarios **0007, 0011, 0019**
- `tests/e2e-platform-agents.test.ts` — unit tests (multimorbidity P008, allergy P001+Amoxicillin, LLM-off deterministic P002)
- `e2e/platform-golden-agents.spec.ts` — Playwright API journeys for **AKSH-E2E-0007, 0011, 0019**
- Demo proxies: P008 (multimorbidity), P001 (allergy), P002 (LLM failure / cohort B)

```bash
npm run test:e2e:platform-agents
npm run test:e2e:platform-agent-journeys
npm run test:e2e:platform-stage6
```

### Stage 7 complete (2026-08-12)

- `lib/e2e/decision-safety-assertions.ts` — golden decision/safety validators + coaching gate + renal fabrication guard
- `tests/e2e-platform-decision.test.ts` — unit tests for **AKSH-E2E-0001, 0009, 0012**
- `e2e/platform-golden-decision.spec.ts` — Playwright API journeys (OBSERVE, ESCALATE, ACQUIRE_DATA)
- Demo proxies: P007 (stable T2D), P018 (critical lab escalate), P015 (absent creatinine)

```bash
npm run test:e2e:platform-decision
npm run test:e2e:platform-decision-journeys
npm run test:e2e:platform-stage7
```

### Stage 8 complete (2026-08-12)

- `lib/e2e/hitl-intervention-assertions.ts` — Accept/Reject honesty, outcome-link, adherence RECOMMEND validators
- `tests/e2e-platform-hitl.test.ts` — unit tests for **AKSH-E2E-0005, 0010, 0015**
- `e2e/platform-golden-hitl.spec.ts` — Playwright HITL journeys (Reject no staging, Accept → health plan + learning)
- Demo proxies: P007 (adherence), P002 (Reject / Accept→outcome)

```bash
npm run test:e2e:platform-hitl
npm run test:e2e:platform-hitl-journeys
npm run test:e2e:platform-stage8
```

### Stage 9 complete (2026-08-12)

- `lib/e2e/lab-sim.ts` — delayed → complete (idempotent duplicate), no fabricated values while delayed
- `lib/e2e/pharmacy-sim.ts` — adherence failure → coordination task → clinician escalate
- `lib/e2e/care-team-sim.ts` — resolve synthetic care team + route pharmacy/lab follow-ups
- `lib/e2e/stakeholder-sim-assertions.ts` — golden validators for **AKSH-E2E-0013, 0014**
- `app/api/admin/e2e/sims` — E2E-gated GET/POST sim surface (`liveNhsLab:false`, `livePrescribing:false`)
- Generator: every cohort F patient now always has a delayed eGFR order

```bash
npm run test:e2e:platform-sims
npm run test:e2e:platform-sim-journeys
npm run test:e2e:platform-stage9
```

### Stage 10 complete (2026-08-12)

- `lib/e2e/state-versioning.ts` — source-reference idempotent ingest + version delta helpers
- `lib/e2e/learning-state-assertions.ts` — golden validators for **0008, 0018, 0020** + closed learning loop
- `tests/e2e-platform-learning.test.ts` — improvement detection, dedup, supersession, population honesty, Accept→outcome
- `e2e/platform-golden-learning.spec.ts` — Playwright journeys for learning APIs + cohort aggregates

```bash
npm run test:e2e:platform-learning
npm run test:e2e:platform-learning-journeys
npm run test:e2e:platform-stage10
```

### Stage 11 complete (2026-08-12)

- `lib/e2e/perf-security-assertions.ts` — golden validators for **0016, 0017, 0019** + E2E SLOs + lightweight reminder + failure honesty
- `tests/e2e-platform-perf-security.test.ts` — tenant deny, reminder (0 clinical agents), LLM-off + timeout non-destructive, soft SLOs
- `e2e/platform-golden-perf-security.spec.ts` — Playwright journeys (researcher/patient deny, reminder contract, deterministic orchestrate)
- Soft latency via existing `evaluatePerfSample` / `PERF_SMOKE_STRICT`; no live EMIS / auto-retrain claims

```bash
npm run test:e2e:platform-perf-security
npm run test:e2e:platform-perf-security-journeys
npm run test:e2e:platform-stage11
```

### Stage 12 complete (2026-08-12)

- `lib/e2e/final-report.ts` — golden coverage matrix, 12-stage matrix, P0–P3 findings, architecture-loop honesty
- `scripts/report-e2e.ts` — final markdown + `data/e2e/{batch}/report.json` (replaces thin Stage-2 reporter)
- `tests/e2e-platform-final-report.test.ts` — contract: liveEmis/autoRetrain false, all golden validated, no P0 blockers
- `/dashboard/admin/e2e` — surfaces stages, golden list, findings from final report JSON
- Artefacts: `docs/reports/E2E_PLATFORM_FINAL_REPORT_e2e-20260812.md`

```bash
npm run test:e2e:platform-final-report
npm run report:e2e
npm run test:e2e:platform-stage12
npm run test:e2e:platform-all-stages   # optional full suite
```

**Programme status:** Stages 1–12 complete for internal software E2E validation. **Not** production clinical readiness.

### Post-programme slice (2026-08-12)

- **AKSH-E2E-0021** — Clinician Modify/edit golden (closes former F-P2-002): unit + Playwright; draft stays DRAFT; learning `decision=edit`; no health plan / EHR
- **CI** — `.github/workflows/e2e.yml` adds `platform-unit-gates` job (`npm run test:e2e:platform-unit-gates`) before Playwright; LLM-off + soft SLOs
- Golden pack now **21** scenarios; regenerate with `npm run report:e2e`

**Still deferred (honest):** live EMIS/EPS (P1), 500–5k load (P1), systematic prompt-injection corpus (P2), CIS2 (P2).

---

## Appendix A — Commands already available

```bash
npm run seed:demo-cohort -- --apply
npm run seed:demo-cohort -- --reset --apply
npm run test:clinical-proof
npm run test:workflow
npm run test:e2e
npm run test:e2e:clinical-proof
npm run smoke:all
npm run verify
```

Proposed (Stage 2) — **now available**:

```bash
E2E_TEST_MODE=true npm run seed:e2e -- --seed=20260812
E2E_TEST_MODE=true npm run seed:e2e -- --apply
npm run test:e2e:platform
npm run report:e2e
npm run cleanup:e2e -- --batch=e2e-20260812 --apply
```
