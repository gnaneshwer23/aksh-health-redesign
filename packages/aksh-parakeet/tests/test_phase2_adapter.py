"""Phase 2 — intake adapter: FHIR mapping, tags, Provenance, no patient overwrite."""
from __future__ import annotations

from datetime import datetime, timezone

from aksh_access.adapter import PatientAccessAdapter
from aksh_access.fhir import (
    HBA1C,
    HYPO_COUNT,
    NHS_NUMBER,
    SOURCE_TAG,
    FHIRStore,
    has_code,
    is_external,
    patient_nhs_number,
)
from aksh_access.vendor_mock import AccessEvent

NOW = datetime(2026, 10, 9, 9, 0, tzinfo=timezone.utc)


def _patient_payload(nhs: str = "9990000001", **extra) -> dict:
    base = {
        "nhs_number": nhs,
        "given": "James",
        "family": "Patel",
        "birth_date": "1971-11-22",
        "gender": "male",
        "phone": "+447700900001",
    }
    base.update(extra)
    return base


def _seed_ehr_patient(store: FHIRStore, nhs: str = "9990000001") -> dict:
    return store.create(
        {
            "resourceType": "Patient",
            "id": "ehr-patel",
            "identifier": [{"system": NHS_NUMBER, "value": nhs}],
            "name": [{"family": "Patel", "given": ["James"]}],
            "birthDate": "1971-11-22",
            "gender": "male",
            # Intentionally different phone from vendor payload — must not be overwritten.
            "telecom": [{"system": "phone", "value": "+447700900099"}],
        }
    )


def test_existing_patient_never_modified() -> None:
    store = FHIRStore()
    ehr = _seed_ehr_patient(store)
    adapter = PatientAccessAdapter(store)
    before = store.read("Patient", ehr["id"])

    result = adapter.ingest(
        AccessEvent(
            type="referral.received",
            channel="fax",
            occurred_at=NOW,
            payload={
                "patient": _patient_payload(phone="+447700900001"),
                "reason": "Diabetes review",
            },
        )
    )

    after = store.read("Patient", ehr["id"])
    assert result["patient_id"] == "ehr-patel"
    assert after == before
    assert after["telecom"][0]["value"] == "+447700900099"
    assert "Patient/ehr-patel" not in result["created"]


def test_new_patient_created_with_source_tag() -> None:
    store = FHIRStore()
    adapter = PatientAccessAdapter(store)
    result = adapter.ingest(
        AccessEvent(
            type="referral.received",
            channel="fax",
            occurred_at=NOW,
            payload={
                "patient": _patient_payload(nhs="9990000003", family="Novak", given="Elena"),
                "reason": "New diabetes referral",
            },
        )
    )
    patient = store.read("Patient", result["patient_id"])
    assert patient_nhs_number(patient) == "9990000003"
    assert is_external(patient)
    assert any(t["code"] == SOURCE_TAG["code"] for t in patient["meta"]["tag"])


def test_referral_creates_active_service_request() -> None:
    store = FHIRStore()
    _seed_ehr_patient(store)
    adapter = PatientAccessAdapter(store)
    result = adapter.ingest(
        AccessEvent(
            type="referral.received",
            channel="fax",
            occurred_at=NOW,
            event_id="pk-evt-ref-1",
            payload={
                "patient": _patient_payload(),
                "reason": "Poor glycaemic control",
                "referrer": "Dr Smith",
            },
        )
    )
    assert store.count("ServiceRequest") == 1
    sr = store.search("ServiceRequest")[0]
    assert sr["status"] == "active"
    assert sr["intent"] == "order"
    assert is_external(sr)
    assert ref_in_provenance(store, "pk-evt-ref-1", result["created"])


def test_intake_patient_reported_is_unverified() -> None:
    store = FHIRStore()
    _seed_ehr_patient(store)
    adapter = PatientAccessAdapter(store)
    result = adapter.ingest(
        AccessEvent(
            type="intake.completed",
            channel="voice",
            occurred_at=NOW,
            event_id="pk-evt-intake-1",
            payload={
                "patient": _patient_payload(),
                "medications": ["metformin", "gliclazide", "apixaban", "aspirin"],
                "conditions": ["type 2 diabetes"],
                "reported_hba1c": {"value": 60, "date": "2026-09-01"},
                "hypo_episodes_30d": 2,
            },
        )
    )

    meds = store.search("MedicationStatement")
    assert len(meds) == 4
    assert all(is_external(m) for m in meds)

    conditions = store.search("Condition")
    assert len(conditions) == 1
    assert (
        conditions[0]["verificationStatus"]["coding"][0]["code"] == "unconfirmed"
    )
    assert is_external(conditions[0])

    observations = store.search("Observation")
    assert len(observations) == 2
    hba1c = next(o for o in observations if has_code(o, HBA1C))
    hypo = next(o for o in observations if has_code(o, HYPO_COUNT))
    assert hba1c["status"] == "preliminary"
    assert hba1c["valueQuantity"]["value"] == 60
    assert hba1c["valueQuantity"]["code"] == "mmol/mol"
    assert hypo["status"] == "preliminary"
    assert hypo["valueInteger"] == 2
    assert all(is_external(o) for o in observations)
    assert ref_in_provenance(store, "pk-evt-intake-1", result["created"])


