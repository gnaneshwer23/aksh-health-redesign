import type { Metadata } from "next";

import { CompleteStepClient } from "./complete-step-client";

export const metadata: Metadata = {
  title: "Complete | Onboarding | Aksh Health",
  description: "Onboarding complete — enter your Aksh Health dashboard.",
};

export default function CompletePage() {
  return <CompleteStepClient />;
}
