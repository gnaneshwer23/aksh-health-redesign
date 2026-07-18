/** Resolve the organisation ODS code across role-specific field names. */
export function resolveOrganisationOdsCode(
  organisation: Record<string, unknown> | null | undefined
): string | null {
  if (!organisation) return null;

  for (const key of ["odsCode", "icsOdsCode", "trustOdsCode"] as const) {
    const value = organisation[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}
