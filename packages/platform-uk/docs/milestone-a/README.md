# Milestone A — Agent Runtime & Platform Reliability

Phased hardening of the existing 14-agent platform (`packages/platform-uk`). Prefer extend existing CONDUCTOR / SHIELD / care-episode / Neon structures — no parallel orchestration engines.

| Doc | Purpose |
| --- | --- |
| [BASELINE_AUDIT.md](./BASELINE_AUDIT.md) | Verified baseline at `9abf04c` (#86–#96) |
| [AGENT_RUNTIME_VERIFICATION.md](./AGENT_RUNTIME_VERIFICATION.md) | 14-agent runtime evidence |
| [PHASE_A1_REPORT.md](./PHASE_A1_REPORT.md) | A1 implementation / tests / next |
| [ORCHESTRATION_RELIABILITY.md](./ORCHESTRATION_RELIABILITY.md) | A2 durable runs + SHIELD enqueue gate |
| [PHASE_A2_REPORT.md](./PHASE_A2_REPORT.md) | A2 implementation / tests / next |

Phases: **A1** runtime metadata → **A2** durable runs → **A3** stakeholder → **A4** security/ops → **A5** E2E golden. Formal HCP evaluation = Milestone B.
