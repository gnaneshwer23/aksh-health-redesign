import { getSql } from "@/lib/db";

export async function GET() {
  const sql = getSql();
  const patients = await sql`SELECT patient_key, display_name, created_at FROM patients ORDER BY created_at DESC LIMIT 20`;
  return Response.json({ patients });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { patientKey?: string; displayName?: string };
  if (!body.patientKey || !body.displayName) {
    return Response.json({ error: "patientKey and displayName are required" }, { status: 400 });
  }
  const sql = getSql();
  const rows = await sql`
    INSERT INTO patients (patient_key, display_name)
    VALUES (${body.patientKey}, ${body.displayName})
    ON CONFLICT (patient_key) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING patient_key, display_name, created_at
  `;
  return Response.json({ patient: rows[0] });
}
