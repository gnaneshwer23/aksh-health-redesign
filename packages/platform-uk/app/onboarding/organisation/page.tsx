import type { Metadata } from "next";

import { OrganisationStepClient } from "./organisation-step-client";

export const metadata: Metadata = {
  title: "Organisation | Onboarding | Aksh Health",
  description: "Configure your practice, trust, or research organisation.",
};

export default function OrganisationPage() {
  return <OrganisationStepClient />;
}
