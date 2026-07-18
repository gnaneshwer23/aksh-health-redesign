"use client";

import { cn } from "@/lib/utils";

type DataSource = "neo4j" | "mock" | null;

export function Neo4jMockModeBanner({
  source,
  loading,
  className,
  showLive = false,
}: {
  source: DataSource;
  loading?: boolean;
  className?: string;
  /** When true, also show a positive live banner for Neo4j-connected views. */
  showLive?: boolean;
}) {
  if (loading) return null;

  if (source === "neo4j") {
    if (!showLive) return null;
    return (
      <p
        role="status"
        data-testid="neo4j-live-mode-banner"
        className={cn(
          "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900",
          className
        )}
      >
        Clinical graph data is <strong>live from Neo4j</strong>. ORACLE, GUARDIAN, and ICS panels
        reflect the seeded Aura graph for this session.
      </p>
    );
  }

  return (
    <p
      role="status"
      data-testid="neo4j-mock-mode-banner"
      className={cn(
        "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900",
        className
      )}
    >
      Clinical graph data is in <strong>local fallback mode</strong>. Neo4j is not connected. ORACLE,
      GUARDIAN, and ICS panels use cached fallback data until the graph is linked. If Aura shows{" "}
      <strong>Paused</strong>, resume the instance in the Neo4j Aura console, wait until it is Running,
      then refresh — see docs/NEO4J_SETUP.md.
    </p>
  );
}
