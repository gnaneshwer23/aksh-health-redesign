from typing import Any, Dict, List


REQUIRED_FHIR_FIELDS = {"resourceType", "id"}


def normalize_fhir_resource(payload: Dict[str, Any]) -> Dict[str, Any]:
    missing = [field for field in REQUIRED_FHIR_FIELDS if field not in payload]
    if missing:
        raise ValueError(f"FHIR resource missing fields: {', '.join(missing)}")
    return {
        "resourceType": payload["resourceType"],
        "id": payload["id"],
        "resource": payload,
    }


def normalize_fhir_bundle(payload: Dict[str, Any]) -> Dict[str, Any]:
    if payload.get("resourceType") != "Bundle":
        raise ValueError("Expected FHIR Bundle resourceType")
    entries = payload.get("entry", [])
    if not isinstance(entries, list):
        raise ValueError("FHIR Bundle entry must be a list")
    return {
        "resourceType": "Bundle",
        "type": payload.get("type", "collection"),
        "entry": entries,
    }
