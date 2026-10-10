import { patientIdFromInviteCode } from "@/lib/onboarding/markets";
import { getSyntheticWorld } from "@/lib/synthetic-world/generate";

export type PatientBinding =
  | { status: "none" }
  | { status: "linked"; patientId: string; organisationId: string; market: string }
  | { status: "rejected"; reason: "unknown-code" | "details-mismatch" };

/**
 * Bind a self-registered patient to a clinic record. An invite code alone is not enough: the date of birth
 * must match the record too, so a guessed or shared code cannot open someone else's record.
 * Synthetic network only (Track A) — live clinics will issue single-use codes from their own system.
 */
export function resolvePatientBinding(identity: Record<string, unknown> | undefined): PatientBinding {
  const code = typeof identity?.inviteCode === "string" ? identity.inviteCode : "";
  if (!code.trim()) return { status: "none" };

  const patientId = patientIdFromInviteCode(code);
  const patient = patientId ? getSyntheticWorld().patients.find((p) => p.id === patientId) : undefined;
  if (!patient) return { status: "rejected", reason: "unknown-code" };

  const dob = typeof identity?.dateOfBirth === "string" ? identity.dateOfBirth.trim() : "";
  if (dob !== patient.dob) return { status: "rejected", reason: "details-mismatch" };

  return { status: "linked", patientId: patient.id, organisationId: patient.primaryOrganisationId, market: patient.market };
}
