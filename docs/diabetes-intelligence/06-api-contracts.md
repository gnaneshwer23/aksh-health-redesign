# 06 — API contracts sketch

All routes require authenticated user scope (`requireAuthenticatedUserScope`).  
Honesty fields on every clinical response: `ehrWrite: false`, `hitlRequired: true` where drafts exist, `synthetic: true` for journey demo data.

## Existing (reuse)

| Method | Path | Role |
|--------|------|------|
| GET/POST | `/api/patients/[id]/state` | Patient State facts / snapshot |
| GET | `/api/patients/[id]/timeline` | Precision-health timeline |
| GET/POST | `/api/patients/[id]/health-plan` | Legacy DRAFT-only health plans (JSON) |
| POST | `/api/patients/[id]/diabetes/glucose` | Ingest glucose fact |
| POST | `/api/patients/[id]/diabetes/hba1c` | Ingest HbA1c fact |
| POST | `/api/review-cases/[id]/items/[itemId]/decision` | HITL Accept/Edit/Reject |

## New — Connected Diabetes Journey

### GET `/api/patients/[id]/diabetes-journey`

Returns the assembled vertical slice for one patient.

```ts
type DiabetesJourneyResponse = {
  patientId: string;
  patientLabel: string;
  synthetic: true;
  ehrWrite: false;
  history: { conditions: string[]; medications: string[]; allergies: string[]; missingFields: string[] };
  glucose: {
    observations: Array<{ recordedAt: string; glucoseMgDl: number; context?: string }>;
    missingData: { code: string; message: string }[];
    dataCompleteness: number; // 0..1
  };
  carePlans: CarePlanRecord[];
  followUps: CareFollowUpTask[];
  timeline: JourneyTimelineEvent[];
};
```

### POST `/api/patients/[id]/diabetes-journey`

Seed or advance synthetic journey steps (idempotent keys recommended).

Body:

```ts
{ action: "seed_synthetic" | "record_glucose" | "draft_care_plan"; /* action-specific fields */ }
```

### POST `/api/patients/[id]/diabetes-journey/care-plan`

Create a **DRAFT** care plan from history + glucose context.

### POST `/api/patients/[id]/diabetes-journey/care-plan/[planId]/decision`

```ts
{
  action: "accept" | "edit" | "reject";
  editedSections?: CarePlanSection[]; // required for edit
  reason?: string; // required for reject
}
```

Server persists decision + updates plan status; creates follow-up on **accept**; appends journey audit events. Never auto-writes EHR.

### POST `/api/patients/[id]/diabetes-journey/follow-up/[taskId]`

```ts
{ action: "acknowledge" | "complete" | "cancel"; note?: string }
```

## New — Patient 360 foundation (Phase 1)

### GET `/api/patients/[id]/patient-360`

Assembled Patient 360 profile (synthetic honesty fields always present).

### POST `/api/patients/[id]/patient-360`

```ts
{ action: "seed_synthetic" | "start_med_recon" | "record_sharing_preference";
  purpose?: string; status?: "granted" | "withdrawn" | "denied"; basis?: string }
```

### POST `/api/patients/[id]/patient-360/medication-reconciliation/[runId]/decision`

```ts
{ action: "complete" | "cancel"; note?: string }
```

Never sets `ehrWrite` or `autonomousPrescribe` true.

### GET `/api/patients/[id]/patient-360/fhir`

FHIR R4–shaped Bundle snapshot for staging / inspection. `ehrWrite: false`.

## New — Diabetes glucose intelligence (Phase 2)

### GET `/api/patients/[id]/diabetes-intelligence`

Assembled snapshot: CGM/SMBG/HbA1c series, charts, TIR (sufficiency-gated), quality indicators, reviews.

### POST `/api/patients/[id]/diabetes-intelligence`

```ts
{ action: "seed_synthetic" | "ingest_batch" | "draft_review";
  batch?: { channel: "cgm" | "smbg" | "lab_hba1c"; sourceSystem: string; points: GlucoseIngestPoint[] } }
```

### POST `/api/patients/[id]/diabetes-intelligence/review/[reviewId]/decision`

```ts
{ action: "accept" | "edit" | "reject"; editedSections?: GlucoseReviewSection[]; reason?: string }
```

Never sets `ehrWrite` true.

### GET `/api/gp/diabetes-intelligence/worklist`

Urgency-ranked synthetic worklist items for the authenticated clinician scope.

