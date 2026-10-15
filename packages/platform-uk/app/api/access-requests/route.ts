import { NextResponse } from "next/server";

import { insertAccessRequest } from "@/lib/access-requests/access-request-repository";
import { formatAccessRequestReferenceId } from "@/lib/access-requests/reference-id";
import { accessRequestSchema } from "@/lib/access-requests/validation";
import { clientKeyFromRequest } from "@/lib/chat/rate-limit";
import { notifyAccessRequestSubmitted } from "@/lib/email/notify-access-request";
import { reportError } from "@/lib/observability/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

/** Public organisation enquiry (Request access). Rate limited per client; failures never echo internal errors. */
export async function POST(request: Request) {
  const limited = await checkRateLimit(`access-request:${clientKeyFromRequest(request)}`, 5, 60 * 60 * 1000);
  if (!limited.success) return rateLimitResponse(limited, "Too many enquiries from this connection. Please try again later or email us.");
  const body = await request.json().catch(() => ({}));
  const parsed = accessRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid organisation enquiry", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const record = await insertAccessRequest(parsed.data);

    try {
      await notifyAccessRequestSubmitted(record);
    } catch (notifyError) {
      console.error(
        "[access-request] Notification failed:",
        notifyError instanceof Error ? notifyError.message : notifyError
      );
    }

    return NextResponse.json({
      ok: true,
      referenceId: record.id,
      referenceLabel: formatAccessRequestReferenceId(record.id),
    });
  } catch (error) {
    await reportError(error, { source: "server", route: "access-requests" }).catch(() => undefined);
    return NextResponse.json({ error: "We could not record your enquiry. Please try again, or email us." }, { status: 500 });
  }
}
