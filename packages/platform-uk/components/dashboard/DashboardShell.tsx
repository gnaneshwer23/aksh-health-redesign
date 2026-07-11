"use client";

import type { ReactNode } from "react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DemoDataBanner } from "@/components/dashboard/DemoDataBanner";
import { EmailVerificationBanner } from "@/components/dashboard/EmailVerificationBanner";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Toaster } from "@/components/ui/toaster";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

import "@/app/dashboard/dashboard.css";

function DashboardShellSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4" aria-hidden>
      <div className="h-8 w-56 animate-pulse rounded-lg bg-muted/30" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl bg-muted/20" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-muted/15" />
    </div>
  );
}

export function DashboardShell({
  role,
  title,
  children,
  hideSidebar,
  hideSearch,
  organisation,
}: {
  role: DashboardRole;
  title?: string;
  children: ReactNode;
  hideSidebar?: boolean;
  hideSearch?: boolean;
  organisation?: string | null;
}) {
  const { profile, loading } = useUserProfile();
  const resolvedOrganisation = organisation ?? profile?.organisation ?? null;
  const displayTitle =
    role === "patient" && profile?.fullName?.trim()
      ? title ?? `${profile.fullName}'s Health`
      : title;

  return (
    <div className={cn("dashboard-root dashboard-surface flex h-screen flex-col overflow-hidden")}>
      <DemoDataBanner />
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
          {loading ? <DashboardShellSkeleton /> : children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export { ConsentBanner };
