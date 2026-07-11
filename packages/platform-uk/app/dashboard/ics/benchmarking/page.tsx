"use client";

import { PracticeBenchmarkTable } from "@/components/dashboard/ics/PracticeBenchmarkTable";

export default function IcsBenchmarkingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Practice Benchmarking</h2>
        <p className="text-sm text-muted">Compare AI adoption, queue clearance, and equity performance across practices.</p>
      </div>
      <PracticeBenchmarkTable />
    </div>
  );
}
