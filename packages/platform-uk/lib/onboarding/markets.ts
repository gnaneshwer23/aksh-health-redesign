import type { UserRole } from "./roles";

/**
 * Internal locale codes. Never shown as country names in the product: an organisation's region, units,
 * language and emergency numbers are organisation settings, not a sign-up choice.
 */
export const ONBOARDING_MARKETS = [
  { code: "GB" },
  { code: "IN" },
  { code: "US" },
  { code: "AE" },
  { code: "OTHER" },
] as const;

export type OnboardingMarket = (typeof ONBOARDING_MARKETS)[number]["code"];

export const DEFAULT_MARKET: OnboardingMarket = "OTHER";

export function isOnboardingMarket(value: unknown): value is OnboardingMarket {
  return ONBOARDING_MARKETS.some((m) => m.code === value);
}

type RegisteredRole = "gp" | "nurse" | "clinical-pharmacist";

export function isRegisteredRole(role: UserRole): role is RegisteredRole {
  return role === "gp" || role === "nurse" || role === "clinical-pharmacist";
}

/**
 * Registration field for licensed roles. Deliberately jurisdiction-neutral: the regulating body is captured as
 * free text and checked by a per-register verification adapter before any live patient data.
 */
export function registrationFieldFor(role: UserRole, _market?: OnboardingMarket) {
  return isRegisteredRole(role)
    ? { label: "Professional registration or licence number", placeholder: "As issued by your regulator" }
    : null;
}
