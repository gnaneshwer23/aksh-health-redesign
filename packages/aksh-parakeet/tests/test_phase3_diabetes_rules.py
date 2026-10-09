"""Phase 3 — diabetes rules: draft findings only; no store writes."""
from __future__ import annotations

from datetime import datetime, timezone

from aksh_access.diabetes_rules import DEFAULT_THRESHOLDS, evaluate
from aksh_access.fhir import (
    FOOT,
    HBA1C,
    HYPO_COUNT,
    NHS_NUMBER,
    RETINAL,
    SOURCE_TAG,
    T2D,
    UCUM,
    URINE_ACR,
    FHIRStore,
)

NOW = datetime(2026, 10, 9, 9, 0, tzinfo=timezone.utc)


def _patient(store: FHIRStore, pid: str = "p1") -> str:
    store.create(
        {
            "resourceType": "Patient",
            "id": pid,
            "identifier": [{"system": NHS_NUMBER, "value": "9990000001"}],
            "name": [{"family": "Test", "given": ["Pat"]}],
        }
    )
    return pid


def _confirmed_t2d(store: FHIRStore, pid: str) -> None:
    store.create(
        {
            "resourceType": "Condition",
            "id": f"cond-t2d-{pid}",
            "subject": {"reference": f"Patient/{pid}"},
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


def _reported_t2d(store: FHIRStore, pid: str) -> None:
    store.create(
        {
            "resourceType": "Condition",
            "id": f"cond-t2d-rep-{pid}",
            "meta": {"tag": [SOURCE_TAG]},
            "subject": {"reference": f"Patient/{pid}"},
            "code": {"text": "type 2 diabetes"},
            "verificationStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                        "code": "unconfirmed",
                    }
                ]
            },
        }
    )


def _lab_hba1c(store: FHIRStore, pid: str, value: float, when: str, rid: str = "lab-hba1c") -> None:
    store.create(
        {
            "resourceType": "Observation",
            "id": rid,
            "status": "final",
            "code": {"coding": [HBA1C]},
            "subject": {"reference": f"Patient/{pid}"},
            "effectiveDateTime": when,
            "valueQuantity": {
                "value": value,
                "unit": "mmol/mol",
                "system": UCUM,
                "code": "mmol/mol",
            },
        }
    )


def _reported_hba1c(store: FHIRStore, pid: str, value: float, when: str) -> None:
    store.create(
        {
            "resourceType": "Observation",
            "id": "rep-hba1c",
            "meta": {"tag": [SOURCE_TAG]},
            "status": "preliminary",
            "code": {"coding": [HBA1C]},
            "subject": {"reference": f"Patient/{pid}"},
            "effectiveDateTime": when,
            "valueQuantity": {
                "value": value,
                "unit": "mmol/mol",
                "system": UCUM,
                "code": "mmol/mol",
            },
        }
    )


def _med(store: FHIRStore, pid: str, text: str, rid: str, external: bool = False) -> None:
    res = {
        "resourceType": "MedicationStatement",
        "id": rid,
        "status": "active",
        "medicationCodeableConcept": {"text": text},
        "subject": {"reference": f"Patient/{pid}"},
    }
    if external:
        res["meta"] = {"tag": [SOURCE_TAG]}
    store.create(res)


def _annual(store: FHIRStore, pid: str, coding: dict, when: str, rid: str) -> None:
    store.create(
        {
            "resourceType": "Observation",
            "id": rid,
            "status": "final",
            "code": {"coding": [coding]},
            "subject": {"reference": f"Patient/{pid}"},
            "effectiveDateTime": when,
        }
    )


def _hypo(store: FHIRStore, pid: str, count: int, when: str) -> None:
    store.create(
        {
            "resourceType": "Observation",
            "id": "hypo",
            "meta": {"tag": [SOURCE_TAG]},
            "status": "preliminary",
            "code": {"coding": [HYPO_COUNT]},
            "subject": {"reference": f"Patient/{pid}"},
            "effectiveDateTime": when,
            "valueInteger": count,
        }
    )


def _noshow(store: FHIRStore, pid: str, start: str) -> None:
    store.create(
        {
            "resourceType": "Appointment",
            "id": "appt-missed",
            "status": "noshow",
            "start": start,
            "participant": [
                {"actor": {"reference": f"Patient/{pid}"}, "status": "accepted"}
            ],
        }
    )


def test_thresholds_are_fixed_placeholders() -> None:
    assert DEFAULT_THRESHOLDS == {
        "hba1c_review_mmol": 58,
        "hba1c_urgent_mmol": 75,
        "hba1c_interval_days": 183,
        "annual_check_days": 365,
        "hypo_window_days": 30,
        "no_show_window_days": 30,
    }


def test_non_diabetes_patient_raises_zero_findings() -> None:
    store = FHIRStore()
    pid = _patient(store)
    assert evaluate(store, pid, NOW) == []


def test_patient_reported_hba1c_never_satisfies_monitoring() -> None:
    store = FHIRStore()
    pid = _patient(store)
    _confirmed_t2d(store, pid)
    _reported_hba1c(store, pid, 50, "2026-10-01")  # recent but preliminary
    findings = evaluate(store, pid, NOW)
    ids = {f.rule_id for f in findings}
    assert "hba1c-overdue" in ids
    overdue = next(f for f in findings if f.rule_id == "hba1c-overdue")
    assert "patient-reported" in overdue.summary
    assert overdue.action == "book_test"


