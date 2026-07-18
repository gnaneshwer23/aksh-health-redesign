# Clinical safety case rehearsal (Aksh Health UK)

**Status:** In-app / documentary rehearsal only.  
**Not** a signed DCB0129 / DTAC / MHRA clinical safety case.

## Intended use (pilot)

Aksh Health is a **human-in-the-loop clinical workflow layer** above EMIS Web / SystmOne for synthetic and pilot proof:

1. Capture (consult notes / optional Deepgram voice via authenticated `POST /api/transcribe`)
2. Draft + checks (SYNTHESIS / Dr.Assist / GUARDIAN / ORACLE / EQUITY / REFERRAL / VOICE CARE — LLM or deterministic)
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
| Continuous-learning events | `/api/learning/events` · `docs/CONTINUOUS_LEARNING.md` (append-only; **no** auto-retrain) |
| Pharmacist review trail | `/api/pharmacist/reviews` (SHIELD rows labelled medication review) |
| SYNTHESIS drafts | `POST /api/agents/synthesis` (HITL; no EHR write) |
| Dr.Assist drafts | `POST /api/agents/dr-assist` (HITL; Neo4j/mock + LLM/deterministic coding) |
| GUARDIAN drafts | `POST /api/agents/guardian` (HITL; Neo4j/mock + LLM/deterministic) |
| ORACLE drafts | `POST /api/agents/oracle` (HITL; Neo4j/mock + LLM/deterministic) |
| EQUITY drafts | `POST /api/agents/equity` (HITL; aggregate ICS; no EHR write) |
| VOICE CARE escalation | `POST /api/agents/voice-care` (synthetic outbound → SHIELD + nurse task; no telephony) |
| REFERRAL packaging | `POST /api/agents/referral` (HITL draft package; no e-Referral write) |
| Golden-case eval | `POST /api/eval/agents` · `npm run eval:agents` · `docs/AGENT_EVAL_HARNESS.md` |
| Voice transcription status | `GET /api/transcribe` (auth) — Deepgram when `DEEPGRAM_API_KEY` set |
| EMIS staging scaffold | `/api/integrations/emis-staging` |
| Integration contract | `/api/system/integration-contract` |
| Neo4j health | `/api/neo4j/health` and `/api/health` (`neo4j.mode`) |
| System status strip | Admin dashboard probes `GET /api/health` |
| Public ICS demo | `/dashboard/ics` (allowlisted; synthetic; demo banner) |

## Named owners (must be filled before production)

| Role | Current |
|------|---------|
| Clinical Safety Officer (CSO) | Unassigned |
| Hazard log owner | Unassigned |
| Release authority | Unassigned |

## Open production gaps

1. Appoint CSO and maintain hazard log with review dates — start from `docs/HAZARD_LOG_TEMPLATE.md` (test IDs linked; **unsigned**)
2. Complete DCB0129 clinical safety case report outside the synthetic proof app
3. EMIS / SystmOne Partner onboarding + DPIA
4. Neo4j live graph where ORACLE/GUARDIAN/Dr.Assist claims depend on it (`NEO4J_*` — resume Aura if paused)
5. Eval gates + **governed model release** for any LLM clinical drafts (learning recorder exists; auto-retrain forbidden)
6. Formal performance load beyond `npm run smoke:perf` soft SLOs

## How to rehearse

1. Sign in → complete onboarding
2. Generate or open a review case → Accept/Edit/Reject
3. Confirm `/api/audit/shield` returns durable rows when `DATABASE_URL` is set (admin Audit Log prefers Postgres, including empty trail)
4. Optionally record a learning event: `POST /api/learning/events` with predictionId + decision + outcomeKind — confirm `autoRetrainTriggered: false`
5. Optionally `POST /api/agents/synthesis` with a transcript (HITL still required)
6. Optionally `POST /api/agents/dr-assist` with `{ "patientId": "P002" }` (HITL still required)
7. Optionally `POST /api/agents/guardian` with `{ "patientId": "P002", "proposedDrug": "Apixaban" }` (HITL still required)
8. Optionally `POST /api/agents/oracle` with `{ "patientId": "P002" }` (HITL still required)
9. Optionally `POST /api/agents/equity` (HITL; aggregate ICS brief)
10. Optionally `POST /api/agents/voice-care` (synthetic outbound → SHIELD + nurse task; no telephony)
11. Optionally `POST /api/agents/referral` with a case id (HITL still required; synthetic ServiceRequest only)
12. Pharmacist: Mark Reviewed → confirm `/api/pharmacist/reviews` lists the SHIELD row
13. Optionally `POST /api/integrations/emis-staging` — confirms **no** live write-back
14. Voice: authenticated `POST /api/transcribe` with audio — live Deepgram when key present, else clearly labelled simulated transcript
15. Golden eval: `npm run eval:agents` or `POST /api/eval/agents` (see `docs/AGENT_EVAL_HARNESS.md`)
16. Perf smoke: `PERF_SMOKE_BASE_URL=https://akshhealth.com npm run smoke:perf`
17. Public ICS demo: open `/dashboard/ics` without sign-in — confirm demo banner + synthetic population
18. Review hazard residual risks in `docs/HAZARD_LOG_TEMPLATE.md` before any Gate 2 claim