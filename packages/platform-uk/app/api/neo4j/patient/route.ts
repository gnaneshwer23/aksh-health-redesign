import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { evaluateClinicalApiAccess } from "@/lib/clinical-proof/tenant-isolation";
import { isNeo4jConfigured } from "@/lib/neo4j";
import { getMockPatientResponse } from "@/lib/neo4j/mock-fallback";
import { fetchPatientFromGraph } from "@/lib/neo4j/queries";

function resolveSessionRole(session: { user?: { role?: string | null } } | null) {
  return (session?.user?.role as string | undefined) ?? "";
}

function resolveBoundPatientId(request: Request, session: { user?: Record<string, unknown> } | null) {
  const headerBound = request.headers.get("x-bound-patient-id")?.trim();
  if (headerBound) return headerBound;
  const fromSession = session?.user?.boundPatientId;
  return typeof fromSession === "string" ? fromSession.trim() : null;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  const access = evaluateClinicalApiAccess({
    role: resolveSessionRole(session),
    boundPatientId: resolveBoundPatientId(request, session),
    requestedPatientId: id
  });
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason, denied: true }, { status: access.status });
  }

  if (!isNeo4jConfigured()) {
    const mock = getMockPatientResponse(id);
    if (!mock) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    return NextResponse.json(mock, { headers: { "X-Data-Source": "mock" } });
  }

  try {
    const patient = await fetchPatientFromGraph(id);
    if (!patient) {
      const mock = getMockPatientResponse(id);
      if (!mock) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }
      return NextResponse.json(mock, { headers: { "X-Data-Source": "mock" } });
    }
    return NextResponse.json(patient, { headers: { "X-Data-Source": "neo4j" } });
  } catch {
    const mock = getMockPatientResponse(id);
    if (!mock) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    return NextResponse.json(mock, { headers: { "X-Data-Source": "mock" } });
  }
}
