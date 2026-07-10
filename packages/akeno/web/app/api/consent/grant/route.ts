import { getSql } from "@/lib/db";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    patientKey?: string;
    scopes?: string[];
    hoursValid?: number;
  };
  if (!body.patientKey) {
    return Response.json({ error: "patientKey is required" }, { status: 400 });
  }

  const scopes = body.scopes ?? ["care", "analytics"];
  const hoursValid = body.hoursValid ?? 24;
  const token = `consent:${crypto.randomUUID().replace(/-/g, "")}`;

  const sql = getSql();
  const patient = await sql`SELECT patient_key FROM patients WHERE patient_key = ${body.patientKey}`;
  if (patient.length === 0) {
    return Response.json({ error: "Unknown patientKey" }, { status: 404 });
  }

  const rows = await sql`
    INSERT INTO consent_grants (token, patient_key, scopes, expires_at)
    VALUES (
      ${token},
      ${body.patientKey},
      ${scopes},
      NOW() + (${hoursValid} * INTERVAL '1 hour')
    )
    RETURNING token, patient_key, scopes, expires_at
  `;

  return Response.json({ consent: rows[0] });
}
