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

## Error contract

- `400` validation / missing reason on reject
- `401/403` auth / RBAC
- `404` unknown plan/task/recon run
- `409` version conflict if optimistic concurrency added later / recon already decided
