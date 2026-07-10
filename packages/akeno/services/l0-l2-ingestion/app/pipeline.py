from typing import Any, Dict, List


REQUIRED_FIELDS: List[str] = [
    "eventId",
    "sourceSystem",
    "sourceType",
    "patientKey",
    "eventTime",
    "consentToken",
    "payloadType",
    "payload",
]


def normalize_event(event: Dict[str, Any]) -> Dict[str, Any]:
    # In production this is where HL7/FHIR/DICOM adapters and terminology mapping run.
    return {k: event.get(k) for k in REQUIRED_FIELDS}


def validate_quality(event: Dict[str, Any]) -> Dict[str, Any]:
    issues: List[str] = []
    present_count = 0
    for field_name in REQUIRED_FIELDS:
        if event.get(field_name) in (None, "", {}):
            issues.append(f"Missing or empty field: {field_name}")
        else:
            present_count += 1
    quality_score = round((present_count / len(REQUIRED_FIELDS)) * 100, 2)
    return {"qualityScore": quality_score, "issues": issues}