def test_recent_lab_hba1c_clears_overdue_but_high_value_flags_threshold() -> None:
    store = FHIRStore()
    pid = _patient(store)
    _confirmed_t2d(store, pid)
    _lab_hba1c(store, pid, 78, "2026-09-01")  # within 183 days, urgent
    # Keep annual checks current so they don't clutter the set.
    _annual(store, pid, RETINAL, "2026-08-01", "eye")
    _annual(store, pid, URINE_ACR, "2026-08-01", "acr")
    _annual(store, pid, FOOT, "2026-08-01", "foot")
    findings = evaluate(store, pid, NOW)
    ids = {f.rule_id for f in findings}
    assert "hba1c-overdue" not in ids
    assert "hba1c-above-threshold" in ids
    flag = next(f for f in findings if f.rule_id == "hba1c-above-threshold")
    assert flag.severity == "high"
    assert flag.action == "book_review"


def test_well_controlled_recent_checks_zero_findings() -> None:
    store = FHIRStore()
    pid = _patient(store)
    _confirmed_t2d(store, pid)
    _lab_hba1c(store, pid, 48, "2026-09-01")
    _annual(store, pid, RETINAL, "2026-08-01", "eye")
    _annual(store, pid, URINE_ACR, "2026-08-01", "acr")
    _annual(store, pid, FOOT, "2026-08-01", "foot")
    _med(store, pid, "metformin 500mg", "med-met")
    assert evaluate(store, pid, NOW) == []


def test_annual_checks_combined_finding() -> None:
    store = FHIRStore()
    pid = _patient(store)
    _confirmed_t2d(store, pid)
    _lab_hba1c(store, pid, 50, "2026-09-01")
    _annual(store, pid, URINE_ACR, "2026-02-10", "acr")  # within year
    # eye and foot missing / stale
    _annual(store, pid, RETINAL, "2025-06-01", "eye")
    _annual(store, pid, FOOT, "2025-05-20", "foot")
    findings = evaluate(store, pid, NOW)
    annual = next(f for f in findings if f.rule_id == "annual-checks-overdue")
    assert "eye screening" in annual.summary
    assert "foot examination" in annual.summary
    assert "urine ACR" not in annual.summary
    assert annual.action == "book_screening"


def test_anticoagulant_antiplatelet_high_and_notes_patient_reported() -> None:
    store = FHIRStore()
    pid = _patient(store)
    _confirmed_t2d(store, pid)
    _lab_hba1c(store, pid, 50, "2026-09-01")
    _annual(store, pid, RETINAL, "2026-08-01", "eye")
    _annual(store, pid, URINE_ACR, "2026-08-01", "acr")
    _annual(store, pid, FOOT, "2026-08-01", "foot")
    _med(store, pid, "apixaban 5mg", "med-apix", external=True)
    _med(store, pid, "aspirin 75mg", "med-asp", external=True)
    findings = evaluate(store, pid, NOW)
    bleed = next(f for f in findings if f.rule_id == "anticoagulant-antiplatelet")
    assert bleed.severity == "high"
    assert "patient-reported" in bleed.summary


def test_hypoglycaemia_on_hypo_risk_drug() -> None:
    store = FHIRStore()
    pid = _patient(store)
    _confirmed_t2d(store, pid)
    _lab_hba1c(store, pid, 50, "2026-09-01")
    _annual(store, pid, RETINAL, "2026-08-01", "eye")
    _annual(store, pid, URINE_ACR, "2026-08-01", "acr")
    _annual(store, pid, FOOT, "2026-08-01", "foot")
    _med(store, pid, "gliclazide 80mg", "med-glic")
    _hypo(store, pid, 2, "2026-10-01")
    findings = evaluate(store, pid, NOW)
    hypo = next(f for f in findings if f.rule_id == "hypoglycaemia-on-hypo-risk-drug")
    assert hypo.severity == "high"
    assert hypo.action == "book_review"


def test_missed_appointment_high_when_hba1c_urgent() -> None:
    store = FHIRStore()
    pid = _patient(store)
    _confirmed_t2d(store, pid)
    _lab_hba1c(store, pid, 78, "2026-09-01")
    _annual(store, pid, RETINAL, "2026-08-01", "eye")
    _annual(store, pid, URINE_ACR, "2026-08-01", "acr")
    _annual(store, pid, FOOT, "2026-08-01", "foot")
    _noshow(store, pid, "2026-09-28T10:00:00Z")
    findings = evaluate(store, pid, NOW)
    missed = next(f for f in findings if f.rule_id == "missed-appointment")
    assert missed.severity == "high"
    assert missed.action == "rebook_missed"


def test_reported_only_diagnosis_adds_unconfirmed_finding() -> None:
    store = FHIRStore()
    pid = _patient(store)
    _reported_t2d(store, pid)
    findings = evaluate(store, pid, NOW)
    assert any(f.rule_id == "diagnosis-unconfirmed" for f in findings)
    unconfirmed = next(f for f in findings if f.rule_id == "diagnosis-unconfirmed")
    assert unconfirmed.severity == "low"
    assert unconfirmed.action is None


def test_evaluate_writes_nothing_to_store() -> None:
    store = FHIRStore()
    pid = _patient(store)
    _confirmed_t2d(store, pid)
    _lab_hba1c(store, pid, 80, "2026-02-10")  # overdue + above threshold
    before = {
        "DetectedIssue": store.count("DetectedIssue"),
        "CommunicationRequest": store.count("CommunicationRequest"),
        "Observation": store.count("Observation"),
        "Condition": store.count("Condition"),
        "Provenance": store.count("Provenance"),
    }
    findings = evaluate(store, pid, NOW)
    assert findings  # produced drafts
    after = {
        "DetectedIssue": store.count("DetectedIssue"),
        "CommunicationRequest": store.count("CommunicationRequest"),
        "Observation": store.count("Observation"),
        "Condition": store.count("Condition"),
        "Provenance": store.count("Provenance"),
    }
    assert after == before
