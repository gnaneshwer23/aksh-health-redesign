from typing import Any, Dict, List

from .adapters.dicom_adapter import normalize_dicom_meta
from .adapters.fhir_adapter import normalize_fhir_bundle, normalize_fhir_resource
from .adapters.hl7_adapter import normalize_hl7v2


SUPPORTED_PAYLOAD_TYPES = {"FHIR_RESOURCE", "FHIR_BUNDLE", "HL7V2", "DICOM_META", "CUSTOM"}


def route_to_standard(payload_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    if payload_type not in SUPPORTED_PAYLOAD_TYPES:
        raise ValueError(f"Unsupported payload type: {payload_type}")

    if payload_type == "FHIR_RESOURCE":
        normalized = normalize_fhir_resource(payload)
        return {"standardizedType": "FHIR_RESOURCE", "standardizedPayload": normalized}
    if payload_type == "FHIR_BUNDLE":
        normalized = normalize_fhir_bundle(payload)
        return {"standardizedType": "FHIR_BUNDLE", "standardizedPayload": normalized}
    if payload_type == "HL7V2":
        fhir_observation = normalize_hl7v2(payload)
        return {
            "standardizedType": "FHIR_RESOURCE",
            "standardizedPayload": {"resourceType": "Observation", "id": fhir_observation["id"], "resource": fhir_observation},
        }
    if payload_type == "DICOM_META":
        imaging_study = normalize_dicom_meta(payload)
        return {
            "standardizedType": "FHIR_RESOURCE",
            "standardizedPayload": {"resourceType": "ImagingStudy", "id": imaging_study["id"], "resource": imaging_study},
        }

    return {"standardizedType": payload_type, "standardizedPayload": payload}
