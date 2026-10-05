# Aksh Synthetic EHR Rehearsal

**Date:** 2026-10-05  
**Scope:** High-fidelity synthetic clinic + HITL → FHIR → simulated EMIS/SystmOne chart round-trip  
**Honesty:** `liveEmis:false` · `realPatientData:false` · `syntheticOnly:true`

## Verdict

| Gate | Decision |
|---|---|
| **Demo clinic (synthetic diabetes)** | **GO** |
| **SIM-IG / SIM-EMR rehearsal** | **Pass** |
| **Live PHI / DPIA (GOV-002)** | **Blocked** — unchanged |
| **Live EMIS / SystmOne partner write** | **Blocked** — unchanged |

This rehearsal does **not** satisfy DPIA/IG for real patient data and does **not** authorize live EMR write-back.

## What was rehearsed

```
SyntheticPatients → ContextEngine → AgentDrafts → HITL Accept
  → BRIDGE FHIR staging → SimulatedEHR chart (EMIS + SystmOne projections)
  → GP “Written to Record” panel
```

Reject never stages and never mutates the simulated chart. `liveEmis` remains `false` on Accept, BRIDGE, and simulated chart entries.

## Synthetic cohort depth

- **P002** flagship aligned to E2E HbA1c 6.8→8.4 and aspirin + proposed apixaban conflict.
- **P001–P026** longitudinal bundles (labs, meds, encounters, allergies, draft seeds) feed Context Engine.
- **P027–P100** generator emits diabetes-primary HbA1c series, eGFR, adherence gaps, and occasional safety/documentation draft seeds.
- Seed artifacts under `data/seed/` retain `syntheticOnly: true`.

## Simulated EHR

- Store: `lib/simulated-ehr/` (file-scoped charts; parallel `simulated_emis` + `simulated_systmone`).
- API: `GET/POST /api/integrations/simulated-ehr` — always returns `liveEmis:false`.
- Accept path (`hitl-writeback-chain` / BRIDGE staging) upserts chart after successful sim write (idempotent on `bridgeStagingId` + partner).
- GP UI: `SimulatedEhrWrittenPanel` on Written-to-Record.

## Master Journey

- **MJ-41-SIMULATED-EHR** — Accept lands DocumentReference/Observation-class resources on simulated chart; reject unchanged; `liveEmis:false`.

## Explicit non-claims

Do **not** mark Master QA **GOV-002** Pass.  
Do **not** claim live EMIS Partner FHIR write, real PHI handling, or DPIA completion from this rehearsal.
