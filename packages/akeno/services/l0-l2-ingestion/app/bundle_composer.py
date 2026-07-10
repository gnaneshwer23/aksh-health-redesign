from typing import Any, Dict, List


def _extract_fhir_resource(payload: Dict[str, Any]) -> Dict[str, Any] | None:
    standardized = payload.get("standardizedPayload", payload)
    if isinstance(standardized, dict) and "resource" in standardized:
        return standardized["resource"]
    if isinstance(standardized, dict) and standardized.get("resourceType"):
        return standardized
    if isinstance(standardized, dict) and standardized.get("resourceType") == "Bundle":
        return standardized
    return None


def compose_fhir_bundle(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    entries: List[Dict[str, Any]] = []
    for event in events:
        payload = event.get("payload_json") or event.get("payload") or {}
        if not isinstance(payload, dict):
            continue

        standardized_payload = payload.get("standardizedPayload", payload)
        if standardized_payload.get("resourceType") == "Bundle":
            for entry in standardized_payload.get("entry", []):
                entries.append(entry)
            continue

        resource = _extract_fhir_resource(payload)
        if resource:
            entries.append({"resource": resource})

    return {
        "resourceType": "Bundle",
        "type": "collection",
        "entry": entries,
    }
