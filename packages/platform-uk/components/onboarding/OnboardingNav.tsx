"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatSavedAt, useOnboardingStore } from "@/lib/onboarding/store";

type OnboardingNavProps = {
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  showBack?: boolean;
};

export function OnboardingNav({
  onBack,
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
  showBack = true,
}: OnboardingNavProps) {
  const { toast } = useToast();
  const saveForLater = useOnboardingStore((s) => s.saveForLater);

  async function handleSave() {
    const savedAt = await saveForLater();
    const formatted = formatSavedAt(savedAt);

    toast({
      title: "Progress saved",
      description: formatted
        ? `Your onboarding was saved at ${formatted}. Sign in on any device to continue.`
        : "Saved locally. Sign in to sync across devices.",
    });
  }

  return (
    <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-6">
      <div>
        {showBack && onBack ? (
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        ) : (
          <span />
        )}
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={handleSave}>
          Save &amp; Continue Later
        </Button>
        {onContinue ? (
          <Button type="button" onClick={onContinue} disabled={continueDisabled}>
            {continueLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
