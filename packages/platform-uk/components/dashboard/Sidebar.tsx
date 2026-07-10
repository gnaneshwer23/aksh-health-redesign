"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Building2,
  ClipboardList,
  Heart,
  LayoutDashboard,
  Pill,
  Settings,
  Shield,
  Stethoscope,
  Users,
} from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PRACTICE_NAME } from "@/lib/mock-data";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

const NAV: Record<DashboardRole, { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[]> = {
  gp: [
    { href: "/dashboard/gp", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/gp/patients", label: "My Patients", icon: Users },
    { href: "/dashboard/gp/review-queue", label: "Review Queue", icon: ClipboardList },
    { href: "/dashboard/gp/care-pathways", label: "Care Pathways", icon: Activity },
    { href: "/dashboard/ics", label: "Population", icon: BarChart3 },
    { href: "/dashboard/admin", label: "Reports", icon: BarChart3 },
    { href: "/dashboard/admin", label: "Settings", icon: Settings },
  ],
  nurse: [
    { href: "/dashboard/nurse", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/nurse", label: "Observations", icon: Stethoscope },
    { href: "/dashboard/nurse", label: "Handover", icon: ClipboardList },
    { href: "/dashboard/gp/review-queue", label: "GUARDIAN Alerts", icon: Shield },
    { href: "/dashboard/admin", label: "Settings", icon: Settings },
  ],
  pharmacist: [
    { href: "/dashboard/pharmacist", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/pharmacist", label: "Med Review", icon: Pill },
    { href: "/dashboard/pharmacist", label: "Interactions", icon: Shield },
    { href: "/dashboard/pharmacist", label: "BNF Reference", icon: ClipboardList },
    { href: "/dashboard/admin", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin", label: "User Management", icon: Users },
    { href: "/dashboard/admin", label: "Integrations", icon: Activity },
    { href: "/dashboard/admin", label: "Audit Log", icon: ClipboardList },
    { href: "/dashboard/ics", label: "Equity Reports", icon: BarChart3 },
    { href: "/dashboard/admin", label: "Data Governance", icon: Shield },
    { href: "/dashboard/admin", label: "Billing", icon: Building2 },
    { href: "/dashboard/admin", label: "Settings", icon: Settings },
  ],
  ics: [
    { href: "/dashboard/ics", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/ics", label: "Population Health", icon: Users },
    { href: "/dashboard/ics", label: "Equity Metrics", icon: BarChart3 },
    { href: "/dashboard/ics", label: "Benchmarking", icon: Activity },
    { href: "/dashboard/hospital", label: "Digital Twin", icon: Heart },
    { href: "/dashboard/ics", label: "Reports", icon: ClipboardList },
    { href: "/dashboard/admin", label: "Settings", icon: Settings },
  ],
  hospital: [
    { href: "/dashboard/hospital", label: "Command Centre", icon: LayoutDashboard },
    { href: "/dashboard/hospital", label: "Ward Status", icon: Building2 },
    { href: "/dashboard/hospital", label: "Capacity", icon: BarChart3 },
    { href: "/dashboard/hospital", label: "Staffing", icon: Users },
    { href: "/dashboard/ics", label: "Digital Twin", icon: Heart },
    { href: "/dashboard/ics", label: "Reports", icon: ClipboardList },
    { href: "/dashboard/admin", label: "Settings", icon: Settings },
  ],
  patient: [],
};

const ROLE_LABELS: Record<DashboardRole, string> = {
  gp: "GP",
  nurse: "Nurse",
  pharmacist: "Pharmacist",
  admin: "Admin",
  ics: "ICS Lead",
  hospital: "Hospital Ops",
  patient: "Patient",
};

const ROLE_COLORS: Record<DashboardRole, string> = {
  gp: "bg-primary",
  nurse: "bg-secondary",
  pharmacist: "bg-[#6B46C1]",
  admin: "bg-[#1A202C]",
  ics: "bg-warning",
  hospital: "bg-primary",
  patient: "bg-accent",
};

export function Sidebar({ role, userName = "Dr Morgan" }: { role: DashboardRole; userName?: string }) {
  const pathname = usePathname();
  const collapsed = useDashboardStore((s) => s.sidebarCollapsed);
  const items = NAV[role] ?? [];

  if (role === "patient") return null;

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "hidden lg:flex h-full shrink-0 flex-col border-r border-border bg-card shadow-sm transition-all",
          collapsed ? "w-16" : "w-60"
        )}
        aria-label="Dashboard navigation"
      >
        <div className="border-b border-border p-4">
          <p className="text-sm font-bold text-primary truncate">{collapsed ? "A" : "Aksh Health"}</p>
          {!collapsed && <p className="text-xs text-muted truncate">{PRACTICE_NAME}</p>}
          {!collapsed && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs font-medium truncate">{userName}</span>
              <span className={cn("rounded-sm px-1.5 py-0.5 text-[10px] text-white", ROLE_COLORS[role])}>{ROLE_LABELS[role]}</span>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard/gp" && pathname.startsWith(item.href));
            const Icon = item.icon;
            const link = (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active ? "bg-primary text-white border-l-4 border-accent" : "text-foreground hover:bg-background"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
            if (collapsed) {
              return (
                <Tooltip key={`${item.href}-${item.label}`}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
