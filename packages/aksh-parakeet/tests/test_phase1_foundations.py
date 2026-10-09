"""Phase 1 — foundations: FHIRStore + AccessEvent / MockVendor."""
from __future__ import annotations

from datetime import datetime, timezone

import pytest

from aksh_access.fhir import (
    HBA1C,
    NHS_NUMBER,
    SOURCE_TAG,
    T2D,
    URINE_ACR,
    FHIRStore,
    has_code,
    iso,
    parse_dt,
    patient_nhs_number,
    ref,
)
from aksh_access.vendor_mock import (
    CHANNELS,
    EVENT_TYPES,
    AccessEvent,
    MockVendor,
)


def test_code_constants() -> None:
    assert HBA1C["system"] == "http://loinc.org"
    assert HBA1C["code"] == "59261-8"
    assert URINE_ACR["code"] == "9318-7"
    assert T2D["system"] == "http://snomed.info/sct"
    assert T2D["code"] == "44054006"
    assert SOURCE_TAG["code"] == "external-patient-access"
    assert NHS_NUMBER == "https://fhir.nhs.uk/Id/nhs-number"


def test_date_helpers() -> None:
    assert parse_dt("2026-10-09").isoformat().startswith("2026-10-09")
    assert parse_dt("2026-10-09T09:00:00Z").tzinfo is not None
    assert iso(datetime(2026, 10, 9, 9, 0, tzinfo=timezone.utc)) == "2026-10-09T09:00:00Z"


def test_fhir_store_create_read_update_search_count() -> None:
    store = FHIRStore()
    created = store.create(
        {
            "resourceType": "Patient",
            "id": "patel",
            "identifier": [{"system": NHS_NUMBER, "value": "9990000001"}],
            "name": [{"family": "Patel", "given": ["James"]}],
        }
    )
    assert created["id"] == "patel"
    assert store.count("Patient") == 1
    assert store.read("Patient", "patel")["name"][0]["family"] == "Patel"
    assert patient_nhs_number(created) == "9990000001"

    updated = store.update(
        {
            **store.read("Patient", "patel"),
            "telecom": [{"system": "phone", "value": "+447700900001"}],
        }
    )
    assert updated["telecom"][0]["value"] == "+447700900001"

    found = store.search(
        "Patient", where=lambda p: patient_nhs_number(p) == "9990000001"
    )
    assert len(found) == 1
    assert ref(found[0]) == "Patient/patel"

    with pytest.raises(ValueError):
        store.create({"resourceType": "Patient", "id": "patel"})
    with pytest.raises(KeyError):
        store.update({"resourceType": "Patient", "id": "missing"})


def test_has_code() -> None:
    obs = {
        "resourceType": "Observation",
        "code": {"coding": [HBA1C]},
    }
    assert has_code(obs, HBA1C) is True
    assert has_code(obs, URINE_ACR) is False


def test_access_event_validates_type_channel_and_nhs() -> None:
    assert EVENT_TYPES == {
        "referral.received",
        "intake.completed",
        "appointment.booked",
        "appointment.no_show",
    }
    assert CHANNELS == {"voice", "sms", "fax", "email"}

    evt = AccessEvent(
        type="referral.received",
        channel="fax",
        payload={"patient": {"nhs_number": "9990000001", "given": "James"}},
    )
    assert evt.event_id.startswith("pk-evt-")
    assert isinstance(evt.occurred_at, datetime)

    with pytest.raises(ValueError, match="Unknown event type"):
        AccessEvent(type="unknown", payload={"patient": {"nhs_number": "1"}})
    with pytest.raises(ValueError, match="Unknown channel"):
        AccessEvent(
            type="referral.received",
            channel="carrier-pigeon",
            payload={"patient": {"nhs_number": "1"}},
        )
    with pytest.raises(ValueError, match="nhs_number"):
        AccessEvent(type="referral.received", payload={"patient": {}})
    with pytest.raises(ValueError, match="nhs_number"):
        AccessEvent(type="referral.received", payload={})


def test_mock_vendor_records_outreach_never_calls_network() -> None:
    vendor = MockVendor()
    req = {
        "outreach_type": "voice",
        "patient_nhs_number": "9990000001",
        "phone": "+447700900001",
        "script": "Hello James, this is a test.",
        "authorised_by": "prac-001",
        "communication_request": "CommunicationRequest/cr-1",
    }
    record = vendor.request_outreach(req)
    assert record["status"] == "queued"
    assert record["outreach_id"].startswith("pk-out-")
    assert len(vendor.outbound) == 1
    assert vendor.outbound[0]["script"] == req["script"]

    with pytest.raises(ValueError, match="missing fields"):
        vendor.request_outreach({"outreach_type": "voice"})
