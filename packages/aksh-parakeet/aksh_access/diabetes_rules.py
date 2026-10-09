"""Type 2 diabetes rule set. Produces *draft* findings only; nothing is written.

Default thresholds are placeholders loosely based on NICE NG28 (HbA1c checked
3–6 monthly; intensification considered at 58 mmol/mol). The "urgent" level is
an arbitrary prototype value. All thresholds must be signed off by the
Clinical Safety Officer before any non-synthetic use.

Rule of the house: patient-reported data (vendor intake) can *raise* a concern
but never *satisfies* a monitoring requirement.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional

from .fhir import (
    ANTICOAGULANTS,
    ANTIPLATELETS,
    FOOT,
    HBA1C,
    HYPO_COUNT,
    HYPO_RISK_DRUGS,
    RETINAL,
    T2D,
    URINE_ACR,
    VERIFIED_OBS_STATUS,
    FHIRStore,
    has_code,
    is_external,
    parse_dt,
    ref,
)

# Placeholders pending Clinical Safety Officer sign-off — do not change casually.
DEFAULT_THRESHOLDS = {
    "hba1c_review_mmol": 58,
    "hba1c_urgent_mmol": 75,
    "hba1c_interval_days": 183,
    "annual_check_days": 365,
    "hypo_window_days": 30,
    "no_show_window_days": 30,
}


@dataclass
class Finding:
    rule_id: str
    patient_id: str
    severity: str  # high | moderate | low
    summary: str
    evidence: list[str] = field(default_factory=list)
    action: Optional[str] = None  # book_test | book_review | book_screening | rebook_missed | None
    action_detail: Optional[str] = None


# -- query helpers -------------------------------------------------------------
def _for(pid: str):
    pref = f"Patient/{pid}"
    return lambda r: (r.get("subject") or {}).get("reference") == pref


def _obs(store: FHIRStore, pid: str, coding: dict) -> list[dict]:
    sub = _for(pid)
    return store.search("Observation", lambda o: sub(o) and has_code(o, coding))


def _latest(observations: list[dict]) -> Optional[dict]:
    return max(
        observations, key=lambda o: parse_dt(o["effectiveDateTime"]), default=None
    )


def _verified(o: dict) -> bool:
    return o.get("status") in VERIFIED_OBS_STATUS


def _active_meds(store: FHIRStore, pid: str) -> list[dict]:
    sub = _for(pid)
    return store.search(
        "MedicationStatement",
        lambda m: sub(m) and m.get("status") == "active",
    )


def _matching(meds: list[dict], drug_set: set[str]) -> list[tuple[str, dict]]:
    hits: list[tuple[str, dict]] = []
    for m in meds:
        text = m.get("medicationCodeableConcept", {}).get("text", "").lower()
        for d in drug_set:
            if d in text:
                hits.append((d, m))
    return hits


def _diabetes_status(store: FHIRStore, pid: str) -> Optional[str]:
    """Return 'confirmed', 'reported', or None (outside diabetes cohort)."""
    sub = _for(pid)
    status: Optional[str] = None
    for c in store.search("Condition", sub):
        text = c.get("code", {}).get("text", "").lower()
        is_t2d = has_code(c, T2D) or "type 2 diabetes" in text
        if not is_t2d:
            continue
        ver = c.get("verificationStatus", {}).get("coding", [{}])[0].get("code")
        if ver == "confirmed":
            return "confirmed"
        status = "reported"
    return status


# -- rules -------------------------------------------------------------------
def rule_hba1c_monitoring(
    store: FHIRStore, pid: str, now: datetime, t: dict
) -> list[Finding]:
    obs = _obs(store, pid, HBA1C)
    lab = _latest([o for o in obs if _verified(o)])
    reported = [o for o in obs if not _verified(o)]
    if lab and now - parse_dt(lab["effectiveDateTime"]) <= timedelta(
        days=t["hba1c_interval_days"]
    ):
        return []
    summary = "No laboratory HbA1c in the last 6 months"
    if lab:
        summary += f" (last lab result {lab['effectiveDateTime'][:10]})"
    if reported:
        summary += "; a patient-reported value exists but is not counted"
    evidence = ([ref(lab)] if lab else []) + [ref(o) for o in reported]
    return [
        Finding("hba1c-overdue", pid, "moderate", summary, evidence, "book_test")
    ]


def rule_hba1c_control(
    store: FHIRStore, pid: str, now: datetime, t: dict
) -> list[Finding]:
    lab = _latest([o for o in _obs(store, pid, HBA1C) if _verified(o)])
    if not lab:
        return []
    value = lab["valueQuantity"]["value"]
    when = lab["effectiveDateTime"][:10]
    if value >= t["hba1c_urgent_mmol"]:
        sev = "high"
    elif value >= t["hba1c_review_mmol"]:
        sev = "moderate"
    else:
        return []
    return [
        Finding(
            "hba1c-above-threshold",
            pid,
            sev,
            f"Last lab HbA1c {value} mmol/mol on {when} is above the review threshold",
            [ref(lab)],
            "book_review",
            "diabetes review",
        )
    ]


def rule_annual_checks(
    store: FHIRStore, pid: str, now: datetime, t: dict
) -> list[Finding]:
    overdue: list[str] = []
    evidence: list[str] = []
    for coding, label in (
        (RETINAL, "eye screening"),
        (URINE_ACR, "urine ACR"),
        (FOOT, "foot examination"),
    ):
        last = _latest([o for o in _obs(store, pid, coding) if _verified(o)])
        if last:
            evidence.append(ref(last))
        if not last or now - parse_dt(last["effectiveDateTime"]) > timedelta(
            days=t["annual_check_days"]
        ):
            overdue.append(label)
    if not overdue:
        return []
    return [
        Finding(
            "annual-checks-overdue",
            pid,
            "low",
            "Annual diabetes checks overdue: " + ", ".join(overdue),
            evidence,
            "book_screening",
            ", ".join(overdue),
        )
    ]


def rule_bleeding_risk(
    store: FHIRStore, pid: str, now: datetime, t: dict
) -> list[Finding]:
    meds = _active_meds(store, pid)
    anticoag = _matching(meds, ANTICOAGULANTS)
    antiplt = _matching(meds, ANTIPLATELETS)
    if not (anticoag and antiplt):
        return []
    involved = [m for _, m in anticoag + antiplt]
    summary = (
        f"Anticoagulant ({', '.join(sorted({d for d, _ in anticoag}))}) with "
        f"antiplatelet ({', '.join(sorted({d for d, _ in antiplt}))}): "
        f"bleeding risk, confirm indication"
    )
    if any(is_external(m) for m in involved):
        summary += (
            ". Medication list is patient-reported via intake and not yet reconciled"
        )
    return [
        Finding(
            "anticoagulant-antiplatelet",
            pid,
            "high",
            summary,
            [ref(m) for m in involved],
            "book_review",
            "medication review",
        )
    ]


def rule_hypoglycaemia(
    store: FHIRStore, pid: str, now: datetime, t: dict
) -> list[Finding]:
    drugs = _matching(_active_meds(store, pid), HYPO_RISK_DRUGS)
    if not drugs:
        return []
    recent = [
        o
        for o in _obs(store, pid, HYPO_COUNT)
        if now - parse_dt(o["effectiveDateTime"])
        <= timedelta(days=t["hypo_window_days"])
    ]
    latest = _latest(recent)
    if not latest or latest.get("valueInteger", 0) < 1:
        return []
    return [
        Finding(
            "hypoglycaemia-on-hypo-risk-drug",
            pid,
            "high",
            f"{latest['valueInteger']} self-reported hypo episode(s) in 30 days "
            f"while on {', '.join(sorted({d for d, _ in drugs}))}",
            [ref(latest)] + [ref(m) for _, m in drugs],
            "book_review",
            "diabetes review",
        )
    ]


def rule_missed_appointment(
    store: FHIRStore, pid: str, now: datetime, t: dict
) -> list[Finding]:
    pref = f"Patient/{pid}"
    missed = store.search(
        "Appointment",
        lambda a: a.get("status") == "noshow"
        and any(
            p.get("actor", {}).get("reference") == pref
            for p in a.get("participant", [])
        )
        and now - parse_dt(a["start"]) <= timedelta(days=t["no_show_window_days"]),
    )
    if not missed:
        return []
    lab = _latest([o for o in _obs(store, pid, HBA1C) if _verified(o)])
    high = lab is not None and lab["valueQuantity"]["value"] >= t["hba1c_urgent_mmol"]
    return [
        Finding(
            "missed-appointment",
            pid,
            "high" if high else "moderate",
            f"Missed appointment on {missed[0]['start'][:10]}"
            + (" with last HbA1c above the urgent threshold" if high else ""),
            [ref(a) for a in missed],
            "rebook_missed",
            "missed appointment",
        )
    ]


RULES = [
    rule_hba1c_monitoring,
    rule_hba1c_control,
    rule_annual_checks,
    rule_bleeding_risk,
    rule_hypoglycaemia,
    rule_missed_appointment,
]


def evaluate(
    store: FHIRStore,
    pid: str,
    now: datetime,
    thresholds: Optional[dict] = None,
) -> list[Finding]:
    """Evaluate diabetes rules. Pure: never writes to the store."""
    t = {**DEFAULT_THRESHOLDS, **(thresholds or {})}
    status = _diabetes_status(store, pid)
    if status is None:
        return []
    findings: list[Finding] = []
    if status == "reported":
        findings.append(
            Finding(
                "diagnosis-unconfirmed",
                pid,
                "low",
                "Type 2 diabetes is patient-reported only; confirm against GP record",
            )
        )
    for rule in RULES:
        findings.extend(rule(store, pid, now, t))
    return findings
