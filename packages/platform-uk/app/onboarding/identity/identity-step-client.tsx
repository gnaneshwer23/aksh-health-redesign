"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { IdentityForm } from "@/components/onboarding/IdentityForm";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingNav } from "@/components/onboarding/OnboardingNav";
import {
  getNextStep,
  getPreviousStep,
  getStepPath,
  getRoleDefinition,
} from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";

export function IdentityStepClient() {
  const router = useRouter();
  const role = useOnboardingStore((s) => s.role);
  const markStepComplete = useOnboardingStore((s) => s.markStepComplete);
  const syncStepFromId = useOnboardingStore((s) => s.syncStepFromId);

  useEffect(() => {
    if (!role) {
      router.replace("/onboarding/role-select");
      return;
    }
    syncStepFromId("identity");
  }, [role, router, syncStepFromId]);

  if (!role) return null;

  const def = getRoleDefinition(role);

  function handleSubmit() {
    markStepComplete(def?.steps.indexOf("identity") ?? 1);
    const next = getNextStep(role, "identity");
    router.push(next ? getStepPath(next) : "/onboarding/complete");
  }

  function handleBack() {
    const prev = getPreviousStep(role, "identity");
    router.push(prev ? getStepPath(prev) : "/onboarding/role-select");
  }

  return (
    <OnboardingCard
      stepId="identity"
      title="Identity & credentials"
      description={`${def?.label} | verify who you are before accessing Aksh Health.`}
    >
      <IdentityForm role={role} onSubmit={handleSubmit} />
      <OnboardingNav
        onBack={handleBack}
        onContinue={() => {
          const form = document.getElementById("identity-form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
    </OnboardingCard>
  );
}
