"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { PreferencesPanel } from "@/components/onboarding/PreferencesPanel";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingNav } from "@/components/onboarding/OnboardingNav";
import {
  getNextStep,
  getPreviousStep,
  getStepPath,
  getRoleDefinition,
} from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";

export function PreferencesStepClient() {
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
    syncStepFromId("preferences");
  }, [role, router, syncStepFromId]);

  if (!role || role === "patient") return null;

  const def = getRoleDefinition(role);

  function handleSubmit() {
    markStepComplete(def?.steps.indexOf("preferences") ?? 3);
    const next = getNextStep(role, "preferences");
    router.push(next ? getStepPath(next) : "/onboarding/complete");
  }

  function handleBack() {
    const prev = getPreviousStep(role, "preferences");
    router.push(prev ? getStepPath(prev) : "/onboarding/role-select");
  }

  return (
    <OnboardingCard
      stepId="preferences"
      title="Workspace preferences"
      description="Choose defaults for drafts, alerts, and digests in your role."
    >
      <PreferencesPanel role={role} onSubmit={handleSubmit} />
      <OnboardingNav
        onBack={handleBack}
        onContinue={() => {
          const form = document.getElementById("preferences-form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      />
    </OnboardingCard>
  );
}
