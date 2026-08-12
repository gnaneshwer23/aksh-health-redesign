import type { Metadata } from "next";

import { ConsentStepClient } from "./consent-step-client";

export const metadata: Metadata = {
  title: "Consent | Onboarding ",
  description: "Review data governance and AI consent terms.",
};

export default function ConsentPage() {
  return <ConsentStepClient />;
}
