import type { AppRole } from "@/lib/permission-matrix";
import { evaluateAppRoleClinicalReadAccess } from "@/lib/clinical-proof/tenant-isolation";

/**
 * Patient-scoped Ask Aksh chat access.
 *
 * Allowed (named PHI about a patient chart):
 * - clinical_reviewer (gp / nurse / clinical-pharmacist session roles)
 * - patient — own bound record only
 *
 * Denied (no named PHI chat):
 * - operations_lead (practice-manager, ics-lead, hospital-executive) — admin default off
 * - researcher — aggregate only
 * - restricted — fail closed
 */
export type PatientChatAudience = "clinician" | "patient";

export type PatientChatAccessResult = {
  allowed: boolean;
  reason: string;
  status: 200 | 401 | 403;
};

export function evaluatePatientChatAccess(input: {
  appRole: AppRole;
  boundPatientId?: string | null;
  requestedPatientId: string;
  audience?: PatientChatAudience;
}): PatientChatAccessResult {
  const audience = input.audience ?? "clinician";

  if (audience === "patient" && input.appRole !== "patient") {
    return {
      allowed: false,
      reason: "Patient-audience chat requires the patient role",
      status: 403,
    };
  }

  if (audience === "clinician" && input.appRole === "patient") {
    return {
      allowed: false,
      reason: "Patient role must use patient-audience Ask Aksh (self only)",
      status: 403,
    };
  }

  // Same fail-closed gate as patient clinical reads: ICS/researcher/admin off; patient self-only.
  const clinical = evaluateAppRoleClinicalReadAccess({
    appRole: input.appRole,
    boundPatientId: input.boundPatientId,
    requestedPatientId: input.requestedPatientId,
  });

  return {
    allowed: clinical.allowed,
    reason: clinical.reason,
    status: clinical.status,
  };
}

export function patientChatAllowedAppRoles(): AppRole[] {
  return ["clinical_reviewer", "patient"];
}
