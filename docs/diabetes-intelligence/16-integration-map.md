# 16 — Integration map (post-implementation audit)

**Date:** 30 October 2026  
**Package:** `packages/platform-uk`  
**LIVE_ORGANISATIONS:** `0`  
**Scope:** Trace Patient 360 → glucose intelligence → medication-care → care-plan approval → continuous care → longitudinal timeline → agent intelligence (Phase 6 = domain registry only).

## Verdict

Phases 0–6 ship as synthetic modules keyed by mock-cohort `patientId` (canonical demo: **P002**) and authenticated **`scopeKey` (= user id)**. **INT-01 mitigated:** `runConnectedDiabetesPipeline` + `/api/patients/[id]/connected-diabetes` (+ dashboard Pipeline step) walks Patient 360 → glucose → meds → journey care-plan draft → continuous care → agent intel with shared context. HITL Accept/Edit/Reject is **not** auto-applied. Safety posture holds: `ehrWrite: false`, no autonomous prescribe/treatment. Unvalidated intelligence remains **`synthetic_demo`**. Neon production schema/data untouched (facades only; no destructive drops).

## End-to-end path (as implemented)

| Step | Module | Primary API | UI | Feeds next automatically? |
|------|--------|-------------|-----|---------------------------|
| 1 Patient 360 | `lib/patient-intelligence/` | `/api/patients/[id]/patient-360` | `/dashboard/gp/patients/[id]/patient-360` | Partial — medcare reads allergies/care team |
| 2 Glucose intelligence | `lib/diabetes-intelligence/glucose-*` | `/api/patients/[id]/diabetes-intelligence` | `…/diabetes-intelligence` + GP worklist | **No** — separate from journey ingest |
| 3 Medication & personalised care | `medcare-*` | `/api/patients/[id]/medication-care` | `…/medication-care` | **No** — own care plans vs journey |
| 4 Care-plan HITL | Journey + medcare | `…/diabetes-journey` + medcare care-plan decisions | journey + medication-care | Dual approval lifecycles |
| 5 Continuous care | `continuous-care-*` | `/api/patients/[id]/continuous-care` | patient + GP/nurse worklists | Seed pattern refs only (no FKs) |
| 6 Longitudinal timeline | Cross-cut | `/api/patients/[id]/timeline` | chart panel + **timeline page** | Merges journey + continuous + precision-health; **omits** glucose/medcare/agent |
| 7 Agent intelligence | `agent-intel-*` | `/api/patients/[id]/agent-intelligence` | patient + GP worklist | Context Engine package feeds drafts; Guardian gates enqueue; live 360/glucose/medcare signals enrich shared context |
| 8 Domain framework | `lib/disease-domains/` | (none) | (none) | Registry only; CVD/CKD/obesity `not_activated` |

## Shared context

| Key | Reality |
|-----|---------|
| `patientId` | URL `[id]` / journey `[patientId]`; mock cohort (`P002`, …) |
| `scopeKey` | `session.user.id` via `requireAuthenticatedUserScope` |
| `organisationId` | **Stamped** on journey care-plan / follow-up writes (default `practice-demo` / tenant `practiceId`); RLS via `aksh.ctx_org_ids()` when set (INT-08 mitigated) |
| Actor | `userEmail ?? userId` on decisions + **`decidedByPersona`** clinical persona (INT-10) |

## Stores (duplication)

| Concern | Store A | Store B | Status |
|---------|---------|---------|--------|
| Care plans | `aksh.care_plan_records` (canonical SoT) | `aksh.medcare_care_plans` (satellite) | **Collapsed write path** — `care-plan-canonical` + bridge; medcare mirrors via `canonical_plan_id`; additive 051 |
| Follow-ups | journey `care_follow_up_tasks` (SoT) | `ccare_follow_up_items` (ops projection) | **Collapsed write path** — `follow-up-canonical` + bridge mirror; additive `entry_surface` (051) |
| Med recon | Patient 360 entry | medcare entry (same table) | **Mitigated** — `med-recon-facade` + `med-recon-canonical` dedupe; `entry_surface` provenance; one physical store |
| Glucose | Phase 2 `glucose_*` (canonical) | disease-module ingest (journey) | **Mitigated** — `glucose-bridge` dual-write + series-first read |
| Timeline | P360 / journey / `/timeline` API | three partial views | **Mitigated** on `/timeline` (glucose/medcare/agent merged) |
| Agent context | mock cohort | live module snapshots | **Mitigated** — `buildSharedPatientContextAsync` |

JSON fallbacks under `packages/platform-uk/data/` when Postgres is off (scoped by `scopeKey`).

## Auth & isolation

- All connected APIs use **`requireAuthenticatedUserScope`**.
- **`denyUnlessConnectedPatientAccess`** (INT-09) gates every patient-scoped module route — wraps `evaluateAppRoleClinicalReadAccess` → `evaluatePatientUrlAccess` (cross-patient / unbound patient / ops-researcher deny). Same posture as `/api/patients/[id]/state`.
- **`denyUnlessConnectedDiabetesDecisionScope`** (INT-10) gates every module Accept/Edit/Reject — GP full; pharmacist med surfaces; nurse continuous-care escalations only; non-clinical denied. Responses expose `decidedByPersona`.
- Tenant isolation = **per-user `scopeKey`** plus **stamped `organisation_id`** on journey writes (INT-08 mitigated; LIVE_ORGANISATIONS=0).

## Provenance

| Surface | Model |
|---------|--------|
| Patient 360 | Rich provenance on spine entities |
| Glucose / journey / medcare | Synthetic flags + actor timestamps; no shared `InformationProvenance` enum |
| Agent drafts | `ai_generated` → `clinician_verified` on HITL (best-in-class) |

## Safety invariants (verified in types + unit tests)

- `ehrWrite: false` on snapshots / decisions
- `autonomousPrescribe` / `prescribeOrTreat` / `autonomousClinicalAction` = false
- HITL required before clinical-looking drafts become “verified” artifacts (still synthetic store only)

## Target integration (remaining)

1. ~~Canonical glucose path~~ — mitigated via `glucose-bridge` (stores retained; dual-write).
2. ~~Canonical care-plan read model~~ — mitigated via facade.
3. ~~Follow-up dual store~~ — mitigated via `follow-up-facade` + bridge (stores retained).
4. ~~Unified timeline projector~~ — mitigated on `/timeline` API; P360 panel still partial (INT-05 residual).
5. ~~Live shared patient context~~ — mitigated via `buildSharedPatientContextAsync`.
6. ~~Org/practice tenancy stamp + RLS proof path~~ (INT-08) + patient URL access (INT-09) + clinical persona (INT-10).
7. Shared `ConnectedPatientChrome` + Pipeline orchestrator entry (shipped).
8. ~~Dual med-recon entry (INT-04)~~ — mitigated via canonical write + facade; physical store was already single-table; additive `entry_surface` (050) for local-dev/sim only.
9. ~~Care-plan / follow-up physical dual-table collapse~~ — mitigated via `care-plan-canonical` / `follow-up-canonical` + additive 051 link/`entry_surface` columns (local-dev/sim only; satellites retained, no Neon prod drops).

## Related defects

See [18-defect-register.md](./18-defect-register.md) (INT-01 … INT-15).
