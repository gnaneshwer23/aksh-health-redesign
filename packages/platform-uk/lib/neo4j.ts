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

  const session = activeDriver.session();
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
