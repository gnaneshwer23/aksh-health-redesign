import type { Metadata } from "next";

import { ConnectedDiabetesDemo } from "@/components/demo/workflow/ConnectedDiabetesDemo";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Demo · Connected diabetes journey",
  description:
    "Synthetic guided demo of Patient 360 → glucose → medication → care-plan HITL → continuous care → agent intelligence → timeline. Not clinically validated; no EHR write.",
};

export default function ConnectedDiabetesDemoPage() {
  return (
    <SiteShell>
      <ConnectedDiabetesDemo />
    </SiteShell>
  );
}
