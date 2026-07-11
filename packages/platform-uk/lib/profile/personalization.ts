import type { UserRole } from "@/lib/onboarding/roles";
import type { IdentityData, OrganisationData } from "@/lib/onboarding/validation";

import type { UserProfile } from "./user-profile";

const DEFAULT_PRACTICE_LABEL = "Riverside Medical Centre";

function readStringRecord(record: Record<string, unknown> | undefined, ...keys: string[]): string | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function readPreferenceString(
  source: Record<string, unknown> | undefined,
  ...keys: string[]
): string | null {
  return readStringRecord(source, ...keys);
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
    case "researcher":
      return (
        readStringRecord(organisation, "researchInstitution") ??
        readStringRecord(identity, "institutionName") ??
        null
      );
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

export function getPersonalizedLabel(profile: UserProfile | null | undefined, fallback: string): string {
  return profile?.organisation?.trim() || fallback;
}

export function getFirstName(fullName: string | null | undefined): string | null {
  const name = fullName?.trim();
  if (!name) return null;

  const parts = name.split(/\s+/);
  const honorifics = new Set(["mr", "mrs", "ms", "miss", "dr", "prof"]);
  if (parts.length > 1 && honorifics.has(parts[0].toLowerCase().replace(/\./g, ""))) {
    return parts[1] ?? null;
  }
  return parts[0] ?? null;
}

export function toOrgSlug(organisation: string | null | undefined): string {
  if (!organisation?.trim()) return "aksh";
  return organisation
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

export function filterByOrg<T extends { organisation?: string }>(
  items: T[],
  org: string | null | undefined
): T[] {
  if (!org?.trim()) return items;

  const needle = org.trim().toLowerCase();
  const filtered = items.filter((item) => {
    const itemOrg = item.organisation?.trim().toLowerCase();
    if (!itemOrg) return false;
    return itemOrg.includes(needle) || needle.includes(itemOrg);
  });

  return filtered.length > 0 ? filtered : items;
}

export function getSupervisingGpHint(profile: UserProfile | null | undefined): string | null {
  return (
    readPreferenceString(profile?.preferences, "supervisingGp") ??
    readPreferenceString(profile?.organisationDetails as Record<string, unknown>, "supervisingGp") ??
    profile?.fullName ??
    null
  );
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

export function filterGpPatientsForProfile<T extends { supervisingGp?: string; organisation?: string }>(
  patients: T[],
  profile: UserProfile | null | undefined
): T[] {
  let scoped = patients;
  if (profile?.organisation) {
    scoped = filterByOrg(scoped, profile.organisation);
  }
  return filterGpPatients(scoped, getSupervisingGpHint(profile));
}

export function buildEmptyStateMessage(
  profile: UserProfile | null | undefined,
  context: string,
  fallback: string
): string {
  const org = profile?.organisation?.trim();
  if (org) return `No ${context} assigned to ${org}`;
  if (profile?.role) return `No ${context} for your ${profile.role} account yet`;
  return fallback;
}

export function getWardLabel(profile: UserProfile | null | undefined, fallback = "Ward 3A"): string {
  return (
    readPreferenceString(profile?.organisationDetails as Record<string, unknown>, "wardTeam") ??
    readPreferenceString(profile?.preferences, "wardTeam", "ward") ??
    fallback
  );
}

export function getPharmacyLabel(profile: UserProfile | null | undefined, fallback = DEFAULT_PRACTICE_LABEL): string {
  return (
    readPreferenceString(profile?.preferences, "pharmacyName", "pharmacy") ??
    readPreferenceString(profile?.organisationDetails as Record<string, unknown>, "pcnAffiliation") ??
    getPersonalizedLabel(profile, fallback)
  );
}

export function matchesOrgEmail(email: string, org: string | null | undefined): boolean {
  if (!org?.trim()) return false;

  const emailLower = email.toLowerCase();
  const orgLower = org.toLowerCase();
  if (emailLower.includes(orgLower.replace(/\s+/g, ""))) return true;

  const tokens = orgLower.split(/\s+/).filter((token) => token.length > 3);
  return tokens.some((token) => emailLower.includes(token));
}

export function buildReviewQueueLabel(fullName: string | null | undefined, fallback = "AI Review Queue"): string {
  const name = fullName?.trim();
  if (!name) return fallback;
  return `${name}'s queue`;
}
