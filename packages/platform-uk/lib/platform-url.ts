export function getPlatformOnboardingUrl(role: string): string {
  return `/onboarding?role=${encodeURIComponent(role)}`;
}
