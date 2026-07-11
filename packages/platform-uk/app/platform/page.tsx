import type { Metadata } from "next";
import { Suspense } from "react";

import { AudiencePage } from "@/components/marketing/AudienceHero";
import { PlatformTabs } from "@/components/marketing/platform-tabs";

export const metadata: Metadata = {
  title: "Platform Architecture",
  description: "Full platform architecture overview of the Aksh Health AI Healthcare Operating System.",
};

export default function PlatformPage() {
  return (
    <AudiencePage
      kicker="Platform"
      title="The AI Healthcare Operating System"
      description="Aksh Health sits above your existing systems: EMIS Web, SystmOne, Epic, and Oracle Health. It connects data, surfaces risk, and coordinates care without replacing your EHR."
    >
      <Suspense fallback={<div className="py-16 text-center text-steel">Loading platform…</div>}>
        <PlatformTabs />
      </Suspense>
    </AudiencePage>
  );
}
