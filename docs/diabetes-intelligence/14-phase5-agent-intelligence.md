# Phase 5 — Agent intelligence / AI orchestration

**Date:** 29 October 2026  
**Status:** Synthetic demo scaffolding in `packages/platform-uk`  
**Capability:** `diabetes_agent_intelligence` = `synthetic_demo`  
**Evidence:** `tests/diabetes-agent-intelligence.test.ts`  
**LIVE_ORGANISATIONS:** `0` — not clinically validated; **not production clinical AI**.

## What shipped

| Surface | Path |
|---------|------|
| Domain | `lib/diabetes-intelligence/agent-intel-*.ts` |
| Migration | `048_diabetes_agent_intelligence.sql` (local-dev / simulation only) |
| API | `GET/POST /api/patients/[id]/agent-intelligence` |
| Draft HITL | `POST .../agent-intelligence/draft/[draftId]/decision` |
| GP worklist | `GET /api/gp/agent-intelligence/worklist` |
| GP UI | `/dashboard/gp/patients/[id]/agent-intelligence` |
| GP worklist UI | `/dashboard/gp/agent-intelligence` |

## Coverage vs BUILD DIRECTIVE

| Feature | Classification | Notes |
|---------|----------------|-------|
| Patient history summarisation | `synthetic_demo` | Deterministic draft; AI-generated until HITL |
| Clinical documentation drafting | `synthetic_demo` | SOAP structured output + validation |
| Missing-information identification | `synthetic_demo` | Rules over shared context |
| Evidence-grounded retrieval | `synthetic_demo` | Synthetic corpus + citations |
| Follow-up draft generation | `synthetic_demo` | Aligns with continuous-care patterns after Accept |
| Clinician approval gates | `synthetic_demo` | Accept / Edit / Reject |
| Structured model output validation | `synthetic_demo` | `validateStructuredDraft` |
| Model and prompt version tracking | `synthetic_demo` | Append-only registry; pinned on every draft |
| Evaluation datasets / regression | `synthetic_demo` | Offline eval suite (P002, P007) |
| AI vs verified distinction | `synthetic_demo` | `provenance` + `verifiedClinical` |
| Shared patient context | `synthetic_demo` | Reuses cohort + P360 / journey / glucose / medcare / continuous-care / agents register — no silos |

Drafting mode is **`deterministic_synthetic`** (offline-safe). Live LLM remains gated and is **not** required for tests; capability does not claim production clinical AI.

## How to try

1. From `packages/platform-uk`: `.env.local` → Neon **local-dev** only.
2. Optional: `npm run db:migrate -- --apply` for `048` (never production main).
3. `npx tsx tests/diabetes-agent-intelligence.test.ts`
4. Authenticated GP: `/dashboard/gp/patients/P002/agent-intelligence` → **Run orchestration** → Accept/Edit/Reject drafts.
5. Worklist: `/dashboard/gp/agent-intelligence`.

## Explicit non-claims

- No autonomous prescribe / treatment (`prescribeOrTreat: false`).
- No EHR write (`ehrWrite: false`).
- Not clinically validated or regulatory-approved.
- Not a live NICE/BNF connector — evidence corpus is synthetic.
- Disease module remains rules-first; ML promotion only under governance.

## Still incomplete / deferred

- Learning-loop feedback into signal thresholds with full audit productization
- Org FK + RLS proof against live organisations
- Playwright E2E for agent intelligence
- Capability promotion beyond `synthetic_demo` (requires CLINICAL_RELEASE)
- Optional gated LLM drafting behind env (tests stay offline)
