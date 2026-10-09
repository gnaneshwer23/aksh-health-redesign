"""Phase 4 — clinician approval gate: propose / approve / reject / audit."""
from __future__ import annotations

from datetime import datetime, timezone

import pytest

from aksh_access.adapter import PatientAccessAdapter
from aksh_access.approval_gate import OUTREACH_PHRASES, ApprovalGate
from aksh_access.diabetes_rules import Finding, evaluate
from aksh_access.fhir import (
    FOOT,
    HBA1C,
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


def _seed_patel(store: FHIRStore) -> str:
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
    store.create(
        {
            "resourceType": "Observation",
            "id": "ehr-acr",
            "status": "final",
            "code": {"coding": [URINE_ACR]},
            "subject": {"reference": "Patient/patel"},
            "effectiveDateTime": "2026-02-10",
        }
    )
    store.create(
        {
            "resourceType": "Observation",
            "id": "ehr-eye",
            "status": "final",
            "code": {"coding": [RETINAL]},
            "subject": {"reference": "Patient/patel"},
            "effectiveDateTime": "2025-06-01",
        }
    )
    store.create(
        {
            "resourceType": "Observation",
            "id": "ehr-foot",
            "status": "final",
            "code": {"coding": [FOOT]},
            "subject": {"reference": "Patient/patel"},
            "effectiveDateTime": "2025-05-20",
        }
    )
    return "patel"


def _ingest_patel_events(store: FHIRStore) -> None:
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


def _gate_with_findings() -> tuple[FHIRStore, ApprovalGate, MockVendor]:
    store = FHIRStore()
    vendor = MockVendor()
    _seed_patel(store)
    _ingest_patel_events(store)
    gate = ApprovalGate(store, CLINICIANS)
    gate.propose(evaluate(store, "patel", NOW))
    return store, gate, vendor


def test_nothing_written_before_approval() -> None:
    store, gate, vendor = _gate_with_findings()
    assert gate.pending()
    assert store.count("DetectedIssue") == 0
    assert store.count("CommunicationRequest") == 0
    assert vendor.outbound == []


def test_unauthorised_clinician_blocked() -> None:
    store, gate, _ = _gate_with_findings()
    pid = gate.pending()[0].id
    with pytest.raises(PermissionError):
        gate.approve(pid, "intruder", NOW)
    assert store.count("DetectedIssue") == 0
    assert gate.audit[-1]["action"] == "blocked-unauthorised"


def test_approval_writes_issue_request_and_provenance() -> None:
    store, gate, _ = _gate_with_findings()
    prop = next(
        p
        for p in gate.pending()
        if p.finding.rule_id == "anticoagulant-antiplatelet"
    )
    gate.approve(prop.id, "prac-001", NOW, note="Aspirin likely redundant; review")
    issue = store.read(
        "DetectedIssue", prop.outcome["detected_issue"].split("/")[1]
    )
    assert issue["author"]["reference"] == "Practitioner/prac-001"
    assert issue["severity"] == "high"
    assert "Clinician note: Aspirin likely redundant" in issue["detail"]
    assert "communication_request" in prop.outcome
    comm = store.read(
        "CommunicationRequest",
        prop.outcome["communication_request"].split("/")[1],
    )
    assert comm["status"] == "active"
    assert comm["category"][0]["text"] == "book_review"
    assert comm["payload"][0]["contentString"] == OUTREACH_PHRASES["book_review"]
    prov = [
        pv
        for pv in store.search("Provenance")
        if any(
            t["reference"] == prop.outcome["detected_issue"] for t in pv["target"]
        )
    ]
    assert prov
    assert prov[0]["agent"][0]["type"]["coding"][0]["code"] == "verifier"


def test_rejection_requires_reason_and_writes_nothing() -> None:
    store, gate, vendor = _gate_with_findings()
    pid = gate.pending()[0].id
    with pytest.raises(ValueError, match="rejection reason"):
        gate.reject(pid, "prac-001", NOW, "  ")
    gate.reject(pid, "prac-001", NOW, "Already addressed in clinic")
    assert store.count("DetectedIssue") == 0
    assert store.count("CommunicationRequest") == 0
    assert vendor.outbound == []
    assert gate.audit[-1]["action"] == "rejected"


def test_decided_proposal_cannot_be_decided_again() -> None:
    _, gate, _ = _gate_with_findings()
    pid = gate.pending()[0].id
    gate.approve(pid, "prac-001", NOW)
    with pytest.raises(ValueError, match="not pending"):
        gate.approve(pid, "prac-001", NOW)
    with pytest.raises(ValueError, match="not pending"):
        gate.reject(pid, "prac-001", NOW, "too late")


def test_dedupe_exact_finding_and_supersede_outdated() -> None:
    store = FHIRStore()
    gate = ApprovalGate(store, CLINICIANS)
    f1 = Finding(
        "hba1c-overdue",
        "patel",
        "moderate",
        "No laboratory HbA1c in the last 6 months",
        action="book_test",
    )
    f1b = Finding(
        "hba1c-overdue",
        "patel",
        "moderate",
        "No laboratory HbA1c in the last 6 months",
        action="book_test",
    )
    f2 = Finding(
        "hba1c-overdue",
        "patel",
        "moderate",
        "No laboratory HbA1c in the last 6 months (last lab result 2026-02-10)",
        action="book_test",
    )
    first = gate.propose([f1])
    assert len(first) == 1
    assert gate.propose([f1b]) == []  # exact duplicate ignored
    second = gate.propose([f2])
    assert len(second) == 1
    assert first[0].status == "superseded"
    assert second[0].status == "pending"
    assert any(a["action"] == "superseded" for a in gate.audit)


def test_pending_sorted_by_severity() -> None:
    store = FHIRStore()
    gate = ApprovalGate(store, CLINICIANS)
    gate.propose(
        [
            Finding("annual-checks-overdue", "p", "low", "annual", action="book_screening"),
            Finding("hba1c-above-threshold", "p", "high", "high hba1c", action="book_review"),
            Finding("hba1c-overdue", "p", "moderate", "overdue", action="book_test"),
        ]
    )
    severities = [p.finding.severity for p in gate.pending()]
    assert severities == ["high", "moderate", "low"]


def test_finding_without_action_writes_issue_only() -> None:
    store = FHIRStore()
    store.create(
        {
            "resourceType": "Patient",
            "id": "p1",
            "identifier": [{"system": NHS_NUMBER, "value": "9990000099"}],
        }
    )
    gate = ApprovalGate(store, CLINICIANS)
    props = gate.propose(
        [
            Finding(
                "diagnosis-unconfirmed",
                "p1",
                "low",
                "Type 2 diabetes is patient-reported only; confirm against GP record",
            )
        ]
    )
    gate.approve(props[0].id, "prac-001", NOW)
    assert store.count("DetectedIssue") == 1
    assert store.count("CommunicationRequest") == 0
    assert "communication_request" not in props[0].outcome
