import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let health: { database: "disconnected" | "connected" } = { database: "disconnected" };
  let stats = {
    patients: 0,
    ingestionEvents: 0,
    activeConsents: 0,
    recentEvents: [] as Array<{
      event_id: string;
      patient_key: string;
      source_type: string;
      quality_score: number;
    }>,
  };

  try {
    const sql = getSql();
    await sql`SELECT 1 AS ok`;
    health = { database: "connected" };

    const patientCount = await sql`SELECT COUNT(*)::int AS count FROM patients`;
    const eventCount = await sql`SELECT COUNT(*)::int AS count FROM ingestion_events`;
    const consentCount = await sql`SELECT COUNT(*)::int AS count FROM consent_grants WHERE revoked_at IS NULL`;
    const recentEvents = await sql`
      SELECT event_id, patient_key, source_type, quality_score
      FROM ingestion_events
      ORDER BY created_at DESC
      LIMIT 5
    `;

    stats = {
      patients: Number(patientCount[0]?.count ?? 0),
      ingestionEvents: Number(eventCount[0]?.count ?? 0),
      activeConsents: Number(consentCount[0]?.count ?? 0),
      recentEvents: recentEvents as typeof stats.recentEvents,
    };
  } catch {
    health = { database: "disconnected" };
  }

  return (
    <main>
      <span className="badge">Akeno Health · Neon + Vercel</span>
      <h1>Platform Control Dashboard</h1>
      <p>Backend data is stored in Neon Postgres and served through Vercel API routes.</p>

      <div className="grid">
        <section className="card">
          <h2>Database Status</h2>
          <div className="metric">{health.database === "connected" ? "Online" : "Offline"}</div>
        </section>
        <section className="card">
          <h2>Patients</h2>
          <div className="metric">{stats.patients}</div>
        </section>
        <section className="card">
          <h2>Ingestion Events</h2>
          <div className="metric">{stats.ingestionEvents}</div>
        </section>
        <section className="card">
          <h2>Active Consents</h2>
          <div className="metric">{stats.activeConsents}</div>
        </section>
      </div>

      <section className="card">
        <h2>Recent Ingestion Events</h2>
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Patient</th>
              <th>Source</th>
              <th>Quality</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentEvents.map((event) => (
              <tr key={event.event_id}>
                <td>{event.event_id}</td>
                <td>{event.patient_key}</td>
                <td>{event.source_type}</td>
                <td>{event.quality_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer>
        API endpoints: /api/health · /api/patients · /api/consent/grant · /api/ingest ·
        /api/patient-context/[patientKey]
      </footer>
    </main>
  );
}
