# Stakeholder Integration (Milestone A3)

**Branch:** `feat/milestone-a3-stakeholder-integration`  
**Depends on:** A2 durable orchestration (`feat/milestone-a2-orchestration-persistence` / PR #98)  
**Date:** 2026-10-30

## Goal

Strengthen multi-stakeholder continuity on the **existing** care-episode / Front Desk / GP / nurse / pharmacist paths — without a second CONDUCTOR, queue, or care-episode model. Surface durable run + SHIELD-blocked enqueue status to ops/GP **without PHI leakage**.

## What improved (handoffs)

| Transition | Before A3 | After A3 |
| --- | --- | --- |
| Nurse observations → GP | Visibility via timeline; weak queue task | `handoffNurseToGp` opens GP care-episode task; nurse-vitals API wires it |
| GP review → Pharmacist | Pharmacist spine review exists; no episode task | `handoffGpToPharmacist` opens pharmacist med-review task (HITL only) |
| Care-plan → Patient | Unified plans returned all statuses | `listPatientVisibleCarePlans` / `filterPatientVisibleCarePlans` → **APPROVED only**; patient journey GET + `/api/patients/[id]/care-plans` + companion panel wired; drafts never leak |
| Follow-up ownership | Owner string on journey tasks | `assignFollowUpOwnership` with org boundary + audit stamp |
| Lab / referral drafts | Staged as DRAFT items | `trackLabReferralDraftStatuses` + unified worklist strip |
| Team assignment | Unified worklist only | `mutateReviewQueueAssignment` assign / reassign / escalate + audit API |
| CONDUCTOR ops | Agent Ops readiness/equity only | `/api/agents/ops-runs` + Agent Ops durable-runs table (hashed patient refs) |

## Ops visibility (no PHI)

- `lib/agents/ops-run-visibility.ts` maps durable `agent_intel_runs` → status, SHIELD-blocked flag, correlation id, hashed `patientRef` (`pt_<sha256[:8]>`).
- Never returns `patientLabel`, NHS number, clinical content, or result snapshots to ops UI.
- Surfaced on Admin Agent Ops (`data-testid="agent-ops-durable-runs"`) and as a summary strip on the GP unified worklist banner.

## Care-episode outbox consumer (design + drain)

- Existing transitions already emit `outbox_enqueued` events (`care_episode.transition`).
- A3 adds `drainCareEpisodeOutbox` / `describeOutboxConsumerDesign` — in-process handlers for `encounter_active` → nurse→GP and `in_review`/`med_review` → GP→pharmacist.
- **Non-goals:** second agent queue, Workflow DevKit, autonomous clinical decisions, live EHR.
- A4+ may bind the same handlers to Neon LISTEN / pg_cron; do not fork orchestration.

## Team assignment / delegation

- Store: `data/review-queue-assignments*.json` (file) + API `GET|POST /api/gp/review-queue/assign`.
- Actions: `assign` | `reassign` | `escalate` (escalate requires reason).
- Boundaries: actor practice must match case practice; optional `allowedPatientIds` gate.
- Every mutation writes an audit row (`fromAssignee` → `toAssignee`).

## Honesty invariants

- `ehrWrite: false`, `autonomous: false`, `hitlRequired: true`, `phiLeakage: false`
- Pharmacist / lab / referral remain drafts until clinician Accept
- No live EMIS / EHR writeback

## Key files

- `lib/agents/ops-run-visibility.ts`
- `lib/care-episode/stakeholder-handoffs.ts`
- `lib/care-episode/outbox-consumer.ts`
- `lib/gp/review-queue-assignment.ts`
- `app/api/agents/ops-runs/route.ts`
- `app/api/gp/review-queue/assign/route.ts`
- `app/dashboard/admin/agent-ops/page.tsx`
- `tests/stakeholder-integration-a3.test.ts`

## Next (A4)

See `SECURITY_AND_PRIVACY.md` + `OBSERVABILITY_AND_OPERATIONS.md` (A4 branch) — authz matrix, PHI-safe audit refs, durable-run alerts. Review-only until merge policy allows.
