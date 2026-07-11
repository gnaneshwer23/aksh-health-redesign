import { NextResponse } from "next/server";

import { insertAccessRequest } from "@/lib/access-requests/access-request-repository";
import { formatAccessRequestReferenceId } from "@/lib/access-requests/reference-id";
import { accessRequestSchema } from "@/lib/access-requests/validation";

export async function POST(request: Request) {
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

    return NextResponse.json({
      ok: true,
      referenceId: record.id,
      referenceLabel: formatAccessRequestReferenceId(record.id),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit organisation enquiry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
