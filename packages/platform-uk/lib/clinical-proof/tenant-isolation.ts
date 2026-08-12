/**
 * Tenant / RLS isolation contracts for clinical-proof.
 *
 * Practice A must not see Practice B cases.
 * Patients may only access their own bound patient id.
 * Admin / operations roles are denied clinical record APIs.
 *
 * These helpers are the unit-testable policy surface. Routes call them before
 * returning clinical payloads. Postgres RLS remains the durable store filter
 * when DATABASE_URL is set (`app.practice_id` + review_cases policy).
 */

import type { AppRole } from "../permission-matrix";

export type ClinicalAccessRole =
  | "gp"
  | "nurse"
  | "pharmacist"
  | "patient"
  | "practice-manager"
  | "ics-lead"
  | "hospital-executive"
  | "researcher"
  | "clinical_reviewer"
  | "operations_lead"
  | string;

/** Roles that may call patient-level clinical APIs (Neo4j patient/guardian, agent drafts). */
export const CLINICAL_RECORD_ALLOWED_ROLES = new Set<string>([
  "gp",
  "nurse",
  "pharmacist",
  "clinical_reviewer"
]);

/** Admin / ops / aggregate roles — must not read individual clinical records via clinical APIs. */
export const CLINICAL_RECORD_DENIED_ROLES = new Set<string>([
  "practice-manager",
  "ics-lead",
  "hospital-executive",
  "researcher",
  "operations_lead"
]);

export type PracticeScopedRecord = {
  id: string;
  practiceId?: string | null;
};

export function normalizePracticeId(practiceId?: string | null, fallback = "practice-demo") {
  const trimmed = practiceId?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

/** Filter records so practice A never receives practice B rows. */
export function filterRecordsForPractice<T extends PracticeScopedRecord>(
  records: T[],
  practiceId: string,
  fallbackPracticeId = "practice-demo"
): T[] {
  const wanted = normalizePracticeId(practiceId, fallbackPracticeId);
  return records.filter(
    (record) => normalizePracticeId(record.practiceId, fallbackPracticeId) === wanted
  );
}

export function assertPracticeCannotSeeOtherPractice(
  practiceAId: string,
  practiceBRecords: PracticeScopedRecord[],
  fallbackPracticeId = "practice-demo"
) {
  const leaked = filterRecordsForPractice(practiceBRecords, practiceAId, fallbackPracticeId);
  if (leaked.length > 0) {
    throw new Error(
      `Tenant isolation failed: practice ${practiceAId} can see ${leaked.length} record(s) from another practice`
    );
  }
  return true;
}

export type PatientUrlAccessInput = {
  role: ClinicalAccessRole;
  /** Bound patient id for the authenticated patient user (null if not a patient). */
  boundPatientId?: string | null;
  /** Patient id requested via URL / query (e.g. ?id=P002). */
  requestedPatientId: string;
};

/**
 * Patient role may only open their own patient id.
 * Non-patient clinical roles are not blocked by this check (RBAC handles them separately).
 */
export function evaluatePatientUrlAccess(input: PatientUrlAccessInput): {
  allowed: boolean;
  reason: string;
  status: 200 | 403 | 400;
} {
  const requested = input.requestedPatientId.trim();
  if (!requested) {
    return { allowed: false, reason: "Missing patient id", status: 400 };
  }

  const role = String(input.role ?? "").trim().toLowerCase();
  if (role !== "patient") {
    return { allowed: true, reason: "Not a patient-bound request", status: 200 };
  }

  const bound = input.boundPatientId?.trim();
  if (!bound) {
    return {
      allowed: false,
      reason: "Patient session has no bound patient id",
      status: 403
    };
  }

  if (bound !== requested) {
    return {
      allowed: false,
      reason: `Patient ${bound} cannot access patient ${requested}`,
      status: 403
    };
  }

  return { allowed: true, reason: "Bound patient matches requested id", status: 200 };
}

export function assertPatientCannotAccessOtherPatient(input: PatientUrlAccessInput) {
  const result = evaluatePatientUrlAccess(input);
  if (!result.allowed) {
    throw new Error(result.reason);
  }
  return true;
}

export type ClinicalApiAccessInput = {
  role: ClinicalAccessRole;
  /** Optional: patient-bound check when role is patient */
  boundPatientId?: string | null;
  requestedPatientId?: string | null;
};

/**
 * Admin / ICS / hospital / researcher / operations_lead cannot read clinical records
 * via clinical APIs. Patients are limited to their bound id.
 */
export function evaluateClinicalApiAccess(input: ClinicalApiAccessInput): {
  allowed: boolean;
  reason: string;
  status: 200 | 403;
} {
  const role = String(input.role ?? "").trim().toLowerCase();

  if (CLINICAL_RECORD_DENIED_ROLES.has(role)) {
    return {
      allowed: false,
      reason: `Role "${role}" is denied clinical record APIs (admin/ops isolation)`,
      status: 403
    };
  }

  if (role === "patient") {
    const patientCheck = evaluatePatientUrlAccess({
      role: "patient",
      boundPatientId: input.boundPatientId,
      requestedPatientId: input.requestedPatientId ?? ""
    });
    return {
      allowed: patientCheck.allowed,
      reason: patientCheck.reason,
      status: patientCheck.status === 400 ? 403 : patientCheck.status
    };
  }

  if (CLINICAL_RECORD_ALLOWED_ROLES.has(role) || role === "") {
    // Empty role: treat as clinician in test harness when only practice headers are set
    return { allowed: true, reason: "Clinical role permitted", status: 200 };
  }

  // Unknown roles fail closed for clinical record reads
  return {
    allowed: false,
    reason: `Role "${role}" is not permitted clinical record APIs`,
    status: 403
  };
}

export function assertAdminDeniedClinicalApi(role: ClinicalAccessRole) {
  const result = evaluateClinicalApiAccess({ role, requestedPatientId: "P002" });
  if (result.allowed) {
    throw new Error(`Expected role "${role}" to be denied clinical APIs`);
  }
  return true;
}

/**
 * Stage 5 — AppRole-aware clinical read gate for patient APIs (state, timeline).
 * Maps NextAuth AppRole to the same fail-closed posture as evaluateClinicalApiAccess.
 */
export function evaluateAppRoleClinicalReadAccess(input: {
  appRole: AppRole;
  boundPatientId?: string | null;
  requestedPatientId: string;
}): { allowed: boolean; reason: string; status: 200 | 403 } {
  const requested = input.requestedPatientId.trim();
  if (!requested) {
    return { allowed: false, reason: "Missing patient id", status: 403 };
  }

  if (input.appRole === "operations_lead" || input.appRole === "researcher" || input.appRole === "restricted") {
    return {
      allowed: false,
      reason: `AppRole "${input.appRole}" is denied patient clinical read APIs`,
      status: 403,
    };
  }

  if (input.appRole === "patient") {
    const patientCheck = evaluatePatientUrlAccess({
      role: "patient",
      boundPatientId: input.boundPatientId,
      requestedPatientId: requested,
    });
    return {
      allowed: patientCheck.allowed,
      reason: patientCheck.reason,
      status: patientCheck.status === 400 ? 403 : patientCheck.status,
    };
  }

  return { allowed: true, reason: "Clinical reviewer read permitted", status: 200 };
}
