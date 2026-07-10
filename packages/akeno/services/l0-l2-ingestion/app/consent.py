import os
from typing import Any, Dict, List

import httpx


IDENTITY_CONSENT_URL = os.getenv("IDENTITY_CONSENT_URL", "http://localhost:8003")


def validate_consent_token(consent_token: str, patient_key: str | None = None) -> bool:
    if not consent_token:
        return False
    try:
        response = httpx.get(
            f"{IDENTITY_CONSENT_URL}/consent/validate/{consent_token}",
            timeout=3.0,
        )
        response.raise_for_status()
        payload = response.json()
    except httpx.HTTPError:
        return False
    if not payload.get("valid"):
        return False
    if patient_key and payload.get("patientKey") != patient_key:
        return False
    return True


def fetch_consent_state(consent_token: str) -> Dict[str, Any]:
    response = httpx.get(
        f"{IDENTITY_CONSENT_URL}/consent/validate/{consent_token}",
        timeout=3.0,
    )
    response.raise_for_status()
    payload = response.json()
    if not payload.get("valid"):
        return {"active": False, "scope": [], "expiresAt": None}
    return {
        "active": True,
        "scope": payload.get("scopes", []),
        "expiresAt": payload.get("expiresAt"),
    }
