"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

import {
  getStepIdAtIndex,
  getStepIdFromPathname,
  getStepIndex,
  getStepPath,
} from "@/lib/onboarding/roles";
import { formatSavedAt, useOnboardingStore } from "@/lib/onboarding/store";

function OnboardingSavedBanner() {
  const savedAt = useOnboardingStore((s) => s.savedAt);
  const isSaving = useOnboardingStore((s) => s.isSaving);
  const formatted = formatSavedAt(savedAt);

  if (!formatted && !isSaving) return null;

  return (
    <div className="border-b border-border-subtle bg-card/80 px-4 py-2 text-center text-xs text-muted">
      {isSaving ? "Saving…" : `Last saved: ${formatted}`}
    </div>
  );
}

export function OnboardingHydrator({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const hydrateFromServer = useOnboardingStore((s) => s.hydrateFromServer);
  const isHydrated = useOnboardingStore((s) => s.isHydrated);
  const role = useOnboardingStore((s) => s.role);
  const currentStep = useOnboardingStore((s) => s.currentStep);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      void hydrateFromServer();
      return;
    }

    useOnboardingStore.setState({ isHydrated: true });
  }, [status, hydrateFromServer]);

  useEffect(() => {
    if (!isHydrated || !role) return;

    const pathStepId = getStepIdFromPathname(pathname);
    const savedStepId = getStepIdAtIndex(role, currentStep);
    if (!pathStepId || !savedStepId) return;

    const pathIndex = getStepIndex(role, pathStepId);
    if (pathIndex < 0 || pathIndex >= currentStep) return;

    const targetPath = getStepPath(savedStepId);
    if (pathname !== targetPath) {
      router.replace(targetPath);
    }
  }, [isHydrated, role, currentStep, pathname, router]);

  if (status === "loading" || !isHydrated) {
    return (
      <p className="text-center text-muted">Loading onboarding…</p>
    );
  }

  return (
    <>
      <OnboardingSavedBanner />
      {children}
    </>
  );
}
