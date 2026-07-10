from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any

from .xai import build_rationale
from .guardrails import evaluate_safety
from .clinician_governance import record_review
from .model_registry import resolve_active_model
from .audit_events import publish_ai_audit_event


app = FastAPI(title="Akeno L3-L4 AI Safety Service", version="0.1.0")


class ScoreRequest(BaseModel):
    patientKey: str
    features: Dict[str, float]

class GovernanceRequest(BaseModel):
    patientKey: str
    riskScore: float
    action: str
    reason: str


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "l3-l4-ai-safety"}


@app.post("/score")
def score(request: ScoreRequest) -> Dict[str, Any]:
    model_info = resolve_active_model()
    # Placeholder model score.
    risk_score = min(100.0, sum(request.features.values()) % 100)
    rationale = build_rationale(request.features, risk_score)
    safety = evaluate_safety(request.features, risk_score)
    response = {
        "patientKey": request.patientKey,
        "model": model_info,
        "riskScore": risk_score,
        "recommendation": "review_clinician" if risk_score >= 60 else "monitor",
        "rationale": rationale,
        "safety": safety,
    }
    publish_ai_audit_event(
        {
            "eventType": "AI_SCORE_GENERATED",
            "patientKey": request.patientKey,
            "modelVersion": model_info["modelVersion"],
            "riskScore": risk_score,
            "recommendation": response["recommendation"],
            "blocked": safety["blocked"],
        }
    )
    return response


@app.post("/governance/decision")
def governance_decision(request: GovernanceRequest) -> Dict[str, Any]:
    result = record_review(
        patient_key=request.patientKey,
        risk_score=request.riskScore,
        action=request.action,
        reason=request.reason,
    )
    publish_ai_audit_event({"eventType": "CLINICIAN_GOVERNANCE_DECISION", **result})
    return result
