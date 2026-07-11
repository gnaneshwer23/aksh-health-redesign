const PLATFORM_URL =
  process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://0ne-health.vercel.app";

export function getPlatformOnboardingUrl(role: string): string {
  return `${PLATFORM_URL}/onboarding?role=${encodeURIComponent(role)}`;
}
