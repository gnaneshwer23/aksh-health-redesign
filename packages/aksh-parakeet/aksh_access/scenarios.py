"""Synthetic test cohort.

All people, NHS numbers (999 test range) and phone numbers
(Ofcom 07700 900xxx drama range) are fictional.
"""
from __future__ import annotations

from datetime import datetime, timezone

from .fhir import (
    DVT,
    FOOT,
    HBA1C,
    NHS_NUMBER,
    RETINAL,
    T2D,
    UCUM,
    URINE_ACR,
    FHIRStore,
)
from .vendor_mock import AccessEvent

NOW = datetime(2026, 10, 9, 9, 0, tzinfo=timezone.utc)


def _t(month: int, day: int, hour: int = 10) -> datetime:
    return datetime(2026, month, day, hour, 0, tzinfo=timezone.utc)


def seed_ehr_patient(
    store: FHIRStore,
    pid: str,
    nhs: str,
    family: str,
    given: str,
    birth: str,
    gender: str,
    phone: str | None,
    conditions=(),
    labs=(),
    meds=(),
) -> None:
    """Simulates data already in the GP/hospital record (verified, untagged)."""
    patient: dict = {
        "resourceType": "Patient",
        "id": pid,
        "identifier": [{"system": NHS_NUMBER, "value": nhs}],
        "name": [{"family": family, "given": [given]}],
        "birthDate": birth,
        "gender": gender,
    }
    if phone:
        patient["telecom"] = [
            {"system": "phone", "value": phone, "use": "mobile"}
        ]
    store.create(patient)
    for coding in conditions:
        store.create(
            {
                "resourceType": "Condition",
                "subject": {"reference": f"Patient/{pid}"},
                "code": {"coding": [coding]},
                "clinicalStatus": {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                            "code": "active",
                        }
                    ]
                },
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
    for coding, when, value in labs:
        obs: dict = {
            "resourceType": "Observation",
            "status": "final",
            "code": {"coding": [coding]},
            "subject": {"reference": f"Patient/{pid}"},
            "effectiveDateTime": when,
        }
        if value is not None:
            obs["valueQuantity"] = {
                "value": value,
                "unit": "mmol/mol",
                "system": UCUM,
                "code": "mmol/mol",
            }
        store.create(obs)
    for med in meds:
        store.create(
            {
                "resourceType": "MedicationStatement",
                "status": "active",
                "medicationCodeableConcept": {"text": med},
                "subject": {"reference": f"Patient/{pid}"},
            }
        )


PATEL = {
    "nhs_number": "9990000001",
    "family": "Patel",
    "given": "James",
    "birth_date": "1972-03-14",
    "gender": "male",
    "phone": "+447700900001",
}
OKAFOR = {
    "nhs_number": "9990000002",
    "family": "Okafor",
    "given": "Ada",
    "birth_date": "1980-07-02",
    "gender": "female",
    "phone": "+447700900002",
}
NOVAK = {
    "nhs_number": "9990000003",
    "family": "Novak",
    "given": "Tomas",
    "birth_date": "1961-11-23",
    "gender": "male",
    "phone": "+447700900003",
}


def _ehr(p: dict) -> dict:
    return {
        "nhs": p["nhs_number"],
        "family": p["family"],
        "given": p["given"],
        "birth": p["birth_date"],
        "gender": p["gender"],
        "phone": p["phone"],
    }


def seed_ehr(store: FHIRStore) -> None:
    seed_ehr_patient(
        store,
        "patel",
        **_ehr(PATEL),
        conditions=[T2D, DVT],
        labs=[
            (HBA1C, "2026-02-10", 78),
            (URINE_ACR, "2026-02-10", None),
            (RETINAL, "2025-06-01", None),
            (FOOT, "2025-05-20", None),
        ],
    )
    seed_ehr_patient(
        store,
        "okafor",
        **_ehr(OKAFOR),
        conditions=[T2D],
        labs=[
            (HBA1C, "2026-08-01", 48),
            (URINE_ACR, "2026-03-10", None),
            (RETINAL, "2026-03-10", None),
            (FOOT, "2026-03-10", None),
        ],
        meds=["metformin 500 mg twice daily"],
    )
    # Novak deliberately has no EHR record: first contact is via the vendor.


def patel_events() -> list[AccessEvent]:
    return [
        AccessEvent(
            "referral.received",
            {
                "patient": PATEL,
                "referrer": "Riverside Medical Practice (synthetic)",
                "reason": "Type 2 diabetes review, poor control",
                "letter_text": (
                    "Please review diabetes control. On anticoagulation post-DVT."
                ),
            },
            channel="fax",
            occurred_at=_t(9, 1),
        ),
        AccessEvent(
            "intake.completed",
            {
                "patient": PATEL,
                "medications": [
                    "metformin 1 g twice daily",
                    "gliclazide 80 mg once daily",
                    "apixaban 5 mg twice daily",
                    "aspirin 75 mg once daily",
                ],
                "reported_hba1c": {"value": 60, "date": "2026-08-20"},
                "hypo_episodes_30d": 2,
            },
            channel="voice",
            occurred_at=_t(9, 25),
        ),
        AccessEvent(
            "appointment.booked",
            {
                "patient": PATEL,
                "start": "2026-09-28T09:30:00Z",
                "service": "Diabetes review",
            },
            channel="voice",
            occurred_at=_t(9, 25, 11),
        ),
        AccessEvent(
            "appointment.no_show",
            {"patient": PATEL, "start": "2026-09-28T09:30:00Z"},
            channel="voice",
            occurred_at=_t(9, 28, 10),
        ),
    ]


def okafor_events() -> list[AccessEvent]:
    return [
        AccessEvent(
            "intake.completed",
            {
                "patient": OKAFOR,
                "medications": ["metformin 500 mg twice daily"],
                "hypo_episodes_30d": 0,
            },
            channel="sms",
            occurred_at=_t(10, 2),
        )
    ]


def novak_events() -> list[AccessEvent]:
    return [
        AccessEvent(
            "referral.received",
            {
                "patient": NOVAK,
                "referrer": "Self-referral via phone",
                "reason": "New patient, diabetes",
            },
            channel="voice",
            occurred_at=_t(10, 1),
        ),
        AccessEvent(
            "intake.completed",
            {
                "patient": NOVAK,
                "conditions": ["Type 2 diabetes"],
                "medications": [
                    "metformin 1 g twice daily",
                    "insulin glargine 20 units at night",
                ],
                "hypo_episodes_30d": 1,
            },
            channel="voice",
            occurred_at=_t(10, 1, 12),
        ),
    ]
