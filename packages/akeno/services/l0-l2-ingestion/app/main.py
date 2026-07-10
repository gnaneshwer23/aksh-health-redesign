from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List

from .pipeline import normalize_event, validate_quality
from .patient_context import build_patient_context
from .consent import validate_consent_token
from .interop_bus import route_to_standard
from .storage import persist_event, upsert_patient_graph_projection
from .messaging import publish_ingestion_event
from .db_migrations import run_migrations


app = FastAPI(title="Akeno L0-L2 Ingestion Service", version="0.1.0")


@app.on_event("startup")
def startup() -> None:
    run_migrations()


class IngestionEvent(BaseModel):
    eventId: str
    sourceSystem: str
    sourceType: str
    patientKey: str
    eventTime: str
    consentToken: str
    payloadType: str
    payload: Dict[str, Any] = Field(default_factory=dict)


class IngestionResult(BaseModel):
    accepted: bool
    qualityScore: float
    issues: List[str]


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "l0-l2-ingestion"}


@app.post("/ingest", response_model=IngestionResult)
def ingest(event: IngestionEvent) -> IngestionResult:
    if not validate_consent_token(event.consentToken, event.patientKey):
        return IngestionResult(accepted=False, qualityScore=0.0, issues=["Invalid, expired, or mismatched consent token"])
    event_payload = event.model_dump()
    standardized = route_to_standard(event_payload["payloadType"], event_payload["payload"])
    event_payload["payload"] = standardized
    normalized = normalize_event(event_payload)
    quality = validate_quality(normalized)
    if quality["qualityScore"] < 80:
        return IngestionResult(accepted=False, qualityScore=quality["qualityScore"], issues=quality["issues"])
    persist_event(normalized, quality["qualityScore"])
    upsert_patient_graph_projection(normalized)
    publish_ingestion_event(normalized, quality["qualityScore"])
    return IngestionResult(accepted=True, qualityScore=quality["qualityScore"], issues=quality["issues"])


@app.get("/patient-context/{patient_key}")
def patient_context(patient_key: str) -> Dict[str, Any]:
    context = build_patient_context(patient_key)
    if not context:
        raise HTTPException(status_code=404, detail="Patient context not found")
    return context
