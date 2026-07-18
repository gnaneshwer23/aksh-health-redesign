import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isNeo4jConfigured } from "@/lib/neo4j";
import { getMockIcsPopulationResponse } from "@/lib/neo4j/mock-fallback";
import { fetchIcsPopulationFromGraph } from "@/lib/neo4j/queries";

export async function GET() {
  const session = await getServerSession(authOptions);
  // Public ICS demo: synthetic population only (no patient-level spill).
  // X-Data-Source: demo keeps DemoDataBanner honest and avoids Neo4j mock/live banners.
  if (!session?.user?.id) {
    return NextResponse.json(getMockIcsPopulationResponse(), {
      headers: { "X-Data-Source": "demo" }
    });
  }

  if (!isNeo4jConfigured()) {
    return NextResponse.json(getMockIcsPopulationResponse(), { headers: { "X-Data-Source": "mock" } });
  }

  try {
    const data = await fetchIcsPopulationFromGraph();
    return NextResponse.json(data, { headers: { "X-Data-Source": "neo4j" } });
  } catch {
    return NextResponse.json(getMockIcsPopulationResponse(), { headers: { "X-Data-Source": "mock" } });
  }
}
