import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";

import {
  evaluatePatientChatAccess,
  patientChatAllowedAppRoles,
  type PatientChatAudience,
} from "@/lib/chat/patient-access";
import { assembleClinicalContext } from "@/lib/context-engine/assemble";
import { evaluateGuardianGateway } from "@/lib/guardian-gateway";
import { loadPatientChatContext } from "@/lib/chat/patient-context";
import {
  PATIENT_CHAT_MODEL,
  PATIENT_CHAT_UNAVAILABLE_MESSAGE,
  buildPatientChatSystemPrompt,
  suggestedPromptsForAudience,
} from "@/lib/chat/patient-prompt";
import { checkChatRateLimit } from "@/lib/chat/rate-limit";
import { detectCheckInEscalation } from "@/lib/patient-companion/check-in";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";
import { aiConfigured, languageModel } from "@/lib/ai/model";

export const maxDuration = 30;

const MAX_MESSAGES = 24;

function isChatConfigured(): boolean {
  return aiConfigured();
}

function parseAudience(raw: unknown): PatientChatAudience {
  return raw === "patient" ? "patient" : "clinician";
}

function latestUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (!message || message.role !== "user") continue;
    const parts = Array.isArray(message.parts) ? message.parts : [];
    const text = parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("\n")
      .trim();
    if (text) return text;
  }
  return "";
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId")?.trim() ?? "";
  const audience = parseAudience(searchParams.get("audience"));

  const configured = isChatConfigured();
  const base = {
    available: configured,
    message: configured ? undefined : PATIENT_CHAT_UNAVAILABLE_MESSAGE,
    liveEmis: false as const,
    hitlRequired: true,
    ehrWrite: false,
    honesty: "assisted review · not a diagnosis",
    allowedAppRoles: patientChatAllowedAppRoles(),
    suggestedPrompts: suggestedPromptsForAudience(audience),
    appRole: auth.context.userRole,
  };

  if (!patientId) {
    return Response.json({
      ...base,
      patientRequired: true,
      access: {
        allowed: false,
        reason: "Select a patient first",
        status: 400,
      },
    });
  }

  const access = evaluatePatientChatAccess({
    appRole: auth.context.userRole,
    boundPatientId: auth.context.boundPatientId,
    requestedPatientId: patientId,
    audience,
  });

  return Response.json({
    ...base,
    patientId,
    access,
    patientRequired: false,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  if (!isChatConfigured()) {
    return Response.json({ error: PATIENT_CHAT_UNAVAILABLE_MESSAGE }, { status: 503 });
  }

  const rate = checkChatRateLimit(`patient-chat:${auth.context.userId}`);
  if (!rate.ok) {
    return Response.json(
      { error: "Too many Ask Aksh requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      }
    );
  }

  let body: {
    messages?: UIMessage[];
    patientId?: string;
    audience?: PatientChatAudience;
  };
  try {
    body = (await request.json()) as {
      messages?: UIMessage[];
      patientId?: string;
      audience?: PatientChatAudience;
    };
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const patientId = body.patientId?.trim();
  if (!patientId) {
    return Response.json({ error: "Select a patient first.", patientRequired: true }, { status: 400 });
  }

  const audience = parseAudience(body.audience);
  const access = evaluatePatientChatAccess({
    appRole: auth.context.userRole,
    boundPatientId: auth.context.boundPatientId,
    requestedPatientId: patientId,
    audience,
  });
  if (!access.allowed) {
    return Response.json({ error: access.reason, denied: true }, { status: access.status });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  if (messages.length === 0) {
    return Response.json({ error: "Messages are required." }, { status: 400 });
  }

  const context = await loadPatientChatContext(patientId);
  if (!context) {
    return Response.json({ error: "Patient not found." }, { status: 404 });
  }

  const userText = latestUserText(messages);
  const assembled = await assembleClinicalContext({
    patientId,
    purpose: audience === "patient" ? "patient_self" : "clinical_decision_support",
    actorRole: auth.context.userRole,
    boundPatientId: auth.context.boundPatientId,
  });
  if (assembled.ok) {
    const gate = evaluateGuardianGateway({
      context: assembled.package,
      modelId: "aksh-patient-chat-v1",
      environment: "synthetic",
      userText,
    });
    if (gate.output_status === "BLOCK") {
      return Response.json(
        {
          error: "Ask Aksh blocked this request (safety gateway).",
          output_status: "BLOCK",
          reasons: gate.reasons,
          liveEmis: false,
        },
        { status: 403 }
      );
    }
  }

  const escalation =
    audience === "patient" && userText
      ? detectCheckInEscalation(userText)
      : { triggered: false, category: null, matchedPhrase: null };

  const escalationNote = escalation.triggered
    ? `category=${escalation.category}; matched="${escalation.matchedPhrase}" — urge care-team / urgent contact; do not clinically manage.`
    : null;

  void persistShieldAuditEvent({
    action: "defer",
    actor: auth.context.userEmail ?? auth.context.userId,
    label: escalation.triggered
      ? `Ask Aksh patient chat escalation (${escalation.category})`
      : "Ask Aksh patient chat turn",
    detail: `audience=${audience}; dataSource=${context.dataSource}; promptChars=${userText.length}`,
    category: "system",
    agentLabel: "AskAksh",
    resourceRef: `${context.patientLabel} (${context.patientId})`,
    payload: {
      patientId: context.patientId,
      audience,
      dataSource: context.dataSource,
      liveEmis: false,
      hitlRequired: true,
      ehrWrite: false,
      escalation: escalation.triggered
        ? {
            triggered: true,
            category: escalation.category,
            matchedPhrase: escalation.matchedPhrase,
          }
        : { triggered: false },
    },
  });

  try {
    const result = streamText({
      model: languageModel(PATIENT_CHAT_MODEL),
      instructions: buildPatientChatSystemPrompt({
        audience,
        context,
        escalationNote,
      }),
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 900,
      temperature: 0.25,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
      headers: {
        "X-Aksh-Live-Emis": "false",
        "X-Aksh-Hitl-Required": "true",
        "X-Aksh-Data-Source": context.dataSource,
        ...(escalation.triggered ? { "X-Aksh-Escalation": String(escalation.category) } : {}),
      },
    });
  } catch {
    return Response.json(
      {
        error:
          "Ask Aksh could not respond just now. Try again, or use the review queue / care-team pathways.",
      },
      { status: 502 }
    );
  }
}
