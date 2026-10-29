import { NextResponse } from "next/server";

import {
  advanceAppointment,
  advanceCarePlanProgress,
  advanceContinuousFollowUp,
  advancePatientUpdate,
  buildContinuousCare,
  seedAndBuildContinuousCare,
  setContinuousNotificationPrefs,
} from "@/lib/diabetes-intelligence";
import type {
  AppointmentStatus,
  FollowUpItemStatus,
  NotificationPreferences,
  PatientUpdateStatus,
  PlanProgressStatus,
} from "@/lib/diabetes-intelligence/continuous-care-types";
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

  const snapshot = await buildContinuousCare(patientId, {
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
      | "update_follow_up"
      | "update_appointment"
      | "triage_patient_update"
      | "set_notification_prefs"
      | "update_plan_progress";
    itemId?: string;
    appointmentId?: string;
    updateId?: string;
    progressId?: string;
    status?: string;
    note?: string;
    channels?: NotificationPreferences["channels"];
    prefsStatus?: NotificationPreferences["status"];
    topics?: string[];
    quietHours?: NotificationPreferences["quietHours"];
    progressPct?: number;
    milestoneId?: string;
    milestoneDone?: boolean;
    planStatus?: PlanProgressStatus;
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
      const snapshot = await seedAndBuildContinuousCare(patientId, {
        scopeKey,
        actor,
      });
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    if (body.action === "update_follow_up") {
      if (!body.itemId || !body.status) {
        return NextResponse.json({ error: "itemId and status required" }, { status: 400 });
      }
      const snapshot = await advanceContinuousFollowUp(
        {
          patientId,
          itemId: body.itemId,
          status: body.status as FollowUpItemStatus,
          note: body.note,
          actor,
        },
        { scopeKey }
      );
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    if (body.action === "update_appointment") {
      if (!body.appointmentId || !body.status) {
        return NextResponse.json({ error: "appointmentId and status required" }, { status: 400 });
      }
      const snapshot = await advanceAppointment(
        {
          patientId,
          appointmentId: body.appointmentId,
          status: body.status as AppointmentStatus,
          note: body.note,
          actor,
        },
        { scopeKey }
      );
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    if (body.action === "triage_patient_update") {
      if (!body.updateId || !body.status) {
        return NextResponse.json({ error: "updateId and status required" }, { status: 400 });
      }
      const snapshot = await advancePatientUpdate(
        {
          patientId,
          updateId: body.updateId,
          status: body.status as PatientUpdateStatus,
          note: body.note,
          actor,
        },
        { scopeKey }
      );
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    if (body.action === "set_notification_prefs") {
      const snapshot = await setContinuousNotificationPrefs(
        {
          patientId,
          channels: body.channels,
          status: body.prefsStatus,
          topics: body.topics,
          quietHours: body.quietHours,
          actor,
        },
        { scopeKey }
      );
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    if (body.action === "update_plan_progress") {
      if (!body.progressId) {
        return NextResponse.json({ error: "progressId required" }, { status: 400 });
      }
      const snapshot = await advanceCarePlanProgress(
        {
          patientId,
          progressId: body.progressId,
          status: body.planStatus,
          progressPct: body.progressPct,
          milestoneId: body.milestoneId,
          milestoneDone: body.milestoneDone,
          actor,
        },
        { scopeKey }
      );
      return NextResponse.json({ ...snapshot, action: body.action });
    }

    return NextResponse.json(
      {
        error:
          "action must be seed_synthetic | update_follow_up | update_appointment | triage_patient_update | set_notification_prefs | update_plan_progress",
      },
      { status: 400 }
    );
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message, ehrWrite: false }, { status });
  }
}
