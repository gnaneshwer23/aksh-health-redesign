# End-to-end QA audit — PRD, implementation plans & production

**Audited:** 2026-10-05T17:55Z  
**Commit (code):** `49aef91` (+ local test alignment for P002 HbA1c `8.4`, see §Findings)  
**Production:** https://akshhealth.com  
**Scope:** Synthetic / internal-testing clinic (`liveEmis:false`, `realPatientData:false`) — **not** live PHI or live EMR write-back

## Executive verdict

| Target | Decision | Basis |
| --- | --- | --- |
| **Internal testing / synthetic clinic (production URL)** | **GO** | Automated suites green (post-fix), Master Journey 34/41, prod auth + honesty probes |
| **PRD clinical-proof matrix (REQ-001–037)** | **Aligned** | 30 PASS · 1 PARTIAL · 3 BLOCKED: partner · 2 GAP · 2 MANUAL — unchanged from `docs/QA_TRACEABILITY_MATRIX.md` |
| **Phased build plan (P0–P6 platform)** | **PASS (historical gates)** | P6 regression audit; spine A–F + NEXUS in CONDUCTOR; honesty rules intact |
| **Phased build P7 (partner / live EHR)** | **Open / external** | REQ-017, REQ-019, REQ-025 remain partner-blocked by design |
| **Aksh 2.0 intelligence layer** | **PASS** | `test:aksh20:eval`, context/GraphRAG/guardian/model-registry contracts in Master Journey |
| **Live patient PHI (GOV-002 / DPIA)** | **Blocked** | Expected; not a blocker for synthetic deployment |
| **Live EMIS / SystmOne write-back** | **Blocked** | `liveEmis:false`; MJ-33 / MJ-41 honesty PASS |

**No release blockers** for the agreed internal-testing scope. Do not promote to live PHI or live EMR without governance and partner gates.

---

## Authoritative sources cross-walk

| Document | Role in this audit |
| --- | --- |
| `docs/volume-i/VOLUME_I_PRODUCT_REQUIREMENTS.md` | Product intent (FR/NFR); traced via QA matrix, not line-by-line in this run |
| `docs/QA_TRACEABILITY_MATRIX.md` | REQ-001–037 → components → tests → status |
| `docs/PHASED_BUILD_AND_AUDIT_PLAN.md` | Phase gates P0–P7, honesty rules, audit commands |
| `docs/PHASED_BUILD_P0_AUDIT.md` … `P6_AUDIT.md` | Recorded phase exit evidence |
| `docs/QA_CHECKLIST_ALIGNMENT.md` | ~188 deployment checklist items → automation vs manual |
| `docs/reports/AKSH_2.0_QA_EXECUTION_20261005.md` | Aksh 2.0 checklist (CONDITIONAL GO synthetic) |
| `docs/reports/E2E_MASTER_JOURNEY_20261005.md` | AKSH-E2E-MASTER-001 trace (41 steps) |

---

## Evidence — this audit run (2026-10-05)

| Check | Command / probe | Result |
| --- | --- | --- |
| Demo cohort + simulated EHR | `npm run test:demo-cohort` | **10/10 PASS** |
| Aksh 2.0 intelligence | `npm run test:aksh20:eval` | **PASS** |
| Master Journey (durable skip) | `AKSH_MASTER_SKIP_DURABLE=true npm run test:e2e:platform-master` | **PASS 34/41** (7 Neon durable steps skipped) |
| Clinical proof (full) | `npm run test:clinical-proof` | **PASS** (after P002 HbA1c assertion update) |
| Public smoke (local dev) | `npm run smoke:public` | **PASS** (10 pages @ :3000) |
| Prod Postgres | `GET /api/health` | **live** |
| Prod Neo4j | `GET /api/health` | **mock** (Aura paused; `required:false`) |
| Unauth clinical APIs | `/api/context/package`, `/api/models/registry`, `/api/integrations/simulated-ehr` | **401** |
| Ask Aksh (marketing) | `GET/POST /api/chat` | **available + streams** (`openai/gpt-4o-mini` + `AI_GATEWAY_API_KEY`) |
| Phase 2 honesty | `GET /api/system/phase2-capability-status` | **401** unauth (route gated); unit tests: PRISM/ATLAS `live:false` |

---

## Master Journey vs implementation plan

Closed loop under one `correlationId` for software validation (`AKSH-E2E-MASTER-001`):

- **PASS (34):** CONNECT → UNDERSTAND → DETECT → REASON → DECIDE (contract) → simulators (labs, pharmacy, voice, CGM, EHR adapter) → Aksh 2.0 (context, GraphRAG mock, NEXUS contract, guardian gateway, model registry) → **MJ-41 simulated EHR write-back** (`liveEmis:false`).
- **SKIP (7):** MJ-10–16 durable Neon HITL / learning / SHIELD-scope when `AKSH_MASTER_SKIP_DURABLE=true` — acceptable for internal gate without full durable env in CI/local.
- **Honesty (MJ-33):** `liveEmis:false`, sims only, not clinically validated, not autonomous-care ready — **PASS**.

