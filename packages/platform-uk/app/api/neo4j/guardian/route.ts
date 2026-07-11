import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isNeo4jConfigured } from "@/lib/neo4j";
import { getMockGuardianResponse } from "@/lib/neo4j/mock-fallback";
import { fetchGuardianFromGraph } from "@/lib/neo4j/queries";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId")?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  }

  if (!isNeo4jConfigured()) {
    const mock = getMockGuardianResponse(patientId);
    if (!mock) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    return NextResponse.json(mock, { headers: { "X-Data-Source": "mock" } });
  }

  try {
    const guardian = await fetchGuardianFromGraph(patientId);
    if (!guardian) {
      const mock = getMockGuardianResponse(patientId);
      if (!mock) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }
      return NextResponse.json(mock, { headers: { "X-Data-Source": "mock" } });
    }
    return NextResponse.json(guardian, { headers: { "X-Data-Source": "neo4j" } });
  } catch {
    const mock = getMockGuardianResponse(patientId);
    if (!mock) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    return NextResponse.json(mock, { headers: { "X-Data-Source": "mock" } });
  }
}
