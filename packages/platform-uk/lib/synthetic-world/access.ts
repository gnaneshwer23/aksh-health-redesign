import { CLINICAL_RECORD_DENIED_ROLES } from "@/lib/clinical-proof/tenant-isolation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

/**
 * Patient-level network data follows the same rule as clinical record APIs: admin, operations,
 * population and research roles see aggregates only. Public demo viewers (no session) see the
 * synthetic registry, consistent with the public GP demo dashboard.
 */
export async function patientLevelAccess(): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  const session = await getServerSession(authOptions).catch(() => null);
  const role = String((session?.user as { role?: string } | undefined)?.role ?? "").toLowerCase();
  if (role && CLINICAL_RECORD_DENIED_ROLES.has(role)) {
    return { allowed: false, reason: `Role "${role}" sees aggregate network data only, not individual patients.` };
  }
  if (role === "patient") return { allowed: false, reason: "Patients see their own record in My Health, not the registry." };
  return { allowed: true };
}
