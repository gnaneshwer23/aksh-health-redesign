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
  identity: IdentityData;
  organisationDetails: OrganisationData;
  source: "database" | "session";
};

export { buildProfileGreeting, filterGpPatients, getTimeGreeting, resolveOrganisationName } from "./personalization";

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

  try {
    const { findProfileByUserId } = await import("@/lib/auth/user-repository");
    const { getOnboardingProgress } = await import("@/lib/onboarding/onboarding-progress-repository");
    profile = await findProfileByUserId(input.userId);
    onboarding = await getOnboardingProgress(input.userId);
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
      preferences: {
        ...(profile?.preferences ?? {}),
        ...(onboarding?.preferences ?? {}),
      },
      onboardingComplete: profile?.onboardingComplete ?? input.onboardingComplete ?? false,
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
