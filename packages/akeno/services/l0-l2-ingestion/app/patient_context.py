from typing import Any, Dict, List

from .bundle_composer import compose_fhir_bundle
from .storage import fetch_patient_events, get_graph_summary


def build_patient_context(patient_key: str) -> Dict[str, Any]:
    events = fetch_patient_events(patient_key)
    if not events:
        return {}

    bundle = compose_fhir_bundle(events)
    graph_summary = get_graph_summary(patient_key)
    risk_signals: List[str] = []

    for event in events:
        if event.get("source_type") in {"WEARABLE", "LAB"}:
            risk_signals.append(f"signal:{event['source_type'].lower()}")

    return {
        "patientKey": patient_key,
        "bundle": bundle,
        "graphSummary": graph_summary,
        "riskSignals": sorted(set(risk_signals)),
        "consentState": {
            "active": True,
            "scope": ["care", "analytics"],
            "expiresAt": None,
        },
        "eventCount": len(events),
    }
