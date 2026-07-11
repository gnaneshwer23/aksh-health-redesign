"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Activity,
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  FlaskConical,
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

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: Record<DashboardRole, NavItem[]> = {
  gp: [
    { href: "/dashboard/gp", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/gp/patients", label: "My Patients", icon: Users },
    { href: "/dashboard/gp/review-queue", label: "Review Queue", icon: ClipboardList },
    { href: "/dashboard/gp/care-pathways", label: "Care Pathways", icon: Activity },
    { href: "/dashboard/gp/reports", label: "Reports", icon: BarChart3 },
    { href: "/dashboard/gp/settings", label: "Settings", icon: Settings },
  ],
  nurse: [
    { href: "/dashboard/nurse", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/nurse/observations", label: "Observations", icon: Stethoscope },
    { href: "/dashboard/nurse/handover", label: "Handover", icon: ClipboardList },
    { href: "/dashboard/nurse/alerts", label: "GUARDIAN Alerts", icon: Shield },
    { href: "/dashboard/nurse?section=settings", label: "Settings", icon: Settings },
  ],
  pharmacist: [
    { href: "/dashboard/pharmacist", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/pharmacist/reviews", label: "Med Review", icon: Pill },
    { href: "/dashboard/pharmacist/interactions", label: "Interactions", icon: Shield },
    { href: "/dashboard/pharmacist/bnf", label: "BNF Reference", icon: ClipboardList },
    { href: "/dashboard/pharmacist?section=settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "User Management", icon: Users },
    { href: "/dashboard/admin/integrations", label: "Integrations", icon: Activity },
    { href: "/dashboard/admin/audit", label: "Audit Log", icon: ClipboardList },
    { href: "/dashboard/admin/pilot-applications", label: "Pilot Applications", icon: FileText },
    { href: "/dashboard/admin/billing", label: "Billing", icon: Building2 },
  ],
  ics: [
    { href: "/dashboard/ics", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/ics?panel=population", label: "Population Health", icon: Users },
    { href: "/dashboard/ics?panel=equity", label: "Equity Metrics", icon: BarChart3 },
    { href: "/dashboard/ics?panel=benchmarking", label: "Benchmarking", icon: Activity },
    { href: "/dashboard/ics?panel=digital-twin", label: "Digital Twin", icon: Heart },
    { href: "/dashboard/ics?panel=reports", label: "Reports", icon: ClipboardList },
    { href: "/dashboard/ics?section=settings", label: "Settings", icon: Settings },
  ],
  hospital: [
    { href: "/dashboard/hospital", label: "Command Centre", icon: LayoutDashboard },
    { href: "/dashboard/hospital?panel=wards", label: "Ward Status", icon: Building2 },
    { href: "/dashboard/hospital?panel=capacity", label: "Capacity", icon: BarChart3 },
    { href: "/dashboard/hospital?panel=staffing", label: "Staffing", icon: Users },
    { href: "/dashboard/hospital?panel=digital-twin", label: "Digital Twin", icon: Heart },
    { href: "/dashboard/hospital?panel=reports", label: "Reports", icon: ClipboardList },
    { href: "/dashboard/hospital?section=settings", label: "Settings", icon: Settings },
  ],
  researcher: [
    { href: "/dashboard/researcher", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/researcher?panel=evaluation", label: "Evaluation", icon: FlaskConical },
    { href: "/dashboard/researcher?section=settings", label: "Settings", icon: Settings },
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
  researcher: "Researcher",
  patient: "Patient",
};

const ROLE_COLORS: Record<DashboardRole, string> = {
  gp: "bg-primary",
  nurse: "bg-secondary",
  pharmacist: "bg-[#6B46C1]",
  admin: "bg-slate",
  ics: "bg-warning",
  hospital: "bg-primary",
  researcher: "bg-[#E67E22]",
  patient: "bg-accent",
};

function isNavItemActive(pathname: string, searchParams: URLSearchParams, href: string) {
  const [path, query] = href.split("?");
  if (query) {
    if (pathname !== path) return false;
    const itemParams = new URLSearchParams(query);
    for (const [key, value] of itemParams.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
    return true;
  }

  if (pathname !== path) return false;
  if (searchParams.get("panel") || searchParams.get("section")) return false;
  return true;
}

export function Sidebar({ role, userName = "Dr Morgan" }: { role: DashboardRole; userName?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
            const active = isNavItemActive(pathname, searchParams, item.href);
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
