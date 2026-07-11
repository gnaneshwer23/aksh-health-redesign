export function getPlatformOnboardingUrl(role: string): string {
  return `/onboarding/role-select?role=${encodeURIComponent(role)}`;
}
