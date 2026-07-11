"use client";

import type { ReactNode } from "react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Toaster } from "@/components/ui/toaster";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

import "@/app/dashboard/dashboard.css";

export function DashboardShell({
  role,
  title,
  children,
  hideSidebar,
}: {
  role: DashboardRole;
  title?: string;
  children: ReactNode;
  hideSidebar?: boolean;
}) {
  return (
    <div className={cn("dashboard-root dashboard-surface flex h-screen flex-col overflow-hidden")}>
      <TopBar role={role} title={title} />
      <div className="flex flex-1 overflow-hidden">
        {!hideSidebar && <Sidebar role={role} />}
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}

export { ConsentBanner };
