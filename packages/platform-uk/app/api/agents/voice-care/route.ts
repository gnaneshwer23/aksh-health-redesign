import { NextResponse } from "next/server";

import { runVoiceCareEscalation } from "@/lib/agents/voice-care";
import {
  listShieldAuditEvents,
  persistShieldAuditEvent
} from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";
import type { NurseEscalationTask } from "@/lib/types";

export const maxDuration = 30;

function tasksFromShieldEvents(
  events: Awaited<ReturnType<typeof listShieldAuditEvents>>["events"]
): NurseEscalationTask[] {
  const tasks: NurseEscalationTask[] = [];
  for (const event of events) {
    const payload = event.payload ?? {};
    const task = payload.nurseTask as NurseEscalationTask | undefined;
    if (task?.id && task.summary) {
      tasks.push(task);
      continue;
    }
    if (event.label.toLowerCase().includes("voice care")) {
      tasks.push({
        id: `shield-${event.id}`,
        patientLabel: event.resourceRef ?? "Synthetic patient",
        caseId: event.caseId ?? "unknown",
        priority: "urgent",
        summary: event.detail ?? event.label,
        createdAt: event.recordedAt,
        source: "voice_care"
      });
    }
  }
  return tasks;
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const listed = await listShieldAuditEvents({
    agentLabel: "VOICE",
    labelContains: "Voice Care",
    limit: 20
  });

  const tasks = tasksFromShieldEvents(listed.events);

  return NextResponse.json({
    available: true,
    channel: "synthetic_outbound",
    telephony: false,
    note: "VOICE CARE escalations are synthetic outbound scripts — no live telephony or EHR write.",
    source: listed.source,
    tasks,
    ehrWrite: false,
    hitlRequired: true
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: { caseId?: string; patientLabel?: string; oracleScore?: number } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = runVoiceCareEscalation({
    caseId: body.caseId,
    patientLabel: body.patientLabel,
    oracleScore: body.oracleScore
  });

  const shieldResult = await persistShieldAuditEvent({
    action: "defer",
    actor: auth.context.userEmail ?? auth.context.userId,
    label: "SHIELD: VOICE CARE synthetic outbound escalation",
    detail: `${result.label} · ${result.nurseTask.summary}`,
    category: "system",
    caseId: result.escalation.caseId,
    agentLabel: "VOICE",
    resourceRef: result.escalation.patientLabel,
    payload: {
      channel: result.channel,
      telephony: false,
      label: result.label,
      escalation: result.escalation,
      nurseTask: result.nurseTask,
      transcriptPreview: result.transcript.slice(0, 280)
    }
  });

  return NextResponse.json({
    ...result,
    shieldPersisted: shieldResult.persisted,
    durable: shieldResult.persisted,
    shieldAuditWriteFailed: !shieldResult.persisted,
    hitlRequired: true,
    ehrWrite: false
  });
}
