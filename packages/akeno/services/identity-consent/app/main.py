from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .consent_store import grant_consent, register_patient, revoke_consent, validate_consent
from .db_migrations import run_migrations
from .settings import POSTGRES_DSN


app = FastAPI(title="Akeno Identity and Consent Service", version="0.3.0-dpdpa")


@app.on_event("startup")
def startup() -> None:
    run_migrations()


class RegisterPatientRequest(BaseModel):
    patientKey: str
    displayName: str


class GrantConsentRequest(BaseModel):
    patientKey: str
    scopes: List[str] = Field(default_factory=lambda: ["care", "analytics"])
    hoursValid: int = 24
    proxyKey: Optional[str] = None
    purpose: str = Field(default="care_delivery", description="DPDPA purpose limitation")
    retentionDays: int = Field(default=90, ge=1, le=365, description="DPDPA data minimization retention")
    actor: str = "api-client"


class RevokeConsentRequest(BaseModel):
    token: str
    withdrawalReason: Optional[str] = None
    actor: str = "api-client"


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "identity-consent", "dpdpaSchema": "002"}


@app.post("/patients/register")
def patients_register(request: RegisterPatientRequest) -> dict:
    return register_patient(POSTGRES_DSN, request.patientKey, request.displayName)


@app.post("/consent/grant")
def consent_grant(request: GrantConsentRequest) -> dict:
    try:
        return grant_consent(
            POSTGRES_DSN,
            request.patientKey,
            request.scopes,
            request.hoursValid,
            request.proxyKey,
            purpose=request.purpose,
            retention_days=request.retentionDays,
            actor=request.actor,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/consent/revoke")
def consent_revoke(request: RevokeConsentRequest) -> dict:
    try:
        return revoke_consent(
            POSTGRES_DSN,
            request.token,
            withdrawal_reason=request.withdrawalReason,
            actor=request.actor,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/consent/validate/{token}")
def consent_validate(token: str) -> dict:
    return validate_consent(POSTGRES_DSN, token)
