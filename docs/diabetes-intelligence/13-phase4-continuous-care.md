# Phase 4 — Continuous care / longitudinal operations

**Date:** 29 October 2026  
**Status:** Synthetic demo scaffolding in `packages/platform-uk`  
**Capability:** `continuous_care_operations` = `synthetic_demo`  
**Evidence:** `tests/continuous-care-operations.test.ts`  
**LIVE_ORGANISATIONS:** `0` — not clinically validated; not production-ready.

## What shipped

| Surface | Path |
|---------|------|
| Domain | `lib/diabetes-intelligence/continuous-care-*.ts` |
| Migration | `047_continuous_care.sql` (local-dev / simulation only) |
| API | `GET/POST /api/patients/[id]/continuous-care` |
| Escalation HITL | `POST .../continuous-care/escalation/[escalationId]/decision` |
| GP worklist | `GET /api/gp/continuous-care/worklist` |
| Nurse queue | `GET /api/nurse/continuous-care/worklist` |
| Timeline merge | Journey + continuous-care events into `/api/patients/[id]/timeline` |
| GP UI | `/dashboard/gp/patients/[id]/continuous-care` |
| GP worklist UI | `/dashboard/gp/continuous-care` |
| Nurse queue UI | `/dashboard/nurse/continuous-care` |

## Coverage vs BUILD DIRECTIVE

| Feature | Classification | Notes |
|---------|----------------|-------|
| Follow-up worklists | `synthetic_demo` | Reuses journey follow-up + medcare task patterns |
| Appointment coordination | `synthetic_demo` | Propose → confirm → complete; no live booking connector |
| Patient-reported updates | `synthetic_demo` | Unverified until clinician ack; `verifiedByClinician: false` |
| Notification preferences | `synthetic_demo` | Channel + quiet hours + topics |
| Staff escalation queues | `synthetic_demo` | HITL Accept/Edit/Reject/Resolve/Queue |
| Completed-action tracking | `synthetic_demo` | Written on follow-up complete / escalation resolve |
| Care-plan progress monitoring | `synthetic_demo` | Milestones + progress % + measurable outcome |
| Operational and safety analytics | `synthetic_demo` | Derived; `autonomousClinicalActions: 0`, `ehrWrites: 0` |

Every workflow item carries **owner**, **status**, **timestamps**, **decision history**, and **measurable outcome**.

## How to try

1. From `packages/platform-uk`: `.env.local` → Neon **local-dev** only.
2. Optional: `npm run db:migrate -- --apply` for `047` (never production main).
3. `npx tsx tests/continuous-care-operations.test.ts`
4. Authenticated GP: `/dashboard/gp/patients/P002/continuous-care` → **Seed continuous care spine** → advance follow-ups / appointments / escalate HITL.
5. Nurse: `/dashboard/nurse/continuous-care` for role-filtered queue.
6. Timeline: `/dashboard/gp/patients/P002/timeline` (or API) — journey + continuous-care events merged.

## Explicit non-claims

- No autonomous clinical actions or patient outreach.
- No EHR write (`ehrWrite: false`).
- Outbound recall / campaign automation remains **planned** (`outbound_campaigns`).
- Not clinically validated or regulatory-approved.
- Appointment coordination does not claim a live NHS booking connector.

## Still incomplete / deferred

- Org FK + RLS proof against live organisations
- Playwright E2E golden path for continuous care
- Live schedule / recall connectors under governance
- Clinical safety case / CSO sign-off before capability promotion beyond `synthetic_demo`
