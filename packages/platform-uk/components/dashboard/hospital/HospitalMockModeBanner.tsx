"use client";

import { cn } from "@/lib/utils";

/** Honest rehearsal banner for hospital command surfaces (synthetic ops data only). */
export function HospitalMockModeBanner({ className }: { className?: string }) {
  return (
    <p
      role="status"
      data-testid="hospital-mock-mode-banner"
      className={cn(
        "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900",
        className
      )}
    >
      Hospital Command Centre is in <strong>synthetic rehearsal mode</strong>. Ward, capacity, and
      staffing figures are demo data — <strong>Not live hospital system</strong> / EPR feed. Accept/Dismiss actions
      log to SHIELD only; there is no write-back to hospital systems. liveEmis:false.
    </p>
  );
}
