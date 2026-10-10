import type { UserRole } from "./roles";

/** Markets a self-serve account can start in. Regulation stays per market; the product is the same. */
export const ONBOARDING_MARKETS = [
  { code: "GB", label: "United Kingdom" },
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "OTHER", label: "Somewhere else" },
] as const;

export type OnboardingMarket = (typeof ONBOARDING_MARKETS)[number]["code"];

export const DEFAULT_MARKET: OnboardingMarket = "GB";

export function isOnboardingMarket(value: unknown): value is OnboardingMarket {
  return ONBOARDING_MARKETS.some((m) => m.code === value);
}

type RegisteredRole = "gp" | "nurse" | "clinical-pharmacist";

const REGISTRATION: Record<OnboardingMarket, Record<RegisteredRole, { label: string; placeholder: string }>> = {
  GB: {
    gp: { label: "GMC number", placeholder: "7 digits" },
    nurse: { label: "NMC PIN", placeholder: "e.g. 12A3456B" },
    "clinical-pharmacist": { label: "GPhC number", placeholder: "7 digits" },
  },
  IN: {
    gp: { label: "NMC / State Medical Council registration", placeholder: "Registration number" },
    nurse: { label: "State Nursing Council registration", placeholder: "Registration number" },
    "clinical-pharmacist": { label: "State Pharmacy Council registration", placeholder: "Registration number" },
  },
  US: {
    gp: { label: "NPI number", placeholder: "10 digits" },
    nurse: { label: "NPI or state RN licence", placeholder: "NPI or licence number" },
    "clinical-pharmacist": { label: "NPI or state pharmacist licence", placeholder: "NPI or licence number" },
  },
  AE: {
    gp: { label: "DHA / DOH / MOHAP licence", placeholder: "Licence number" },
    nurse: { label: "DHA / DOH / MOHAP licence", placeholder: "Licence number" },
    "clinical-pharmacist": { label: "DHA / DOH / MOHAP licence", placeholder: "Licence number" },
  },
  OTHER: {
    gp: { label: "Professional registration number", placeholder: "Registration number" },
    nurse: { label: "Professional registration number", placeholder: "Registration number" },
    "clinical-pharmacist": { label: "Professional registration number", placeholder: "Registration number" },
  },
};

export function isRegisteredRole(role: UserRole): role is RegisteredRole {
  return role === "gp" || role === "nurse" || role === "clinical-pharmacist";
}

/** Label for the professional registration field for this role in this market. */
export function registrationFieldFor(role: UserRole, market: OnboardingMarket) {
  return isRegisteredRole(role) ? REGISTRATION[market][role] : null;
}

/**
 * Patient invite codes are issued by a clinic and bind a patient account to that clinic's record.
 * In the synthetic network the code for patient W0123 is AKSH-W0123.
 */
export const INVITE_CODE_PATTERN = /^AKSH-W\d{4}$/i;

export function patientIdFromInviteCode(code: string | null | undefined): string | null {
  const trimmed = code?.trim().toUpperCase() ?? "";
  return INVITE_CODE_PATTERN.test(trimmed) ? trimmed.slice("AKSH-".length) : null;
}
