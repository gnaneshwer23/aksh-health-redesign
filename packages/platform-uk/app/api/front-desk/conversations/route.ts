import { NextResponse } from "next/server";
import { z } from "zod";

import { withDeskDirectory } from "@/lib/front-desk/directory";
import { respond, startConversation } from "@/lib/front-desk/conversation";
import { signSession, verifySession } from "@/lib/front-desk/session-token";
import { mutateState } from "@/lib/front-desk/store";
import type { ConversationSession } from "@/lib/front-desk/types";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const startSchema = z.object({
  action: z.literal("start"),
  channel: z.enum(["voice", "sms", "web_chat", "staff_phone"]).default("web_chat"),
  direction: z.enum(["inbound", "outbound"]).default("inbound"),
  campaignKind: z.enum(["missed_appointment", "lapsed_review", "recall", "health_check_in"]).nullish(),
  campaignId: z.string().max(80).nullish(),
  expectedPatientId: z.string().max(20).nullish(),
});

const turnSchema = z.object({
  action: z.literal("turn"),
  session: z.record(z.string(), z.unknown()),
  token: z.string().min(10).max(200),
  utterance: z.string().min(1).max(1000),
});

/**
 * POST /api/front-desk/conversations — Asha conversation turns (synthetic patients only).
 * The session is returned signed; each turn must present it unchanged.
 */
async function handlePOST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const start = startSchema.safeParse(body);
  if (start.success) {
    if (start.data.direction === "outbound" && !start.data.expectedPatientId) {
      return NextResponse.json({ error: "Outbound calls need the intended patient." }, { status: 400 });
    }
    const { result } = await mutateState((s) =>
      startConversation(s, {
        channel: start.data.channel,
        direction: start.data.direction,
        campaignKind: start.data.campaignKind ?? null,
        campaignId: start.data.campaignId ?? null,
        expectedPatientId: start.data.expectedPatientId ?? null,
      })
    );
    return NextResponse.json({ reply: result.reply, session: result.session, token: signSession(result.session) });
  }

  const turn = turnSchema.safeParse(body);
  if (!turn.success) return NextResponse.json({ error: "Expected a start or turn action." }, { status: 400 });

  const session = turn.data.session as unknown as ConversationSession;
  if (!verifySession(session, turn.data.token)) {
    return NextResponse.json({ error: "Conversation could not be verified. Please start again." }, { status: 409 });
  }
  const before = session.stage;
  const { result } = await mutateState((s) => respond(s, structuredClone(session), turn.data.utterance));

  // Safety escalations are significant events: record them in SHIELD (synthetic patients).
  if (before !== "handed_off" && result.session.stage === "handed_off" && result.session.highestSafety !== "none") {
    await persistShieldAuditEvent({
      action: "defer",
      actor: "asha",
      label: "SHIELD: Front Desk safety escalation (synthetic)",
      detail: `level=${result.session.highestSafety}; conversation=${result.session.id}; handed to practice team, not handled autonomously`,
      category: "human_review",
      agentLabel: "CANVAS",
      resourceRef: result.session.patientId ?? "unidentified caller",
    }).catch(() => undefined);
  }

  return NextResponse.json({ reply: result.reply, session: result.session, token: signSession(result.session) });
}

/** Patients come from this request's database directory (see lib/front-desk/directory.ts). */
export async function POST(request: Request) {
  return withDeskDirectory(() => handlePOST(request));
}
