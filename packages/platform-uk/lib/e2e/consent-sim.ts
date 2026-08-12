/**
 * Purpose-bound consent simulation for the diabetes clinic loop.
 * Grant → mid-journey revoke blocks downstream processing (honest deny, not silent continue).
 */

export const CONSENT_SIM_HONESTY = {
  liveConsentRegistry: false as const,
  liveEmis: false as const,
  ehrWrite: false as const,
  note: "Simulated purpose-bound consent registry — not a live national consent spine.",
} as const;

export type ConsentPurpose =
  | "care_coordination"
  | "voice_encounter_capture"
  | "lab_share"
  | "pharmacy_share"
  | "research_aggregate"
  | "digital_twin_ranking";

export type ConsentGrant = {
  id: string;
  patientId: string;
  purpose: ConsentPurpose;
  status: "granted" | "revoked";
  grantedAt: string;
  revokedAt: string | null;
  correlationId: string;
  actor: string;
  liveConsentRegistry: false;
  ehrWrite: false;
};

export type ConsentAccessDecision = {
  allowed: boolean;
  purpose: ConsentPurpose;
  patientId: string;
  reason: string;
  grantId: string | null;
};

export function grantConsent(input: {
  patientId: string;
  purpose: ConsentPurpose;
  correlationId: string;
  actor: string;
  at?: string;
}): ConsentGrant {
  const at = input.at ?? new Date().toISOString();
  return {
    id: `e2e-consent-${input.purpose}-${input.patientId}`,
    patientId: input.patientId,
    purpose: input.purpose,
    status: "granted",
    grantedAt: at,
    revokedAt: null,
    correlationId: input.correlationId,
    actor: input.actor,
    liveConsentRegistry: false,
    ehrWrite: false,
  };
}

export function revokeConsent(
  grant: ConsentGrant,
  actor: string,
  at?: string
): ConsentGrant {
  if (grant.status === "revoked") {
    return grant;
  }
  return {
    ...grant,
    status: "revoked",
    revokedAt: at ?? new Date().toISOString(),
    actor,
  };
}

export function evaluateConsentAccess(
  grants: ConsentGrant[],
  patientId: string,
  purpose: ConsentPurpose
): ConsentAccessDecision {
  const match = grants
    .filter((g) => g.patientId === patientId && g.purpose === purpose)
    .sort((a, b) => (a.grantedAt < b.grantedAt ? 1 : -1))[0];

  if (!match) {
    return {
      allowed: false,
      purpose,
      patientId,
      reason: `No consent grant for purpose=${purpose}`,
      grantId: null,
    };
  }
  if (match.status === "revoked") {
    return {
      allowed: false,
      purpose,
      patientId,
      reason: `Consent revoked for purpose=${purpose} at ${match.revokedAt}`,
      grantId: match.id,
    };
  }
  return {
    allowed: true,
    purpose,
    patientId,
    reason: `Consent granted for purpose=${purpose}`,
    grantId: match.id,
  };
}

/**
 * Assert mid-journey revoke blocks a purpose (used by Master / stakeholder clinic).
 */
export function assertRevokeBlocksPurpose(
  grants: ConsentGrant[],
  patientId: string,
  purpose: ConsentPurpose
): { ok: boolean; decision: ConsentAccessDecision } {
  const decision = evaluateConsentAccess(grants, patientId, purpose);
  return { ok: decision.allowed === false, decision };
}
