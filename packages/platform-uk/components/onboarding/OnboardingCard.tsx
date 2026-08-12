"use client";

import Link from "next/link";
import type { ReactNode } from "react";

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

  return (
    <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6">
        <Link href="/" className="font-display text-base font-semibold tracking-tight text-primary">
          Aksh Health
        </Link>
      </div>

      <div className="onboarding-card-surface">
        <StepIndicator role={role} currentStepId={stepId} />
        <p
          className="mb-5 text-xs leading-relaxed text-muted"
          data-testid="onboarding-honesty-banner"
        >
          Demo / staging setup — synthetic data. Drafts wait for a clinician decision.{" "}
          <span className="font-medium text-foreground">liveEmis:false</span>
          {" — "}no live EMIS or SystmOne connection.
        </p>
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
