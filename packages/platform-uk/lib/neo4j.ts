import type { Driver, QueryResult } from "neo4j-driver";
import neo4j from "neo4j-driver";

let driver: Driver | null = null;

export function isNeo4jConfigured(): boolean {
  return Boolean(
    process.env.NEO4J_URI?.trim() &&
      process.env.NEO4J_USERNAME?.trim() &&
      process.env.NEO4J_PASSWORD?.trim()
  );
}

export function getNeo4jDriver(): Driver | null {
  if (!isNeo4jConfigured()) return null;

  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI!.trim(),
      neo4j.auth.basic(process.env.NEO4J_USERNAME!.trim(), process.env.NEO4J_PASSWORD!.trim())
    );
  }

  return driver;
}

export async function runQuery(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<QueryResult> {
  const activeDriver = getNeo4jDriver();
  if (!activeDriver) {
    throw new Error("Neo4j is not configured");
  }

  const database = process.env.NEO4J_DATABASE?.trim();
  const session = activeDriver.session(database ? { database } : undefined);
  try {
    return await session.run(cypher, params);
  } finally {
    await session.close();
  }
}

export async function closeNeo4jDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

export type Neo4jHealthStatus = {
  connected: boolean;
  mode: "live" | "mock";
};

/** Verify Aura connectivity when env vars are present; otherwise report mock mode. */
export async function checkNeo4jHealth(): Promise<Neo4jHealthStatus> {
  if (!isNeo4jConfigured()) {
    return { connected: false, mode: "mock" };
  }

  try {
    const activeDriver = getNeo4jDriver();
    if (!activeDriver) {
      return { connected: false, mode: "mock" };
    }
    await activeDriver.verifyConnectivity();
    return { connected: true, mode: "live" };
  } catch {
    return { connected: false, mode: "mock" };
  }
}
