/**
 * Client-side SHIELD writes that report what actually happened.
 *
 * Every dashboard decision used to fire-and-forget POST /api/audit/shield and then tell the user
 * "SHIELD logged" — including on the public demo, where the route returns 401 and nothing is
 * written. SC-1/SC-3 only hold if the UI says "logged" when the durable write succeeded.
 */

export type ShieldWriteOutcome = "logged" | "not_signed_in" | "unavailable" | "failed";

export type ShieldWritePayload = {
  action: "accept" | "reject" | "edit" | "defer" | string;
  label: string;
  detail?: string;
  agentLabel?: string;
  resourceRef?: string;
  caseId?: string;
  category?: string;
  payload?: Record<string, unknown>;
};

export async function recordShieldEvent(
  payload: ShieldWritePayload,
  options: { authenticated: boolean }
): Promise<ShieldWriteOutcome> {
  // No session: the route would 401. Don't pretend, and don't send the request.
  if (!options.authenticated) return "not_signed_in";

  try {
    const response = await fetch("/api/audit/shield", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        detail: payload.detail?.slice(0, 280),
        category: payload.category ?? "reviewer_decision",
      }),
    });
    if (response.ok) return "logged";
    if (response.status === 401) return "not_signed_in";
    if (response.status === 503) return "unavailable";
    return "failed";
  } catch {
    return "failed";
  }
}

/** Toast fragment for an outcome. Only "logged" may say SHIELD logged. */
export function describeShieldOutcome(outcome: ShieldWriteOutcome): string {
  switch (outcome) {
    case "logged":
      return "SHIELD logged";
    case "not_signed_in":
      return "Demo only, not audited (sign in to record)";
    case "unavailable":
      return "SHIELD durable store unavailable, not audited";
    case "failed":
      return "SHIELD write failed, not audited";
  }
}

export const DEMO_REVIEWER_NAME = "Demo viewer (not signed in)";
