import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import LvClinicianGate from "@/components/marketing/lavender/LvClinicianGate";
import LvCtaBand from "@/components/marketing/lavender/LvCtaBand";
import LvHero from "@/components/marketing/lavender/LvHero";
import LvLoop from "@/components/marketing/lavender/LvLoop";
import LvProblem from "@/components/marketing/lavender/LvProblem";

const lazy = (loader: () => Promise<{ default: React.ComponentType }>) =>
  dynamic(loader, { loading: () => <div className="min-h-[16rem]" aria-hidden /> });

const LvDiabetesModule = lazy(() => import("@/components/marketing/lavender/LvDiabetesModule"));
const LvAgents = lazy(() => import("@/components/marketing/lavender/LvAgents"));
const LvPatientAccess = lazy(() => import("@/components/marketing/lavender/LvPatientAccess"));
const LvLayers = lazy(() => import("@/components/marketing/lavender/LvLayers"));
const LvRoles = lazy(() => import("@/components/marketing/lavender/LvRoles"));
const PatelJourneySection = lazy(() => import("@/components/marketing/PatelJourneySection"));
const LvTracks = lazy(() => import("@/components/marketing/lavender/LvTracks"));
const LvPilotSteps = lazy(() => import("@/components/marketing/lavender/LvPilotSteps"));

export const metadata: Metadata = {
  title: "Aksh Health | Clinical Intelligence, Under Clinical Control",
  description:
    "The Aksh Intelligence Platform: one auditable, human-in-the-loop clinical intelligence layer beside your EHR. First module: Aksh Diabetes. A named clinician decides; the platform never decides alone.",
};

export default function HomePage() {
  return (
    <MarketingShell overLightHero>
      <LvHero />
      <LvProblem />
      <LvLoop flush />
      <LvClinicianGate />
      <LvDiabetesModule />
      <LvPatientAccess />
      <LvAgents />
      <LvLayers />
      <LvRoles />
      <PatelJourneySection />
      <LvTracks />
      <LvPilotSteps />
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
