from typing import Any, Dict


def normalize_dicom_meta(payload: Dict[str, Any]) -> Dict[str, Any]:
    study_uid = payload.get("studyInstanceUID")
    if not study_uid:
        raise ValueError("DICOM metadata requires studyInstanceUID")

    return {
        "resourceType": "ImagingStudy",
        "id": study_uid.replace(".", "-"),
        "status": "available",
        "identifier": [{"system": "urn:dicom:uid", "value": study_uid}],
        "modality": [{"system": "http://dicom.nema.org/resources/ontology/DCM", "code": payload.get("modality", "OT")}],
        "description": payload.get("description", "Imaging study"),
    }
