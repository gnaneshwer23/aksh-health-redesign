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
  REAL_SKIPPED_STEPS,
  getRoleDefinition,
} from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";
import { useRealWorkspace } from "@/components/workspace/WorkspaceMode";

export function OrganisationStepClient() {
  const router = useRouter();
  const role = useOnboardingStore((s) => s.role);
  const markStepComplete = useOnboardingStore((s) => s.markStepComplete);
  const syncStepFromId = useOnboardingStore((s) => s.syncStepFromId);
  const real = useRealWorkspace();

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
    const next = getNextStep(role, "organisation", real ? REAL_SKIPPED_STEPS : undefined);
    router.push(next ? getStepPath(next) : "/onboarding/complete");
  }

  function handleBack() {
    const prev = getPreviousStep(role, "organisation", real ? REAL_SKIPPED_STEPS : undefined);
    router.push(prev ? getStepPath(prev) : "/onboarding/role-select");
  }

  return (
    <OnboardingCard
      stepId="organisation"
      title="Your organisation"
      description={real ? "Set up your clinic, or join the clinic that invited you." : "Start in the sandbox clinic now, or tell us about your organisation for when it goes live."}
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
