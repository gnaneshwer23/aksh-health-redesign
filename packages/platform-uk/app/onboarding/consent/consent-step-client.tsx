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
  REAL_SKIPPED_STEPS,
  getRoleDefinition,
} from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";
import { useRealWorkspace } from "@/components/workspace/WorkspaceMode";

export function ConsentStepClient() {
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
    syncStepFromId("consent");
  }, [role, router, syncStepFromId]);

  if (!role) return null;

  const def = getRoleDefinition(role);

  function handleSubmit() {
    markStepComplete(def?.steps.indexOf("consent") ?? 4);
    const next = getNextStep(role, "consent", real ? REAL_SKIPPED_STEPS : undefined);
    router.push(next ? getStepPath(next) : "/onboarding/complete");
  }

  function handleBack() {
    const prev = getPreviousStep(role, "consent", real ? REAL_SKIPPED_STEPS : undefined);
    router.push(prev ? getStepPath(prev) : "/onboarding/role-select");
  }

  return (
    <OnboardingCard
      stepId="consent"
      title="Consent and acknowledgements"
      description={
        role === "patient"
          ? "Please read and agree to these terms in plain English."
          : "Required acknowledgements before you use the workspace."
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
