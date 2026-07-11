import type { UserRole } from "@/lib/onboarding/roles";
import type { IdentityData, OrganisationData } from "@/lib/onboarding/validation";

import { resolveOrganisationName } from "./personalization";

export type UserProfile = {
  userId: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  organisation: string | null;
  practiceOds: string | null;
  preferences: Record<string, unknown>;
  onboardingComplete: boolean;
  emailVerified: boolean;
  identity: IdentityData;
  organisationDetails: OrganisationData;
  source: "database" | "session";
};

export {
  buildEmptyStateMessage,
  buildProfileGreeting,
  buildReviewQueueLabel,
  filterByOrg,
  filterGpPatients,
  filterGpPatientsForProfile,
  getFirstName,
  getPersonalizedLabel,
  getPharmacyLabel,
  getSupervisingGpHint,
  getTimeGreeting,
  getWardLabel,
  matchesOrgEmail,
  readPreferenceString,
  resolveOrganisationName,
  toOrgSlug,
} from "./personalization";

export async function buildUserProfile(input: {
  userId: string;
  email: string | null;
  role: UserRole;
  fullName?: string | null;
  organisation?: string | null;
  onboardingComplete?: boolean;
}): Promise<UserProfile> {
  let profile = null;
  let onboarding = null;
  let emailVerified = true;

  try {
    const { findProfileByUserId, findUserEmailVerification } = await import("@/lib/auth/user-repository");
    const { getOnboardingProgress } = await import("@/lib/onboarding/onboarding-progress-repository");
    profile = await findProfileByUserId(input.userId);
    onboarding = await getOnboardingProgress(input.userId);
    emailVerified = await findUserEmailVerification(input.userId);
  } catch {
    profile = null;
    onboarding = null;
  }

  if (profile || onboarding) {
    const identity = onboarding?.identity ?? {};
    const organisationDetails = onboarding?.organisation ?? {};
    const role = profile?.role ?? onboarding?.role ?? input.role;
    const fullName = profile?.fullName ?? input.fullName ?? null;

    return {
      userId: input.userId,
      email: input.email,
      fullName,
      role,
      organisation:
        resolveOrganisationName(role, profile, identity, organisationDetails) ?? input.organisation ?? null,
      practiceOds: profile?.practiceOds ?? readStringRecord(organisationDetails, "odsCode") ?? null,
      preferences: mergeProfilePreferences(profile?.preferences, onboarding?.preferences, organisationDetails),
      onboardingComplete: profile?.onboardingComplete ?? input.onboardingComplete ?? false,
      emailVerified,
      identity,
      organisationDetails,
      source: "database",
    };
  }

  return {
    userId: input.userId,
    email: input.email,
    fullName: input.fullName ?? null,
    role: input.role,
    organisation: input.organisation ?? null,
    practiceOds: null,
    preferences: {},
    onboardingComplete: input.onboardingComplete ?? false,
    emailVerified: true,
    identity: {},
    organisationDetails: {},
    source: "session",
  };
}

function readStringRecord(record: Record<string, unknown> | undefined, ...keys: string[]): string | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function mergeProfilePreferences(
  profilePreferences: Record<string, unknown> | undefined,
  onboardingPreferences: Record<string, unknown> | undefined,
  organisationDetails: OrganisationData
): Record<string, unknown> {
  const merged: Record<string, unknown> = {
    ...(profilePreferences ?? {}),
    ...(onboardingPreferences ?? {}),
  };

  const supervisingGp = readStringRecord(organisationDetails as Record<string, unknown>, "supervisingGp");
  const wardTeam = readStringRecord(organisationDetails as Record<string, unknown>, "wardTeam");
  const pcnAffiliation = readStringRecord(organisationDetails as Record<string, unknown>, "pcnAffiliation");
  const pharmacyName = readStringRecord(organisationDetails as Record<string, unknown>, "pharmacyName");

  if (supervisingGp && merged.supervisingGp === undefined) merged.supervisingGp = supervisingGp;
  if (wardTeam && merged.wardTeam === undefined) merged.wardTeam = wardTeam;
  if (pcnAffiliation && merged.pcnAffiliation === undefined) merged.pcnAffiliation = pcnAffiliation;
  if (pharmacyName && merged.pharmacyName === undefined) merged.pharmacyName = pharmacyName;

  return merged;
}
