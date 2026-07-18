# Clinical safety case rehearsal (Aksh Health UK)

**Status:** In-app / documentary rehearsal only.  
**Not** a signed DCB0129 / DTAC / MHRA clinical safety case.

## Intended use (pilot)

Aksh Health is a **human-in-the-loop clinical workflow layer** above EMIS Web / SystmOne for synthetic and pilot proof:

1. Capture (consult notes / optional Deepgram voice via authenticated `POST /api/transcribe`)
2. Draft + checks (SYNTHESIS / GUARDIAN / ORACLE — LLM or deterministic)
3. Clinician Accept / Edit / Reject
4. FHIR-shaped staging + durable SHIELD audit
5. EHR write-back **only** after named clinician approval **and** Partner credentials (not enabled in this build)

## Invariants

- Zero autonomous clinical writes to the EHR
- Synthetic / pilot data unless explicitly contracted otherwise
- Marketing and APIs must not claim MHRA registration, DCB0129 sign-off, or CQC readiness

## Evidence artefacts in this repo

| Artefact | Route / location |
|----------|------------------|
| Governance pack | `/review/governance-pack` |
| Clinical safety file placeholders | `/api/system/clinical-safety-files` |
| Audit integrity | `/api/system/audit-integrity` |
| Permission matrix | `/api/system/permission-matrix` |
| Durable SHIELD events | `aksh.shield_audit_events` via `/api/audit/shield` |
| Pharmacist review trail | `/api/pharmacist/reviews` (SHIELD rows labelled medication review) |
| SYNTHESIS drafts | `POST /api/agents/synthesis` (HITL; no EHR write) |
| GUARDIAN drafts | `POST /api/agents/guardian` (HITL; Neo4j/mock + LLM/deterministic) |
| Voice transcription status | `GET /api/transcribe` (auth) — Deepgram when `DEEPGRAM_API_KEY` set |
| EMIS staging scaffold | `/api/integrations/emis-staging` |
| Integration contract | `/api/system/integration-contract` |
| Neo4j health | `/api/neo4j/health` and `/api/health` (`neo4j.mode`) |

## Named owners (must be filled before production)

| Role | Current |
|------|---------|
| Clinical Safety Officer (CSO) | Unassigned |
| Hazard log owner | Unassigned |
| Release authority | Unassigned |

## Open production gaps

1. Appoint CSO and maintain hazard log with review dates
2. Complete DCB0129 clinical safety case report outside the synthetic proof app
3. EMIS / SystmOne Partner onboarding + DPIA
4. Neo4j live graph where ORACLE/GUARDIAN claims depend on it (`NEO4J_*` — resume Aura if paused)
5. Eval gates for any LLM clinical drafts before unsupervised use
6. ORACLE agent path (risk narrative) still graph-backed only — no separate LLM ORACLE route yet

## How to rehearse

1. Sign in → complete onboarding
2. Generate or open a review case → Accept/Edit/Reject
3. Confirm `/api/audit/shield` returns durable rows when `DATABASE_URL` is set (admin Audit Log prefers Postgres, including empty trail)
4. Optionally `POST /api/agents/synthesis` with a transcript (HITL still required)
5. Optionally `POST /api/agents/guardian` with `{ "patientId": "P002", "proposedDrug": "Apixaban" }` (HITL still required)
6. Pharmacist: Mark Reviewed → confirm `/api/pharmacist/reviews` lists the SHIELD row
7. Optionally `POST /api/integrations/emis-staging` — confirms **no** live write-back
8. Voice: authenticated `POST /api/transcribe` with audio — live Deepgram when key present, else clearly labelled simulated transcript
