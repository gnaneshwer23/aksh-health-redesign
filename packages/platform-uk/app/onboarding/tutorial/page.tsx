import type { Metadata } from "next";

import { TutorialStepClient } from "./tutorial-step-client";

export const metadata: Metadata = {
  title: "Tutorial | Onboarding | Aksh Health",
  description: "Interactive first-run tutorial for your Aksh Health dashboard.",
};

export default function TutorialPage() {
  return <TutorialStepClient />;
}
