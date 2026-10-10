import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import LvAudiences from "@/components/marketing/lavender/LvAudiences";
import LvClinicianGate from "@/components/marketing/lavender/LvClinicianGate";
import LvCtaBand from "@/components/marketing/lavender/LvCtaBand";
import LvHero from "@/components/marketing/lavender/LvHero";
import LvLoop from "@/components/marketing/lavender/LvLoop";
import LvProblem from "@/components/marketing/lavender/LvProblem";

const lazy = (loader: () => Promise<{ default: React.ComponentType }>) =>
  dynamic(loader, { loading: () => <div className="min-h-[16rem]" aria-hidden /> });

const LvDiabetesModule = lazy(() => import("@/components/marketing/lavender/LvDiabetesModule"));
const LvPatientAccess = lazy(() => import("@/components/marketing/lavender/LvPatientAccess"));
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
      <LvAudiences />
      <LvProblem />
      <LvLoop flush />
      <LvDiabetesModule />
      <LvPatientAccess />
      <LvClinicianGate />
      <PatelJourneySection />
      <LvTracks />
      <LvPilotSteps />
      <LvCtaBand
        eyebrow="Free to start"
        title="Clinical intelligence should help clinicians think, not replace them."
        lede="Create an account and work in a sandbox clinic today. When your organisation is ready for real patients, we go live one workflow at a time."
        primary={{ label: "Start free", href: "/signup" }}
        secondary={{ label: "Bring Aksh to your organisation", href: "/get-started" }}
      />
    </MarketingShell>
  );
}
