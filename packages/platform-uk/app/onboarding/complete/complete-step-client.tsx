"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { SandboxPreview } from "@/components/onboarding/SandboxPreview";
import { getRoleDefinition, resolveDashboardPath } from "@/lib/onboarding/roles";
import { markOnboardingComplete, useOnboardingStore } from "@/lib/onboarding/store";

export function CompleteStepClient() {
  const router = useRouter();
  const role = useOnboardingStore((s) => s.role);
  const identity = useOnboardingStore((s) => s.identity);
  const markStepComplete = useOnboardingStore((s) => s.markStepComplete);
  const syncStepFromId = useOnboardingStore((s) => s.syncStepFromId);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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
    if (!role) return;
    setSubmitting(true);
    try {
      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      markStepComplete(def?.steps.indexOf("complete") ?? def?.steps.length ?? 0);
      markOnboardingComplete(role);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  const dashboardPath = resolveDashboardPath(role);

  return (
    <OnboardingCard
      stepId="complete"
      title="You're all set"
      description={`Welcome, ${displayName}. Your ${def?.label} workspace is ready.`}
    >
      <SandboxPreview />
      <div className="mt-6 space-y-4">
        {!done ? (
          <Button type="button" onClick={handleComplete} disabled={submitting}>
            {submitting ? "Saving…" : "Complete onboarding"}
          </Button>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={dashboardPath}>Go to dashboard</Link>
            </Button>
            {def?.alternateDashboardPaths?.map((path) => (
              <Button key={path} variant="outline" asChild>
                <Link href={path}>Open regional view</Link>
              </Button>
            ))}
          </div>
        )}
      </div>
    </OnboardingCard>
  );
}
