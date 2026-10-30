# Milestone A5 — Technical Readiness Report

**Date:** 2026-10-30  
**Branch:** `feat/milestone-a5-e2e-readiness`  
**Depends on:** A1–A4 review stack (#97–#100) — **do not merge** until policy allows  
**Scope:** Technical readiness for a **controlled HCP evaluation** — **not** clinical deployment / unsupervised care.

---

## Verdict

**Conditionally ready for controlled HCP evaluation (synthetic / simulation workspace only), pending merge of Milestone A review stack and explicit HCP protocol (Milestone B).**

Not ready for clinical deployment, live EMIS write-back, or production patient care.

---

## Verified capabilities (evidence-backed)

| Capability | Evidence | Confidence |
| --- | --- | --- |
| 14-agent register + CONDUCTOR orchestration (deterministic LLM-off) | A1 contracts + A5 golden orch | High |
| Guardian BLOCK never enqueues drafts | A5 negatives + multi-account + A1 | High |
| SHIELD fail-closed when Postgres configured | A5 negatives + `p1-shield-diabetes-decide` | High (unit); live Neon not in A5 gate |
| Care-episode continuity intake→booking→nurse→GP→pharmacist | A5 golden + A3 handoffs | High (file-store) |
| Care-plan APPROVED-only patient visibility | A5 golden | High |
| Duplicate decision rejection (care plan + agent intel) | A5 negatives | High |
| Role / authz denials (patient/researcher/ops) | A5 negatives + RBAC suite + A4 | High (API/unit) |
| Cross-tenant scope isolation + practice filter | A5 negatives + tenant-isolation | High (unit); DB RLS separate |
| PHI-safe Agent Ops run visibility | A5 golden + A3/A4 | High |
| Durable run claim/finalize + SHIELD enqueue gate | A2/A4 lineage exercised in A5 ops step | High (file-store) |

---

## Partial / simulated (honest)

| Area | Status | Note |
| --- | --- | --- |
| Lab approve / result path | **sim** | `lib/e2e/lab-sim` + draft status tracking; not live pathology |
| Pharmacist adherence concern | **sim** | `lib/e2e/pharmacy-sim` + care-episode pharmacist task |
| Browser multi-role golden UI | **partial** | Role-landing + authz smoke (`milestone-a5-multi-account-browser`); full UI booking chain not run |
| Live Postgres in A5 CI script | **not used** | Suite clears `DATABASE_URL` for hermetic file-store |

---

## Residual blockers for Milestone B (HCP eval)

1. **Merge policy** — A1–A5 remain review-only; B should not claim platform readiness until stack lands or is explicitly accepted.
2. **Browser multi-account E2E** — role smoke exists; full persona booking→decide click-path still open.
3. **DB-backed RLS proofs in the A5 gate** — tenant/RLS DB tests exist but are not part of `test:milestone-a5`; include a Neon branch gate before formal HCP sessions if evaluators use shared DB.
4. **Lab / pharmacy product HITL** — still simulation-layer for end-to-end continuity; evaluators must see honesty labels.
5. **HCP protocol** — evaluation plan (`docs/agents/HCP_AGENT_EVALUATION_PLAN.md`) is separate; A5 does not run clinical scoring with HCPs.
6. **No PRISM/ATLAS expansion** — scaffolds only; do not present as CONDUCTOR actors in eval.
7. **Live integrations off** — `ehrWrite:false`, `liveEmis:false`; BRIDGE not production-enabled.

---

## Recommendation

| Audience | Recommendation |
| --- | --- |
| Engineering | Accept A5 as **technical QA gate** for synthetic HCP sandbox prep |
| Clinical / safety | Proceed to Milestone B only with written protocol, synthetic cohort, and no clinical-decision claims |
| Deploy / ops | **No production deploy** from this PR |

Gate command for re-verification:

```bash
cd packages/platform-uk && npm run test:milestone-a5
```

See also: [E2E_ACCEPTANCE_RESULTS.md](./E2E_ACCEPTANCE_RESULTS.md), [PHASE_A5_REPORT.md](./PHASE_A5_REPORT.md).
