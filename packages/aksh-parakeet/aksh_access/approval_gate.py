"""Clinician approval gate + outreach dispatch (SHIELD / CONDUCTOR, prototype).

Phase 4 guarantees:
  1. Findings are queued as proposals; duplicates are skipped; outdated
     pending proposals for the same rule/patient are superseded.
  2. Nothing clinical (DetectedIssue, CommunicationRequest) is written
     until an authorised clinician approves.
  3. Reject requires a reason and writes nothing.
  4. Decisions are final and fully audited.

Phase 5 guarantees:
  5. One outbound call per patient covering all approved, unsent requests.
  6. Scripts use only fixed non-clinical phrases (no results, drugs, diagnoses).
  7. Missing phone -> not sent; dispatch is idempotent.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from .diabetes_rules import Finding
from .fhir import FHIRStore, NHS_NUMBER, iso, ref
from .vendor_mock import MockVendor

# Fixed, non-clinical phrases. Order = call priority.
# Do not invent or change wording without Clinical Safety Officer sign-off.
OUTREACH_PHRASES = {
    "rebook_missed": "a new date for the appointment we missed you at",
    "book_review": "an appointment with your diabetes care team",
    "book_test": "a routine blood test",
    "book_screening": "your routine annual diabetes checks",
}

_OPENING = "Hello {given}, this is {service} calling to arrange {items}."
_CLOSING = (
    " If you have questions about your health, the care team will go through "
    "them at your appointment."
)
OUTREACH_ID_SYSTEM = "urn:aksh:patient-access:outreach"


@dataclass
class Proposal:
    id: str
    finding: Finding
    status: str = "pending"  # pending | approved | rejected | superseded
    decided_by: Optional[str] = None
    decided_at: Optional[datetime] = None
    note: Optional[str] = None
    outcome: dict = field(default_factory=dict)


class ApprovalGate:
    def __init__(
        self,
        store: FHIRStore,
        authorised_clinicians: dict[str, str],
        vendor: Optional[MockVendor] = None,
        service_name: str = "the Aksh diabetes service",
    ) -> None:
        self.store = store
        self.vendor = vendor if vendor is not None else MockVendor()
        self.clinicians = authorised_clinicians
        self.service_name = service_name
        self.proposals: dict[str, Proposal] = {}
        self.audit: list[dict] = []
        self._n = 0

    # -- proposing ------------------------------------------------------------
    def propose(self, findings: list[Finding]) -> list[Proposal]:
        new: list[Proposal] = []
        for f in findings:
            same_key = [
                p
                for p in self.proposals.values()
                if p.finding.rule_id == f.rule_id
                and p.finding.patient_id == f.patient_id
            ]
            if any(p.finding.summary == f.summary for p in same_key):
                continue  # already seen this exact finding (any status)
            for p in same_key:
                if p.status == "pending":
                    p.status = "superseded"
                    self._log("superseded", p.id)
            self._n += 1
            p = Proposal(id=f"prop-{self._n:04d}", finding=f)
            self.proposals[p.id] = p
            self._log(
                "proposed",
                p.id,
                rule=f.rule_id,
                patient=f.patient_id,
                severity=f.severity,
            )
            new.append(p)
        return new

    def pending(self) -> list[Proposal]:
        order = {"high": 0, "moderate": 1, "low": 2}
        return sorted(
            (p for p in self.proposals.values() if p.status == "pending"),
            key=lambda p: (order[p.finding.severity], p.id),
        )

    # -- deciding -------------------------------------------------------------
    def approve(
        self,
        proposal_id: str,
        clinician_id: str,
        now: datetime,
        note: str = "",
    ) -> Proposal:
        p = self._pending(proposal_id)
        prac_ref = self._practitioner(clinician_id)
        f = p.finding

        issue = self.store.create(
            {
                "resourceType": "DetectedIssue",
                "status": "final",
                "severity": f.severity,
                "code": {"text": f.rule_id},
                "patient": {"reference": f"Patient/{f.patient_id}"},
                "identifiedDateTime": iso(now),
                "author": {"reference": prac_ref},
                "detail": f.summary + (f" | Clinician note: {note}" if note else ""),
                "implicated": [{"reference": e} for e in f.evidence],
            }
        )
        targets = [ref(issue)]
        comm = None
        if f.action:
            if f.action not in OUTREACH_PHRASES:
                raise ValueError(
                    f"Outreach type {f.action!r} is not on the approved list"
                )
            comm = self.store.create(
                {
                    "resourceType": "CommunicationRequest",
                    "status": "active",
                    "category": [{"text": f.action}],
                    "subject": {"reference": f"Patient/{f.patient_id}"},
                    "reasonReference": [{"reference": ref(issue)}],
                    "requester": {"reference": prac_ref},
                    "authoredOn": iso(now),
                    "medium": [{"text": "voice"}],
                    "payload": [{"contentString": OUTREACH_PHRASES[f.action]}],
                }
            )
            targets.append(ref(comm))

        self.store.create(
            {
                "resourceType": "Provenance",
                "target": [{"reference": t} for t in targets],
                "recorded": iso(now),
                "activity": {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
                            "code": "CREATE",
                        }
                    ]
                },
                "agent": [
                    {
                        "type": {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                                    "code": "verifier",
                                }
                            ]
                        },
                        "who": {"reference": prac_ref},
                    }
                ],
                "entity": [
                    {
                        "role": "derivation",
                        "what": {"display": f"Aksh rule {f.rule_id}"},
                    }
                ]
                + [{"role": "source", "what": {"reference": e}} for e in f.evidence],
            }
        )

        p.outcome = {"detected_issue": ref(issue)}
        if comm:
            p.outcome["communication_request"] = ref(comm)
        p.status = "approved"
        p.decided_by = clinician_id
        p.decided_at = now
        p.note = note
        self._log("approved", p.id, by=clinician_id)
        return p

    def reject(
        self,
        proposal_id: str,
        clinician_id: str,
        now: datetime,
        reason: str,
    ) -> Proposal:
        if not reason.strip():
            raise ValueError("A rejection reason is required")
        p = self._pending(proposal_id)
        self._practitioner(clinician_id)
        p.status = "rejected"
        p.decided_by = clinician_id
        p.decided_at = now
        p.note = reason
        self._log("rejected", p.id, by=clinician_id, reason=reason)
        return p

    # -- internals ------------------------------------------------------------
    def _pending(self, proposal_id: str) -> Proposal:
        p = self.proposals.get(proposal_id)
        if p is None:
            raise KeyError(proposal_id)
        if p.status != "pending":
            raise ValueError(f"{proposal_id} is {p.status}, not pending")
        return p

    def _practitioner(self, clinician_id: str) -> str:
        if clinician_id not in self.clinicians:
            self._log("blocked-unauthorised", None, by=clinician_id)
            raise PermissionError(f"{clinician_id} is not an authorised clinician")
        if not self.store.exists("Practitioner", clinician_id):
            self.store.create(
                {
                    "resourceType": "Practitioner",
                    "id": clinician_id,
                    "name": [{"text": self.clinicians[clinician_id]}],
                }
            )
        return f"Practitioner/{clinician_id}"

    # -- outreach (Phase 5) ---------------------------------------------------
    def dispatch_outreach(self, now: datetime) -> list[dict]:
        """Send one call per patient covering every approved, unsent request."""
        _ = now  # reserved for future scheduling; dispatch is immediate in prototype
        unsent = self.store.search(
            "CommunicationRequest",
            lambda c: c.get("status") == "active" and not c.get("identifier"),
        )
        by_patient: dict[str, list[dict]] = {}
        for c in unsent:
            by_patient.setdefault(c["subject"]["reference"], []).append(c)

        results: list[dict] = []
        for pref, comms in by_patient.items():
            patient = self.store.read("Patient", pref.split("/", 1)[1])
            phone = next(
                (
                    t["value"]
                    for t in patient.get("telecom", [])
                    if t.get("system") == "phone"
                ),
                None,
            )
            nhs = next(
                (
                    i["value"]
                    for i in patient.get("identifier", [])
                    if i.get("system") == NHS_NUMBER
                ),
                None,
            )
            if not phone:
                self._log("dispatch-skipped-no-phone", None, patient=pref)
                results.append(
                    {
                        "patient": pref,
                        "status": "not-sent",
                        "reason": "no phone number on record",
                    }
                )
                continue
            types = [
                t
                for t in OUTREACH_PHRASES
                if any(c["category"][0]["text"] == t for c in comms)
            ]
            if "rebook_missed" in types and "book_review" in types:
                types.remove("book_review")  # the rebooked appointment is the review
            record = self.vendor.request_outreach(
                {
                    "outreach_type": "+".join(types),
                    "patient_nhs_number": nhs,
                    "phone": phone,
                    "script": self._script(patient, types),
                    "authorised_by": sorted(
                        {c["requester"]["reference"] for c in comms}
                    ),
                    "communication_request": [ref(c) for c in comms],
                }
            )
            for c in comms:
                c["identifier"] = [
                    {"system": OUTREACH_ID_SYSTEM, "value": record["outreach_id"]}
                ]
                self.store.update(c)
            self._log(
                "dispatched",
                None,
                patient=pref,
                outreach=record["outreach_id"],
                items=types,
            )
            results.append(record)
        return results

    def _script(self, patient: dict, types: list[str]) -> str:
        given = (patient.get("name") or [{}])[0].get("given", [""])[0] or "there"
        phrases = [OUTREACH_PHRASES[t] for t in types]
        if len(phrases) == 1:
            items = phrases[0]
        else:
            items = ", ".join(phrases[:-1]) + " and " + phrases[-1]
        return (
            _OPENING.format(given=given, service=self.service_name, items=items)
            + _CLOSING
        )

    def _log(self, action: str, proposal_id: Optional[str], **kw) -> None:
        self.audit.append({"action": action, "proposal": proposal_id, **kw})
