# Aksh Health — Post-Enhancement End-to-End Validation

**Document type:** Publication-ready E2E validation pack (post Part 60 approval)  
**Date:** 2026-08-12  
**Package:** `packages/platform-uk`  
**Implementation HEAD (pre-commit):** local working tree after Master Journey land  
**Live prod health probe:** `https://akshhealth.com/api/health`  
**Authoritative architecture:** `docs/AKSH_FINAL_ARCHITECTURE_SPEC.md`  
**Master Journey trace:** `docs/reports/E2E_MASTER_JOURNEY_20260812.md` (+ `.json`)  
**Related evidence:** `docs/E2E_PLATFORM_VALIDATION_ASSESSMENT.md`, `docs/reports/E2E_PLATFORM_FINAL_REPORT_e2e-20260812.md`, `lib/e2e/master-journey.ts`

**Frozen architecture (unchanged):**

```
PATIENT STATE → INTELLIGENCE → DECISION → INTERVENTION → LEARNING

CONNECT → UNDERSTAND → DETECT → REASON → PREDICT → RECOMMEND → DECIDE → ACT → MONITOR → LEARN
```

Layers: Data · Interoperability · Safety · Privacy · Consent · Security · Provenance · Evaluation · Observability · Governance · Human Oversight

---

## Executive summary

**Does enhanced Aksh work as one connected longitudinal Health Intelligence and Care Orchestration Platform end-to-end?**

**Yes — as a synthetic / Track A Master Journey for internal software validation.**  
`AKSH-E2E-MASTER-001` now automates a single deteriorating-patient chain with one `correlationId` across Patient State → CONDUCTOR intelligence → Decision → HITL Accept → health-plan intervention → follow-up outcome → learning, plus **SIMULATED** lab/pharmacy stakeholder steps on the same correlation id. Golden slices AKSH-E2E-0001…0021 remain green as stage unit gates.

**Latest Master Journey run (2026-08-12):** **PASS 25/25** · canonical identity `P002` (legacy alias `E2P021`) · seed `20260812` · artifact `docs/reports/E2E_MASTER_JOURNEY_20260812.md`.

**Honest readiness (Part 57) — unchanged axes, engineering path closed:**

| Axis | Classification |
| --- | --- |
| **Engineering** | **INTERNAL TEST READY** |
| **Workflow** | **SIMULATED END-TO-END** |
| **Clinical Evidence** | **UNVALIDATED** |

**Not claimed:** clinically validated · production ready for autonomous care · live NHS EMR · MHRA/CQC certification. Lab/pharmacy remain **SIMULATED**. Neo4j production probe remains **mock** (`connected:false`).

---

## How to run (publication commands)

```bash
cd packages/platform-uk

# Master Journey (Part 50–52) — preferred single gate
npm run test:master
# alias → test:e2e:platform-master

# Regenerate Master Journey markdown/JSON under docs/reports/
npm run report:master

# Programme aliases (map to existing harness)
npm run seed:e2e          # ± --apply with E2E_TEST_MODE=true
npm run cleanup:e2e -- --batch=e2e-20260812 --apply
npm run report:e2e
npm run test:smoke        # → smoke:all
npm run test:golden       # Playwright golden journey specs
npm run test:e2e          # full Playwright suite
npm run test:e2e:platform-unit-gates   # includes Master Journey
```

CI-friendly durable skip (no Neon writes):

```bash
AKSH_MASTER_SKIP_DURABLE=true npm run test:master
```

Admin observability (not production-exposed without `E2E_TEST_MODE`): `/dashboard/admin/e2e`.

---

## Environment snapshot

| Item | Value |
| --- | --- |
| Date | 2026-08-12 |
| Seed | `20260812` · source `AKSH_E2E_TEST` · `isSynthetic:true` |
| Live health | Postgres **live** · Neo4j **mock** |
| Master Journey | **PASS 25/25** (`AKSH-E2E-MASTER-001`) |
| Golden pack | 21/21 stage-validated |
| Invariants | `liveEmis:false` · `autoRetrain:false` · HITL mandatory |

Production health probe (2026-08-12):

```json
{
  "status": "ok",
  "database": { "configured": true, "connected": true, "mode": "live" },
  "neo4j": {
    "configured": true,
    "connected": false,
    "mode": "mock",
    "required": false
  }
}
```

---

## Part 1 — Architecture discovered (unchanged reality)

### 1.1 Runtime stack

