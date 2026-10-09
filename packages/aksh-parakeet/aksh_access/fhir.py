"""FHIR R4 helpers, code constants, and a minimal in-memory store.

FHIRStore exposes create / read / update / search / count — the Medplum-shaped
subset this prototype needs, so it can be swapped for a real client later
without touching the adapter, rules, or approval gate.
"""
from __future__ import annotations

import copy
import uuid
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Callable, Optional

# --- Code systems -----------------------------------------------------------
LOINC = "http://loinc.org"
SNOMED = "http://snomed.info/sct"
UCUM = "http://unitsofmeasure.org"
NHS_NUMBER = "https://fhir.nhs.uk/Id/nhs-number"
AKSH_CHECKS = "urn:aksh:annual-check"
AKSH_REPORTED = "urn:aksh:patient-reported"

HBA1C = {
    "system": LOINC,
    "code": "59261-8",
    "display": "Hemoglobin A1c/Hemoglobin.total in Blood by IFCC protocol",
}
URINE_ACR = {
    "system": LOINC,
    "code": "9318-7",
    "display": "Albumin/Creatinine [Mass Ratio] in Urine",
}
RETINAL = {
    "system": AKSH_CHECKS,
    "code": "retinal-screening",
    "display": "Diabetic eye screening",
}
FOOT = {
    "system": AKSH_CHECKS,
    "code": "foot-check",
    "display": "Diabetic foot examination",
}
HYPO_COUNT = {
    "system": AKSH_REPORTED,
    "code": "hypo-episodes-30d",
    "display": "Self-reported hypoglycaemia episodes, last 30 days",
}
T2D = {
    "system": SNOMED,
    "code": "44054006",
    "display": "Type 2 diabetes mellitus",
}
DVT = {
    "system": SNOMED,
    "code": "128053003",
    "display": "Deep venous thrombosis",
}

# Medication name sets used by later diabetes rules (Phase 3).
ANTICOAGULANTS = {"apixaban", "rivaroxaban", "edoxaban", "dabigatran", "warfarin"}
ANTIPLATELETS = {"aspirin", "clopidogrel", "prasugrel", "ticagrelor"}
HYPO_RISK_DRUGS = {"gliclazide", "glimepiride", "glipizide", "tolbutamide", "insulin"}

# Every resource that arrives via a patient-access vendor carries this tag.
SOURCE_TAG = {
    "system": "urn:aksh:data-origin",
    "code": "external-patient-access",
    "display": "Captured by patient-access AI; not clinically verified",
}

# Lab / EHR observation statuses that may satisfy monitoring rules.
VERIFIED_OBS_STATUS = {"final", "amended", "corrected"}


# --- Small helpers ----------------------------------------------------------
def parse_dt(value: str) -> datetime:
    """Parse ISO date or datetime into a timezone-aware UTC datetime."""
    if len(value) == 10:
        d = date.fromisoformat(value)
        return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def iso(dt: datetime) -> str:
    """Format a datetime as FHIR-friendly UTC ISO-8601 with Z suffix."""
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def ref(resource: dict) -> str:
    return f"{resource['resourceType']}/{resource['id']}"


def has_code(resource: dict, coding: dict) -> bool:
    return any(
        c.get("system") == coding["system"] and c.get("code") == coding["code"]
        for c in resource.get("code", {}).get("coding", [])
    )


def is_external(resource: dict) -> bool:
    return any(
        t.get("code") == SOURCE_TAG["code"]
        for t in resource.get("meta", {}).get("tag", [])
    )


def patient_nhs_number(patient: dict) -> Optional[str]:
    for ident in patient.get("identifier", []):
        if ident.get("system") == NHS_NUMBER:
            return ident.get("value")
    return None


# --- Store ------------------------------------------------------------------
class FHIRStore:
    """In-memory FHIR resource store with a Medplum-compatible surface."""

    def __init__(self) -> None:
        self._data: dict[str, dict[str, dict]] = defaultdict(dict)

    def create(self, resource: dict) -> dict:
        res = copy.deepcopy(resource)
        rtype = res["resourceType"]
        res.setdefault("id", str(uuid.uuid4()))
        if res["id"] in self._data[rtype]:
            raise ValueError(f"{rtype}/{res['id']} already exists")
        self._data[rtype][res["id"]] = res
        return copy.deepcopy(res)

    def update(self, resource: dict) -> dict:
        res = copy.deepcopy(resource)
        rtype, rid = res["resourceType"], res["id"]
        if rid not in self._data[rtype]:
            raise KeyError(f"{rtype}/{rid} not found")
        self._data[rtype][rid] = res
        return copy.deepcopy(res)

    def read(self, rtype: str, rid: str) -> dict:
        return copy.deepcopy(self._data[rtype][rid])

    def exists(self, rtype: str, rid: str) -> bool:
        return rid in self._data.get(rtype, {})

    def search(
        self, rtype: str, where: Optional[Callable[[dict], bool]] = None
    ) -> list[dict]:
        items = list(self._data.get(rtype, {}).values())
        return [copy.deepcopy(r) for r in items if where is None or where(r)]

    def count(self, rtype: str) -> int:
        return len(self._data.get(rtype, {}))
