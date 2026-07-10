"use client";

import { useEffect, useMemo, useState } from "react";

import type { DashboardSummary } from "@/lib/dashboard-summary";

export function useDashboardSummary() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load workspace summary.");
        }

        const payload = (await response.json()) as { summary: DashboardSummary };
        setSummary(payload.summary);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load workspace summary.");
      } finally {
        setIsLoaded(true);
      }
    }

    void loadSummary();
  }, []);

  return useMemo(
    () => ({ summary, isLoaded, error }),
    [summary, isLoaded, error]
  );
}
