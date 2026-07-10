"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { OrgForm } from "@/components/onboarding/OrgForm";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingNav } from "@/components/onboarding/OnboardingNav";
import {
  getNextStep,
  getPreviousStep,
  getStepPath,
  getRoleDefinition,
} from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";

export function OrganisationStepClient() {
  const router = useRouter();
  const role = useOnboardingStore((s) => s.role);
  const markStepComplete = useOnboardingStore((s) => s.markStepComplete);
  const syncStepFromId = useOnboardingStore((s) => s.syncStepFromId);

  useEffect(() => {
    if (!role) {
      router.replace("/onboarding/role-select");
      return;
    }
    if (role === "patient") {
      router.replace(getStepPath("consent"));
      return;
    }
    syncStepFromId("organisation");
  }, [role, router, syncStepFromId]);

  if (!role || role === "patient") return null;

  const def = getRoleDefinition(role);

  function handleSubmit() {
    markStepComplete(def?.steps.indexOf("organisation") ?? 2);
    const next = getNextStep(role, "organisation");
    router.push(next ? getStepPath(next) : "/onboarding/complete");
  }

  function handleBack() {
    const prev = getPreviousStep(role, "organisation");
    router.push(prev ? getStepPath(prev) : "/onboarding/role-select");
  }

  return (
    <OnboardingCard
      stepId="organisation"
      title="Organisation setup"
      description="Connect your practice, ICS, trust, or research institution."
    >
      <OrgForm role={role} onSubmit={handleSubmit} />
      <OnboardingNav
        onBack={handleBack}
        onContinue={() => {
          const form = document.getElementById("org-form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
    </OnboardingCard>
  );
}
