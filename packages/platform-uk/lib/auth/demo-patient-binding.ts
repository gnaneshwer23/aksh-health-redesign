/**
 * Demo / invite-by-practice patient binding.
 *
 * Production sessions must carry `boundPatientId` on the JWT for patient-role
 * self-scope (FR-CORE-005). Until live practice invite connectors exist, demo
 * cohort emails map onto the synthetic chart ids the GP workspace already uses.
 *
 * Canonical shared diabetes journey patient: P002 Mr James Patel
 * (same id as Master Journey / GP review queue).
 */

import {
  FLAGSHIP_CANONICAL_PATIENT_ID,
  FLAGSHIP_CANONICAL_PATIENT_LABEL,
} from "@/lib/e2e/patient-identity";

export const CANONICAL_SHARED_DEMO_PATIENT_ID = FLAGSHIP_CANONICAL_PATIENT_ID;
export const CANONICAL_SHARED_DEMO_PATIENT_LABEL = FLAGSHIP_CANONICAL_PATIENT_LABEL;

const DEMO_EMAIL_DOMAIN = "demo.akshhealth.com";

/**
 * Explicit bindings for the paired doctor↔patient demo.
 * patient01 is the golden companion account → P002 (shared with GP).
 */
const EXPLICIT_DEMO_BINDINGS: Record<string, string> = {
  [`patient01@${DEMO_EMAIL_DOMAIN}`]: CANONICAL_SHARED_DEMO_PATIENT_ID,
};

/**
 * Map patient02..patient15 → P027..P040 (extended demo cohort charts).
 * Keeps remaining demo patient logins fail-open for self-scope rehearsal.
 */
function extendedDemoBinding(email: string): string | null {
  const match = /^patient(\d{2})@demo\.akshhealth\.com$/i.exec(email);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n) || n < 2 || n > 15) return null;
  // patient02 → P027 … patient15 → P040
  const chartNum = 25 + n;
  return `P${String(chartNum).padStart(3, "0")}`;
}

export function resolveDemoBoundPatientId(
  email: string | null | undefined,
  role: string | null | undefined
): string | null {
  if (role !== "patient") return null;
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  return EXPLICIT_DEMO_BINDINGS[normalized] ?? extendedDemoBinding(normalized);
}

export function readBoundPatientIdFromPreferences(
  preferences: Record<string, unknown> | null | undefined
): string | null {
  const raw = preferences?.boundPatientId;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return null;
}

/**
 * Resolve binding for a patient session: preference override, then demo email map.
 * Non-patient roles always get null.
 */
export function resolveBoundPatientIdForSession(input: {
  role: string | null | undefined;
  email?: string | null;
  preferences?: Record<string, unknown> | null;
}): string | null {
  if (input.role !== "patient") return null;
  return (
    readBoundPatientIdFromPreferences(input.preferences) ??
    resolveDemoBoundPatientId(input.email, input.role)
  );
}
