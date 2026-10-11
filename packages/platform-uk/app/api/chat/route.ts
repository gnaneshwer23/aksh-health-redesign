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
import { aiConfigured, languageModel } from "@/lib/ai/model";

export const maxDuration = 30;

const MAX_MESSAGES = 24;

function isChatConfigured(): boolean {
  return (
    aiConfigured()
  );
}

function publicChatError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/free tier|paid credits|top-up|top up/i.test(message)) {
    return "Chat model is unavailable on the current AI Gateway plan. Please try again later, or use Contact (/contact).";
  }
  if (/authentication|api key|oidc/i.test(message)) {
    return "Chat authentication failed. Please try again later, or use Contact (/contact).";
  }
  return "We could not reach the assistant just now. Please try again, or use Contact (/contact) or Security (/security).";
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

  const rate = await checkChatRateLimit(clientKeyFromRequest(req));
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
      model: languageModel(CHAT_MODEL),
      instructions: CHAT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 700,
      temperature: 0.3,
      onError: ({ error }) => {
        console.error("[api/chat] stream error:", error);
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError: (error) => {
          console.error("[api/chat] ui stream error:", error);
          return publicChatError(error);
        },
      }),
    });
  } catch (error) {
    console.error("[api/chat] request error:", error);
    return Response.json({ error: publicChatError(error) }, { status: 502 });
  }
}
