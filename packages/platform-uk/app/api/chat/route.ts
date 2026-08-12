import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";

import {
  CHAT_MODEL,
  CHAT_SYSTEM_PROMPT,
  CHAT_UNAVAILABLE_MESSAGE,
} from "@/lib/chat/knowledge";
import { checkChatRateLimit, clientKeyFromRequest } from "@/lib/chat/rate-limit";

export const maxDuration = 30;

const MAX_MESSAGES = 24;

function isChatConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY) || process.env.VERCEL === "1";
}

export async function GET() {
  return Response.json({
    available: isChatConfigured(),
    message: isChatConfigured() ? undefined : CHAT_UNAVAILABLE_MESSAGE,
  });
}

export async function POST(req: Request) {
  if (!isChatConfigured()) {
    return Response.json({ error: CHAT_UNAVAILABLE_MESSAGE }, { status: 503 });
  }

  const rate = checkChatRateLimit(clientKeyFromRequest(req));
  if (!rate.ok) {
    return Response.json(
      { error: "Too many chat requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      }
    );
  }

  let body: { messages?: UIMessage[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  if (messages.length === 0) {
    return Response.json({ error: "Messages are required." }, { status: 400 });
  }

  try {
    const result = streamText({
      model: CHAT_MODEL,
      instructions: CHAT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 700,
      temperature: 0.3,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch {
    return Response.json(
      {
        error:
          "We could not reach the assistant just now. Please try again, or use Contact (/contact) or Security (/security).",
      },
      { status: 502 }
    );
  }
}
