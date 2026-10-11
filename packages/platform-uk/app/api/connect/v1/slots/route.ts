import { NextResponse } from "next/server";

import { authenticate, receiveSlots } from "@/lib/connector/service";
import { errorResponse } from "@/lib/network/http";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/connect/v1/slots — a scheduling system reports freed or taken slots (FHIR R4 Slot / Bundle, or { slots: [...] }).
 * Authorization: Bearer <connection key>. Per-item result codes are returned; the request succeeds if it was understood.
 */
export async function POST(request: Request) {
  // Unauthenticated callers are limited by address before any key lookup; valid keys then get their own budget.
  const byAddress = checkRateLimit(`connector-ip:${getClientIp(request)}`, 600, 60_000);
  if (!byAddress.success) return rateLimitResponse(byAddress, "Too many requests from this address.");
  try {
    const key = await authenticate(request.headers.get("authorization"));
    const limited = checkRateLimit(`connector:${key.id}`, 120, 60_000);
    if (!limited.success) return rateLimitResponse(limited, "Too many requests for this connection. Slow down.");
    const body = await request.json().catch(() => null);
    return NextResponse.json(await receiveSlots(key, body));
  } catch (error) {
    return errorResponse(error, "/api/connect/v1/slots");
  }
}