Re-run: `cd packages/platform-uk && AKSH_MASTER_SKIP_DURABLE=true npm run test:master`

---

## PRD / traceability matrix snapshot

From `docs/QA_TRACEABILITY_MATRIX.md` (37 requirements):

| Status | Count | Examples |
| --- | ---: | --- |
| PASS | 30 | HITL chain, SHIELD, Patel golden path, tenant isolation, learning append-only |
| PARTIAL | 1 | REQ-021 RBAC cross-role (nurse/GP edge cases) |
| BLOCKED: partner | 3 | Live EMIS write (REQ-017/019), CIS2 (REQ-025) |
| GAP | 2 | Mirth HL7 round-trip (REQ-024), pen test report (REQ-027) |
| MANUAL | 2 | Gate 1–3 sign-off (REQ-030), governed model release SOP (REQ-037) |

**Synthetic EHR rehearsal (recent build plan work)** maps to REQ-009/010/016/034 and Master Journey MJ-31, MJ-41 — **implemented and tested** (`tests/simulated-ehr.test.ts`, HITL chain tests).

---

## Phased build plan alignment

| Phase | Intent | Audit status |
| --- | --- | --- |
| P0 | Baseline lock | PASS (recorded) |
| P1 | Neon 009/010 durability | PASS (recorded) |
| P2 | NEXUS ∈ CONDUCTOR | PASS — MJ-07/38 |
| P3 | Agent brand in GP UI | PASS (P3 audit) |
| P4 | Front/back honesty | PASS (P4 audit) |
| P5 | Staging secrets Medplum/Deepgram | PASS degraded where OAuth fails |
| P6 | Full regression | PASS (recorded); **this run** clinical-proof green |
| P7 | Partner / live EHR | **Not started** — external |

Global honesty rules (no `liveEmis:true` without partner go/no-go, no autonomous write, no fake certifications, PRISM/ATLAS not live): **spot-check PASS** on prod health + Master Journey MJ-33/MJ-40.

---

## Aksh 2.0 vs 1.0 clinic (prior execution report)

Reference: `docs/reports/AKSH_2.0_QA_EXECUTION_20261005.md` — **CONDITIONAL GO** synthetic; **NO-GO** live PHI.

This audit **confirms** continued PASS on intelligence eval and Master Journey Aksh 2.0 steps; **adds** post-deploy verification that marketing **Ask** chat works after Gateway model/key fix (`49aef91`).

---

## Findings & actions

### 1. Clinical-proof drift (fixed in working tree)

`tests/clinical-spine-diabetes.test.ts` still expected fixture HbA1c **8.1%** for P002 while the synthetic longitudinal bundle and Master Journey (MJ-03, MJ-41) canonical path is **6.8% → 8.4%**. Assertion updated to **8.4** for `readingsSource === "fixture"`. **Recommend commit** with clinical-proof green.

### 2. Neo4j mock (accepted)

GraphRAG runs in **mock** mode while Aura is paused. Matches honesty banners and REQ-005. **Not** a blocker for internal testing.

### 3. Durable Master Journey skips (accepted)

Seven steps require Neon durable HITL/learning paths. Run without skip only when validating full durable stack in a Neon-backed environment.

### 4. Deployment QA checklist (~188 items)

Large portions remain **manual** (Lighthouse, WCAG, OAuth SSO, step-by-step onboarding fields). See `docs/QA_CHECKLIST_ALIGNMENT.md`. Automated layers cover auth smoke, public pages, clinical-proof E2E, and role dashboard HTTP smokes when `SMOKE_*` creds are set.

### 5. Out of scope (unchanged)

- GOV-002 DPIA / live PHI production  
- Live NHS EMIS/SystmOne partner write-back  
- MHRA / completed DCB0129 / DTAC claims  

---

## Sign-off

| Audience | Recommendation |
| --- | --- |
| **Internal testing on akshhealth.com** | **GO** — synthetic clinic, HITL, FHIR staging, simulated EHR round-trip, Aksh 2.0 contracts |
| **Live PHI or live EMR production** | **NO-GO** until GOV-002 + partner programme complete |
| **Next engineering hygiene** | Commit P002 HbA1c test fix; optional full Master Journey without `AKSH_MASTER_SKIP_DURABLE` in Neon staging |

---

## Quick re-run bundle

```bash
cd packages/platform-uk
npm run test:demo-cohort
npm run test:aksh20:eval
AKSH_MASTER_SKIP_DURABLE=true npm run test:e2e:platform-master
npm run test:clinical-proof
npm run smoke:public   # requires dev server on :3000
```

_Production spot-check:_ `curl -sS https://akshhealth.com/api/health` · unauth `/api/context/package` → 401 · `POST /api/chat` streams assistant text.
