# Aksh agents: register, loop, rules and provenance

**Date:** 20 October 2026 · Internal. Sources: Volume I PRD Ch.5 and Ch.7 (FR-AGT-001…038), journey FLOW-JRN-1, the
July 2026 naming reference, `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md`.

## Register (`lib/agents/register.ts`)

14 contracts: the 12 directory agents plus VOICE (part of CANVAS) and DrAssist (part of SYNTHESIS). Each states product
name, legacy ids, role, loop stage, trigger, inputs, outputs, review item, human gate, reviewer, model permission,
data it may read, prohibited actions, failure behaviour, PRD requirements, test evidence and status.

| Code id | Product name | Stage | Trigger | Review item / gate | Model flag | Status |
|---|---|---|---|---|---|---|
| CONDUCTOR | Aksh Orchestrator | orchestrate | case run | — | none | In validation |
| VOICE | Aksh Voice (part of CANVAS) | intake | intake session | voice_transcript | none | In validation |
| CANVAS | Aksh Canvas | intake | intake session | — | none | In validation |
| SYNTHESIS | Aksh Synthesis | draft | CONDUCTOR, parallel | soap_note | SYNTHESIS | In validation |
| DrASSIST | DrAssist AI (part of SYNTHESIS) | code | CONDUCTOR, after | diagnosis_codes | DR_ASSIST | In validation |
| GUARDIAN | Aksh Guardian | safety | CONDUCTOR, parallel | guardian_alert · medication_decision | GUARDIAN | In validation |
| HORIZON (ORACLE) | Aksh Horizon | risk | CONDUCTOR, parallel | oracle_update | ORACLE | In validation |
| NEXUS | Aksh Nexus | correlate | CONDUCTOR, parallel | review-only input | NEXUS | In validation |
| PATHWAY (REFERRAL) | Aksh Pathway | coordinate | after note + codes accepted | referral_package · referral_pathway | none | In validation |
| BRIDGE | Aksh Bridge | stage | after case accepted | — | none | In validation |
| SHIELD | Aksh Shield | audit | every event | — | none | In validation |
| COMPASS (EQUITY) | Aksh Compass | population | on request | reviewed by requester | EQUITY | In validation |
| PRISM | Aksh Prism | imaging | never | — | none | Planned |
| ATLAS | Aksh Trials Agent | research | never | — | none | Planned |

No agent runs on real patients in production: the LLM gate refuses model calls there and the agent APIs are closed.

## The loop (FLOW-JRN-1, now in code)

1. **Capture / structure** — VOICE → CANVAS (intake sessions).
2. **Analyse** — Aksh Diabetes turns glucose, HbA1c, laboratory results and complications into HORIZON factors and
   GUARDIAN notes (`lib/clinical-spine/spine-patient.ts`, labs from `aksh.network_observations`).
3. **Draft** — CONDUCTOR runs SYNTHESIS, GUARDIAN, HORIZON, NEXUS in parallel, then DrAssist; sets priority, review
   order (from the register) and safety route. **SHIELD records the run (awaited, reported).**
4. **Enqueue (new)** — `POST /api/network/patients/:id/clinical-review` turns the drafts into a review case in review
   order (`lib/clinical-spine/enqueue.ts`), labelled `ai_draft`, unless GUARDIAN blocks. Referrals indicated by the
   complication checks are held on the case (`agentRun.pendingReferrals`) with their evidence and rule ids.
5. **Decide** — the clinician accepts, edits or rejects each draft and decides gates and the case, all on the server
   with the signed-in identity, version checks and the audit row in the same transaction (#36, #45).
6. **Coordinate (new)** — once the note and codes are accepted, PATHWAY drafts one referral per held referral
   (`draftPendingReferrals`); a clinician confirms it (referral gate).
7. **Stage** — case accept → BRIDGE stages FHIR R4; result shown; nothing written to a live record.
8. **Learn** — each decision writes a learning event; outcomes link later; releases are manual (G-ML-1/2/3).
9. **Population** — COMPASS on request, aggregates only. Since 21 Oct it also returns the organisation's own loop
   outcomes (`lib/clinical-spine/loop-outcomes.ts`): agent reviews, drafts accepted / edited / rejected per agent,
   rejection and accepted-unedited rates (shown only with 5 or more decided drafts), referrals held / drafted /
   confirmed by domain, and the most often missing results. Counts 1–4 are shown as "<5"; no patient is named. These
   are the measures each agent's release criteria use.

## Rules (`lib/rules/registry.ts`)

18 rules with source, version, effective date, sign-off state and the exact code fragment they live in; the test fails
if a threshold changes without the registry. Clinical thresholds are `pending_clinical_lead`; only data-quality and
workflow rules are `operational`. Complication flags cite the rule ids that fired.

## Provenance (`lib/provenance.ts`)

observed · patient_reported · calculated · ai_draft · clinician_confirmed. Laboratory results carry it in the agents'
view and the patient record; every enqueued draft is `ai_draft`.

## Tests

`tests/agent-register.test.ts`, `tests/rule-registry.test.ts`, `tests/agent-loop.test.ts` (pure loop: run → drafts in
order → accept note and codes → PATHWAY referral), `tests/patient-spine-db.test.ts` (simulation DB: run audited, case
stored, decision persisted with audit).

## Release criteria (21 Oct)

Each runnable agent in the register has release criteria (`release`), and `GET /api/agents/readiness` measures them
against the organisation's agent-loop results (`lib/agents/readiness.ts`). Numeric targets are **proposed** until the
clinical safety officer confirms them (`targetsConfirmedBy`); no agent is ever ready on numbers alone.

| Agent | Decided drafts | Rejection rate | Accepted without edits | Other |
|---|---|---|---|---|
| SYNTHESIS | ≥ 50 | ≤ 10% | ≥ 60% | — |
| DrAssist | ≥ 50 | ≤ 10% | ≥ 70% | — |
| GUARDIAN | ≥ 50 | ≤ 20% | — | hazard test set: every known red interaction flagged |
| HORIZON | ≥ 50 | ≤ 15% | — | — |
| PATHWAY | ≥ 20 | — | — | ≥ 80% of referral drafts confirmed; referral thresholds signed off |
| Others | — | — | — | sign-offs only (speech-processing decision for VOICE, suppression review for COMPASS, etc.) |

Every agent also needs: clinical safety case and hazard log, DPIA and regulatory opinion, approved go-live.

## Still open

- VOICE live transcription needs a governed decision (on-premise speech recognition or a processor agreement).
- Done 21 Oct: `/api/audit/shield` now takes only fixed actions and agent labels, the user's own cases, stamps the
  signed-in account and practice and marks `origin: dashboard_panel`; reads are limited to the caller's practice.
- Clinical lead sign-off of the registered thresholds; per-organisation guideline selection should pick rule sets.
- Release criteria per agent (capability register) before any agent runs for real patients.