| Layer | Reality | Evidence |
| --- | --- | --- |
| Frontend | Next.js App Router · Tailwind 3.4 · role dashboards | `app/dashboard/*` |
| Auth | NextAuth + bcrypt users in Neon | `lib/auth*` |
| DB | **Neon Postgres live** in prod | `/api/health` |
| Graph | Neo4j Aura **configured, disconnected → mock** | `/api/health` |
| AI | Vercel AI Gateway (flag-gated) + deterministic fallbacks | clinical-spine / agents |
| Orchestration | Deterministic CONDUCTOR | `lib/clinical-spine/orchestrate.ts` |
| Decision | Named module | `lib/decision/` |
| Disease | Diabetes (flag-gated) · Heart **typed stub** | disease-modules |
| Interop | FHIR staging · EMIS partner sandbox · `liveEmis:false` | partner-readiness |
| Hosting | Vercel → https://akshhealth.com | live probe |

### 1.2 Frontend routes / dashboards

Eight role dashboards + regional + review workspace + admin E2E cockpit (blocked in production without `E2E_TEST_MODE`). See prior discovery inventory — **no architecture redesign** in this pass.

### 1.3 Frozen loop vs implementation

| Stage | Status | Classification |
| --- | --- | --- |
| CONNECT | Partial ingest + E2E seeds | **PARTIAL → LIVE** (Aksh) / **SIMULATED** (external) |
| UNDERSTAND | Patient State facts + timeline | **PARTIAL** |
| DETECT | Diabetes/rules/cohort assertions | **PARTIAL** |
| REASON | NEXUS / SYNTHESIS / GUARDIAN | **LIVE** |
| PREDICT | HORIZON (id ORACLE) | **LIVE** |
| RECOMMEND | PATHWAY / coaching drafts | **LIVE** (draft) |
| DECIDE | `lib/decision` + safety-route | **LIVE** |
| ACT | Staging/sim write-back | **SIMULATED** |
| MONITOR | Follow-up / outcomes | **PARTIAL** |
| LEARN | learning_events · `autoRetrain:false` | **LIVE** |

---

## Parts 49–52 — Golden + Master Journey (CURRENT)

### Golden pack

`lib/e2e/golden-scenarios.ts` — **AKSH-E2E-0001 … 0021** (21 scenarios). Stage reports: validated via unit ± Playwright ± API.

### Master Journey (`AKSH-E2E-MASTER-001`) — **IMPLEMENTED**

| Requirement | Status |
| --- | --- |
| Single deteriorating patient end-to-end | **PASS** (cohort B / P002) |
| Persistent `correlationId` across API/DB/agents/audit scope | **PASS** (`scopeKey` + actor annotation) |
| 25-step PASS/FAIL Part-52 trace report | **PASS** → `docs/reports/E2E_MASTER_JOURNEY_*.md` |
| Combine generator state + orchestration + HITL + sims | **PASS** in `lib/e2e/master-journey.ts` |
| Dual identity P1-ID-001 | **RESOLVED** — canonical `P002` shared by Master / Neo4j / review queue / generator cohort B; legacy alias `E2P021 → P002` |

**Runner:** `npm run test:master` · Playwright surface: `e2e/platform-master-journey.spec.ts`  
**Latest overall:** **PASS (25/25)** — see full step table in `docs/reports/E2E_MASTER_JOURNEY_20260812.md`.

Identity note: **P1-ID-001 resolved.** Flagship patient id is canonical **`P002`** across clinical-proof fixtures, Neo4j seed, review queue / spine resolution, Master Journey, and E2E generator cohort B. Legacy generator id `E2P021` is retained only as a thin alias for one-release compatibility (`lib/e2e/patient-identity.ts`).

---

## Synthetic data / harness command map

| Requested | Repository command |
| --- | --- |
| `seed:e2e` | `E2E_TEST_MODE=true npm run seed:e2e` (± `--apply`) |
| `cleanup:e2e` | `npm run cleanup:e2e -- --batch=<id> --apply` |
| `report:e2e` | `npm run report:e2e` |
| `report:master` | `npm run report:master` |
| `test:smoke` | `npm run test:smoke` → `smoke:all` |
| `test:golden` | `npm run test:golden` |
| `test:master` | `npm run test:master` → `test:e2e:platform-master` |
| `test:e2e` | `npm run test:e2e` |
| Unit gates | `npm run test:e2e:platform-unit-gates` (includes Master) |

Generator defaults: seed `20260812` · 100 patients · `AKSH_E2E_TEST` · `liveEmis:false`.

---

