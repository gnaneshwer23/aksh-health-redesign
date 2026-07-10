import pytest

from app.adapters.dicom_adapter import normalize_dicom_meta
from app.adapters.fhir_adapter import normalize_fhir_resource
from app.adapters.hl7_adapter import normalize_hl7v2
from app.bundle_composer import compose_fhir_bundle


def test_normalize_fhir_resource():
    resource = normalize_fhir_resource({"resourceType": "Observation", "id": "obs-1", "status": "final"})
    assert resource["resourceType"] == "Observation"
    assert resource["resource"]["id"] == "obs-1"


def test_normalize_hl7v2():
    resource = normalize_hl7v2({"patientId": "p1", "observationCode": "HR", "observationValue": 88})
    assert resource["resourceType"] == "Observation"
    assert resource["id"].startswith("hl7-p1")


def test_normalize_dicom_meta():
    resource = normalize_dicom_meta({"studyInstanceUID": "1.2.3.4", "modality": "MR"})
    assert resource["resourceType"] == "ImagingStudy"


def test_compose_fhir_bundle():
    events = [
        {
            "payload_json": {
                "standardizedType": "FHIR_RESOURCE",
                "standardizedPayload": {
                    "resourceType": "Observation",
                    "id": "obs-1",
                    "resource": {"resourceType": "Observation", "id": "obs-1"},
                },
            }
        }
    ]
    bundle = compose_fhir_bundle(events)
    assert bundle["resourceType"] == "Bundle"
    assert len(bundle["entry"]) == 1
