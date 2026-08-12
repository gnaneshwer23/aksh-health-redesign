"use client";

import Link from "next/link";
import { ClipboardList, Pill, Shield } from "lucide-react";

import { PharmacistHeroDemoPath } from "@/components/dashboard/pharmacist/PharmacistHeroDemoPath";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { patients } from "@/lib/mock-data";
import { getPharmacyLabel } from "@/lib/profile/personalization";

const sections = [
  {
    href: "/dashboard/pharmacist/reviews",
    title: "Medication Review Queue",
    description: "Expandable patient rows with polypharmacy reviews and GUARDIAN staging.",
    icon: Pill,
    count: patients.filter((p) => p.activeMedications.length >= 2).length,
  },
  {
    href: "/dashboard/pharmacist/interactions",
    title: "Interaction Checker",
    description: "Drug interaction search with HITL edit-and-stage workflow.",
    icon: Shield,
    count: null,
  },
  {
    href: "/dashboard/pharmacist/bnf",
    title: "BNF Reference",
    description: "British National Formulary search and recently viewed monographs.",
    icon: ClipboardList,
    count: null,
  },
];

export default function PharmacistOverviewPage() {
  const { profile } = useUserProfile();
  const pharmacyLabel = getPharmacyLabel(profile);

  return (
    <div className="space-y-6">
      <PharmacistHeroDemoPath />
      <div>
        <h2 className="text-lg font-semibold text-accent">Pharmacist workspace</h2>
        <p className="mt-1 text-sm text-muted">
          Medication safety for {pharmacyLabel} — interaction checks and BNF reference with
          human-in-the-loop approval for diabetes / polypharmacy care coordination.
        </p>
        <p className="sr-only" data-testid="pharmacist-honesty-banner">
          Synthetic meds panel · GUARDIAN drafts · HITL Accept/Edit/Reject · SHIELD · liveEmis:false.
          Mark Reviewed does not write to the EHR. Spine: POST /api/clinical-spine/pharmacist-review.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="block">
              <Card className="dashboard-card border-0 shadow-none transition-colors hover:border-accent/25">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10">
                        <Icon className="h-5 w-5 text-accent" />
                      </span>
                      <CardTitle className="text-base text-accent">{section.title}</CardTitle>
                    </div>
                    {section.count !== null && (
                      <Badge className="bg-accent text-white">{section.count} patients</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
