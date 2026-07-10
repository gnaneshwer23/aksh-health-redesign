#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA_DIR="${ROOT_DIR}/infra"
SMOKE_TEST_SCRIPT="${ROOT_DIR}/scripts/e2e_smoke_test.sh"

MAX_ATTEMPTS="${MAX_ATTEMPTS:-30}"
SLEEP_SECONDS="${SLEEP_SECONDS:-2}"

wait_for_url() {
  local url="$1"
  local name="$2"
  local attempt=1
  while (( attempt <= MAX_ATTEMPTS )); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$name is ready: $url"
      return 0
    fi
    echo "Waiting for $name ($attempt/$MAX_ATTEMPTS)..."
    sleep "$SLEEP_SECONDS"
    ((attempt++))
  done
  echo "Timed out waiting for $name: $url" >&2
  return 1
}

echo "1) Starting stack with Docker Compose..."
docker compose -f "${INFRA_DIR}/docker-compose.yml" up --build -d

echo "2) Waiting for service readiness..."
wait_for_url "http://localhost:8003/health" "identity-consent"
wait_for_url "http://localhost:8001/health" "l0-l2-ingestion"
wait_for_url "http://localhost:8002/health" "l3-l4-ai-safety"

echo "3) Running E2E smoke test..."
bash "${SMOKE_TEST_SCRIPT}"

echo "Bootstrap and test complete."
