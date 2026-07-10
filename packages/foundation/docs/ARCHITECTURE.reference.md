# UK V1 App Architecture

## Goal
Ship a narrow clinician-review workflow that proves:
- structured draft generation
- safety gating
- clinician decision capture
- FHIR-oriented persistence
- auditability

## App Shape
- `Dashboard`: entry point showing queue, status, and safety summary
- `Review Queue`: list of pending clinician-review cases
- `Case Review`: draft summary, safety flags, editable sections, final decision
- `Audit View`: timeline of workflow events

## Technical Layers
- `app/`: page routes and layout
- `components/review/`: workflow-specific UI
- `lib/types.ts`: workflow contracts
- `lib/mock-data.ts`: synthetic proof data
- `lib/workflow.ts`: derived state helpers and decision actions

## Initial Boundaries
- synthetic data only
- no live EHR integration
- no production write-back
- no patient-facing workflow
- one review-first use case only

## First Build Priority
1. stable workflow data model
2. case review screen
3. safety flag panel
4. decision actions
5. audit event display
