"""Phase 5 — outreach dispatch: one call/patient, non-clinical scripts, idempotent."""
from __future__ import annotations

from datetime import datetime, timezone

from aksh_access.adapter import PatientAccessAdapter
from aksh_access.approval_gate import ApprovalGate
from aksh_access.diabetes_rules import evaluate
from aksh_access.fhir import (
    ANTICOAGULANTS,
    ANTIPLATELETS,
    FOOT,
    HBA1C,
    HYPO_RISK_DRUGS,
    NHS_NUMBER,
    RETINAL,
    T2D,
    UCUM,
    URINE_ACR,
    FHIRStore,
)
from aksh_access.vendor_mock import AccessEvent, MockVendor

NOW = datetime(2026, 10, 9, 9, 0, tzinfo=timezone.utc)
CLINICIANS = {"prac-001": "Dr A. Reviewer"}
CLINICAL_TERMS = [
    "hba1c",
    "mmol",
    "bleeding",
    "hypo",
    "diabetes is",
    *ANTICOAGULANTS,
    *ANTIPLATELETS,
    *HYPO_RISK_DRUGS,
]


def _seed_patel(store: FHIRStore) -> None:
    store.create(
        {
            "resourceType": "Patient",
            "id": "patel",
            "identifier": [{"system": NHS_NUMBER, "value": "9990000001"}],
            "name": [{"family": "Patel", "given": ["James"]}],
            "telecom": [{"system": "phone", "value": "+447700900001"}],
        }
    )
    store.create(
        {
            "resourceType": "Condition",
            "id": "ehr-t2d",
            "subject": {"reference": "Patient/patel"},
            "code": {"coding": [T2D]},
            "verificationStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                        "code": "confirmed",
                    }
                ]
            },
        }
    )
    store.create(
        {
            "resourceType": "Observation",
            "id": "ehr-hba1c",
            "status": "final",
            "code": {"coding": [HBA1C]},
            "subject": {"reference": "Patient/patel"},
            "effectiveDateTime": "2026-02-10",
            "valueQuantity": {
                "value": 78,
                "unit": "mmol/mol",
                "system": UCUM,
                "code": "mmol/mol",
            },
        }
    )
    for rid, coding, when in (
        ("ehr-acr", URINE_ACR, "2026-02-10"),
        ("ehr-eye", RETINAL, "2025-06-01"),
        ("ehr-foot", FOOT, "2025-05-20"),
    ):
        store.create(
            {
                "resourceType": "Observation",
                "id": rid,
                "status": "final",
                "code": {"coding": [coding]},
                "subject": {"reference": "Patient/patel"},
                "effectiveDateTime": when,
            }
        )


def _ingest_patel(store: FHIRStore) -> None:
    adapter = PatientAccessAdapter(store)
    patient = {
        "nhs_number": "9990000001",
        "given": "James",
        "family": "Patel",
        "phone": "+447700900001",
    }
    for e in (
        AccessEvent(
            type="intake.completed",
            channel="voice",
            occurred_at=NOW,
            payload={
                "patient": patient,
                "medications": ["metformin", "gliclazide", "apixaban", "aspirin"],
                "reported_hba1c": {"value": 60, "date": "2026-09-01"},
                "hypo_episodes_30d": 2,
            },
        ),
        AccessEvent(
            type="appointment.booked",
            channel="sms",
            occurred_at=NOW,
            payload={"patient": patient, "start": "2026-09-28T10:00:00Z"},
        ),
        AccessEvent(
            type="appointment.no_show",
            channel="sms",
            occurred_at=NOW,
            payload={"patient": patient, "start": "2026-09-28T10:00:00Z"},
        ),
    ):
        adapter.ingest(e)


def _seed_novak(store: FHIRStore) -> None:
    """Second patient with confirmed T2D + overdue HbA1c only (phone present)."""
    store.create(
        {
            "resourceType": "Patient",
            "id": "novak",
            "identifier": [{"system": NHS_NUMBER, "value": "9990000002"}],
            "name": [{"family": "Novak", "given": ["Elena"]}],
            "telecom": [{"system": "phone", "value": "+447700900002"}],
        }
    )
    store.create(
        {
            "resourceType": "Condition",
            "id": "novak-t2d",
            "subject": {"reference": "Patient/novak"},
            "code": {"coding": [T2D]},
            "verificationStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                        "code": "confirmed",
                    }
                ]
            },
        }
    )
    store.create(
        {
            "resourceType": "Observation",
            "id": "novak-hba1c",
            "status": "final",
            "code": {"coding": [HBA1C]},
            "subject": {"reference": "Patient/novak"},
            "effectiveDateTime": "2025-01-01",
            "valueQuantity": {
                "value": 50,
                "unit": "mmol/mol",
                "system": UCUM,
                "code": "mmol/mol",
            },
        }
    )


