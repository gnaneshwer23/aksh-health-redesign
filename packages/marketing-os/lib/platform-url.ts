const PLATFORM_URL =
  process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:3000";

export function getPlatformOnboardingUrl(role: string): string {
  return `${PLATFORM_URL}/onboarding?role=${encodeURIComponent(role)}`;
}
