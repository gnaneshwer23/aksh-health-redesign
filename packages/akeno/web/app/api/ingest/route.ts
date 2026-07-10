import { getSql } from "@/lib/db";

type IngestBody = {
  eventId?: string;
  sourceSystem?: string;
  sourceType?: string;
  patientKey?: string;
  consentToken?: string;
  payloadType?: string;
  payload?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const body = (await request.json()) as IngestBody;
  const required = ["eventId", "sourceSystem", "sourceType", "patientKey", "consentToken", "payloadType"] as const;
  for (const key of required) {
    if (!body[key]) {
      return Response.json({ error: `${key} is required` }, { status: 400 });
    }
  }

  const sql = getSql();
  const consent = await sql`
    SELECT token, patient_key, expires_at, revoked_at
    FROM consent_grants
    WHERE token = ${body.consentToken}
  `;
  if (consent.length === 0) {
    return Response.json({ accepted: false, issues: ["Invalid consent token"] }, { status: 403 });
  }
  const grant = consent[0] as { patient_key: string; expires_at: string; revoked_at: string | null };
  if (grant.revoked_at) {
    return Response.json({ accepted: false, issues: ["Consent revoked"] }, { status: 403 });
  }
  if (grant.patient_key !== body.patientKey) {
    return Response.json({ accepted: false, issues: ["Consent patient mismatch"] }, { status: 403 });
  }

  const standardizedPayload = {
    standardizedType: body.payloadType,
    standardizedPayload: body.payload ?? {},
  };

  await sql`
    INSERT INTO ingestion_events (event_id, patient_key, source_type, payload_type, quality_score, payload_json)
    VALUES (
      ${body.eventId},
      ${body.patientKey},
      ${body.sourceType},
      ${body.payloadType},
      ${100},
      ${JSON.stringify(standardizedPayload)}::jsonb
    )
    ON CONFLICT (event_id) DO UPDATE
    SET quality_score = EXCLUDED.quality_score,
        payload_json = EXCLUDED.payload_json
  `;

  return Response.json({ accepted: true, qualityScore: 100, issues: [] });
}
