# P0 Audit — Baseline lock

**Date:** 2026-07-21  
**Branch:** `main` @ `95dd414` (+ this audit commit)  
**Scope:** Snapshot green baseline; freeze DONE layers; no feature work.

## Exit criteria — PASS

| Criterion | Result | Evidence |
|---|---|---|
| Clinical-proof green on `main` | **PASS** | `npm run test:clinical-proof` → exit 0 (~40s) |
| Typecheck green | **PASS** | `npm run typecheck` → exit 0 |
| DONE layers inventory agreed | **PASS** | Matches plan baseline table; no rebuild proposed |
| Open gaps list matches plan table | **PASS** | P1–P7 map unchanged (009/010, NEXUS∉CONDUCTOR, etc.) |

## Automated gates

### `npm run test:clinical-proof` — PASS (exit 0)

| Suite | Result |
|---|---|
| Cohort / FHIR shape / FHIR R4 | OK |
| Knowledge graph (mock) | OK (`mode=mock connected=false`) |
| HITL non-bypass + HITL→FHIR→sim chain | OK |
| SHIELD append-only contract | OK |
| RBAC / golden paths / learning / perf / hazard | OK |
| Medplum dry-run flag | OK |
| Tenant isolation | OK |
| Agent orchestration | OK (GUARDIAN→ORACLE→SYNTHESIS when urgent) |
| NEXUS agent (standalone) | OK (`mode=deterministic`) |
| Precision health phases 1–3 + whole-loop | OK |
| Clinical spine Phases A–F | OK (F: `flipBlocked=true`) |

### `npm run typecheck` — PASS (exit 0)

`tsc -p tsconfig.verify.json --pretty false`

## Honesty spot-checks — PASS

| Check | Result | Evidence |
|---|---|---|
| Orchestrate capabilities `hitlRequired:true` | PASS | `getClinicalSpineOrchestrateCapabilities()` → `hitlRequired:true`, `liveEmis:false`, `ehrWrite:false` |
| Partner readiness `liveEmis:false` | PASS | `buildPartnerReadinessPack().honesty.liveEmis === false`; route hard-codes `liveEmis: false` |
| No `certified:true` unlock path | PASS | `POST /api/clinical-spine/partner-gates` rejects `body.certified === true` / `unlocksLiveEmis === true`; repository always persists `certified:false` |
| Spine docs still present | PASS | `docs/PHASE_A_COMPLETE.md` · `CLINICAL_SPINE_PHASE_{B–F}.md` · Phase A–F tests green |

## Critical-path smoke (static / module) — PASS

| Path | Result |
|---|---|
| Sign-in | `app/signin/page.tsx` + legacy redirect `app/auth/signin/page.tsx` present |
| Sign-up | `app/signup/page.tsx` renders `SignUpForm` |
| How it works | `app/how-it-works/page.tsx` — HITL / no live EHR copy |
| Orchestrate | `lib/clinical-spine/orchestrate.ts` + `ClinicalOrchestratePanel` present |
| SHIELD | `app/api/audit/shield/route.ts` present; clinical-proof SHIELD contract OK |
| Partner readiness API | `app/api/clinical-spine/partner-readiness/route.ts` present |

*(Full browser smoke / Playwright not required for P0; deferred to P4/P6.)*

## Fixes shipped in P0

**None.** Baseline was already green — no P0 blockers.

## Honesty invariants (locked)

- `liveEmis: false` (hard)
- HITL mandatory on orchestrate (`hitlRequired: true`)
- No fake certifications (`certified:true` rejected)
- NEXUS standalone OK; **not** claimed in CONDUCTOR (P2)
- Medplum / Neo4j dry-run / mock when credentials absent

## DONE layers — do not rebuild

Auth/onboarding (NextAuth + Neon) · SHIELD · Neo4j · SYNTHESIS/GUARDIAN/HORIZON · CONDUCTOR orchestrate · HITL · Medplum dry-run · Clinical spine A–F · NEXUS API (standalone).

## What’s next — P1

**P1 — Neon durability:** apply `db/migrations/009_practices.sql` and `010_consent_grants.sql` to target Neon; verify practices + consent grant round-trip; keep file fallback.

See [`PHASED_BUILD_AND_AUDIT_PLAN.md`](./PHASED_BUILD_AND_AUDIT_PLAN.md).
