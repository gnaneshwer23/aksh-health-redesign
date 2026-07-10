import { getSql } from "@/lib/db";

export async function GET() {
  const sql = getSql();
  const patientCount = await sql`SELECT COUNT(*)::int AS count FROM patients`;
  const eventCount = await sql`SELECT COUNT(*)::int AS count FROM ingestion_events`;
  const consentCount = await sql`SELECT COUNT(*)::int AS count FROM consent_grants WHERE revoked_at IS NULL`;
  const recentEvents = await sql`
    SELECT event_id, patient_key, source_type, quality_score, created_at
    FROM ingestion_events
    ORDER BY created_at DESC
    LIMIT 5
  `;

  return Response.json({
    patients: patientCount[0]?.count ?? 0,
    ingestionEvents: eventCount[0]?.count ?? 0,
    activeConsents: consentCount[0]?.count ?? 0,
    recentEvents,
  });
}