def test_booked_then_no_show_updates_appointment() -> None:
    store = FHIRStore()
    _seed_ehr_patient(store)
    adapter = PatientAccessAdapter(store)
    start = "2026-09-28T10:00:00Z"

    booked = adapter.ingest(
        AccessEvent(
            type="appointment.booked",
            channel="sms",
            occurred_at=NOW,
            event_id="pk-evt-book-1",
            payload={
                "patient": _patient_payload(),
                "start": start,
                "service": "Diabetes review",
            },
        )
    )
    assert store.count("Appointment") == 1
    assert store.search("Appointment")[0]["status"] == "booked"
    assert is_external(store.search("Appointment")[0])

    noshow = adapter.ingest(
        AccessEvent(
            type="appointment.no_show",
            channel="sms",
            occurred_at=NOW,
            event_id="pk-evt-noshow-1",
            payload={"patient": _patient_payload(), "start": start},
        )
    )
    assert store.count("Appointment") == 1
    appt = store.search("Appointment")[0]
    assert appt["status"] == "noshow"
    assert noshow["updated"]
    assert "Appointment/" in noshow["updated"][0]


def test_no_show_without_prior_booking_creates_noshow() -> None:
    store = FHIRStore()
    _seed_ehr_patient(store)
    adapter = PatientAccessAdapter(store)
    result = adapter.ingest(
        AccessEvent(
            type="appointment.no_show",
            channel="email",
            occurred_at=NOW,
            event_id="pk-evt-noshow-alone",
            payload={
                "patient": _patient_payload(),
                "start": "2026-08-01T09:00:00Z",
            },
        )
    )
    assert store.count("Appointment") == 1
    assert store.search("Appointment")[0]["status"] == "noshow"
    assert result["created"]
    assert is_external(store.search("Appointment")[0])


def test_every_event_writes_one_provenance_with_device_and_event_id() -> None:
    store = FHIRStore()
    adapter = PatientAccessAdapter(store)
    event = AccessEvent(
        type="referral.received",
        channel="fax",
        occurred_at=NOW,
        event_id="pk-evt-prov-1",
        payload={"patient": _patient_payload(nhs="9990000009"), "reason": "Review"},
    )
    adapter.ingest(event)

    provenances = store.search("Provenance")
    assert len(provenances) == 1
    prov = provenances[0]
    assert prov["agent"][0]["who"]["reference"] == "Device/parakeet-patient-access"
    assert prov["entity"][0]["what"]["identifier"]["value"] == "pk-evt-prov-1"
    assert store.exists("Device", "parakeet-patient-access")


def test_vendor_created_resources_all_tagged() -> None:
    store = FHIRStore()
    adapter = PatientAccessAdapter(store)
    adapter.ingest(
        AccessEvent(
            type="intake.completed",
            channel="voice",
            occurred_at=NOW,
            payload={
                "patient": _patient_payload(nhs="9990000008"),
                "medications": ["metformin"],
                "conditions": ["type 2 diabetes"],
                "reported_hba1c": {"value": 55, "date": "2026-09-01"},
                "hypo_episodes_30d": 0,
            },
        )
    )
    for rtype in ("Patient", "MedicationStatement", "Condition", "Observation"):
        for resource in store.search(rtype):
            assert is_external(resource), f"{rtype}/{resource['id']} missing source tag"


def ref_in_provenance(store: FHIRStore, event_id: str, targets: list[str]) -> bool:
    provenances = store.search(
        "Provenance",
        lambda p: any(
            e.get("what", {}).get("identifier", {}).get("value") == event_id
            for e in p.get("entity", [])
        ),
    )
    assert len(provenances) == 1
    prov_targets = {t["reference"] for t in provenances[0]["target"]}
    return set(targets).issubset(prov_targets)
