"use client";

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
    <div className="mb-8 space-y-3">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">
          Step {Math.max(currentIndex, 1)} of {steps.length || 1}
        </span>
        <span className="font-medium text-foreground">
          {ONBOARDING_STEP_LABELS[currentStepId]}
        </span>
      </div>
      <Progress value={progressValue} className="h-1.5" />
      <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Onboarding steps">
        {steps.map((stepId, index) => {
          const absoluteIndex = def?.steps.indexOf(stepId) ?? index;
          const isComplete = absoluteIndex < currentIndex;
          const isActive = stepId === currentStepId;
          return (
            <li
              key={stepId}
              className={cn(
                "list-none",
                isActive && "font-medium text-foreground",
                isComplete && !isActive && "text-foreground/70"
              )}
            >
              {ONBOARDING_STEP_LABELS[stepId]}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
