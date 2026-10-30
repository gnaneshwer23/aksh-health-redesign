"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  Database,
  FileText,
  FlaskConical,
  Heart,
  LayoutDashboard,
  Layers,
  Network,
  PhoneCall,
  Pill,
  Settings,
  Shield,
  Stethoscope,
  Users, CalendarClock } from "lucide-react";

import { useRealWorkspace } from "@/components/workspace/WorkspaceMode";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PRACTICE_NAME } from "@/lib/mock-data";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { getPersonalizedLabel } from "@/lib/profile/personalization";
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
    { href: "/dashboard/front-desk", label: "Front Desk", icon: PhoneCall },
    { href: "/dashboard/access", label: "Fill slots", icon: CalendarClock },
    { href: "/dashboard/network", label: "Care network", icon: Network },
    { href: "/dashboard/monitoring", label: "CGM monitoring", icon: Activity },
    { href: "/dashboard/gp/diabetes-journey/P002", label: "Diabetes journey (demo)", icon: Heart },
    { href: "/dashboard/gp/diabetes-intelligence", label: "Glucose intel worklist", icon: Activity },
    { href: "/dashboard/gp/continuous-care", label: "Continuous care (demo)", icon: ClipboardList },
    { href: "/dashboard/gp/agent-intelligence", label: "Agent intel (demo)", icon: Layers },
    { href: "/dashboard/organisation", label: "Organisation", icon: Building2 },
    { href: "/review", label: "Case Review Workspace", icon: Layers },
    { href: "/dashboard/gp/care-pathways", label: "Care Pathways", icon: Activity },
    { href: "/dashboard/gp/reports", label: "Reports", icon: BarChart3 },
    { href: "/dashboard/gp/settings", label: "Settings", icon: Settings },
  ],
  nurse: [
    { href: "/dashboard/nurse", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/nurse/observations", label: "Observations", icon: Stethoscope },
    { href: "/dashboard/nurse/handover", label: "Handover", icon: ClipboardList },
    { href: "/dashboard/nurse/alerts", label: "GUARDIAN Alerts", icon: Shield },
    { href: "/dashboard/nurse/continuous-care", label: "Continuous care (demo)", icon: ClipboardList },
    { href: "/dashboard/front-desk", label: "Front Desk", icon: PhoneCall },
    { href: "/dashboard/access", label: "Fill slots", icon: CalendarClock },
    { href: "/dashboard/network", label: "Care network", icon: Network },
    { href: "/dashboard/monitoring", label: "CGM monitoring", icon: Activity },
    { href: "/dashboard/organisation", label: "Organisation", icon: Building2 },
    { href: "/dashboard/nurse?section=settings", label: "Settings", icon: Settings },
  ],
  pharmacist: [
    { href: "/dashboard/pharmacist", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/pharmacist/reviews", label: "Med Review", icon: Pill },
    { href: "/dashboard/pharmacist/interactions", label: "Interactions", icon: Shield },
    { href: "/dashboard/pharmacist/bnf", label: "Formulary Reference", icon: ClipboardList },
    { href: "/dashboard/network", label: "Care network", icon: Network },
    { href: "/dashboard/monitoring", label: "CGM monitoring", icon: Activity },
    { href: "/dashboard/organisation", label: "Organisation", icon: Building2 },
    { href: "/dashboard/pharmacist?section=settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/front-desk", label: "Front Desk", icon: PhoneCall },
    { href: "/dashboard/access", label: "Fill slots", icon: CalendarClock },
    { href: "/dashboard/network", label: "Care network", icon: Network },
    { href: "/dashboard/organisation", label: "Organisation", icon: Building2 },
    { href: "/dashboard/admin/users", label: "User Management", icon: Users },
    { href: "/dashboard/admin/integrations", label: "Integrations", icon: Activity },
    { href: "/dashboard/admin/precision-health", label: "System spine", icon: Heart },
    { href: "/dashboard/admin/consent", label: "Consent registry", icon: Shield },
    { href: "/dashboard/admin/audit", label: "Audit Log", icon: ClipboardList },
    { href: "/dashboard/admin/agent-ops", label: "Agent Ops", icon: Activity },
    { href: "/dashboard/admin/learning", label: "Learning events", icon: BookOpen },
    { href: "/dashboard/admin/organisation-enquiries", label: "Organisation Enquiries", icon: FileText },
    { href: "/dashboard/admin/billing", label: "Billing", icon: Building2 },
  ],
  ics: [
    { href: "/dashboard/ics", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/ics/population", label: "Population Health", icon: Users },
    { href: "/dashboard/ics/equity", label: "Equity Metrics", icon: BarChart3 },
    { href: "/dashboard/ics/benchmarking", label: "Benchmarking", icon: Activity },
    { href: "/dashboard/ics/forecast", label: "Risk state", icon: Heart },
    { href: "/dashboard/network", label: "Care network", icon: Network },
    { href: "/dashboard/organisation", label: "Organisation", icon: Building2 },
    { href: "/dashboard/ics?section=settings", label: "Settings", icon: Settings },
  ],
  hospital: [
    { href: "/dashboard/hospital", label: "Command Centre", icon: LayoutDashboard },
    { href: "/dashboard/hospital/wards", label: "Ward Status", icon: Building2 },
    { href: "/dashboard/hospital/capacity", label: "Capacity", icon: BarChart3 },
    { href: "/dashboard/hospital/staffing", label: "Staffing", icon: Users },
    { href: "/dashboard/hospital?panel=digital-twin", label: "Risk state", icon: Heart },
    { href: "/dashboard/hospital?panel=reports", label: "Reports", icon: ClipboardList },
    { href: "/dashboard/hospital?section=settings", label: "Settings", icon: Settings },
  ],
  researcher: [
    { href: "/dashboard/researcher", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/researcher#federated", label: "Federated (stub)", icon: FlaskConical },
    { href: "/dashboard/researcher/evaluation", label: "Evaluation", icon: FlaskConical },
    { href: "/dashboard/researcher/data-access", label: "Data Access", icon: Database },
    { href: "/dashboard/researcher/settings", label: "Settings", icon: Settings },
  ],
  patient: [],
};

/** Real workspace: only features backed by live records. CGM monitoring is for clinicians. */
const REAL_NAV: NavItem[] = [
  { href: "/dashboard/today", label: "Today", icon: LayoutDashboard },
  { href: "/dashboard/access", label: "Fill slots", icon: CalendarClock },
  { href: "/dashboard/network", label: "Patients", icon: Users },
  { href: "/dashboard/monitoring", label: "CGM monitoring", icon: Activity },
  { href: "/dashboard/organisation", label: "Organisation", icon: Building2 },
];

const ROLE_LABELS: Record<DashboardRole, string> = {
  gp: "GP",
  nurse: "Nurse",
  pharmacist: "Pharmacist",
  admin: "Admin",
  ics: "Population health lead",
  hospital: "Hospital Ops",
  researcher: "Researcher",
  patient: "Patient",
};

/** Nightingale seafoam / spruce role chips — no purple pharmacist chrome. */
const ROLE_COLORS: Record<DashboardRole, string> = {
  gp: "bg-secondary",
  nurse: "bg-secondary",
  pharmacist: "bg-secondary",
  admin: "bg-primary",
  ics: "bg-secondary",
  hospital: "bg-secondary",
  researcher: "bg-steel",
  patient: "bg-secondary",
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

export function Sidebar({ role, inSheet = false }: { role: DashboardRole; inSheet?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storeCollapsed = useDashboardStore((s) => s.sidebarCollapsed);
  const collapsed = !inSheet && storeCollapsed;
  const { profile, loading } = useUserProfile();
  const [platformAdmin, setPlatformAdmin] = useState(false);
  const real = useRealWorkspace();
  const nav = real ? REAL_NAV.filter((i) => i.href !== "/dashboard/monitoring" || ["gp", "nurse", "pharmacist"].includes(role)) : NAV[role] ?? [];
  const base = [...nav, { href: "/dashboard/security", label: "Security", icon: Shield }];
  const items = platformAdmin ? [...base, { href: "/dashboard/platform", label: "Go-live reviews", icon: Shield }] : base;
  const [enquiryCount, setEnquiryCount] = useState(0);

  // Aksh platform admins also see the go-live review queue. Everyone else gets false (or a 401) and no link.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/platform/me")
      .then((r) => (r.ok ? r.json() : { platformAdmin: false }))
      .then((d: { platformAdmin?: boolean }) => !cancelled && setPlatformAdmin(Boolean(d.platformAdmin)))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  const userName = profile?.fullName?.trim() || "Aksh user";
  // Real workspace: the organisation this person works in, from their memberships (profile text can be stale).
  const [orgName, setOrgName] = useState<string | null>(null);
  useEffect(() => {
    if (!real || role === "patient") return;
    let cancelled = false;
    fetch("/api/orgs")
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d: { rows?: { name: string }[] }) => {
        if (cancelled) return;
        const rows = d.rows ?? [];
        setOrgName(rows.length > 1 ? `${rows[0]!.name} +${rows.length - 1}` : rows[0]?.name ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [real, role]);
  const organisationLabel = real ? orgName ?? profile?.organisation?.trim() ?? "" : getPersonalizedLabel(profile, PRACTICE_NAME);

  useEffect(() => {
    if (role !== "admin" || real) return;

    let cancelled = false;

    async function loadEnquiryCount() {
      try {
        const response = await fetch("/api/admin/access-requests");
        if (!response.ok) return;
        const payload = (await response.json()) as { submittedCount?: number };
        if (!cancelled) setEnquiryCount(payload.submittedCount ?? 0);
      } catch {
        // Non-blocking sidebar badge
      }
    }

    void loadEnquiryCount();
    return () => {
      cancelled = true;
    };
  }, [role, real]);

  if (role === "patient") return null;

  return (
    <TooltipProvider>
      <aside
        className={cn(
          inSheet ? "flex h-full w-full flex-col" : "hidden lg:flex h-full shrink-0 flex-col border-r border-border-subtle/60 bg-card/90 shadow-sidebar transition-all duration-200 backdrop-blur-md",
          collapsed ? "w-16" : "w-sidebar"
        )}
        aria-label="Dashboard navigation"
      >
        <div className="border-b border-border-subtle/60 px-4 py-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-bold text-white shadow-soft">
              {collapsed ? "A" : "A"}
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-primary">Aksh Health</p>
                <p className="truncate text-[11px] text-muted">
                  {loading ? (
                    <span className="inline-block h-3 w-28 animate-pulse rounded bg-muted/30" />
                  ) : (
                    organisationLabel
                  )}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="mt-5 flex items-center gap-2 rounded-3xl bg-surface px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pastel-mint text-xs font-bold text-pastel-mint-ink">
                {loading ? "…" : (userName.split(" ").pop()?.[0] ?? "U")}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-foreground">
                  {loading ? (
                    <span className="inline-block h-3 w-20 animate-pulse rounded bg-muted/30" />
                  ) : (
                    userName
                  )}
                </span>
                <span className={cn("mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold text-white", ROLE_COLORS[role])}>
                  {ROLE_LABELS[role]}
                </span>
                {!loading && profile?.organisation ? (
                  <span className="mt-1 block truncate text-[10px] text-muted">{profile.organisation}</span>
                ) : null}
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3.5">
          {items.map((item) => {
            const active = isNavItemActive(pathname, searchParams, item.href);
            const Icon = item.icon;
            const showEnquiryBadge =
              role === "admin" &&
              item.href === "/dashboard/admin/organisation-enquiries" &&
              enquiryCount > 0;
            const link = (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "dashboard-nav-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  active ? "dashboard-nav-item--active" : "dashboard-nav-item--inactive",
                  collapsed && showEnquiryBadge && "relative"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                    active ? "bg-lime text-navy" : "bg-transparent text-steel"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {!collapsed ? (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {showEnquiryBadge ? (
                      <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {enquiryCount > 99 ? "99+" : enquiryCount}
                      </span>
                    ) : null}
                  </>
                ) : null}
                {collapsed && showEnquiryBadge ? (
                  <span
                    className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white"
                    aria-label={`${enquiryCount} new organisation enquiries`}
                  >
                    {enquiryCount > 9 ? "9+" : enquiryCount}
                  </span>
                ) : null}
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