def _approve_all(gate: ApprovalGate) -> None:
    for p in list(gate.pending()):
        gate.approve(p.id, "prac-001", NOW)


def test_nothing_sent_before_approval() -> None:
    store = FHIRStore()
    vendor = MockVendor()
    _seed_patel(store)
    _ingest_patel(store)
    gate = ApprovalGate(store, CLINICIANS, vendor=vendor)
    gate.propose(evaluate(store, "patel", NOW))
    assert gate.dispatch_outreach(NOW) == []
    assert vendor.outbound == []


def test_one_call_per_patient_and_scripts_are_non_clinical() -> None:
    store = FHIRStore()
    vendor = MockVendor()
    _seed_patel(store)
    _ingest_patel(store)
    _seed_novak(store)
    gate = ApprovalGate(store, CLINICIANS, vendor=vendor)
    gate.propose(evaluate(store, "patel", NOW) + evaluate(store, "novak", NOW))
    _approve_all(gate)
    sent = gate.dispatch_outreach(NOW)
    assert len(sent) == 2
    assert len({o["patient_nhs_number"] for o in sent}) == 2
    for o in sent:
        text = o["script"].lower()
        for term in CLINICAL_TERMS:
            assert term not in text, f"clinical term {term!r} leaked into outbound script"
    patel_call = next(o for o in sent if o["patient_nhs_number"] == "9990000001")
    # rebook absorbs book_review
    assert "book_review" not in patel_call["outreach_type"].split("+")
    assert "rebook_missed" in patel_call["outreach_type"]
    assert "James" in patel_call["script"]
    assert "routine blood test" in patel_call["script"]


def test_dispatch_is_idempotent() -> None:
    store = FHIRStore()
    vendor = MockVendor()
    _seed_patel(store)
    _ingest_patel(store)
    gate = ApprovalGate(store, CLINICIANS, vendor=vendor)
    gate.propose(evaluate(store, "patel", NOW))
    _approve_all(gate)
    first = gate.dispatch_outreach(NOW)
    assert len(first) == 1
    assert len(vendor.outbound) == 1
    assert gate.dispatch_outreach(NOW) == []
    assert len(vendor.outbound) == 1


def test_no_phone_means_no_call() -> None:
    store = FHIRStore()
    vendor = MockVendor()
    # Vendor-created patient without phone.
    adapter = PatientAccessAdapter(store)
    adapter.ingest(
        AccessEvent(
            type="intake.completed",
            channel="voice",
            occurred_at=NOW,
            payload={
                "patient": {
                    "nhs_number": "9990000077",
                    "given": "Z",
                    "family": "Q",
                },
                "conditions": ["Type 2 diabetes"],
            },
        )
    )
    pid = store.search("Patient")[0]["id"]
    gate = ApprovalGate(store, CLINICIANS, vendor=vendor)
    gate.propose(evaluate(store, pid, NOW))
    _approve_all(gate)
    res = gate.dispatch_outreach(NOW)
    assert res[0]["status"] == "not-sent"
    assert res[0]["reason"] == "no phone number on record"
    assert vendor.outbound == []
    assert any(a["action"] == "dispatch-skipped-no-phone" for a in gate.audit)


def test_communication_requests_marked_sent() -> None:
    store = FHIRStore()
    vendor = MockVendor()
    _seed_patel(store)
    _ingest_patel(store)
    gate = ApprovalGate(store, CLINICIANS, vendor=vendor)
    gate.propose(evaluate(store, "patel", NOW))
    _approve_all(gate)
    sent = gate.dispatch_outreach(NOW)
    outreach_id = sent[0]["outreach_id"]
    for c in store.search("CommunicationRequest"):
        assert c["identifier"][0]["value"] == outreach_id
