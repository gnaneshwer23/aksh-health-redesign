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
6. Optionally exercise multi-role **lab / pharmacy HITL (C3)** — stage from GP, review on lab/pharmacy queues. See [LAB_PHARMACY_HITL.md](./LAB_PHARMACY_HITL.md).
7. Review related golden harness fixture text when shown.
8. Choose agent label + Accept/Edit/Reject; score rubrics (justify any ≤3); save.
9. View PHI-safe aggregates on **Agent Ops** (`GET /api/eval/hcp-feedback`).
10. **Week 2 edges (C5)** — COMPASS ICS brief honesty, VOICE ≠ VOICE CARE, directory ↔ register path kinds. See [COMPASS_HONESTY.md](./COMPASS_HONESTY.md).

### Week 2 facilitator edges (C5)

| Day focus | Surface | What to verify |
| --- | --- | --- |
| COMPASS aggregate brief (ICS) | Agent Ops COMPASS panel · ICS Equity | Decision-support / sandbox strip; not certified ICS routing |
| Alias clarity | Alias honesty panel · nurse VOICE CARE · GP VOICE mic | VOICE ≠ VOICE CARE; ORACLE→HORIZON etc. |
| Directory vs register | Directory honesty panel · Agent Ops registry | live-path / scaffold / sim; no “production ready” |

---

## What C1 is not

- **Not** clinical validation or device certification.
- **Not** calendar booking, Neon shared-sandbox automation, CSO exit note workflow, or live integrations (remain post-C human/ops). C2 review honesty — see [REVIEW_HONESTY.md](./REVIEW_HONESTY.md). C3 lab/pharmacy product HITL — see [LAB_PHARMACY_HITL.md](./LAB_PHARMACY_HITL.md). C4 residual PHI scrub + optional ops alert channel — see [PHI_OPS_ALERT.md](./PHI_OPS_ALERT.md). C5 COMPASS / alias / directory honesty — see [COMPASS_HONESTY.md](./COMPASS_HONESTY.md) (honesty only — not COMPASS product expansion).
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
# includes: milestone-b gate + C1 UI + C2 honesty + C3 lab/pharmacy HITL + C4 phi-ops + C5 compass-honesty + typecheck
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
- COMPASS ICS briefs are decision-support sandbox — not certified ICS routing.
- VOICE (dictation) ≠ VOICE CARE (synthetic outbound); ORACLE→HORIZON, EQUITY→COMPASS, REFERRAL→PATHWAY are aliases only.
- Directory / register / Agent Ops agree on live-path · scaffold · sim — never “production ready”.
