# Aksh Health UK/EU 10-Layer Architecture Build Map

Updated: 3 May 2026

Source board: `Aksh Health UK/Europe -- 10-Layer NHS Intelligence Architecture`

## Positioning Boundary

This repository is following the 10-layer architecture as a sequenced product build map, but the current implementation remains a synthetic, own-system proof. It does not claim live NHS integration, real patient data handling, production clinical software, production clinical AI, or autonomous clinical decisioning.

Current build rule:

`prove the workflow internally first -> protect boundaries with contracts/tests -> only then prepare adapters`

## Layer-By-Layer Build Status

| Layer | Board Intent | Built Now | Current Status | Next Build Needed |
| --- | --- | --- | --- | --- |
| L1 Data Ingestion | Voice/notes, public health/SDOH, genomics, wearables, imaging/labs, EMIS/SystmOne | Synthetic intake, simulated patient profiles, deterministic note-to-draft generation, six-category L1 synthetic source fixture catalog | Strong synthetic proof | Add route/UI surfacing for fixture catalog only if useful. Keep EMIS/SystmOne as placeholders only. |
| L2 Data Harmonisation & FHIR Mapping | FHIR R4 mapping, event streams, GDPR boundaries, NHS Login/CIS2 | FHIR-shaped draft model, export mapping, validation summaries, synthetic-only export metadata | Strong proof | Add stronger internal canonical mapping checks and keep authentication as proof-grade only. No NHS Login/CIS2 claim yet. |
| L3 Voice Intelligence | ASR, clinical NLP, SOAP generation, phone/channel equity | Intake route, deterministic draft generation, research boundary, no live model deployment | Early proof | Add route-level tests for intake generation and explicit transcription dependency boundaries. No production ASR/NLP claim yet. |
| L4 AI Orchestration + Human Gates | Stateful workflows, healthcare MCP, A2A, mandatory human gates | Review-first workflow, acceptance blockers, finalization states, reviewer override/checklist guards, explicit persisted red-flag/referral/medication human-gate decisions | Strong proof | Add deeper human-gate analytics after the current UI/route contract seams stay green. |
| L5 Seven AI Agents | EQUITY, SYNTHESIS, DrASSIST, VOICE, SHIELD, GUARDIAN, ORACLE | Domain modules for intake, safety, validation, remediation, benchmarks, governance, research evaluation | Partial proof | Name agent-like internal modules carefully as workstreams, not autonomous agents. Build workstream dashboards only where useful. |
| L6 Persistence Moat | FHIR persistence, graph, vector, time-series stores | JSON proof repository, frozen artifacts, evidence registry, database adapter contract, repository parity tests | Strong proof for JSON | Keep JSON active. Define adapter parity before any database. Do not switch to Medplum/graph/vector/time-series yet. |
| L7 Insight & Simulation | NICE-grounded CDS, equity dashboard, QOF gaps, trial eligibility | Safety flags, clinical rule coverage, simulated patients, benchmark evidence, research evaluation boundary | Partial proof | Add synthetic insight packs for equity, NICE/BNF-style rules, QOF-like gaps, and trial eligibility as mock-only evidence. |
| L8 Multi-Stakeholder Outputs | GP, patient, practice manager, audit, research outputs | Landing, onboarding, dashboards, command centre, governance pack, reports, evidence pages | Strong proof | Refine role-specific dashboards into clearer personas without claiming live SMART-on-FHIR/NHS App integration. |
| L9 Actions & Clinical Outcomes | GP-approved decisions, safety-netting, pathway actions, research contribution | Accept/reject/defer, reviewer notes, override reasons, frozen artifacts, activity timelines, reviewer-confirmed safety-netting/referral/medication draft actions | Strong synthetic proof | Add action-outcome analytics only after enough synthetic review sessions exist. |
| L10 Outcome Capture & Learning | Outcomes, equity monitoring, federated learning, FDP analytics | Benchmark history, readiness history, research evaluation boundary, L10 synthetic outcome-capture schema, no live training | Strong synthetic proof | Keep federated learning/FDP as future research boundaries; do not connect live learning. |

## What We Are Following In Sequence

The current build has deliberately prioritized the middle of the architecture first because that is the safest proof path:

1. `L4-L6 core workflow and persistence`: review-first workflow, safety/finalization logic, frozen artifacts, JSON persistence, evidence exports, and repository parity.
2. `L8 stakeholder surfaces`: landing, onboarding, dashboards, command centre, governance pack, reports, clean-demo readiness.
3. `L2 evidence/FHIR proof`: FHIR-shaped export mapping, validation summaries, resource references, evidence registry.
4. `L7/L10 validation memory`: benchmarks, readiness history, research evaluation boundary, and synthetic-only evaluation artifacts.
5. `L1/L9/L10 proof extensions`: six source fixture catalog, persisted human-gate decisions, reviewer-confirmed action drafts, and synthetic outcome capture for offline evaluation.
6. `L3/L5 next`: voice/intake dependency boundaries and careful agent/workstream framing without autonomous-agent claims.

This is slightly different from building layer 1 to layer 10 in strict order, and that is intentional. The safest sequence is to prove human review, evidence, storage, and governance before adding more ingestion or intelligence breadth.

## Built Guardrails

- `lib/system-contracts.ts` defines own-system boundaries, database adapter contracts, and required repository parity checks.
- `/api/system/database-contract` exports the current storage contract.
- `/api/research/evaluation` exports the offline research boundary.
- `tests/repository-parity.test.ts` protects JSON repository behavior before any future database adapter can replace it.
- `tests/readonly-route-contracts.test.ts` calls the real read-only API route handlers with test-only authenticated headers.
- `tests/api-contracts.test.ts` protects synthetic-only evidence and disabled integration defaults.

## Current Build Truth

Built:

- Synthetic intake and generated draft workflow.
- FHIR-shaped draft and export evidence.
- Review queue, case detail, decisions, overrides, checklists, timeline, and field-change history.
- Safety flags, blockers, finalization states, benchmark checks, readiness gates, and validation dossiers.
- Frozen accepted artifacts and evidence registry.
- Simulated patient cohort.
- Governance pack and research evaluation boundary.
- Command centre, onboarding, dashboards, roadmap, ops, reports, and demo readiness.
- JSON proof storage with repository parity tests.
- Persisted human-gate decisions attached to cases and frozen evidence artifacts.
- L1 synthetic source fixture catalog for the six ingestion categories.
- L9 reviewer-confirmed action drafts for safety-netting, referral/pathway, and medication decisions.
- L10 synthetic outcome-capture schema for offline benchmark/evaluation learning.

Not built yet:

- Live NHS/EHR integrations.
- NHS Login/CIS2 production authentication.
- Real patient data handling.
- Production clinical safety case.
- Production database adapter.
- Live ASR/NLP/model deployment.
- Federated learning or NHS FDP integration.

## Recommended Next Sequence

1. Keep endpoint route contracts, repository parity, verify, and build green after each architecture slice.
2. Add browser-level smoke assertions for persisted human-gate decisions and evidence/report outcome panels.
3. Add route/export surfacing for the L1 fixture catalog if it helps demos or architecture walkthroughs.
4. Add synthetic action-outcome analytics only after enough reviewer-confirmed synthetic sessions exist.
5. Continue splitting large evidence/report surfaces while preserving route behavior.
