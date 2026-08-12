# Aksh E2E Platform Final Report — e2e-20260812

**Generated:** 2026-08-12T10:30:54.989Z  
**Seed:** 20260812  
**Source:** AKSH_E2E_TEST · **liveEmis:** false · **autoRetrain:** false  
**Status:** READY FOR INTERNAL TESTING

> Software E2E validation only — not production clinical readiness, not controlled pilot, not live EHR writeback.

## Executive summary

| Metric | Value |
| --- | --- |
| Stages complete (1–12) | 12 / 12 |
| Golden scenarios validated | 21 / 21 |
| Readiness | READY FOR INTERNAL TESTING |
| P0 findings blocking internal test | 0 |

## Architecture loop coverage

| Layer | Status |
| --- | --- |
| Patient State | covered |
| Intelligence | covered |
| Decision | covered |
| Intervention | covered |
| Learning | covered |
| Safety | covered |

## Test population

| Entity | Count |
| --- | --- |
| Patients | 100 |
| Users | 112 |
| Patient State facts | 3190 |
| Lab events (sim) | 200 |
| Pharmacy events (sim) | 28 |

### Cohort distribution

- **Cohort A:** 20
- **Cohort B:** 20
- **Cohort C:** 15
- **Cohort D:** 10
- **Cohort E:** 10
- **Cohort F:** 10
- **Cohort G:** 10
- **Cohort H:** 5

## Stage matrix

| Stage | Title | Status | Script |
| --- | --- | --- | --- |
| 1 | Assessment | complete | — |
| 2 | Test infra (seed/cleanup/report/env) | complete | `seed:e2e` |
| 3 | Generator + cohorts A–H + personas | complete | `test:e2e:platform` |
| 4 | RBAC negative + golden journey B | complete | `test:e2e:platform-rbac` |
| 5 | Patient State assertions at scale | complete | `test:e2e:platform-state` |
| 6 | Agents + orchestration | complete | `test:e2e:platform-stage6` |
| 7 | Decision + Safety | complete | `test:e2e:platform-stage7` |
| 8 | HITL / Intervention | complete | `test:e2e:platform-stage8` |
| 9 | Lab / pharmacy / care-team sims | complete | `test:e2e:platform-stage9` |
| 10 | Learning + state versioning | complete | `test:e2e:platform-stage10` |
| 11 | Perf / security / failure | complete | `test:e2e:platform-stage11` |
| 12 | Final report + admin E2E surface | complete | `test:e2e:platform-stage12` |

## Golden scenarios (AKSH-E2E-0001 … 0021)

| ID | Title | Stage | Status | Evidence |
| --- | --- | --- | --- | --- |
| AKSH-E2E-0001 | Stable diabetes — observe only | 7 | validated | unit, playwright |
| AKSH-E2E-0002 | Progressive Type 2 diabetes deterioration | 4 | validated | unit, playwright |
| AKSH-E2E-0003 | High-risk multimorbidity prioritisation | 5 | validated | unit, playwright |
| AKSH-E2E-0004 | CGM hypoglycaemia safety | 5 | validated | unit, playwright |
| AKSH-E2E-0005 | Medication adherence engagement | 8 | validated | unit, playwright |
| AKSH-E2E-0006 | Missing information — acquire data | 5 | validated | unit, playwright |
| AKSH-E2E-0007 | Complex multimorbidity agent reasoning | 6 | validated | unit, playwright |
| AKSH-E2E-0008 | Detect positive improvement | 10 | validated | unit, playwright |
| AKSH-E2E-0009 | Critical lab escalation | 7 | validated | unit, playwright |
| AKSH-E2E-0010 | Clinician Reject — no staging | 8 | validated | unit, playwright |
| AKSH-E2E-0011 | Allergy safety block | 6 | validated | unit, playwright |
| AKSH-E2E-0012 | Hallucination guard — absent renal | 7 | validated | unit, playwright |
| AKSH-E2E-0013 | Delayed lab result (sim) | 9 | validated | unit, playwright, api |
| AKSH-E2E-0014 | Pharmacy adherence failure (sim) | 9 | validated | unit, playwright, api |
| AKSH-E2E-0015 | Accept → health plan → outcome | 8 | validated | unit, playwright |
| AKSH-E2E-0016 | Tenant isolation negative | 11 | validated | unit, playwright, api |
| AKSH-E2E-0017 | Simple reminder — no agent overload | 11 | validated | unit, playwright, contract |
| AKSH-E2E-0018 | Duplicate lab result idempotency | 10 | validated | unit, playwright |
| AKSH-E2E-0019 | AI provider failure — no corruption | 6 | validated | unit, playwright |
| AKSH-E2E-0020 | Population health aggregate honesty | 10 | validated | unit, playwright |
| AKSH-E2E-0021 | Clinician Modify — edited draft remains HITL | 8 | validated | unit, playwright |

## Findings (P0–P3)

### P0
_None._

### P1
- **F-P1-001** No live EMIS / EPS / NHS lab connectivity (by design) — liveEmis:false, liveNhsLab:false, livePrescribing:false throughout. Stakeholder paths are simulations only.
- **F-P1-002** Scale suite 500–5000 patients not executed — Generator validates 100-patient cohort. Soft SLOs cover in-process timing; full load/perf campaign deferred.

### P2
- **F-P2-001** Prompt-injection coverage is soft / reminder-scoped — AKSH-E2E-0017 proves hostile text does not spawn clinical agents; systematic injection corpus not yet built.
- **F-P2-003** CIS2 / smartcard auth not simulated — Role auth uses NextAuth + test headers; NHS CIS2 identity proofing is out of scope for this programme.

### P3
- **F-P3-001** Admin E2E dashboard is status/observability only — Seed/cleanup remain CLI; dashboard surfaces batch + report honesty banners, not mutate controls.
- **F-P3-002** Appointment reminder is contract-level — 0017 validates no clinical-agent overload via buildAppointmentReminder — not a production messaging pipeline.

## Honesty boundaries

| May simulate | Must not pretend |
| --- | --- |
| Lab / pharmacy / care-team sims | Live NHS lab / EPS / EMIS writeback |
| Synthetic @e2e.akshhealth.com users | Real ICS panel as live truth |
| Deterministic LLM-off agents | Autonomous treatment |
| Soft perf SLOs | Production latency guarantees |

## Commands

```bash
# seed
E2E_TEST_MODE=true npm run seed:e2e -- --apply

# cleanup
npm run cleanup:e2e -- --batch=e2e-20260812 --apply

# report
npm run report:e2e

# stage6
npm run test:e2e:platform-stage6

# stage7
npm run test:e2e:platform-stage7

# stage8
npm run test:e2e:platform-stage8

# stage9
npm run test:e2e:platform-stage9

# stage10
npm run test:e2e:platform-stage10

# stage11
npm run test:e2e:platform-stage11

# stage12
npm run test:e2e:platform-stage12

# allStages
npm run test:e2e:platform-all-stages
```

## Generator unit tests

PASS — `tests/e2e-platform-generator.test.ts`

---

_End of Stage 12 final report. Demo cohort (@demo.akshhealth.com) remains untouched by E2E cleanup._
