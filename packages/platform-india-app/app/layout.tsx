import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aksh Health India — क्लिनिकल समीक्षा",
  description:
    "DPDPA-aware, review-first clinical documentation for India OPD. ICMR pathways and Indian Pharmacopoeia safety gates — synthetic Phase 0 scaffold only."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hi">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
