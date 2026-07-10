import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getPlatformOnboardingUrl } from "@/lib/platform-url";
import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "Onboarding",
  "Aksh Health onboarding — configure your role and get started."
);

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const role = searchParams.role ?? "gp";
  redirect(getPlatformOnboardingUrl(role));
}
