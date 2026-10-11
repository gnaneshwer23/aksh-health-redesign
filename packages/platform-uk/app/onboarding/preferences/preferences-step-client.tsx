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
  REAL_SKIPPED_STEPS,
  getRoleDefinition,
} from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";
import { useRealWorkspace } from "@/components/workspace/WorkspaceMode";

export function PreferencesStepClient() {
  const router = useRouter();
  const role = useOnboardingStore((s) => s.role);
  const markStepComplete = useOnboardingStore((s) => s.markStepComplete);
  const syncStepFromId = useOnboardingStore((s) => s.syncStepFromId);
  // Role preferences configure demo dashboards; the real workspace has none, so this step passes straight on.
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
    if (real) {
      const next = getNextStep(role, "preferences", REAL_SKIPPED_STEPS);
      router.replace(next ? getStepPath(next) : "/onboarding/complete");
      return;
    }
    syncStepFromId("preferences");
  }, [role, router, syncStepFromId, real]);

  if (!role || role === "patient" || real) return null;

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
