import { NextResponse } from "next/server";

import { insertPilotApplication } from "@/lib/pilot/pilot-application-repository";
import { formatPilotReferenceId } from "@/lib/pilot/reference-id";
import { pilotApplicationSchema } from "@/lib/pilot/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = pilotApplicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid pilot application", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const record = await insertPilotApplication(parsed.data);

    return NextResponse.json({
      ok: true,
      referenceId: record.id,
      referenceLabel: formatPilotReferenceId(record.id),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit pilot application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
