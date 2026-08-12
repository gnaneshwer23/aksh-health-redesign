"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { EmailVerificationBanner } from "@/components/dashboard/EmailVerificationBanner";
import { FirstRunGuidance } from "@/components/dashboard/FirstRunGuidance";
import { HonestyStatusBar } from "@/components/dashboard/HonestyStatusBar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Toaster } from "@/components/ui/toaster";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

import "@/app/dashboard/dashboard.css";

export type DashboardHonestyProps = {
  surface?: string;
  neo4jSource?: "neo4j" | "mock" | "demo" | null;
  neo4jLoading?: boolean;
  showNeo4jLive?: boolean;
};

export function DashboardShell({
  role,
  title,
  children,
  hideSidebar,
  hideSearch,
  organisation,
  showFirstRun = false,
  honesty,
}: {
  role: DashboardRole;
  title?: string;
  children: ReactNode;
  hideSidebar?: boolean;
  hideSearch?: boolean;
  organisation?: string | null;
  /** Dismissible post-onboarding guidance — enable on role home pages. */
  showFirstRun?: boolean;
  /** Optional graph / surface honesty for the single status strip. */
  honesty?: DashboardHonestyProps;
}) {
  const { status } = useSession();
  const { profile, loading } = useUserProfile();
  const resolvedOrganisation = organisation ?? profile?.organisation ?? null;
  const displayTitle =
    role === "patient" && profile?.fullName?.trim()
      ? title ?? `${profile.fullName}'s Health`
      : title;
  const isPublicDemo = status === "unauthenticated";
  const showSidebar = !hideSidebar && role !== "patient";

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
        showBrandMark={!showSidebar}
      />
      <div className="flex flex-1 overflow-hidden">
        {showSidebar ? <Sidebar role={role} /> : null}
        <main className="flex flex-1 flex-col overflow-hidden">
          <HonestyStatusBar
            surface={honesty?.surface ?? title ?? "Clinical"}
            isPublicDemo={isPublicDemo}
            neo4jSource={honesty?.neo4jSource ?? null}
            neo4jLoading={honesty?.neo4jLoading}
            showNeo4jLive={honesty?.showNeo4jLive}
          />
          {showFirstRun && !loading ? (
            <div className="shrink-0 border-b border-border-subtle/70 bg-card/70 px-4 py-2 backdrop-blur-sm">
              <FirstRunGuidance role={role} />
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
