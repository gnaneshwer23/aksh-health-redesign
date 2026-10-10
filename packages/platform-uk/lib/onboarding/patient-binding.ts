import { acceptPatientInvite, NetworkError } from "@/lib/network/service";

export type PatientBinding =
  | { status: "none" }
  | { status: "linked"; patientId: string; organisationId: string }
  | { status: "rejected" };

/**
 * Bind a self-registered patient to their clinic's record using a single-use invite from the database.
 * Code AND date of birth must match. `consume: false` checks without using the invite.
 */
export async function resolvePatientBinding(
  userId: string,
  identity: Record<string, unknown> | undefined,
  options: { consume: boolean }
): Promise<PatientBinding> {
  const code = typeof identity?.inviteCode === "string" ? identity.inviteCode.trim() : "";
  if (!code) return { status: "none" };
  const dateOfBirth = typeof identity?.dateOfBirth === "string" ? identity.dateOfBirth : "";
  try {
    const linked = await acceptPatientInvite({ userId }, { code, dateOfBirth }, options);
    return { status: "linked", patientId: linked.patientId, organisationId: linked.organisationId };
  } catch (error) {
    if (error instanceof NetworkError) return { status: "rejected" };
    throw error;
  }
}
