"""Phase 6 — synthetic cohort + end-to-end safety guarantees."""
from __future__ import annotations

import pytest

from aksh_access.fhir import ANTICOAGULANTS, ANTIPLATELETS, HYPO_RISK_DRUGS
from aksh_access.scenarios import (
    NOW,
    novak_events,
    okafor_events,
    patel_events,
)
from aksh_access.vendor_mock import AccessEvent
from conftest import rules_for, run

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


def test_patel_triggers_expected_findings(pipe) -> None:
    run(pipe, patel_events())
    r = rules_for(pipe, "patel")
    assert set(r) == {
        "hba1c-above-threshold",
        "hba1c-overdue",
        "annual-checks-overdue",
        "anticoagulant-antiplatelet",
        "hypoglycaemia-on-hypo-risk-drug",
        "missed-appointment",
    }
    assert r["anticoagulant-antiplatelet"].finding.severity == "high"
    assert "not yet reconciled" in r["anticoagulant-antiplatelet"].finding.summary


def test_patient_reported_hba1c_does_not_satisfy_monitoring(pipe) -> None:
    run(pipe, patel_events())
    f = rules_for(pipe, "patel")["hba1c-overdue"].finding
    assert "patient-reported value exists but is not counted" in f.summary


def test_well_controlled_patient_has_no_findings(pipe) -> None:
    run(pipe, okafor_events())
    assert rules_for(pipe, "okafor") == {}


def test_vendor_only_patient_flags_unconfirmed_diagnosis(pipe) -> None:
    run(pipe, novak_events())
    pid = pipe.store.search(
        "Patient", lambda p: p["name"][0]["family"] == "Novak"
    )[0]["id"]
    assert "diagnosis-unconfirmed" in rules_for(pipe, pid)
    assert "hypoglycaemia-on-hypo-risk-drug" in rules_for(pipe, pid)
    assert "hba1c-overdue" in rules_for(pipe, pid)


def test_non_diabetic_patient_is_ignored(pipe) -> None:
    pipe.handle(
        AccessEvent(
            "intake.completed",
            {
                "patient": {
                    "nhs_number": "9990000099",
                    "given": "X",
                    "family": "Y",
                },
                "medications": ["apixaban", "aspirin"],
            },
            occurred_at=NOW,
        )
    )
    assert pipe.gate.pending() == []


def test_superseded_when_finding_changes(pipe) -> None:
    ev = patel_events()
    pipe.handle(ev[0])  # overdue, no patient-reported value yet
    pipe.handle(ev[1])  # intake adds patient-reported HbA1c
    statuses = [
        p.status
        for p in pipe.gate.proposals.values()
        if p.finding.rule_id == "hba1c-overdue"
    ]
    assert statuses == ["superseded", "pending"]


def test_e2e_nothing_written_or_sent_before_approval(pipe) -> None:
    run(pipe, patel_events() + novak_events())
    pipe.dispatch()
    assert pipe.store.count("DetectedIssue") == 0
    assert pipe.store.count("CommunicationRequest") == 0
    assert pipe.vendor.outbound == []


def test_e2e_unauthorised_clinician_blocked(pipe) -> None:
    run(pipe, patel_events())
    pid = pipe.gate.pending()[0].id
    with pytest.raises(PermissionError):
        pipe.approve(pid, "intruder")
    assert pipe.store.count("DetectedIssue") == 0
    assert pipe.gate.audit[-1]["action"] == "blocked-unauthorised"


def test_e2e_rejection_requires_reason_and_writes_nothing(pipe) -> None:
    run(pipe, patel_events())
    pid = pipe.gate.pending()[0].id
    with pytest.raises(ValueError):
        pipe.reject(pid, "prac-001", "  ")
    pipe.reject(pid, "prac-001", "Already addressed in clinic")
    pipe.dispatch()
    assert pipe.store.count("DetectedIssue") == 0
    assert pipe.vendor.outbound == []


def test_e2e_one_call_per_patient_scripts_non_clinical_idempotent(pipe) -> None:
    run(pipe, patel_events() + novak_events())
    for p in list(pipe.gate.pending()):
        if (
            p.finding.rule_id == "annual-checks-overdue"
            and p.finding.patient_id != "patel"
        ):
            pipe.reject(
                p.id,
                "prac-001",
                "New patient; checks will be arranged at first review",
            )
        else:
            pipe.approve(p.id, "prac-001")
    sent = pipe.dispatch()
    assert len(sent) == 2
    assert len({o["patient_nhs_number"] for o in sent}) == 2
    for o in sent:
        text = o["script"].lower()
        for term in CLINICAL_TERMS:
            assert term not in text, f"clinical term {term!r} leaked into script"
    patel_call = next(o for o in sent if o["patient_nhs_number"] == "9990000001")
    assert "book_review" not in patel_call["outreach_type"].split("+")
    assert pipe.dispatch() == []
