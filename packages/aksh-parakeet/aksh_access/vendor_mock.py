"""Mock of a patient-access vendor (Parakeet-style contract).

No public vendor API is assumed. This module defines the inbound event and
outbound outreach shapes Aksh expects. A real vendor can sit behind the same
surface later. No network calls are made.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

EVENT_TYPES = {
    "referral.received",
    "intake.completed",
    "appointment.booked",
    "appointment.no_show",
}
CHANNELS = {"voice", "sms", "fax", "email"}

# Required fields for every outbound outreach record (Phase 5 will populate these).
OUTREACH_REQUIRED = {
    "outreach_type",
    "patient_nhs_number",
    "phone",
    "script",
    "authorised_by",
    "communication_request",
}


@dataclass(frozen=True)
class AccessEvent:
    """Inbound event from a patient-access vendor."""

    type: str
    payload: dict
    channel: str = "voice"
    occurred_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    event_id: str = field(
        default_factory=lambda: f"pk-evt-{uuid.uuid4().hex[:10]}"
    )

    def __post_init__(self) -> None:
        if self.type not in EVENT_TYPES:
            raise ValueError(f"Unknown event type: {self.type}")
        if self.channel not in CHANNELS:
            raise ValueError(f"Unknown channel: {self.channel}")
        patient = self.payload.get("patient")
        if not isinstance(patient, dict) or not patient.get("nhs_number"):
            raise ValueError(
                "Every event must carry a patient block with an nhs_number"
            )


class MockVendor:
    """Records outbound outreach requests instead of contacting anyone."""

    def __init__(self) -> None:
        self.outbound: list[dict] = []

    def request_outreach(self, request: dict) -> dict:
        missing = OUTREACH_REQUIRED - set(request.keys())
        if missing:
            raise ValueError(f"Outreach request missing fields: {sorted(missing)}")
        record = {
            **request,
            "outreach_id": f"pk-out-{uuid.uuid4().hex[:10]}",
            "status": "queued",
        }
        self.outbound.append(record)
        return record
