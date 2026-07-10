import type { ReactNode } from "react";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default function GpDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="shell">Loading workspace…</div>}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
