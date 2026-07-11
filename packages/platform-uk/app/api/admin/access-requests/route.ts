import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { listRecentAccessRequests, countAccessRequestsByStatus } from "@/lib/access-requests/access-request-repository";
import { formatAccessRequestReferenceId } from "@/lib/access-requests/reference-id";

const ADMIN_ROLES = new Set(["practice-manager", "ics-lead", "hospital-executive"]);

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session?.user?.id || !role || !ADMIN_ROLES.has(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const applications = await listRecentAccessRequests(10);
    const submittedCount = await countAccessRequestsByStatus("submitted");

    return NextResponse.json({
      ok: true,
      submittedCount,
      applications: applications.map((application) => ({
        ...application,
        referenceLabel: formatAccessRequestReferenceId(application.id),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load organisation enquiries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
