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
import { ONBOARDING_MARKETS } from "@/lib/onboarding/markets";
import { useOnboardingStore } from "@/lib/onboarding/store";

function RoleSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const [selected, setSelected] = useState<UserRole | null>(null);
  const setRole = useOnboardingStore((s) => s.setRole);
  const storedRole = useOnboardingStore((s) => s.role);
  const syncStepFromId = useOnboardingStore((s) => s.syncStepFromId);
  const market = useOnboardingStore((s) => s.market);
  const setMarket = useOnboardingStore((s) => s.setMarket);

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
      title="Where you work, and your role"
      description="Pick your market and role. Setup takes about two minutes, then you land in a synthetic workspace with 500 patients — no real patient data."
    >
      <fieldset className="mb-6">
        <legend className="mb-2 text-sm font-semibold text-foreground">Market</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Market">
          {ONBOARDING_MARKETS.map((m) => (
            <button
              key={m.code}
              type="button"
              role="radio"
              aria-checked={market === m.code}
              onClick={() => setMarket(m.code)}
              className={
                market === m.code
                  ? "rounded-full border border-secondary bg-secondary px-4 py-2 text-sm font-medium text-white"
                  : "rounded-full border border-border-subtle bg-white px-4 py-2 text-sm font-medium text-foreground hover:border-secondary/40"
              }
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Sets which registration number we ask for, emergency numbers and data-residency rules. You can change it later.
        </p>
      </fieldset>
      <p className="mb-2 text-sm font-semibold text-foreground">Role</p>
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
