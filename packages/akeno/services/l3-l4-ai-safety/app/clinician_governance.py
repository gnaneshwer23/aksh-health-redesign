from typing import Dict, Any
from datetime import datetime, timezone


def record_review(patient_key: str, risk_score: float, action: str, reason: str) -> Dict[str, Any]:
    if action not in {"approve", "override", "escalate"}:
        raise ValueError("action must be one of: approve, override, escalate")
    return {
        "patientKey": patient_key,
        "riskScore": risk_score,
        "action": action,
        "reason": reason,
        "reviewedAt": datetime.now(timezone.utc).isoformat(),
        "auditEventType": "CLINICIAN_REVIEW_DECISION",
    }
