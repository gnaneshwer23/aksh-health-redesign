from typing import Any, Dict


def normalize_hl7v2(payload: Dict[str, Any]) -> Dict[str, Any]:
    message_type = payload.get("messageType", "ORU^R01")
    patient_id = payload.get("patientId")
    if not patient_id:
        raise ValueError("HL7 payload requires patientId")

    observation_code = payload.get("observationCode", "unknown")
    observation_value = payload.get("observationValue", "unknown")

    return {
        "resourceType": "Observation",
        "id": f"hl7-{patient_id}-{observation_code}",
        "status": "final",
        "code": {"text": observation_code},
        "valueString": str(observation_value),
        "meta": {"source": message_type},
    }
