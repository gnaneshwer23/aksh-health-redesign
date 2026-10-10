"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { OnboardingCard } from "@/components/onboarding/OnboardingCard";
import { OnboardingNav } from "@/components/onboarding/OnboardingNav";
import { RoleTile } from "@/components/onboarding/RoleTile";
import {
  getStepPath,
  ROLES,
  SIGNUP_ROLE_MAP,
  type UserRole,
} from "@/lib/onboarding/roles";
import { useOnboardingStore } from "@/lib/onboarding/store";

function RoleSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const [selected, setSelected] = useState<UserRole | null>(null);
  const setRole = useOnboardingStore((s) => s.setRole);
  const storedRole = useOnboardingStore((s) => s.role);
  const syncStepFromId = useOnboardingStore((s) => s.syncStepFromId);

  useEffect(() => {
    if (roleParam) {
      const mapped = (SIGNUP_ROLE_MAP[roleParam] ?? roleParam) as UserRole;
      if (ROLES.some((r) => r.id === mapped)) {
        setSelected(mapped);
      }
    } else if (storedRole) {
      setSelected(storedRole);
    }
  }, [roleParam, setSelected, storedRole]);

  function handleContinue() {
    if (!selected) return;

    const current = useOnboardingStore.getState();
    const hasProgress =
      Boolean(current.role) &&
      (Object.keys(current.identity).length > 0 ||
        Object.keys(current.organisation).length > 0 ||
        Object.keys(current.preferences).length > 0 ||
        Object.keys(current.consents).length > 0 ||
        current.completedSteps.length > 1);

    if (current.role && current.role !== selected && hasProgress) {
      const confirmed = window.confirm(
        "Changing role clears saved onboarding progress for the previous role. Continue?"
      );
      if (!confirmed) return;
    }

    setRole(selected);
    syncStepFromId("identity");
    router.push(getStepPath("identity"));
  }

  return (
    <OnboardingCard
      stepId="role-select"
      title="Choose your role"
      description="Setup takes about two minutes. You start in a sandbox workspace; real patient data only arrives when your organisation goes live."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => (
          <RoleTile
            key={role.id}
            role={role}
            selected={selected === role.id}
            onSelect={() => setSelected(role.id)}
          />
        ))}
      </div>
      <OnboardingNav
        showBack={false}
        onContinue={handleContinue}
        continueDisabled={!selected}
      />
    </OnboardingCard>
  );
}

export default function RoleSelectPage() {
  return (
    <Suspense fallback={<p className="text-center text-muted">Loading…</p>}>
      <RoleSelectContent />
    </Suspense>
  );
}
