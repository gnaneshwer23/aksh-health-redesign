import type { Metadata } from "next";

import { PrecisionHealthLoopDemo } from "@/components/demo/PrecisionHealthLoopDemo";

export const metadata: Metadata = {
  title: "Precision Health whole loop (synthetic)",
  description:
    "Synthetic closed-loop demo of the Precision Health Mermaid flowchart — not a living twin or live EMR write-back."
};

export default function PrecisionHealthLoopPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#ecfdf5_0%,_#f8fafc_45%,_#f1f5f9_100%)]">
      <PrecisionHealthLoopDemo />
    </main>
  );
}