## Major capability classification matrix

| Capability | LIVE | SIMULATED | STUB | PLANNED | BROKEN |
| --- | --- | --- | --- | --- | --- |
| Neon Postgres SoT | ✓ | | | | |
| NextAuth + 8 dashboards | ✓ | | | | |
| HITL Accept/Edit/Reject | ✓ | | | | |
| CONDUCTOR orchestration | ✓ | | | | |
| Patient State facts | ✓ (partial depth) | | | | |
| Diabetes intelligence (flag) | ✓ | | | | |
| SHIELD audit (DB up) | ✓ | | | | |
| Learning events | ✓ | | | | |
| BRIDGE FHIR staging | ✓ staging | write-back | | | |
| EMIS partner path | | sandbox | | live flip | |
| Neo4j graph features | | mock fallback | | live Aura | |
| Lab workflow | | ✓ | | live NHS lab | |
| Pharmacy workflow | | ✓ | | live EPS | |
| Heart module | | | ✓ types | wiring | |
| PRISM / ATLAS | | | | ✓ | |
| **Master Journey automation** | ✓ (synthetic) | lab/pharm steps | | | |
| CIS2 / full RBAC enforce | | | `productionRbacEnforced:false` | ✓ | |

Nothing critical in the synthetic HITL loop is **BROKEN**. Neo4j remains intentional mock in production.

---

## Part 57 — Readiness classifications (honest)

| Axis | Result | Rationale |
| --- | --- | --- |
| **Engineering** | **INTERNAL TEST READY** | Stages 1–12 + 21 goldens + **Master Journey 25/25** + CI unit gates |
| **Workflow** | **SIMULATED END-TO-END** | Full loop closed in software with lab/pharmacy sims; no live EMR actors |
| **Clinical Evidence** | **UNVALIDATED** | No prospective/retrospective clinical study claims; synthetic-only |

Do **not** call Aksh: clinically validated · production ready for autonomous care · live NHS EMR.

---

## Remaining gaps (honest)

### P0 — Critical

_None_ for Track A synthetic software safety.

### P1 — High (open)

- **P1-GRAPH-001** — Production Neo4j configured but disconnected (`mode:mock`).
- **P1-EXT-001** — No live EMIS / EPS / NHS lab (by design).
- **P1-SCALE-001** — 500–5000 patient scale suite not executed.

~~**P1-ID-001**~~ — **RESOLVED (2026-08-12):** canonical flagship id `P002` unified across Master Journey, Neo4j seed, review queue, and generator cohort B; legacy `E2P021 → P002` alias retained.

### P2 — Medium

- Unified Change Detection Engine still fragmented.
- Recommendation / intervention first-class DB state machines not built.
- `productionRbacEnforced:false`; CIS2 absent.
- Default E2E population 100 vs brief ≥120.

### Closed this pass

- **P1-MJ-001** — Master Journey + correlationId + Part-52 report **implemented and PASS**.

---

## Publication artifacts

| Artifact | Path |
| --- | --- |
| This pack | `docs/e2e/AKSH-POST-ENHANCEMENT-END-TO-END-VALIDATION.md` |
| Master Journey markdown | `docs/reports/E2E_MASTER_JOURNEY_20260812.md` |
| Master Journey JSON | `docs/reports/E2E_MASTER_JOURNEY_20260812.json` |
| Latest pointer | `data/e2e/master/latest.json` |
| Runner | `lib/e2e/master-journey.ts` |
| Unit gate | `tests/e2e-platform-master.test.ts` |
| Playwright surface | `e2e/platform-master-journey.spec.ts` |
| Stage-12 final report | `docs/reports/E2E_PLATFORM_FINAL_REPORT_e2e-20260812.md` |

---

## Named agents (frozen — not renamed)

Canonical directory: `lib/agents.ts` `AGENT_DIRECTORY` (12 entries).  
Aliases retained: **ORACLE→HORIZON**, **REFERRAL→PATHWAY**, **EQUITY→COMPASS**.  
VOICE / DrASSIST remain sub-capabilities. PRISM/ATLAS Phase 2 (`live:false`).

---

## Discovery archive note

Part 60 discovery (mapping-only gate) completed 2026-08-12 with explicit STOP. This document supersedes the discovery executive sections with **implementation results** after user approval to proceed. Historical connectivity maps and agent inventory above remain accurate; Master Journey rows are updated from **MISSING** → **IMPLEMENTED / PASS**.

---

_End of publication-ready post-enhancement end-to-end validation pack._
