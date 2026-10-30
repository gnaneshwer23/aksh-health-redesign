# Milestone A — Agent Runtime & Platform Reliability

Phased hardening of the existing 14-agent platform (`packages/platform-uk`). Prefer extend existing CONDUCTOR / SHIELD / care-episode / Neon structures — no parallel orchestration engines.

| Doc | Purpose |
| --- | --- |
| [BASELINE_AUDIT.md](./BASELINE_AUDIT.md) | Verified baseline at `9abf04c` (#86–#96) |
| [AGENT_RUNTIME_VERIFICATION.md](./AGENT_RUNTIME_VERIFICATION.md) | 14-agent runtime evidence |
| [PHASE_A1_REPORT.md](./PHASE_A1_REPORT.md) | A1 implementation / tests / next |
| [ORCHESTRATION_RELIABILITY.md](./ORCHESTRATION_RELIABILITY.md) | A2 durable runs + SHIELD enqueue gate |
| [PHASE_A2_REPORT.md](./PHASE_A2_REPORT.md) | A2 implementation / tests / next |
| [STAKEHOLDER_INTEGRATION.md](./STAKEHOLDER_INTEGRATION.md) | A3 handoffs, ops visibility, assignment |
| [PHASE_A3_REPORT.md](./PHASE_A3_REPORT.md) | A3 implementation / tests / next |
| [SECURITY_AND_PRIVACY.md](./SECURITY_AND_PRIVACY.md) | A4 findings, fixes, residual risks |
| [OBSERVABILITY_AND_OPERATIONS.md](./OBSERVABILITY_AND_OPERATIONS.md) | A4 Agent Ops alerts + operator notes |
| [PHASE_A4_REPORT.md](./PHASE_A4_REPORT.md) | A4 implementation / tests / next |
| [E2E_ACCEPTANCE_RESULTS.md](./E2E_ACCEPTANCE_RESULTS.md) | A5 actual commands + results (honest modes) |
| [TECHNICAL_READINESS_REPORT.md](./TECHNICAL_READINESS_REPORT.md) | A5 readiness for controlled HCP eval |
| [PHASE_A5_REPORT.md](./PHASE_A5_REPORT.md) | A5 implementation / tests / next |

Phases: **A1** runtime metadata → **A2** durable runs → **A3** stakeholder → **A4** security/ops → **A5** E2E golden. Formal HCP evaluation = Milestone B.
