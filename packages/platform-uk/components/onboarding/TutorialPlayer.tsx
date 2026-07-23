"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRoleOnboardingPath, type RoleTutorialScreen } from "@/lib/onboarding/role-paths";
import { resolveDashboardPath, type UserRole } from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";

type TutorialPlayerProps = {
  role: UserRole;
  onComplete: () => void;
};

function personaliseTitle(title: string, role: UserRole, identity: Record<string, unknown>): string {
  if (role !== "gp") return title;
  const doctorName =
    String(identity.fullName ?? "Smith")
      .split(" ")
      .pop() ?? "Smith";
  if (title.toLowerCase().startsWith("you're ready")) {
    return `You're ready, Dr ${doctorName}`;
  }
  return title;
}

function ScreenVisual({ screen }: { screen: RoleTutorialScreen }) {
  return (
    <div className="space-y-3 rounded-md border border-border p-4 text-sm">
      {screen.agents && screen.agents.length > 0 ? (
        <div className="flex flex-wrap gap-1.5" aria-label="Agents on this step">
          {screen.agents.map((name) => (
            <Badge key={name} variant="outline">
              {name}
            </Badge>
          ))}
        </div>
      ) : null}
      {screen.bullets && screen.bullets.length > 0 ? (
        <ul className="list-disc space-y-1.5 pl-4 text-muted">
          {screen.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      {screen.honesty ? (
        <p className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-foreground">
          {screen.honesty}
        </p>
      ) : null}
    </div>
  );
}

export function TutorialPlayer({ role, onComplete }: TutorialPlayerProps) {
  const identity = useOnboardingStore((s) => s.identity);
  const tutorialScreen = useOnboardingStore((s) => s.tutorialScreen);
  const setTutorialScreen = useOnboardingStore((s) => s.setTutorialScreen);

  const path = getRoleOnboardingPath(role);
  const screens = path?.tutorialScreens ?? [];
  const screen = screens[tutorialScreen];
  const isLast = tutorialScreen >= screens.length - 1;

  if (!screen || screens.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">No tutorial screens for this role.</p>
        <Button type="button" onClick={onComplete}>
          Continue to complete
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-200">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>
          Tutorial {tutorialScreen + 1} of {screens.length}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={onComplete}>
          Skip tutorial
        </Button>
      </div>

      {path ? (
        <p className="mb-3 rounded-md border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-foreground">
          <span className="font-medium">You approve: </span>
          {path.youApprove}
        </p>
      ) : null}

      <h2 className="text-xl font-semibold text-foreground">
        {personaliseTitle(screen.title, role, identity)}
      </h2>
      <p className="mt-3 text-muted">{screen.body}</p>
      <div className="mt-6">
        <ScreenVisual screen={screen} />
      </div>

      <div className="mt-8 flex justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={tutorialScreen === 0}
          onClick={() => setTutorialScreen(Math.max(0, tutorialScreen - 1))}
        >
          Previous
        </Button>
        {isLast ? (
          <Button type="button" onClick={onComplete}>
            {screen.ctaLabel ?? "Finish tutorial"}
          </Button>
        ) : (
          <Button type="button" onClick={() => setTutorialScreen(tutorialScreen + 1)}>
            Next
          </Button>
        )}
      </div>

      <p className="mt-4 text-xs text-muted">
        After you finish onboarding you&apos;ll land on {resolveDashboardPath(role)}. Skip is available for
        returning demo users — CTAs always complete onboarding first.
      </p>
    </div>
  );
}
