"use client";

import Link from "next/link";
import { Activity, BookOpen, Building2, ClipboardList, FileText, Heart, Shield, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LINKS = [
  { href: "/dashboard/admin/users", label: "User Management", description: "Invite, activate, and manage staff accounts", icon: Users },
  { href: "/dashboard/admin/integrations", label: "Integrations", description: "EMIS, SystmOne, FHIR, and platform service health", icon: Activity },
  {
    href: "/dashboard/admin/precision-health",
    label: "Precision Health",
    description: "Connectors, twin/EMIS honesty flags, partner checklist pointers (scaffolding)",
    icon: Heart,
  },
  {
    href: "/dashboard/admin/consent",
    label: "Consent registry",
    description: "Purpose + modality grants (Phase 1) — SHIELD logged, no EHR write",
    icon: Shield,
  },
  { href: "/dashboard/admin/audit", label: "Audit Log", description: "Full SHIELD audit trail for clinical AI actions", icon: ClipboardList },
  {
    href: "/dashboard/admin/learning",
    label: "Learning events",
    description: "Prediction → decision → outcome recorder (no auto-retrain)",
    icon: BookOpen
  },
  { href: "/dashboard/admin/organisation-enquiries", label: "Organisation Enquiries", description: "Access requests from NHS organisations", icon: FileText },
  { href: "/dashboard/admin/billing", label: "Billing", description: "Subscription and contract contact details", icon: Building2 },
] as const;

export function AdminQuickLinks() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Admin Sections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-start gap-3 rounded-xl border border-border-subtle bg-card p-3 transition-colors hover:border-primary/30 hover:bg-surface-muted"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate/10 text-slate">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-foreground">{link.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{link.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
