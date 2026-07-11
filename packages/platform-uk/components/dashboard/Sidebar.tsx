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
  admin: "bg-slate",
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
          "hidden lg:flex h-full shrink-0 flex-col border-r border-border-subtle bg-card shadow-sidebar transition-all duration-200",
          collapsed ? "w-16" : "w-sidebar"
        )}
        aria-label="Dashboard navigation"
      >
        <div className="border-b border-border-subtle px-4 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm">
              {collapsed ? "A" : "A"}
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-primary">Aksh Health</p>
                <p className="truncate text-[11px] text-muted">{PRACTICE_NAME}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {userName.split(" ").pop()?.[0] ?? "U"}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-foreground">{userName}</span>
                <span className={cn("mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold text-white", ROLE_COLORS[role])}>
                  {ROLE_LABELS[role]}
                </span>
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard/gp" && pathname.startsWith(item.href));
            const Icon = item.icon;
            const link = (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "dashboard-nav-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  active ? "dashboard-nav-item--active" : "dashboard-nav-item--inactive",
                  active && "border-l-[3px] border-accent pl-[9px]"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-white" : "text-steel")} />
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
