# Evidence artefact — clinical safety hazard log

**Status:** Template expanded for Gate 2 prep (Sprint C). **CSO unsigned** — not a signed DCB0129 log.

## How to generate / maintain

1. Master template: [`docs/HAZARD_LOG_TEMPLATE.md`](../HAZARD_LOG_TEMPLATE.md) — hazard ↔ control ↔ **test ID** matrix + residual risk register.
2. Automated trace check: `CP-HAZARD-001` via `tests/clinical-proof-hazard-trace.test.ts` (`npm run test:clinical-proof`).
3. Copy into organisation controlled hazard log; CSO sets review dates and signs residual risk.

## Linked clinical-proof / HITL / GUARDIAN IDs (sample)

| Hazard | Primary test IDs |
| --- | --- |
| H-001 Missed interaction | CP-HITL-001 · CP-PATEL-001 · CP-ORCH-001 |
| H-007 AI write without approval | CP-BYPASS-* · CP-SIM-001 · CP-HITL-004 |
| H-011 Silent model update | CP-LEARN-001 |
| H-013 Graph mock treated as live | CP-GRAPH-001 |
| H-014 Medplum ≠ EHR | CP-MEDPLUM-001 |

## Last filled

- Date: 2026-07-18
- Owner: Engineering (template) — CSO unassigned
- Result: Template PASS for linkage; **CSO approval: Unsigned**
