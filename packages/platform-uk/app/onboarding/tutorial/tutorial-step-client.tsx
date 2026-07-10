"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { TutorialPlayer } from "@/components/onboarding/TutorialPlayer";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingNav } from "@/components/onboarding/OnboardingNav";
import {
  getPreviousStep,
  getStepPath,
  getRoleDefinition,
} from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";

export function TutorialStepClient() {
  const router = useRouter();
  const role = useOnboardingStore((s) => s.role);
  const markStepComplete = useOnboardingStore((s) => s.markStepComplete);
  const syncStepFromId = useOnboardingStore((s) => s.syncStepFromId);

  useEffect(() => {
    if (!role) {
      router.replace("/onboarding/role-select");
      return;
    }
    const def = getRoleDefinition(role);
    if (!def?.hasTutorial) {
      router.replace("/onboarding/complete");
      return;
    }
    syncStepFromId("tutorial");
  }, [role, router, syncStepFromId]);

  if (!role) return null;

  const def = getRoleDefinition(role);
  if (!def?.hasTutorial) return null;

  function handleComplete() {
    markStepComplete(def?.steps.indexOf("tutorial") ?? 5);
    router.push("/onboarding/complete");
  }

  function handleBack() {
    const prev = getPreviousStep(role, "tutorial");
    router.push(prev ? getStepPath(prev) : "/onboarding/role-select");
  }

  return (
    <OnboardingCard
      stepId="tutorial"
      title="First-run tutorial"
      description="Learn how Aksh Health works for your role."
    >
      <TutorialPlayer role={role} onComplete={handleComplete} />
      <OnboardingNav onBack={handleBack} showBack />
    </OnboardingCard>
  );
}
