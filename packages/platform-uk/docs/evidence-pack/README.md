# Production-readiness evidence pack

Sixteen artefacts required before pilot / deployment claims.  
Fill each placeholder with real outputs; do not invent PASS for blocked partners.

## Regenerate machine snapshots

```bash
cd packages/platform-uk
npm run evidence:pack
```

Writes into `docs/evidence-pack/generated/` (**gitignored**):

| File | Contents |
| --- | --- |
| `shield-export-sample.json` | SHIELD audit export sample shape |
| `agent-eval-report.json` | Output of `npm run eval:agents` (deterministic LLM flags off) |
| `rbac-matrix-snapshot.json` | Role allowlist + REQ-021–023 traceability slice |
| `health-snapshot.json` | Live `/api/health` when server up, else contract-only |
| `fhir-validation-summary.json` | Zod FHIR R4 pass/fail on clinical-proof fixtures |
| `clinical-proof-gap-summary.json` | Honest gap / blocked-partner register |
| `MANIFEST.md` | Index of generated files |

Optional live health probe:

```bash
EVIDENCE_HEALTH_URL=https://akshhealth.com npm run evidence:pack
# or with local server:
# npm run dev & EVIDENCE_HEALTH_URL=http://127.0.0.1:3000 npm run evidence:pack
```

## Artefact slots

| # | Artefact | Path | How to generate |
| ---: | --- | --- | --- |
| 1 | Traceability matrix | `../QA_TRACEABILITY_MATRIX.md` · `../qa-traceability-matrix.json` | Maintain with each release; `npm run test:clinical-proof` |
| 2 | Architecture / data-flow | `02-architecture.md` | Copy from `../ARCHITECTURE.md` + annotate gaps |
| 3 | API / integration results | `03-api-integration-results.md` | `npm run verify` + paste summary |
| 4 | FHIR conformance | `04-fhir-conformance.md` + `generated/fhir-validation-summary.json` | `npm run evidence:pack` / Zod CI; HL7 validator when available |
| 5 | AI-agent evaluation | `05-ai-agent-evaluation.md` + `generated/agent-eval-report.json` | `npm run eval:agents` / `evidence:pack` |
| 6 | Clinical safety hazard log | `06-hazard-log.md` + `../HAZARD_LOG_TEMPLATE.md` | Template linked to test IDs; CSO sign-off still required |
| 7 | HITL bypass report | `07-hitl-bypass-report.md` | `npm run test:e2e:clinical-proof` |
| 8 | Security / pen-test | `08-security-pen-test.md` | External engagement — GAP until run |
| 9 | Performance / load | `09-performance-load.md` | Smoke: `npm run smoke:perf`; formal load still GAP |
| 10 | Role-based access | `10-rbac-report.md` + `generated/rbac-matrix-snapshot.json` | Playwright RBAC + `npm run smoke:all` |
| 11 | Audit-trail integrity | `11-audit-integrity.md` + `generated/shield-export-sample.json` | `/api/system/audit-integrity` + SHIELD tests |
| 12 | Disaster recovery | `12-disaster-recovery.md` | Ops runbook — GAP |
| 13 | UAT clinician sign-off | `13-uat-signoff.md` | Manual |
| 14 | Pilot monitoring plan | `14-pilot-monitoring.md` | Manual |
| 15 | Known limitations / residual risk | `15-residual-risk.md` + `generated/clinical-proof-gap-summary.json` | Keep synced with E2E_CLINICAL_PROOF gap register |
| 16 | Release / rollback plan | `16-release-rollback.md` | Vercel promote / rollback procedure |

## Sprint C / D additions

- Continuous learning: `docs/CONTINUOUS_LEARNING.md` · `/api/learning/events` · admin UI `/dashboard/admin/learning`
- Perf SLOs: `lib/clinical-proof/perf-slos.ts` · `npm run smoke:perf`
- Neo4j live smoke: `npm run smoke:neo4j`
- Gate checklists: `gate-1-platform-readiness.md` · `gate-2-clinical-safety.md` · `gate-3-pilot-authority.md`

## Honesty rule

Any artefact that depends on live EMIS, Mirth, or CIS2 must say **BLOCKED: partner** or **GAP** until evidence exists. Neo4j is live only when `/api/health` reports `neo4j.mode: "live"` — never fake-pass.
