import type { Metadata } from "next";
import Link from "next/link";

import { AudiencePage } from "@/components/marketing/AudienceHero";
import { PlatformAdministratorsPanel } from "@/components/marketing/platform-tab-panels";

export const metadata: Metadata = {
  title: "For Administrators | Aksh Health",
  description:
    "Practice administration, integration readiness, and SHIELD compliance scaffolding for NHS organisations evaluating Aksh Health.",
};

export default function ForAdministratorsPage() {
  return (
    <AudiencePage
      kicker="For administrators"
      title="Governance, tenancy, and integration readiness."
      description="Practice-level tenancy, integration health views, and SHIELD compliance evidence are scaffolded for evaluation. Current proof uses synthetic patients with clear integration boundaries."
      ctaHref="/get-started"
      ctaLabel="Request organisation onboarding"
    >
      <PlatformAdministratorsPanel />
      <section className="border-t border-border bg-surface py-12">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className="text-steel">Need admin access for your organisation?</p>
          <Link
            href="/signup?role=admin"
            className="mt-4 inline-block rounded-xl bg-navy px-6 py-3 font-bold text-white hover:bg-navy/90"
          >
            Sign up as practice admin
          </Link>
        </div>
      </section>
    </AudiencePage>
  );
}
