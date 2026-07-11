/** @deprecated marketing-os is retired — use packages/platform-uk same-origin routes */
export function getPlatformOnboardingUrl(role: string): string {
  return `/onboarding?role=${encodeURIComponent(role)}`;
}
