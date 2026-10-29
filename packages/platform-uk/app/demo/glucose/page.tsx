import type { Metadata } from "next";

import { GlucoseMonitorDemo } from "@/components/demo/workflow/GlucoseMonitorDemo";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Demo · Glucose and CGM monitoring",
  description:
    "Synthetic guided demo: readings → prioritised worklist → explanation → clinician review → recorded result. No autonomous treatment changes.",
};

export default function GlucoseDemoPage() {
  return (
    <SiteShell>
      <GlucoseMonitorDemo />
    </SiteShell>
  );
}
