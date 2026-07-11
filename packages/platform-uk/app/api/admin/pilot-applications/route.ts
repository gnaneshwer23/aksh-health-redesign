import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { listRecentPilotApplications } from "@/lib/pilot/pilot-application-repository";
import { formatPilotReferenceId } from "@/lib/pilot/reference-id";

const ADMIN_ROLES = new Set(["practice-manager", "ics-lead", "hospital-executive"]);

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session?.user?.id || !role || !ADMIN_ROLES.has(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const applications = await listRecentPilotApplications(10);

    return NextResponse.json({
      ok: true,
      applications: applications.map((application) => ({
        ...application,
        referenceLabel: formatPilotReferenceId(application.id),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load pilot applications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
