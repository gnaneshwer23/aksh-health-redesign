"use client";

import { cn } from "@/lib/utils";

type DataSource = "neo4j" | "mock" | null;

export function Neo4jMockModeBanner({
  source,
  loading,
  className,
}: {
  source: DataSource;
  loading?: boolean;
  className?: string;
}) {
  if (loading || source === "neo4j") return null;

  return (
    <p
      role="status"
      data-testid="neo4j-mock-mode-banner"
      className={cn(
        "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900",
        className
      )}
    >
      Clinical graph data is in <strong>mock mode</strong>. Neo4j is not connected. ORACLE,
      GUARDIAN, and ICS panels use synthetic fallback data.
    </p>
  );
}
