# 18 — Prioritised defect register (integration / UX / safety)

**Date:** 30 October 2026  
**Source:** Post-implementation integration audit (doc 16) + UX audit (doc 20).  
**Policy:** Small bugs may be fixed in the validation PRs; larger items stay registered.

| ID | Severity | Area | Title | Detail | Disposition |
|----|----------|------|-------|--------|-------------|
| INT-01 | **High** | Integration | No cross-phase data orchestration | Modules share `patientId` only; no pipeline assembles downstream inputs | **Mitigated** — `runConnectedDiabetesPipeline` + `/api/patients/[id]/connected-diabetes` + dashboard Pipeline step; HITL gates retained |
| INT-02 | **High** | Integration | Dual glucose pipelines | Journey ingest vs `glucose-repository` / Phase 2 workspace | **Mitigated** — `glucose-bridge` dual-writes journey → canonical `glucose_series_readings`; journey panel prefers series (legacy ingest fallback). Stores not collapsed/dropped. |
| INT-03 | **High** | Integration | Dual care-plan systems | Journey `care_plan_records` vs medcare `medcare_care_plans` | **Mitigated** — canonical write path `care-plan-canonical` / bridge; physical SoT `care_plan_records` with additive `entry_surface` + `medcare_plan_id` (051); medcare satellite keeps template metadata via `canonical_plan_id`; facade dedupes linked rows. No Neon prod drops. |
| INT-04 | Medium | Integration | Dual med-recon entry points | `patient-360` vs `medication-care` both start recon | **Mitigated** — `med-recon-facade` unified read + `med-recon-canonical` shared start/decide (dedupe open runs); single physical store `medication_reconciliation_runs` with additive `entry_surface` (050, local-dev/sim only). Surfaces retain own URLs + INT-10 persona kinds. No Neon prod drops. |
| INT-04a | Medium | Integration | Dual follow-up stores | Journey `care_follow_up_tasks` vs `ccare_follow_up_items` | **Mitigated** — canonical write `follow-up-canonical` → SoT `care_follow_up_tasks` + ops projection mirror; additive `entry_surface` (051); facade tags ccare journey mirrors as `isOpsProjection`. No Neon prod drops. |
| INT-05 | Medium | Integration | Timeline incomplete | `/timeline` + P360 omit glucose/medcare/agent events | **Mitigated** — `/timeline` merges glucose/medcare/agent; P360 `buildTimeline` now also merges capped glucose series/reviews, medcare history, agent history. |
| INT-06 | Medium | UX | Broken timeline page link | Continuous care linked to missing `/patients/[id]/timeline` page | **Fixed** — timeline page + chrome |
| INT-07 | Medium | Integration | Agent shared context mock-only | `buildSharedPatientContext` does not load 360/glucose/medcare | **Mitigated** — `buildSharedPatientContextAsync` loads live module counts into sources; sync helper remains for deterministic drafts |
| INT-08 | Medium | Tenancy | `organisation_id` unused | DB column on 043; never set/filtered | **Mitigated** — writes stamp `organisation_id` (default `practice-demo` / tenant practiceId); migration `049` persona columns + org indexes; `withOrgContext` RLS proof test. LIVE_ORGANISATIONS stays 0; Neon prod untouched. |
| INT-16 | Medium | Tenancy | Deterministic row PKs collide across `scope_key` | Medcare seed IDs (`goal-P002-…`) are global PKs; second user’s seed races first. Mitigated with `ON CONFLICT DO UPDATE` on seed replace. | **Mitigated** — still prefer composite keys later |
| INT-09 | **High** | Auth | Weak API patient access | No `evaluatePatientUrlAccess` on connected diabetes routes | **Fixed** — `denyUnlessConnectedPatientAccess` (`evaluateAppRoleClinicalReadAccess` → `evaluatePatientUrlAccess`) on all patient-scoped connected diabetes APIs; see `tests/connected-patient-api-access.test.ts`. |
| INT-10 | Medium | Auth | No clinical persona on module decisions | `evaluateDecisionScope` not on Accept/Edit/Reject | **Fixed** — `evaluateConnectedDiabetesDecisionScope` / `denyUnlessConnectedDiabetesDecisionScope` on all module decision routes; responses include `decidedByPersona`; journey persists `actor_persona` / `decided_by_persona`. |
| INT-11 | Low | UX | Route param inconsistency | `[id]` vs `diabetes-journey/[patientId]` | **Fixed** — GP diabetes-journey page uses `[id]` (aligned with patient APIs / other dashboard routes). |
| INT-12 | Low | UX | Worklists hard-code P002 | Empty-state demo links only | **Open** (mitigated by chrome + catalog) |
| INT-13 | Medium | Provenance | Provenance model split | Agent enum vs glucose/journey/medcare | **Open** |
| INT-14 | Low | UX | Patient 360 nav incomplete | Missing continuous-care / agent links | **Mitigated** — ConnectedPatientChrome |
| INT-15 | Info | Phase 6 | No API/UI for domain framework | By design (registry) | **Accepted** |
| UX-01 | Medium | Discovery | Sidebar omits connected diabetes | Orphan routes unless patient-chart deep link | **Mitigated** — synthetic sidebar group |
| UX-02 | Medium | Demo | No flagship connected journey demo | `/demo` only slot-fill + glucose ops | **Fixed** — `/demo/connected-diabetes` |
| UX-03 | Low | A11y | Loading states lack `aria-busy` / live regions | Toast-only errors on several workspaces | **Open** (partial chrome loading) |
| UX-04 | Medium | Visual | Dual style systems | Tailwind tokens (360/journey) vs inline styles (phases 2–5) | **Open** |
| SAFE-01 | Info | Safety | Unvalidated intelligence labelled | Must stay `synthetic_demo` | **Policy hold** |
| SAFE-02 | Info | Safety | LIVE_ORGANISATIONS | Remains `0` unless evidence | **Policy hold** |
| GOV-01 | **Blocker** | Release | No CSO-signed clinical safety case | Blocks live diabetes clinical AI | **Open** — see doc 21/22 |
| GOV-02 | **Blocker** | Release | No DPIA / regulatory opinion for workflow | Blocks live use | **Open** |
| GOV-03 | **Blocker** | Release | No approved org go-live | LIVE_ORGANISATIONS=0 | **Open** |

## Severity legend

- **Blocker** — prevents any live-patient / production clinical claim  
- **High** — incorrect integration or security gap for future live use  
- **Medium** — honesty / UX / maintainability risk  
- **Low / Info** — polish or accepted design
