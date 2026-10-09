import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import LvCapabilities from "@/components/marketing/lavender/LvCapabilities";
import LvClinicianGate from "@/components/marketing/lavender/LvClinicianGate";
import LvCtaBand from "@/components/marketing/lavender/LvCtaBand";
import LvHero from "@/components/marketing/lavender/LvHero";

const PatelJourneySection = dynamic(() => import("@/components/marketing/PatelJourneySection"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

const LvRoles = dynamic(() => import("@/components/marketing/lavender/LvRoles"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

const LvPilotSteps = dynamic(() => import("@/components/marketing/lavender/LvPilotSteps"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

const LvHonesty = dynamic(() => import("@/components/marketing/lavender/LvHonesty"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

export const metadata: Metadata = {
  title: "Aksh Health | Clinical Intelligence, Under Clinical Control",
  description:
    "Aksh Health helps clinical teams capture, understand, review and coordinate care with AI-assisted intelligence and named clinician oversight. Diabetes-first. Primary-care ready.",
};

export default function HomePage() {
  return (
    <MarketingShell overLightHero>
      <LvHero />
      <LvCapabilities />
      <LvClinicianGate />
      <LvRoles />
      <PatelJourneySection />
      <LvPilotSteps />
      <LvHonesty />
      <LvCtaBand
        eyebrow="Start with a controlled use case"
        title="Clinical intelligence should help clinicians think, not replace them."
        lede="Start with a focused workflow. Define the governance boundaries. Measure the outcomes. Expand when the evidence supports it."
        primary={{ label: "Request a Pilot", href: "/get-started" }}
        secondary={{ label: "Open the Patel Walkthrough", href: "/demo/patel" }}
      />
    </MarketingShell>
  );
}
