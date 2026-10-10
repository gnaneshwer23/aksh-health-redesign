import { createHmac, timingSafeEqual } from "node:crypto";

import type { ConversationSession } from "./types";

/**
 * Conversation sessions travel with the client so any serverless instance can continue them.
 * They are HMAC-signed so a client cannot skip identity (H-ACC-3) by editing `patientId`.
 */
function secret() {
  const s = process.env.NEXTAUTH_SECRET?.trim();
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("NEXTAUTH_SECRET is required to sign Front Desk sessions");
  return "front-desk-dev-only-secret";
}

export function signSession(session: ConversationSession) {
  return createHmac("sha256", secret()).update(JSON.stringify(session)).digest("base64url");
}

export function verifySession(session: ConversationSession, token: string) {
  const expected = Buffer.from(signSession(session));
  const given = Buffer.from(token ?? "");
  return expected.length === given.length && timingSafeEqual(expected, given);
}
