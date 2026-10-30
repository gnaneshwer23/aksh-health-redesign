import { NextResponse } from "next/server";

import { getPgPool, isPostgresConfigured } from "../../../lib/db/client";
import { isRealWorkspace } from "../../../lib/env/workspace";
import { checkNeo4jHealth, isNeo4jConfigured } from "../../../lib/neo4j";

export const dynamic = "force-dynamic";

type ServiceHealth = {
  configured: boolean;
  connected: boolean;
  mode: "live" | "mock" | "unconfigured";
};

async function checkDatabaseHealth(): Promise<ServiceHealth> {
  if (!isPostgresConfigured()) {
    return { configured: false, connected: false, mode: "unconfigured" };
  }

  try {
    await getPgPool().query("SELECT 1");
    return { configured: true, connected: true, mode: "live" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code ?? "")
        : "";
    // Ops-only signal — production JSON stays ok/degraded with no detail.
    console.error("[health] database probe failed:", code || "unknown", message.split("\n")[0]);
    return { configured: true, connected: false, mode: "live" };
  }
}

/**
 * Health probe. In the real workspace (production) it says only ok/degraded, with 503 when the database is down so
 * uptime monitors alert; the detailed view (graph, modes) is for simulation and local.
 */
export async function GET() {
  if (isRealWorkspace()) {
    const database = await checkDatabaseHealth();
    const ok = !database.configured || database.connected;
    return NextResponse.json({ status: ok ? "ok" : "degraded" }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  }
  const [database, neo4jHealth] = await Promise.all([checkDatabaseHealth(), checkNeo4jHealth()]);

  const neo4j: ServiceHealth = {
    configured: isNeo4jConfigured(),
    connected: neo4jHealth.connected,
    mode: neo4jHealth.mode,
  };

  // Neo4j is optional for the synthetic proof platform. Only fail hard when
  // NEO4J_REQUIRED=true, or when Postgres (auth/audit) is configured but down.
  const neo4jRequired = process.env.NEO4J_REQUIRED === "true";
  const degraded =
    (database.configured && !database.connected) ||
    (neo4jRequired && neo4j.configured && !neo4j.connected);

  return NextResponse.json({
    status: degraded ? "degraded" : "ok",
    database,
    neo4j: {
      ...neo4j,
      required: neo4jRequired,
      note:
        neo4j.mode === "live"
          ? "Graph connected."
          : neo4j.configured
            ? (neo4jHealth.reconnectHint ??
              "Neo4j env present but unreachable — dashboards use mock graph data.")
            : "Neo4j not configured — dashboards use mock graph data.",
    },
  });
}
