import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isNeo4jConfigured } from "@/lib/neo4j";
import { getMockIcsPopulationResponse } from "@/lib/neo4j/mock-fallback";
import { fetchIcsPopulationFromGraph } from "@/lib/neo4j/queries";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
