"use client";

import { Progress } from "@/components/ui/progress";
import { useRealWorkspace } from "@/components/workspace/WorkspaceMode";
import {
  getRoleDefinition,
  ONBOARDING_STEP_LABELS,
  REAL_SKIPPED_STEPS,
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
  const real = useRealWorkspace();
  // Real workspace: steps it skips are not shown or counted.
  const all = (def?.steps ?? []).filter((s) => !real || !REAL_SKIPPED_STEPS.includes(s));
  const steps = all.filter((s) => s !== "role-select");
  const currentIndex = Math.max(0, all.indexOf(currentStepId));
  const progressSteps = all.length ? all.length - 1 : 1;
  const progressValue = Math.max(0, Math.min(100, (currentIndex / progressSteps) * 100));

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">
          Step {Math.max(currentIndex, 1)} of {steps.length || 1}
        </span>
        <span className="font-medium text-foreground">{ONBOARDING_STEP_LABELS[currentStepId]}</span>
      </div>
      <Progress value={progressValue} className="h-2 overflow-hidden rounded-full bg-[#eae9e0]" />
      <ol className="flex flex-wrap gap-2 text-xs" aria-label="Onboarding steps">
        {steps.map((stepId, index) => {
          const absoluteIndex = all.indexOf(stepId) ?? index;
          const isComplete = absoluteIndex < currentIndex;
          const isActive = stepId === currentStepId;
          return (
            <li
              key={stepId}
              className={cn(
                "onboarding-step-pill list-none",
                isActive && "onboarding-step-pill--active",
                isComplete && !isActive && "onboarding-step-pill--done"
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
