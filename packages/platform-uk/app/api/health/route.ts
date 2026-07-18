import { NextResponse } from "next/server";

import { getPgPool, isPostgresConfigured } from "../../../lib/db/client";
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
  } catch {
    return { configured: true, connected: false, mode: "live" };
  }
}

/** Public production health probe — no secrets in the response body. */
export async function GET() {
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
            ? "Neo4j env present but unreachable — dashboards use mock graph data."
            : "Neo4j not configured — dashboards use mock graph data."
    },
  });
}
