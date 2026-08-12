/**
 * Flagship patient identity (P1-ID-001).
 *
 * Canonical id = P002 (Mr James Patel) — shared by clinical-proof fixtures,
 * Neo4j seed, review-queue / spine resolution, Master Journey, and smoke.
 *
 * Legacy E2E generator index E2P021 (cohort B @ seed 20260812) aliases to P002
 * for one-release backward compatibility; new generator batches emit P002 directly.
 */

export const FLAGSHIP_CANONICAL_PATIENT_ID = "P002" as const;
export const FLAGSHIP_CANONICAL_PATIENT_LABEL = "Mr James Patel" as const;
export const FLAGSHIP_GENERATOR_COHORT = "B" as const;

/** Pre-unification generator id for cohort B flagship @ seed 20260812. */
export const FLAGSHIP_LEGACY_GENERATOR_ID = "E2P021" as const;

/** Thin alias map: legacy → canonical. Lookup only; do not invent new dual ids. */
export const PATIENT_ID_ALIASES: Readonly<Record<string, string>> = {
  [FLAGSHIP_LEGACY_GENERATOR_ID]: FLAGSHIP_CANONICAL_PATIENT_ID,
};

export function resolveCanonicalPatientId(id: string): string {
  const trimmed = id.trim();
  return PATIENT_ID_ALIASES[trimmed] ?? trimmed;
}

export function isFlagshipCanonicalPatientId(id: string): boolean {
  return resolveCanonicalPatientId(id) === FLAGSHIP_CANONICAL_PATIENT_ID;
}

export function listLegacyAliasesForCanonical(canonicalId: string): string[] {
  if (canonicalId !== FLAGSHIP_CANONICAL_PATIENT_ID) return [];
  return [FLAGSHIP_LEGACY_GENERATOR_ID];
}
