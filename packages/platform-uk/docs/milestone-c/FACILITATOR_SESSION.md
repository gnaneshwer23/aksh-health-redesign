# Milestone C1 — Facilitator HCP session UI

**Audience:** Clinical safety / ops facilitators running **synthetic** evaluation sessions.  
**Depends on:** Milestone B APIs (`GET /api/eval/hcp-case-pack`, `POST /api/eval/hcp-feedback`) — merge `fa99070` / PR #104.  
**Companion:** [SESSION_PROTOCOL.md](../milestone-b/SESSION_PROTOCOL.md), [EVAL_ENVIRONMENT.md](../milestone-b/EVAL_ENVIRONMENT.md), [HCP_AGENT_EVALUATION_PLAN.md](../agents/HCP_AGENT_EVALUATION_PLAN.md).

This surface replaces curl/JSON-only friction for case-pack load + Accept/Edit/Reject + rubric capture. Completing C1 does **not** certify the product for clinical use.

---

## What C1 is

| Item | Detail |
| --- | --- |
| Case-pack picker | In-app list from `GET /api/eval/hcp-case-pack` with synthetic/eval honesty |
| Session brief | Pack notes, transcript hint, expected GUARDIAN outcome, related golden harness fixtures |
| Feedback form | Accept / Edit / Reject + rubrics 1–5 → `POST /api/eval/hcp-feedback` |
| Discoverability | GP nav · Admin nav · Agent Ops eval harness link |
| Honesty | Required banners; `clinicalValidationClaim: false`; `ehrWrite: false` |

### Click-path (facilitator)

1. Sign in as a clinical reviewer-mapped role (GP / nurse / clinical-pharmacist) for scoring, or Agent Ops role to browse the pack.
2. Open **HCP eval session**:
   - Clinician: `/dashboard/gp/hcp-eval-session`
   - Admin/ops: `/dashboard/admin/hcp-eval-session`
   - Or Agent Ops → Eval harness → “Admin / GP HCP eval session”
3. Read the honesty banner (synthetic / not certification / acceptance ≠ accuracy).
4. Pick a case from the pack grid (e.g. `hcp-core-synthesis-patel`).
5. Optionally open **GP review queue** for that synthetic patient to run CONDUCTOR / drafts — Milestone **C2** mounts the review honesty strip there (executionMode / LLM-week / sim adapters). See [REVIEW_HONESTY.md](./REVIEW_HONESTY.md).
6. Review related golden harness fixture text when shown.
7. Choose agent label + Accept/Edit/Reject; score rubrics (justify any ≤3); save.
8. View PHI-safe aggregates on **Agent Ops** (`GET /api/eval/hcp-feedback`).

---

## What C1 is not

- **Not** clinical validation or device certification.
- **Not** Milestone C3–C5 (lab/pharmacy product HITL, PHI scrub, COMPASS expansion, calendar booking, Neon shared-sandbox automation, CSO exit note workflow, live integrations). C2 review honesty is separate — see [REVIEW_HONESTY.md](./REVIEW_HONESTY.md).
- **Not** flipping `productionRbacEnforced`.
- **Not** live EPS / EHR / PACS connectors.
- **Not** expanding PRISM/ATLAS product scope.
- **Not** autonomous Rx or EHR write (`ehrWrite` remains false).

Human calendar, CSO briefing, and written exit decisions remain outside this software gate (see Milestone B residual blockers).

---

## Gate commands

From `packages/platform-uk`:

```bash
npm run test:milestone-c
# includes: milestone-b gate + C1 UI/wiring harness + typecheck
```

Standalone C1 harness:

```bash
npm run test:milestone-c:ui
```

---

## Honesty copy (required)

- Simulation / synthetic validation — not a clinical device certification.
- Acceptance rate is a workflow metric, not a clinical accuracy score.
- HCP rubric scores are facilitator feedback for product rehearsal — not clinical validation.
- Lab / pharmacy remain simulation-labelled unless live connectors are explicitly enabled.
- PRISM/ATLAS are scaffolds — never present as live CONDUCTOR actors.
