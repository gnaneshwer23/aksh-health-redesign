"use client";

import { Check } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import {
  getRoleDefinition,
  ONBOARDING_STEP_LABELS,
  type OnboardingStepId,
  type UserRole,
} from "@/lib/onboarding/roles";
import { cn } from "@/lib/utils";

type StepIndicatorProps = {
  role: UserRole | null;
  currentStepId: OnboardingStepId;
};

export function StepIndicator({ role, currentStepId }: StepIndicatorProps) {
  const def = getRoleDefinition(role);
  const steps = def?.steps.filter((s) => s !== "role-select") ?? [];
  const currentIndex = def?.steps.indexOf(currentStepId) ?? 0;
  const progressSteps = def?.steps.length ? def.steps.length - 1 : 1;
  const progressValue = Math.max(
    0,
    Math.min(100, (currentIndex / progressSteps) * 100)
  );

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          Step {Math.max(currentIndex, 1)} of {steps.length || 1}
        </span>
        <span className="font-medium text-foreground">
          {ONBOARDING_STEP_LABELS[currentStepId]}
        </span>
      </div>
      <Progress value={progressValue} />
      <div className="flex flex-wrap gap-2">
        {steps.map((stepId, index) => {
          const stepNumber = index + 1;
          const absoluteIndex = def?.steps.indexOf(stepId) ?? index;
          const isComplete = absoluteIndex < currentIndex;
          const isActive = stepId === currentStepId;
          return (
            <div
              key={stepId}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-200 shadow-sm",
                isComplete &&
                  "border-medicom-emerald bg-medicom-emerald text-white",
                isActive &&
                  !isComplete &&
                  "border-medicom-navy bg-medicom-navy text-white ring-4 ring-medicom-navy/15",
                !isComplete && !isActive && "border-border-subtle bg-card text-muted"
              )}
              title={ONBOARDING_STEP_LABELS[stepId]}
            >
              {isComplete ? <Check className="h-4 w-4" aria-hidden /> : stepNumber}
            </div>
          );
        })}
      </div>
    </div>
  );
}
