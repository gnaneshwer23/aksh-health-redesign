#!/usr/bin/env python3
"""Seed Neon with pilot backend data for Akeno Health."""

import json
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

import psycopg


PATIENTS = [
    ("patient-amc1-001", "AMC Pilot Patient One"),
    ("patient-amc2-001", "AMC Pilot Patient Two"),
]


def main() -> int:
    dsn = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_DSN")
    if not dsn:
        print("Set DATABASE_URL or POSTGRES_DSN", file=sys.stderr)
        return 1

    expires_at = datetime.now(timezone.utc) + timedelta(days=30)

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            for patient_key, display_name in PATIENTS:
                cur.execute(
                    """
                    INSERT INTO patients (patient_key, display_name)
                    VALUES (%s, %s)
                    ON CONFLICT (patient_key) DO UPDATE SET display_name = EXCLUDED.display_name
                    """,
                    (patient_key, display_name),
                )

                token = f"consent:{uuid.uuid4().hex}"
                cur.execute(
                    """
                    INSERT INTO consent_grants (token, patient_key, scopes, expires_at)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (token) DO NOTHING
                    """,
                    (token, patient_key, ["care", "analytics"], expires_at),
                )

                event_id = f"evt-seed-{patient_key}"
                payload = {
                    "standardizedType": "FHIR_RESOURCE",
                    "standardizedPayload": {
                        "resourceType": "Observation",
                        "id": f"obs-{patient_key}",
                        "status": "final",
                        "code": {"text": "Heart rate"},
                        "valueQuantity": {"value": 78, "unit": "bpm"},
                    },
                }
                cur.execute(
                    """
                    INSERT INTO ingestion_events (event_id, patient_key, source_type, payload_type, quality_score, payload_json)
                    VALUES (%s, %s, %s, %s, %s, %s::jsonb)
                    ON CONFLICT (event_id) DO UPDATE
                    SET payload_json = EXCLUDED.payload_json,
                        quality_score = EXCLUDED.quality_score
                    """,
                    (
                        event_id,
                        patient_key,
                        "EHR",
                        "FHIR_RESOURCE",
                        100.0,
                        json.dumps(payload),
                    ),
                )
                print(f"seeded: {patient_key}")

    print("Neon seed data complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
