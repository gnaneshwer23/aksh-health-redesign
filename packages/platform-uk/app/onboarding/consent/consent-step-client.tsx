"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ConsentForm } from "@/components/onboarding/ConsentForm";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingNav } from "@/components/onboarding/OnboardingNav";
import {
  getNextStep,
  getPreviousStep,
  getStepPath,
  getRoleDefinition,
} from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";

export function ConsentStepClient() {
  const router = useRouter();
  const role = useOnboardingStore((s) => s.role);
  const markStepComplete = useOnboardingStore((s) => s.markStepComplete);
  const syncStepFromId = useOnboardingStore((s) => s.syncStepFromId);

  useEffect(() => {
    if (!role) {
      router.replace("/onboarding/role-select");
      return;
    }
    syncStepFromId("consent");
  }, [role, router, syncStepFromId]);

  if (!role) return null;

  const def = getRoleDefinition(role);

  function handleSubmit() {
    markStepComplete(def?.steps.indexOf("consent") ?? 4);
    const next = getNextStep(role, "consent");
    router.push(next ? getStepPath(next) : "/onboarding/complete");
  }

  function handleBack() {
    const prev = getPreviousStep(role, "consent");
    router.push(prev ? getStepPath(prev) : "/onboarding/role-select");
  }

  return (
    <OnboardingCard
      stepId="consent"
      title="Consent & governance"
      description={
        role === "patient"
          ? "Please read and agree to these terms in plain English."
          : "Required acknowledgements for safe AI-assisted care."
      }
    >
      <ConsentForm role={role} onSubmit={handleSubmit} />
      <OnboardingNav
        onBack={handleBack}
        onContinue={() => {
          const form = document.getElementById("consent-form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
    </OnboardingCard>
  );
}
