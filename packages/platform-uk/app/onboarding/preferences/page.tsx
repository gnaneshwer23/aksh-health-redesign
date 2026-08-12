import type { Metadata } from "next";

import { PreferencesStepClient } from "./preferences-step-client";

export const metadata: Metadata = {
  title: "Preferences | Onboarding | Aksh Health",
  description: "Configure workspace preferences for your role.",
};

export default function PreferencesPage() {
  return <PreferencesStepClient />;
}
