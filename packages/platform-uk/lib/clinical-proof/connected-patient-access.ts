/**
 * INT-09 — patient-scoped access gate for connected diabetes APIs.
 *
 * Wraps `evaluateAppRoleClinicalReadAccess` (which calls `evaluatePatientUrlAccess`
 * for `patient` sessions) so every patient-module route denies cross-patient and
 * ops/researcher access with the same fail-closed posture as `/api/patients/[id]/state`.
 */

import { NextResponse } from "next/server";

import type { AppRole } from "../permission-matrix";
import { evaluateAppRoleClinicalReadAccess } from "./tenant-isolation";

export type ConnectedPatientAuth = {
  userRole: AppRole;
  boundPatientId: string | null;
};

/**
 * Returns a 403/400 JSON response when the caller may not access `requestedPatientId`.
 * Returns `null` when access is allowed (continue the handler).
 */
export function denyUnlessConnectedPatientAccess(
  auth: ConnectedPatientAuth,
  requestedPatientId: string
): NextResponse | null {
  const access = evaluateAppRoleClinicalReadAccess({
    appRole: auth.userRole,
    boundPatientId: auth.boundPatientId,
    requestedPatientId,
  });
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.reason, denied: true },
      { status: access.status }
    );
  }
  return null;
}
