"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import type { OnboardingStepId } from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";

type OnboardingCardProps = {
  stepId: OnboardingStepId;
  title: string;
  description?: string;
  children: ReactNode;
};

export function OnboardingCard({
  stepId,
  title,
  description,
  children,
}: OnboardingCardProps) {
  const role = useOnboardingStore((s) => s.role);
  const saveForLater = useOnboardingStore((s) => s.saveForLater);
  const { toast } = useToast();

  function handleSave() {
    saveForLater();
    toast({
      title: "Progress saved",
      description: "Return anytime to continue onboarding.",
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl animate-in fade-in duration-200">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-primary">
          Aksh Health
        </Link>
        <Button type="button" variant="ghost" size="sm" onClick={handleSave}>
          Save &amp; Continue Later
        </Button>
      </div>

      <div className="onboarding-card-surface">
        <StepIndicator role={role} currentStepId={stepId} />
        <p
          className="mb-4 rounded-md border border-warning/25 bg-warning/5 px-3 py-2 text-xs text-foreground"
          data-testid="onboarding-honesty-banner"
        >
          Demo / staging onboarding — synthetic data · clinician HITL ·{" "}
          <span className="font-medium">liveEmis:false</span>. No live EMIS or SystmOne connection
          claimed.
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
