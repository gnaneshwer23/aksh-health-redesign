import type { UserRole } from "@/lib/onboarding/roles";
import type { IdentityData, OrganisationData } from "@/lib/onboarding/validation";

function readStringRecord(record: Record<string, unknown> | undefined, ...keys: string[]): string | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function resolveOrganisationName(
  role: UserRole,
  profile: { fullName: string | null; practiceOds: string | null } | null,
  identity: IdentityData,
  organisation: OrganisationData
): string | null {
  switch (role) {
    case "practice-manager":
      return readStringRecord(organisation, "practiceName") ?? profile?.practiceOds ?? null;
    case "ics-lead":
      return readStringRecord(identity, "icsName") ?? readStringRecord(organisation, "icsRegion") ?? null;
    case "hospital-executive":
      return readStringRecord(identity, "trustName") ?? null;
    case "gp":
    case "nurse":
    case "clinical-pharmacist":
      return (
        readStringRecord(organisation, "practiceName") ??
        readStringRecord(organisation, "icsRegion") ??
        profile?.practiceOds ??
        null
      );
    case "patient": {
      const first = readStringRecord(identity, "firstName");
      const last = readStringRecord(identity, "lastName");
      if (first && last) return `${first} ${last}`;
      return profile?.fullName ?? null;
    }
    default:
      return (
        readStringRecord(organisation, "practiceName") ??
        readStringRecord(organisation, "icsRegion") ??
        profile?.practiceOds ??
        null
      );
  }
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function buildProfileGreeting(fullName: string | null | undefined): string {
  const name = fullName?.trim();
  if (!name) return getTimeGreeting();
  return `${getTimeGreeting()}, ${name}`;
}

export function filterGpPatients<T extends { supervisingGp?: string }>(
  patients: T[],
  fullName: string | null | undefined
): T[] {
  if (!fullName?.trim()) return patients;

  const gpHint = fullName
    .replace(/^Dr\.?\s*/i, "")
    .split(/[\s(]/)[0]
    ?.trim();
  if (!gpHint || gpHint.length < 2) return patients;

  const filtered = patients.filter((patient) =>
    patient.supervisingGp?.toLowerCase().includes(gpHint.toLowerCase())
  );
  return filtered.length > 0 ? filtered : patients;
}
