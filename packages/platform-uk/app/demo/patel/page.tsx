import { Suspense } from "react";

import { OverviewDemoLauncher } from "@/components/demo/overview-demo-launcher";

export default function DemoPatelPage() {
  return (
    <Suspense fallback={<main className="panel">Loading demo launcher…</main>}>
      <OverviewDemoLauncher />
    </Suspense>
  );
}
