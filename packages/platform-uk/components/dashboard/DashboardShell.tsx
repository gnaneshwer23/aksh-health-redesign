"use client";

import type { ReactNode } from "react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { EmailVerificationBanner } from "@/components/dashboard/EmailVerificationBanner";
import { FirstRunGuidance } from "@/components/dashboard/FirstRunGuidance";
import { ProductHelpLinks } from "@/components/dashboard/ProductHelpLinks";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Toaster } from "@/components/ui/toaster";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

import "@/app/dashboard/dashboard.css";

export function DashboardShell({
  role,
  title,
  children,
  hideSidebar,
  hideSearch,
  organisation,
  showFirstRun = false,
}: {
  role: DashboardRole;
  title?: string;
  children: ReactNode;
  hideSidebar?: boolean;
  hideSearch?: boolean;
  organisation?: string | null;
  /** Dismissible post-onboarding guidance + help links — enable on role home pages. */
  showFirstRun?: boolean;
}) {
  const { profile, loading } = useUserProfile();
  const resolvedOrganisation = organisation ?? profile?.organisation ?? null;
  const displayTitle =
    role === "patient" && profile?.fullName?.trim()
      ? title ?? `${profile.fullName}'s Health`
      : title;

  // Always render route children (including during profile fetch / SSR). Gating the
  // main pane behind `loading` left fetch-based smoke and first paint on a skeleton
  // with no page copy. First-run chrome can wait for profile; page content should not.
  return (
    <div className={cn("dashboard-root dashboard-surface flex h-screen flex-col overflow-hidden")}>
      <EmailVerificationBanner />
      <TopBar
        role={role}
        title={displayTitle}
        hideSearch={hideSearch}
        organisation={resolvedOrganisation}
      />
      <div className="flex flex-1 overflow-hidden">
        {!hideSidebar && <Sidebar role={role} />}
        <main className="flex flex-1 flex-col overflow-hidden">
          {showFirstRun && !loading ? (
            <div className="shrink-0 space-y-2 border-b border-border-subtle/70 bg-card/70 px-4 py-3 backdrop-blur-sm">
              <FirstRunGuidance role={role} />
              <ProductHelpLinks />
            </div>
          ) : null}
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export { ConsentBanner };
