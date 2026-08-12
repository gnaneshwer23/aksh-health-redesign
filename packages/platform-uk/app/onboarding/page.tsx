import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SIGNUP_ROLE_MAP } from "@/lib/onboarding/roles";

export const metadata: Metadata = {
  title: "Onboarding ",
  description: "Start your personalised Aksh Health onboarding.",
};

type OnboardingPageProps = {
  searchParams: { role?: string };
};

export default function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const mappedRole = searchParams.role
    ? SIGNUP_ROLE_MAP[searchParams.role] ?? searchParams.role
    : null;

  if (mappedRole) {
    redirect(`/onboarding/role-select?role=${mappedRole}`);
  }

  redirect("/onboarding/role-select");
}
