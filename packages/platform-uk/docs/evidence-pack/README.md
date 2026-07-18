# Production-readiness evidence pack (skeleton)

Sixteen artefacts required before pilot / deployment claims.  
Fill each placeholder with real outputs; do not invent PASS for blocked partners.

| # | Artefact | Path | How to generate |
| ---: | --- | --- | --- |
| 1 | Traceability matrix | `../QA_TRACEABILITY_MATRIX.md` · `../qa-traceability-matrix.json` | Maintain with each release; `npm run test:clinical-proof` |
| 2 | Architecture / data-flow | `02-architecture.md` | Copy from `../ARCHITECTURE.md` + annotate gaps |
| 3 | API / integration results | `03-api-integration-results.md` | `npm run verify` + paste summary |
| 4 | FHIR conformance | `04-fhir-conformance.md` | Shape gates today; HL7 validator when available |
| 5 | AI-agent evaluation | `05-ai-agent-evaluation.md` | `npm run eval:agents` |
| 6 | Clinical safety hazard log | `06-hazard-log.md` | Fill template; CSO sign-off |
| 7 | HITL bypass report | `07-hitl-bypass-report.md` | `npm run test:e2e:clinical-proof` |
| 8 | Security / pen-test | `08-security-pen-test.md` | External engagement — GAP until run |
| 9 | Performance / load | `09-performance-load.md` | Load tools — GAP until run |
| 10 | Role-based access | `10-rbac-report.md` | Playwright RBAC + `npm run smoke:all` |
| 11 | Audit-trail integrity | `11-audit-integrity.md` | `/api/system/audit-integrity` + SHIELD tests |
| 12 | Disaster recovery | `12-disaster-recovery.md` | Ops runbook — GAP |
| 13 | UAT clinician sign-off | `13-uat-signoff.md` | Manual |
| 14 | Pilot monitoring plan | `14-pilot-monitoring.md` | Manual |
| 15 | Known limitations / residual risk | `15-residual-risk.md` | Keep synced with E2E_CLINICAL_PROOF gap register |
| 16 | Release / rollback plan | `16-release-rollback.md` | Vercel promote / rollback procedure |

## Honesty rule

Any artefact that depends on live EMIS, Mirth, CIS2, or Aura must say **BLOCKED: partner** or **GAP** until evidence exists. Do not fake-pass.
