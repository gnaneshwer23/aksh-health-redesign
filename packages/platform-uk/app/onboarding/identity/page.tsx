import type { Metadata } from "next";

import { IdentityStepClient } from "./identity-step-client";

export const metadata: Metadata = {
  title: "Identity | Onboarding | Aksh Health",
  description: "Verify your identity and professional credentials.",
};

export default function IdentityPage() {
  return <IdentityStepClient />;
}
