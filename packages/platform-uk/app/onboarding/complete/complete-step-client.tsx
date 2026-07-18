"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { SandboxPreview } from "@/components/onboarding/SandboxPreview";
import { useToast } from "@/components/ui/use-toast";
import { resolvePostAuthRedirect } from "@/lib/auth/redirects";
import { resolveOrganisationOdsCode } from "@/lib/onboarding/organisation-ods";
import { getRoleDefinition } from "@/lib/onboarding/roles";
import { markOnboardingComplete, useOnboardingStore } from "@/lib/onboarding/store";

export function CompleteStepClient() {
  const router = useRouter();
  const { update } = useSession();
  const { toast } = useToast();
  const role = useOnboardingStore((s) => s.role);
  const identity = useOnboardingStore((s) => s.identity);
  const organisation = useOnboardingStore((s) => s.organisation);
  const preferences = useOnboardingStore((s) => s.preferences);
  const consents = useOnboardingStore((s) => s.consents);
  const markStepComplete = useOnboardingStore((s) => s.markStepComplete);
  const syncStepFromId = useOnboardingStore((s) => s.syncStepFromId);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!role) {
      router.replace("/onboarding/role-select");
      return;
    }
    syncStepFromId("complete");
  }, [role, router, syncStepFromId]);

  if (!role) return null;

  const def = getRoleDefinition(role);
  const displayName =
    String(identity.fullName ?? "") ||
    [identity.firstName, identity.lastName].filter(Boolean).join(" ") ||
    def?.label;

  async function handleComplete() {
    if (!role || submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          role,
          identity,
          organisation,
          preferences,
          consents,
          fullName: displayName,
          practiceOds: resolveOrganisationOdsCode(organisation) ?? undefined,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        onboardingComplete?: boolean;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Failed to complete onboarding");
      }

      const updatedSession = await update({ onboardingComplete: true, role });
      const sessionReady =
        updatedSession?.user?.onboardingComplete === true ||
        (await fetch("/api/auth/session")
          .then((res) => res.json())
          .then(
            (session: { user?: { onboardingComplete?: boolean } }) =>
              session.user?.onboardingComplete === true
          ));

      if (!sessionReady) {
        throw new Error("Your session could not be updated. Please sign in again.");
      }

      markStepComplete(def?.steps.indexOf("complete") ?? def?.steps.length ?? 0);
      markOnboardingComplete(role);

      const destination = resolvePostAuthRedirect({
        onboardingComplete: true,
        role,
      });
      window.location.assign(destination);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to complete onboarding";
      toast({
        title: "Could not complete onboarding",
        description: message,
      });
      setSubmitting(false);
    }
  }

  return (
    <OnboardingCard
      stepId="complete"
      title="You're all set"
      description={`Welcome, ${displayName}. Your ${def?.label} workspace is ready — Capture → draft → approve with clinician control.`}
    >
      <SandboxPreview />
      <div className="mt-6 space-y-4">
        <Button type="button" onClick={handleComplete} disabled={submitting}>
          {submitting ? "Opening your dashboard…" : "Go to your dashboard"}
        </Button>
        <p className="text-xs text-muted">
          Completing onboarding marks your profile ready and opens your role home with first-run guidance.
        </p>
      </div>
    </OnboardingCard>
  );
}
