"use client";

import { EquityDeepDive } from "@/components/dashboard/ics/EquityDeepDive";

export default function IcsEquityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Equity Metrics</h2>
        <p className="text-sm text-muted">EQUITY agent flags and recommended interventions by practice.</p>
      </div>
      <EquityDeepDive />
    </div>
  );
}
