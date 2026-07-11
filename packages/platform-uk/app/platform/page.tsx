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
      description="Aksh Health is not a chatbot, patient portal, or EHR. It is the intelligence layer that sits above your existing healthcare infrastructure — EMIS Web, SystmOne, Epic, Oracle Health — and makes it intelligent, proactive, and coordinated."
    >
      <Suspense fallback={<div className="py-16 text-center text-steel">Loading platform…</div>}>
        <PlatformTabs />
      </Suspense>
    </AudiencePage>
  );
}
