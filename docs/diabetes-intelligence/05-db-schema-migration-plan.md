# 05 — DB schema inventory + migration plan

**Schema:** `aksh.*`  
**Runner:** `npm run db:migrate` → `scripts/db-migrate.ts` (ledger `aksh.schema_migrations`)  
**Environment rule:** Apply new migrations on Neon **local-dev / simulation only**. Never write production Neon main from agent workflows. Never edit checksums of applied migrations.

## Inventory (extension-relevant)

| Table / view | Role |
|--------------|------|
| `network_patients` | Org patients; diabetes profile columns |
| `network_observations` | Labs, glucose, CGM aggregates; `verified`, provenance |
| `personal_readings` | Pre-link / patient app readings |
| `cgm_uploads`, `cgm_readings`, `cgm_upload_reviews`, view `cgm_trusted_readings` | CGM |
| `patient_state_facts` | Append-only longitudinal facts (diabetes ingest) |
| `review_cases` | HITL cases (JSONB payload) |
| `shield_audit_events` | Hash-chained clinical decision audit |
| `learning_events` | Accept/edit/reject/defer learning |
| `handoff_tasks` | Access workflow follow-ups |
| `network_audit_events` | Org audit |
| `consent_*` | Consent |
| *(no prior)* `care_plan_records` | **Added in 043** — durable care plans |
| *(no prior)* `care_follow_up_tasks` | **Added in 043** — care-plan follow-ups |
| *(no prior)* `care_journey_events` | **Added in 043** — append-only journey audit |
| *(no prior)* `patient_conditions` … `patient_sharing_preferences` | **Added in 044** — Patient 360 foundation spine |

Full migration list: `001`–`028`, `030`–`042` (no `029`), **`043_diabetes_care_journey.sql`**, **`044_patient_intelligence_foundation.sql`**, **`045_diabetes_glucose_intelligence.sql`**.

## Migration plan

### Applied by Phase 0 delivery (local-dev)

**`043_diabetes_care_journey.sql`**

- `aksh.care_plan_records` — draft/approved/rejected/superseded; sections JSONB; `ehr_write = false`
- `aksh.care_plan_decisions` — append-only Accept/Edit/Reject with actor + timestamps
- `aksh.care_follow_up_tasks` — owner, status, due_at, closed_at, plan_id FK
- `aksh.care_journey_events` — append-only timeline events for the connected journey
- RLS aligned to `aksh_tenant` + org context where `organisation_id` present; simulation scope key supported for file/pg dual path

### Applied by Phase 1 delivery (local-dev)

**`044_patient_intelligence_foundation.sql`**

- `patient_conditions`, `patient_allergies`, `patient_family_history`
- `patient_diabetes_profiles` (typed classification)
- `patient_encounters`, `patient_observation_items` (labs/vitals + quality flags)
- `medication_reconciliation_runs` (HITL scaffolding; `autonomous_prescribe` / `ehr_write` false)
- `patient_care_assignments`, `patient_sharing_preferences` (append-only)
- RLS org-null-or-ctx pattern; file fallback for unit tests

### Applied by Phase 2 delivery (local-dev)

**`045_diabetes_glucose_intelligence.sql`**

- `glucose_series_readings` — CGM / SMBG / lab HbA1c staging with quality flags
- `glucose_intelligence_reviews` — DRAFT→APPROVED/REJECTED HITL reviews (`ehr_write` false)
- `glucose_intelligence_review_decisions` — append-only Accept/Edit/Reject
- RLS org-null-or-ctx pattern; file fallback for unit tests

### Applied by Phase 3 delivery (local-dev)

**`046_medication_personalised_care.sql`**

- `medcare_safety_flags` — clinician-reviewed medication safety flags (`ehr_write` / `autonomous_prescribe` / `validated_cds` false)
- `medcare_safety_reviews` + append-only `medcare_safety_review_decisions`
- `medcare_care_plans` — individualised template drafts (HITL)
- `medcare_patient_goals`, `medcare_assigned_tasks`, `medcare_handoffs`
- `medcare_approval_history` — append-only review/approval trail
- Interaction checks remain application-layer **synthetic stubs** (not a licensed drug DB table)
- RLS org-null-or-ctx pattern; file fallback for unit tests

### Near-term (Phases 4+)

| Migration | Intent |
|-----------|--------|
| `047` (planned) | Optional link `care_plan_records.patient_id` → `network_patients` when org-scoped |
| `048` (planned) | Materialized missing-data summary table if query cost warrants |
| `049` (planned) | Optional projection bridges Patient 360 / glucose / medcare spine ↔ `network_*` / `cgm_*` |

### Explicit non-goals

- No destructive rewrite of `network_observations` or `patient_state_facts`
- No drop of `handoff_tasks` (access product remains)
- No production apply from this agent session

## Application dual path

Repositories prefer Postgres when `DATABASE_URL` / `USE_POSTGRES` configured; otherwise JSON file fallback under `data/` (same pattern as Patient State / health plans) so unit tests remain runnable without Neon.
