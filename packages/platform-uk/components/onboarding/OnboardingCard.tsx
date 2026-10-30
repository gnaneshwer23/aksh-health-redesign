"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { StepIndicator } from "@/components/onboarding/StepIndicator";
import type { OnboardingStepId } from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";
import { useRealWorkspace } from "@/components/workspace/WorkspaceMode";

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
  const real = useRealWorkspace();

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-display text-base font-semibold tracking-tight text-[#121715]"
          aria-label="Aksh Health home"
        >
          <span
            className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#121715] text-[13px] font-bold text-[#dcef55]"
            aria-hidden
          >
            A
          </span>
          Aksh Health
        </Link>
      </div>

      <div className="onboarding-card-surface">
        <StepIndicator role={role} currentStepId={stepId} />
        {real ? null : (
          <p className="mb-5 text-xs leading-relaxed text-muted" data-testid="onboarding-honesty-banner">
            Demo / staging setup — synthetic data. Drafts wait for a clinician decision.{" "}
            <span className="font-medium text-foreground">liveEmis:false</span>
            {" — "}no live EHR write-back in this build.
          </p>
        )}
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
