import { NextResponse } from "next/server";

import {
  advanceMedCareTask,
  applyCarePlanTemplate,
  buildMedicationPersonalisedCare,
  draftMedicationSafetyReview,
  handoffMedCareTask,
  seedAndBuildMedicationPersonalisedCare,
  setPatientGoalStatus,
  startMedCareReconciliation,
} from "@/lib/diabetes-intelligence";
import type { CarePlanTemplateId, CareTaskStatus, PatientGoalStatus } from "@/lib/diabetes-intelligence/medcare-types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  const snapshot = await buildMedicationPersonalisedCare(patientId, {
    scopeKey: auth.context.scopeKey,
  });
  return NextResponse.json(snapshot);
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const patientId = (await context.params).id?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patient id required" }, { status: 400 });
  }

  let body: {
    action?:
      | "seed_synthetic"
      | "start_med_recon"
      | "draft_safety_review"
      | "apply_care_plan_template"
      | "set_goal_status"
      | "update_task"
      | "handoff_task";
    templateId?: CarePlanTemplateId;
    goalId?: string;
    goalStatus?: PatientGoalStatus;
    taskId?: string;
    taskStatus?: CareTaskStatus;
    note?: string;
    fromRole?: string;
    toRole?: string;
    toMemberDisplay?: string;
    summary?: string;
  } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const actor = auth.context.userEmail ?? auth.context.userId;
  const scopeKey = auth.context.scopeKey;

  try {
    if (body.action === "seed_synthetic") {
      const snapshot = await seedAndBuildMedicationPersonalisedCare(patientId, {
        scopeKey,
        actor,
      });
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    if (body.action === "start_med_recon") {
      const snapshot = await startMedCareReconciliation(patientId, {
        scopeKey,
        createdBy: actor,
      });
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    if (body.action === "draft_safety_review") {
      const snapshot = await draftMedicationSafetyReview(patientId, {
        scopeKey,
        createdBy: actor,
      });
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    if (body.action === "apply_care_plan_template") {
      if (!body.templateId) {
        return NextResponse.json({ error: "templateId required" }, { status: 400 });
      }
      const snapshot = await applyCarePlanTemplate(patientId, body.templateId, {
        scopeKey,
        createdBy: actor,
      });
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    if (body.action === "set_goal_status") {
      if (!body.goalId || !body.goalStatus) {
        return NextResponse.json({ error: "goalId and goalStatus required" }, { status: 400 });
      }
      const snapshot = await setPatientGoalStatus(
        {
          patientId,
          goalId: body.goalId,
          status: body.goalStatus,
          actor,
        },
        { scopeKey }
      );
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    if (body.action === "update_task") {
      if (!body.taskId || !body.taskStatus) {
        return NextResponse.json({ error: "taskId and taskStatus required" }, { status: 400 });
      }
      const snapshot = await advanceMedCareTask(
        {
          patientId,
          taskId: body.taskId,
          status: body.taskStatus,
          note: body.note,
          actor,
        },
        { scopeKey }
      );
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    if (body.action === "handoff_task") {
      if (!body.taskId || !body.toRole || !body.summary) {
        return NextResponse.json(
          { error: "taskId, toRole, and summary required" },
          { status: 400 }
        );
      }
      const snapshot = await handoffMedCareTask(
        {
          patientId,
          taskId: body.taskId,
          fromRole: body.fromRole ?? "gp",
          toRole: body.toRole,
          toMemberDisplay: body.toMemberDisplay,
          summary: body.summary,
          actor,
        },
        { scopeKey }
      );
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    return NextResponse.json(
      {
        error:
          "action must be seed_synthetic | start_med_recon | draft_safety_review | apply_care_plan_template | set_goal_status | update_task | handoff_task",
      },
      { status: 400 }
    );
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message, ehrWrite: false }, { status });
  }
}
