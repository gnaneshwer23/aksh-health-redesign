from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

import psycopg


def _log_consent_event(
    cur: psycopg.Cursor,
    *,
    event_type: str,
    token: Optional[str],
    patient_key: str,
    purpose: Optional[str],
    scopes: List[str],
    retention_days: Optional[int],
    actor: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    cur.execute(
        """
        INSERT INTO consent_audit_log
            (token, patient_key, event_type, purpose, scopes, retention_days, actor, metadata)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb)
        """,
        (
            token,
            patient_key,
            event_type,
            purpose,
            scopes,
            retention_days,
            actor,
            psycopg.types.json.Json(metadata or {}),
        ),
    )


def register_patient(dsn: str, patient_key: str, display_name: str) -> Dict[str, Any]:
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO patients (patient_key, display_name)
                VALUES (%s, %s)
                ON CONFLICT (patient_key) DO UPDATE SET display_name = EXCLUDED.display_name
                RETURNING patient_key, display_name, created_at
                """,
                (patient_key, display_name),
            )
            row = cur.fetchone()
    return {"patientKey": row[0], "displayName": row[1], "createdAt": row[2].isoformat()}


def grant_consent(
    dsn: str,
    patient_key: str,
    scopes: List[str],
    hours_valid: int = 24,
    proxy_key: Optional[str] = None,
    purpose: Optional[str] = None,
    retention_days: Optional[int] = None,
    actor: str = "identity-consent-service",
) -> Dict[str, Any]:
    token = f"consent:{uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=hours_valid)
    resolved_purpose = purpose or "care_delivery"
    resolved_retention = retention_days if retention_days is not None else 90

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM patients WHERE patient_key = %s", (patient_key,))
            if not cur.fetchone():
                raise ValueError(f"Unknown patient_key: {patient_key}")
            cur.execute(
                """
                INSERT INTO consent_grants
                    (token, patient_key, scopes, proxy_key, expires_at, purpose, retention_days)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING token, patient_key, scopes, proxy_key, expires_at, purpose, retention_days
                """,
                (token, patient_key, scopes, proxy_key, expires_at, resolved_purpose, resolved_retention),
            )
            row = cur.fetchone()
            _log_consent_event(
                cur,
                event_type="grant",
                token=row[0],
                patient_key=row[1],
                purpose=row[5],
                scopes=list(row[2]),
                retention_days=row[6],
                actor=actor,
                metadata={"proxyKey": row[3], "expiresAt": row[4].isoformat()},
            )
    return {
        "token": row[0],
        "patientKey": row[1],
        "scopes": row[2],
        "proxyKey": row[3],
        "expiresAt": row[4].isoformat(),
        "purpose": row[5],
        "retentionDays": row[6],
    }


def revoke_consent(
    dsn: str,
    token: str,
    withdrawal_reason: Optional[str] = None,
    actor: str = "identity-consent-service",
) -> Dict[str, Any]:
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE consent_grants
                SET revoked_at = NOW(),
                    withdrawn_at = NOW(),
                    withdrawal_reason = COALESCE(%s, withdrawal_reason)
                WHERE token = %s AND revoked_at IS NULL
                RETURNING token, patient_key, scopes, purpose, retention_days
                """,
                (withdrawal_reason, token),
            )
            row = cur.fetchone()
            if not row:
                raise ValueError("Consent token not found or already revoked")
            _log_consent_event(
                cur,
                event_type="revoke",
                token=row[0],
                patient_key=row[1],
                purpose=row[3],
                scopes=list(row[2]),
                retention_days=row[4],
                actor=actor,
                metadata={"withdrawalReason": withdrawal_reason},
            )
    return {"token": row[0], "patientKey": row[1], "revoked": True}


def validate_consent(dsn: str, token: str) -> Dict[str, Any]:
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT token, patient_key, scopes, proxy_key, expires_at, revoked_at,
                       purpose, retention_days
                FROM consent_grants
                WHERE token = %s
                """,
                (token,),
            )
            row = cur.fetchone()
    if not row:
        return {"valid": False, "reason": "token_not_found"}
    if row[5] is not None:
        return {"valid": False, "reason": "revoked"}
    if row[4] < datetime.now(timezone.utc):
        return {"valid": False, "reason": "expired"}
    return {
        "valid": True,
        "token": row[0],
        "patientKey": row[1],
        "scopes": row[2],
        "proxyKey": row[3],
        "expiresAt": row[4].isoformat(),
        "purpose": row[6],
        "retentionDays": row[7],
    }
