"use client";

import Link from "next/link";
import { FlaskConical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";

const ROLE_DEMO_LINKS: Partial<
  Record<DashboardRole, Array<{ href: string; label: string }>>
> = {
  gp: [
    { href: "/dashboard/gp/review-queue", label: "Review queue" },
    { href: "/review/pilot?demo=1", label: "Accept (HITL) pilot" },
    { href: "/cases/case-005/evidence?demo=1", label: "Export FHIR Bundle (sim)" },
    { href: "/demo/script", label: "Full demo script" },
    { href: "/demo/patel", label: "Patel walkthrough" },
  ],
  pharmacist: [
    { href: "/dashboard/pharmacist/reviews", label: "Med review queue" },
    { href: "/dashboard/pharmacist/interactions", label: "GUARDIAN interactions" },
    { href: "/demo/script", label: "Full demo script" },
  ],
  nurse: [
    { href: "/dashboard/nurse/observations", label: "Observations" },
    { href: "/dashboard/nurse/handover", label: "Handover" },
    { href: "/dashboard/nurse/alerts", label: "GUARDIAN alerts" },
    { href: "/demo/script", label: "Full demo script" },
  ],
  admin: [
    { href: "/dashboard/admin/integrations", label: "Integrations honesty" },
    { href: "/dashboard/admin/audit", label: "SHIELD audit" },
    { href: "/dashboard/admin/organisation-enquiries", label: "Organisation enquiries" },
    { href: "/demo/script", label: "Full demo script" },
  ],
  ics: [
    { href: "/dashboard/ics/population", label: "Population" },
    { href: "/dashboard/ics/equity", label: "Equity (COMPASS)" },
    { href: "/dashboard/ics/forecast", label: "Forecast" },
    { href: "/demo/script", label: "Full demo script" },
  ],
  hospital: [
    { href: "/dashboard/hospital/wards", label: "Wards" },
    { href: "/dashboard/hospital/capacity", label: "Capacity" },
    { href: "/dashboard/hospital/staffing", label: "Staffing" },
    { href: "/demo/script", label: "Full demo script" },
  ],
  researcher: [
    { href: "/dashboard/researcher", label: "Ethics / overview" },
    { href: "/dashboard/researcher/evaluation", label: "Evaluation" },
    { href: "/dashboard/researcher/data-access", label: "Data access" },
    { href: "/demo/script", label: "Full demo script" },
  ],
};

const SHARED_LINKS = [
  { href: "/platform", label: "Platform" },
  { href: "/security", label: "Security" },
  { href: "/product/demo", label: "Product demo" },
];

/** Collapses hero demo paths + product help into one TopBar control. */
export function DemoMenu({ role }: { role: DashboardRole }) {
  const roleLinks = ROLE_DEMO_LINKS[role] ?? [
    { href: "/demo/script", label: "Full demo script" },
    { href: "/demo/patel", label: "Walkthrough" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hidden h-8 gap-1.5 rounded-full px-2.5 text-xs font-medium text-primary hover:text-secondary sm:inline-flex"
          data-testid="demo-menu-trigger"
          aria-label="Demo and help"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          Demo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted">
          Demo paths
        </DropdownMenuLabel>
        {roleLinks.map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <Link href={link.href}>{link.label}</Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted">
          Help
        </DropdownMenuLabel>
        <div data-testid="product-help-links">
          {SHARED_LINKS.map((link) => (
            <DropdownMenuItem key={link.href} asChild>
              <Link href={link.href}>{link.label}</Link>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
