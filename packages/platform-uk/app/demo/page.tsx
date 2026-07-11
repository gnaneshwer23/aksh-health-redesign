import type { Metadata } from "next";

import { DemoHub } from "@/components/marketing/demo-hub";

export const metadata: Metadata = {
  title: "Product Demonstrations | Aksh Health",
  description:
    "Synthetic-safe walkthroughs of Aksh Health clinical workflows, review queues, and Voice Care monitoring. Clinician-in-the-loop demonstrations with no live patient data.",
};

export default function DemoPage() {
  return <DemoHub />;
}