## New — Medication & personalised care (Phase 3)

### GET `/api/patients/[id]/medication-care`

Assembled snapshot: meds, recon runs, allergy + **synthetic** interaction panel, safety flags/reviews, care-plan templates/plans, goals, education, tasks, handoffs, approval history.

### POST `/api/patients/[id]/medication-care`

```ts
{ action: "seed_synthetic" | "start_med_recon" | "draft_safety_review"
        | "apply_care_plan_template" | "set_goal_status" | "update_task" | "handoff_task";
  templateId?: CarePlanTemplateId;
  goalId?: string; goalStatus?: PatientGoalStatus;
  taskId?: string; taskStatus?: CareTaskStatus; note?: string;
  fromRole?: string; toRole?: string; toMemberDisplay?: string; summary?: string }
```

### POST `/api/patients/[id]/medication-care/medication-reconciliation/[runId]/decision`

```ts
{ action: "complete" | "cancel"; note?: string }
```

Never sets `ehrWrite` or `autonomousPrescribe` true.

### POST `/api/patients/[id]/medication-care/safety-review/[reviewId]/decision`

```ts
{ action: "accept" | "edit" | "reject"; editedSections?: MedCareReviewSection[]; reason?: string }
```

### POST `/api/patients/[id]/medication-care/care-plan/[planId]/decision`

```ts
{ action: "accept" | "edit" | "reject"; editedSections?: PersonalisedCarePlanSection[]; reason?: string }
```

## New — Continuous care (Phase 4)

### GET `/api/patients/[id]/continuous-care`

Assembled snapshot: follow-up worklist, appointments, patient-reported updates, notification preferences, escalation queue, completed actions, care-plan progress, decision history, operational/safety analytics.

### POST `/api/patients/[id]/continuous-care`

```ts
{ action: "seed_synthetic" | "update_follow_up" | "update_appointment"
        | "triage_patient_update" | "set_notification_prefs" | "update_plan_progress";
  itemId?: string; appointmentId?: string; updateId?: string; progressId?: string;
  status?: string; note?: string;
  channels?: NotificationChannelPrefs; prefsStatus?: string; topics?: string[];
  progressPct?: number; milestoneId?: string; milestoneDone?: boolean; planStatus?: string }
```

### POST `/api/patients/[id]/continuous-care/escalation/[escalationId]/decision`

```ts
{ action: "accept" | "edit" | "reject" | "resolve" | "queue"; reason?: string; editedNote?: string }
```

Never sets `ehrWrite` or `autonomousClinicalAction` true. Reject requires reason.

### GET `/api/gp/continuous-care/worklist`

Urgency-ranked synthetic continuous-care worklist (follow-ups, escalations, patient updates).

### GET `/api/nurse/continuous-care/worklist`

Role-filtered nurse/ops queue (`ownerRole === "nurse"`).

### GET `/api/patients/[id]/timeline` (extended)

Merges diabetes journey events + continuous-care decision history into the precision-health timeline (`care_journey` / `continuous_care` kinds). Still `ehrWrite: false`, `unifiedHealthRecord: false`.

## New — Agent intelligence (Phase 5)

### GET `/api/patients/[id]/agent-intelligence`

Assembled snapshot: shared patient context, version registry + active pin, AI drafts, orchestration runs, decision history, offline eval suite results, AI vs verified distinction note.

### POST `/api/patients/[id]/agent-intelligence`

```ts
{ action: "seed_synthetic" | "run_orchestration" }
```

Produces deterministic synthetic drafts (history summary, clinical documentation, missing-information, evidence retrieval, follow-up). `llmUsed: false` in this delivery.

### POST `/api/patients/[id]/agent-intelligence/draft/[draftId]/decision`

```ts
{ action: "accept" | "edit" | "reject"; reason?: string; editedPayload?: StructuredDraftPayload }
```

Reject requires reason. Edit requires `editedPayload` (re-validated). Accept/Edit mark `verifiedClinical: true` and `provenance: clinician_verified` on the **draft artifact only**. Never sets `ehrWrite` or `prescribeOrTreat` true.

### GET `/api/gp/agent-intelligence/worklist`

Open AI drafts awaiting HITL (`provenance: ai_generated`).

## Error contract

- `400` validation / missing reason on reject
- `401/403` auth / RBAC
- `404` unknown plan/task/recon run
- `409` version conflict if optimistic concurrency added later / recon already decided
