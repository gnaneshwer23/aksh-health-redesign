# E2E Clinical Proof Framework — Aksh Health

**Status:** Harness + automated proof for what the platform actually implements.  
**Not a claim** that Aksh is production-ready end-to-end with live EMIS write-back.

Live site: https://akshhealth.com  
Repo: `packages/platform-uk`  
Sprint: **B** (multi-patient golden paths, agent orchestration, evidence pack generators)

---

## Vision chain (seven-stage pipeline)

```text
EHR or patient input
→ FHIR intake
→ knowledge graph
→ AI agents
→ clinician review (HITL mandatory)
→ FHIR staging
→ EHR write-back
→ audit trail
→ care action
→ measurable outcome
```

Invariant: **zero autonomous clinical writes**. Draft ≠ record until a named clinician Accepts.

---

## Four completion levels (Definition of Done)

| Level | Meaning | Aksh Health today (honest) |
| --- | --- | --- |
| **UI complete** | Screens, dashboards, interactions exist | **Met** for marketing, 8 role dashboards, Patel demo, review queue |
| **Functionally complete** | Buttons/agents/workflows produce expected outputs | **Met** for HITL Accept/Edit/Reject, agent draft APIs, FHIR R4 schema CI, Accept→stage→sim chain, **7-patient parameterized golden paths**, **multi-agent orchestration**, SHIELD when Postgres available, evidence pack generators |
| **Integrated complete** | Real services exchange data correctly | **Partial** — Neon Postgres + NextAuth real; Neo4j Aura currently **paused/unreachable** (honest mock + automated graph assertions); EMIS/Mirth/CIS2 **not** live |
| **Production-ready** | Secure, governed, clinically safe | **Not met** — no CSO-signed safety case, no Partner write-back, no signed Gate 1–3 |

**End-to-end built** for Aksh means all four levels for the full chain. We are **not** there. Sprint B closed multi-patient + orchestration functional proof and kept integrated Neo4j/EMIS honest.

---

## Master Definition of Done checklist

| # | Condition | Status | Evidence |
| ---: | --- | --- | --- |
| 1 | Patient identity resolved | Partial | Synthetic cohort + duplicate NHS fixture (P016); no live PDS |
| 2 | Clinical data → valid FHIR R4 | Met (schema CI) | Zod FHIR R4 gates for 9 resource types (`fhir-r4-validator.ts`); HL7 Java Validator JAR optional |
| 3 | Knowledge graph updated | Partial | Live graph assertions when Aura reachable; else honest mock (`clinical-proof-graph`) |
| 4 | Agents run on correct patient context | Met (orchestration) | Shared-context orchestration: SYNTHESIS + GUARDIAN + ORACLE (+ DrASSIST) |
| 5 | Every AI output marked draft | Met | Agent APIs return `hitlRequired` / `ehrWrite: false` |
| 6 | Confidence / evidence visible | Partial | UI + agent drafts; orchestration asserts independent evidence per agent |
| 7 | Urgent outputs prioritised | Met (orchestration) | GUARDIAN leads review order when Urgent (red/URGENT flag) |
| 8 | Clinician Accept / Edit / Reject | Met (UI + store) | GP review queue + workflow review cases |
| 9 | Rejected outputs never reach record | Met (platform) | Reject path + staging/sim write deny (chain test) |
| 10 | Edited outputs preserve clinician version | Met (UI) | `editedContent` + re-accept |
| 11 | Accepted → staged FHIR | Met (platform) | Accept → FHIR R4 validate → EMIS staging queue (internal only) → approval token |
| 12 | Nothing written to EHR without approval | Met (invariant) | EMIS disabled; sim write requires token; replay denied |
| 13 | Immutable AuditEvent | Partial | SHIELD append-only Postgres when configured; no DELETE API |
| 14 | RBAC | Partial | Middleware role dashboards; public GP/ICS allowlisted demos |
| 15 | Outcomes return to timeline | Gap | Continuous learning loop not productionised |
| 16 | Failures detectable / recoverable | Partial | Health probes + smoke; no full DR evidence |

---

## Honest gap register

| Integration / capability | Status | Notes |
| --- | --- | --- |
| EMIS Partner live write-back | **BLOCKED: partner** | `/api/integrations/emis-staging` queues only; `liveWriteBack: false` |
| SystmOne write-back | **BLOCKED: partner** | Not implemented |
| Mirth Connect | **GAP / mock UI** | Marketing/admin status mock — no live routes |
| Neo4j Aura (live) | **Paused / unreachable (Jul 2026)** | Creds present; `ServiceUnavailable`; clinical-proof uses honest mock until Resume + seed |
| CIS2 / NHS login | **BLOCKED: partner** | NextAuth credentials (+ optional clinical OAuth scaffold) |
| FHIR R4 schema CI | **Met** | Zod R4 gates fail CI on invalid; HL7 Java Validator JAR still optional |
| Medplum sync | **Disabled by default** | Flagged off in integration contract |
| Deepgram voice | **Optional** | Simulated transcript when key absent |
| DCB0129 / CSO hazard log | **Documentary** | Template in evidence pack; unsigned |
| Tenant isolation (multi-practice) | **Partial** | Practice context helpers; not full RLS proof |

---

## Synthetic cohort

- **26 patients** in `lib/mock-data/patients.ts` (P001–P026)
- Required clinical profiles covered (T2D, HTN, HF, COPD, polypharmacy, allergy, pregnancy, paediatric, frailty, renal/liver, MH crisis, oncology, DVT, missing info, duplicate identity, conflicting records, deterioration, healthy)
- Neo4j seed (`npm run data:seed:neo4j`) uses the same array
- Golden path patient: **P002 Mr James Patel** (dedicated UI spec)
- Multi-patient golden paths (parameterized): **P001, P003, P004, P008, P009, P015, P018** — allergy/DVT, frailty/COPD, renal, polypharmacy, paediatric, missing info, HF/renal deterioration

---

## How to run clinical proof

```bash
cd packages/platform-uk

# Unit / contract clinical-proof suite (no browser)
# Includes: cohort, FHIR, graph, HITL chain, SHIELD, RBAC, golden-paths, orchestration
npm run test:clinical-proof

# Full verify (includes workflow + clinical-proof)
npm run verify

# Playwright clinical-proof specs
npm run test:e2e:clinical-proof

# Agent eval (HITL-safe)
npm run eval:agents

# Evidence pack snapshots → docs/evidence-pack/generated/ (gitignored)
npm run evidence:pack
```

Orchestrator (unit + documents what is blocked):

```bash
npm run test:e2e:clinical-proof:all
```

Requires `DATABASE_URL` for signup/SHIELD durable paths in Playwright.

---

## Evidence pack

See `docs/evidence-pack/README.md` for the 16 artefact slots and how to regenerate machine snapshots (`npm run evidence:pack`).

Traceability: `docs/QA_TRACEABILITY_MATRIX.md` (+ `docs/qa-traceability-matrix.json`).

---

## Formal gates (not signed)

1. **Technical acceptance** — architecture functions; clinical-proof suite green
2. **Clinical safety acceptance** — CSO + hazard log (template only today)
3. **Operational pilot readiness** — sponsor + DPIA + Partner credentials

Do not declare production-ready until Gates 1–3 are signed with inspectable evidence.
