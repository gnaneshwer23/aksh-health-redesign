import type { Metadata } from "next";

import { SlotFillDemo } from "@/components/demo/workflow/SlotFillDemo";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Demo · Cancelled-slot fill",
  description:
    "Synthetic guided demo: freed slot → ranked worklist → staff decision → recorded result. Staff always choose; Aksh never contacts patients.",
};

export default function SlotFillDemoPage() {
  return (
    <SiteShell>
      <SlotFillDemo />
    </SiteShell>
  );
}
