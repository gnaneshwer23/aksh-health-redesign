import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { readBoundPatientIdFromPreferences } from "@/lib/auth/demo-patient-binding";
import { findProfileByUserId } from "@/lib/auth/user-repository";
import { getPatientDetail } from "@/lib/synthetic-world/queries";

/**
 * Self-scope record for a patient account linked by clinic invite. A patient can only ever read the record
 * bound on their own profile (server-side), never one named in the request.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "patient") {
    return NextResponse.json({ error: "Patient accounts only" }, { status: 403 });
  }
  const profile = await findProfileByUserId(session.user.id);
  const boundId = readBoundPatientIdFromPreferences(profile?.preferences);
  if (!boundId) {
    return NextResponse.json({ linked: false });
  }
  const detail = getPatientDetail(boundId);
  if (!detail) {
    return NextResponse.json({ linked: false });
  }
  return NextResponse.json({
    linked: true,
    record: {
      id: detail.id,
      name: `${detail.givenName} ${detail.familyName}`,
      typeLabel: detail.typeLabel,
      market: detail.market,
      hba1c: detail.hba1c,
      medications: detail.medications,
      careTeam: detail.careTeamDetail.map((t) => ({ name: t.name, role: t.roleLabel, organisation: t.organisation })),
      clinic: detail.primaryOrganisation?.name ?? null,
      pharmacy: detail.pharmacy?.name ?? null,
      openCareGaps: detail.openCareGaps,
      emergencyNumber: detail.marketInfo.emergencyNumber,
      hba1cUnit: detail.marketInfo.hba1cUnitPrimary,
    },
  });
}
