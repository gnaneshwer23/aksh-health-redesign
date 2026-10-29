# 03 — Feature-gap matrix (Phases 1–6)

**Classification keys**

| Key | Meaning |
|-----|---------|
| `implemented+tested` | Code + tests; may still be `in_validation` clinically |
| `incomplete` | Partial implementation |
| `synthetic_demo` | End-to-end on synthetic data only |
| `planned` | Not built |
| `research/validation` | Needs clinical/safety/eval work before release |

Statuses below are product reality, not marketing. Capability register remains authoritative for public claims.

## Phase 1 — Foundations (patient identity, facts, audit)

| Feature | Status | Evidence / notes |
|---------|--------|------------------|
| Org isolation / RLS | `implemented+tested` | care-network tests; production capability |
| Patient State append-only facts | `implemented+tested` | migration 013; ingest tests |
| SHIELD / append-only audit | `implemented+tested` | shield_audit_events |
| Consent model | `implemented+tested` | consent capabilities |
| LIVE orgs on real patients | `research/validation` | LIVE_ORGANISATIONS=0 |

## Phase 2 — Glucose & history

| Feature | Status | Evidence / notes |
|---------|--------|------------------|
| CGM monitoring worklist | `implemented+tested` | `cgm_monitoring` production (code) |
| Patient-reported readings | `implemented+tested` | `patient_readings` |
| Lab HbA1c / renal / lipids | `implemented+tested` | `lab_results` |
| Diabetes module glucose/HbA1c signals | `incomplete` / `synthetic_demo` | Flag-gated; glucose often `insufficient_data` until enough points |
| Clinical history → Patient 360 unified view | `incomplete` → **slice closes synthetic path** | Journey workspace |
| Missing-data indicators | `incomplete` → **slice adds explicit indicators** | CGM monitoring has stale/gap concepts |

## Phase 3 — Clinician review & care plan

| Feature | Status | Evidence / notes |
|---------|--------|------------------|
| Review queue Accept/Edit/Reject | `implemented+tested` | `in_validation` clinically |
| Health plan draft artifact | `synthetic_demo` | Always DRAFT; JSON store |
| **Approved care plan after HITL** | was `planned` → **`synthetic_demo` in this slice** | Postgres + file fallback |
| Notes/coding drafts | `implemented+tested` | `in_validation` |
| Medication safety / referrals | `implemented+tested` | `in_validation`; no auto prescribe |

## Phase 4 — Follow-up & longitudinal

| Feature | Status | Evidence / notes |
|---------|--------|------------------|
| Access handoff_tasks | `implemented+tested` | Slot-fill oriented |
| **Care-plan follow-up (owner/status/audit)** | was `planned` → **`synthetic_demo` in this slice** | |
| Longitudinal timeline (cases + modalities) | `incomplete` | Existing timeline API |
| **Journey timeline including plan + follow-up** | **`synthetic_demo` in this slice** | |
| Outbound recall campaigns | `planned` | capability |

## Phase 5 — Multi-agent diabetes intelligence

| Feature | Status | Evidence / notes |
|---------|--------|------------------|
| CONDUCTOR + specialists (sim) | `implemented+tested` | agents `in_validation` |
| AKSH_DIABETES analyse in loop | `incomplete` | Present in register/loop; flag-gated wiring |
| HbA1c trends / complications / lifestyle | `implemented+tested` | capabilities `in_validation` |
| PRISM / ATLAS | `planned` | |
| Continuous learning from Accept/Edit/Reject | `incomplete` | learning_events exist |

## Phase 6 — Production readiness & integrations

| Feature | Status | Evidence / notes |
|---------|--------|------------------|
| Clinical safety case / CSO sign-off | `research/validation` | releaseCriteria on clinical caps |
| DPIA / regulatory opinion | `research/validation` | |
| Live EHR write | `planned` / prohibited until gates | `liveEmis: false` |
| Live device vendor integrations | `incomplete` | connector patterns; not claimed live |
| Org go-live | `research/validation` | LIVE_ORGANISATIONS=0 |

## Vertical slice coverage (this delivery)

| Beat | Classification |
|------|----------------|
| Synthetic patient history | `synthetic_demo` |
| Glucose observations + missing-data | `synthetic_demo` |
| Clinician review Accept/Edit/Reject on care plan | `synthetic_demo` |
| Approved care plan persistence | `synthetic_demo` |
| Follow-up task | `synthetic_demo` |
| Longitudinal journey timeline | `synthetic_demo` |
