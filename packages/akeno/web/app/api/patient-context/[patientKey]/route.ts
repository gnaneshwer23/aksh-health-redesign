import { getSql } from "@/lib/db";

export async function GET(_: Request, context: { params: Promise<{ patientKey: string }> }) {
  const { patientKey } = await context.params;
  const sql = getSql();

  const events = await sql`
    SELECT event_id, source_type, payload_type, quality_score, payload_json, created_at
    FROM ingestion_events
    WHERE patient_key = ${patientKey}
    ORDER BY created_at ASC
  `;

  if (events.length === 0) {
    return Response.json({ error: "Patient context not found" }, { status: 404 });
  }

  const bundleEntries = events.map((event) => {
    const payload = event.payload_json as { standardizedPayload?: Record<string, unknown> };
    const resource = payload?.standardizedPayload ?? payload;
    return { resource };
  });

  return Response.json({
    patientKey,
    eventCount: events.length,
    bundle: {
      resourceType: "Bundle",
      type: "collection",
      entry: bundleEntries,
    },
    graphSummary: {
      nodeCount: 1,
      edgeCount: events.length,
      lastUpdated: events[events.length - 1].created_at,
    },
  });
}
