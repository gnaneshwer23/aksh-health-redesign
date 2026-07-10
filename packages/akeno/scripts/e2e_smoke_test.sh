#!/usr/bin/env bash
set -euo pipefail

BASE_IDENTITY_URL="${BASE_IDENTITY_URL:-http://localhost:8003}"
BASE_INGESTION_URL="${BASE_INGESTION_URL:-http://localhost:8001}"
BASE_AI_URL="${BASE_AI_URL:-http://localhost:8002}"
PATIENT_KEY="${PATIENT_KEY:-patient-smoke-001}"

echo "1) Checking service health endpoints..."
curl -fsS "${BASE_IDENTITY_URL}/health" >/dev/null
curl -fsS "${BASE_INGESTION_URL}/health" >/dev/null
curl -fsS "${BASE_AI_URL}/health" >/dev/null

echo "2) Registering patient and granting consent..."
curl -fsS -X POST "${BASE_IDENTITY_URL}/patients/register" \
  -H "Content-Type: application/json" \
  -d "{\"patientKey\": \"${PATIENT_KEY}\", \"displayName\": \"Smoke Test Patient\"}" >/dev/null

consent_response="$(curl -fsS -X POST "${BASE_IDENTITY_URL}/consent/grant" \
  -H "Content-Type: application/json" \
  -d "{\"patientKey\": \"${PATIENT_KEY}\", \"scopes\": [\"care\", \"analytics\"], \"hoursValid\": 24}")"

consent_token="$(python3 - <<PY
import json
print(json.loads("""$consent_response""")["token"])
PY
)"

echo "3) Sending ingestion payload..."
ingestion_response="$(curl -fsS -X POST "${BASE_INGESTION_URL}/ingest" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"evt-smoke-001\",
    \"sourceSystem\": \"smoke-test\",
    \"sourceType\": \"EHR\",
    \"patientKey\": \"${PATIENT_KEY}\",
    \"eventTime\": \"2026-01-01T00:00:00Z\",
    \"consentToken\": \"${consent_token}\",
    \"payloadType\": \"FHIR_RESOURCE\",
    \"payload\": {\"resourceType\": \"Observation\", \"id\": \"obs-smoke\", \"status\": \"final\"}
  }")"

python3 - <<PY
import json
payload = json.loads("""$ingestion_response""")
assert payload["accepted"] is True, payload
print("Ingestion accepted with qualityScore:", payload["qualityScore"])
PY

echo "4) Fetching unified patient context..."
context_response="$(curl -fsS "${BASE_INGESTION_URL}/patient-context/${PATIENT_KEY}")"
python3 - <<PY
import json
payload = json.loads("""$context_response""")
assert payload["eventCount"] >= 1, payload
assert len(payload["bundle"]["entry"]) >= 1, payload
print("Patient context bundle entries:", len(payload["bundle"]["entry"]))
PY

echo "5) Requesting AI score..."
score_response="$(curl -fsS -X POST "${BASE_AI_URL}/score" \
  -H "Content-Type: application/json" \
  -d '{
    "patientKey": "patient-smoke-001",
    "features": {"hrv_drop": 12.0, "sleep_deficit": 18.0, "glucose_variance": 9.0}
  }')"

python3 - <<PY
import json
payload = json.loads("""$score_response""")
assert "riskScore" in payload, payload
assert "model" in payload and "modelVersion" in payload["model"], payload
print("AI score generated with model:", payload["model"]["modelVersion"])
PY

echo "6) Posting governance decision..."
curl -fsS -X POST "${BASE_AI_URL}/governance/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "patientKey": "patient-smoke-001",
    "riskScore": 72.0,
    "action": "approve",
    "reason": "Smoke test clinical review"
  }' >/dev/null

echo "E2E smoke test passed."
