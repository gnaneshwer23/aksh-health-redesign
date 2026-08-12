import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { OnboardingHydrator } from "@/components/onboarding/OnboardingHydrator";
import { ToasterProvider } from "@/components/ui/use-toast";

import "./onboarding.css";

export const metadata: Metadata = {
  title: "Onboarding | Aksh Health",
  description: "Set up your Aksh Health workspace for your clinical or care role.",
};

export const dynamic = "force-dynamic";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <ToasterProvider>
      <div className="onboarding-shell">
        <main className="px-4 py-10">
          <Suspense fallback={<p className="text-center text-muted">Loading onboarding…</p>}>
            <OnboardingHydrator>{children}</OnboardingHydrator>
          </Suspense>
        </main>
      </div>
    </ToasterProvider>
  );
}
