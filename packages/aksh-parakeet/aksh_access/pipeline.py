"""Orchestrator: vendor event → FHIR → diabetes rules → approval queue.

Kept framework-free so each step can become a LangGraph node later
(ingest → evaluate → propose, with an interrupt before approve).
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Callable, Optional

from .adapter import PatientAccessAdapter
from .approval_gate import ApprovalGate, Proposal
from .diabetes_rules import evaluate
from .fhir import FHIRStore
from .vendor_mock import AccessEvent, MockVendor

DEFAULT_CLINICIANS = {"prac-001": "Dr S. Rahman (synthetic, GMC 0000001)"}


class AkshPatientAccessPipeline:
    def __init__(
        self,
        clinicians: Optional[dict] = None,
        now: Optional[Callable[[], datetime]] = None,
        thresholds: Optional[dict] = None,
    ) -> None:
        self.store = FHIRStore()
        self.vendor = MockVendor()
        self.adapter = PatientAccessAdapter(self.store)
        self.gate = ApprovalGate(
            self.store,
            clinicians or DEFAULT_CLINICIANS,
            vendor=self.vendor,
        )
        self.thresholds = thresholds
        self._now = now

    def now(self) -> datetime:
        return self._now() if self._now else datetime.now(timezone.utc)

    def handle(self, event: AccessEvent) -> list[Proposal]:
        result = self.adapter.ingest(event)
        findings = evaluate(
            self.store, result["patient_id"], self.now(), self.thresholds
        )
        return self.gate.propose(findings)

    def approve(
        self, proposal_id: str, clinician_id: str, note: str = ""
    ) -> Proposal:
        return self.gate.approve(proposal_id, clinician_id, self.now(), note)

    def reject(
        self, proposal_id: str, clinician_id: str, reason: str
    ) -> Proposal:
        return self.gate.reject(proposal_id, clinician_id, self.now(), reason)

    def dispatch(self) -> list[dict]:
        return self.gate.dispatch_outreach(self.now())
