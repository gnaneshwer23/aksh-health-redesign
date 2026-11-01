# Agent functionality audit pack (2026-10-30)

Review-only documentation from branch `docs/agent-functionality-audit`. **Do not treat as an implementation PR.**

> **Status note (post #88–#91):** Findings written against pre-#88 `main` are **historical**. For current engineering status prefer code + merged PRs: unified review worklist (#88), SHIELD diabetes dual-write then fail-closed integrity, care-episode intake/booking handoff (#90), and CI 2.0 / P4 scaffolds (#85/#91). Do not expand PRISM/ATLAS or Agent Ops metric inventory from these docs alone.

| Document | Purpose |
| --- | --- |
| [AGENT_FUNCTIONALITY_AUDIT.md](./AGENT_FUNCTIONALITY_AUDIT.md) | Inventory, A–F audit, maturity L0–L5, tests run |
| [AGENT_INTEGRATION_GAP_MATRIX.md](./AGENT_INTEGRATION_GAP_MATRIX.md) | Gaps with prefer-extend reasoning |
| [AGENT_ORCHESTRATION_ARCHITECTURE.md](./AGENT_ORCHESTRATION_ARCHITECTURE.md) | Canonical CONDUCTOR architecture |
| [MULTI_STAKEHOLDER_WORKFLOW_AUDIT.md](./MULTI_STAKEHOLDER_WORKFLOW_AUDIT.md) | Journey transitions working/partial/disconnected |
| [AGENT_IMPLEMENTATION_ROADMAP.md](./AGENT_IMPLEMENTATION_ROADMAP.md) | P0–P4 work items (not implemented here) |
| [HCP_AGENT_EVALUATION_PLAN.md](./HCP_AGENT_EVALUATION_PLAN.md) | HCP rubrics + Agent Ops (ops surface live; Milestone B harness) |
| [../milestone-b/EVAL_ENVIRONMENT.md](../milestone-b/EVAL_ENVIRONMENT.md) | Milestone B synthetic HCP eval environment |
| [../milestone-b/SESSION_PROTOCOL.md](../milestone-b/SESSION_PROTOCOL.md) | Facilitator ops protocol (calendar still human) |
| [../milestone-c/FACILITATOR_SESSION.md](../milestone-c/FACILITATOR_SESSION.md) | Milestone C1 in-app facilitator session UI |
| [../milestone-c/REVIEW_HONESTY.md](../milestone-c/REVIEW_HONESTY.md) | Milestone C2 review honesty strip (executionMode / LLM week) |
| [../milestone-c/LAB_PHARMACY_HITL.md](../milestone-c/LAB_PHARMACY_HITL.md) | Milestone C3 lab/pharmacy product HITL (multi-role, sim-labelled) |
| [../milestone-c/PHI_OPS_ALERT.md](../milestone-c/PHI_OPS_ALERT.md) | Milestone C4 residual PHI scrub + optional ops alert channel |
| [../milestone-c/COMPASS_HONESTY.md](../milestone-c/COMPASS_HONESTY.md) | Milestone C5 COMPASS / alias / directory honesty (Week 2 edges) |

Read-only diag: `npx tsx scripts/agent-functionality-audit-diag.ts` from `packages/platform-uk`.
