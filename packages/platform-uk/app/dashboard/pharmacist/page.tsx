"use client";

import Link from "next/link";
import { ClipboardList, Pill, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { patients } from "@/lib/mock-data";
import { getPharmacyLabel } from "@/lib/profile/personalization";

const PHARMACIST_ACCENT = "text-[#6B46C1]";

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
      <div>
        <h2 className={`text-lg font-semibold ${PHARMACIST_ACCENT}`}>Pharmacist workspace</h2>
        <p className="text-sm text-muted mt-1">
          Medication safety for {pharmacyLabel} | interaction checks and BNF reference with human-in-the-loop approval.
        </p>
        <p className="mt-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Reviews can append durable SHIELD audit events when signed in. Marking reviewed does not write to the EHR.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="block">
              <Card className="shadow-sm border-[#6B46C1]/15 hover:border-[#6B46C1]/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6B46C1]/10">
                        <Icon className="h-5 w-5 text-[#6B46C1]" />
                      </span>
                      <CardTitle className={`text-base ${PHARMACIST_ACCENT}`}>{section.title}</CardTitle>
                    </div>
                    {section.count !== null && (
                      <Badge className="bg-[#6B46C1] text-white">{section.count} patients</Badge>
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
