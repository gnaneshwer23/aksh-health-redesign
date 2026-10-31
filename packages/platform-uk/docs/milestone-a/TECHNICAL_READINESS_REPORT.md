# Milestone A5 — Technical Readiness Report

**Date:** 2026-10-31 (post-P0 `#102` + RLS / care-plan visibility)  
**Main tip:** `68fb041` (P0) + follow-up enforced care-plan RLS (054) / patient APPROVED-only  
**Scope:** Technical readiness for a **controlled HCP evaluation** — **not** clinical deployment / unsupervised care.

---

## Verdict

**Conditionally ready for controlled HCP evaluation (synthetic / simulation workspace only), pending explicit HCP protocol (Milestone B).**

Not ready for clinical deployment, live EMIS write-back, or production patient care.

---

## Verified capabilities (evidence-backed)

| Capability | Evidence | Confidence |
| --- | --- | --- |
| 14-agent register + CONDUCTOR orchestration (deterministic LLM-off) | A1 contracts + A5 golden orch | High |
| Guardian BLOCK never enqueues drafts | A5 negatives + multi-account + A1 | High |
| SHIELD fail-closed when Postgres configured | A5 negatives + `p1-shield-diabetes-decide` | High (unit); optional Neon A5 gate when configured |
| Care-episode continuity intake→booking→nurse→GP→pharmacist | A5 golden + A3 handoffs | High (file-store); Neon optional via `test:milestone-a5:neon` |
| Care-plan APPROVED-only patient visibility | A5 golden + multi-account + `/care-plans` patient filter | High |
| Duplicate decision rejection (care plan + agent intel) | A5 negatives | High |
| Role / authz denials (patient/researcher/ops) | A5 negatives + RBAC suite + A4 | High (API/unit) |
| Cross-tenant scope isolation + practice filter | A5 negatives + tenant-isolation + multi-account org list | High |
| Shared-DB care-plan RLS (cross-org deny, fail-closed) | Migration 054 + `care-plan-rls-db` / org-tenancy (Neon-gated) | High when Neon gate runs; hermetic app-layer covered |
| PHI-safe Agent Ops run visibility | A5 golden + A3/A4 | High |
| Durable run claim/finalize + SHIELD enqueue gate | A2/A4 lineage exercised in A5 ops step | High (file-store) |

---

## Partial / simulated (honest)

| Area | Status | Note |
| --- | --- | --- |
| Lab approve / result path | **sim** | `lib/e2e/lab-sim` + draft tracking; visible HITL honesty on admin E2E (`lab-pharmacy-sim-honesty`) |
| Pharmacist adherence concern | **sim** | `lib/e2e/pharmacy-sim` + pharmacist workspace honesty banner |
| Browser multi-role golden UI | **covered (synthetic)** | Role smoke + booking→nurse observe→GP CONDUCTOR/review Accept click-path |
| Live Postgres in A5 CI script | **optional** | Default hermetic clears `DATABASE_URL`; Neon gate keeps it when `MILESTONE_A5_USE_NEON=1` |

---

## Residual blockers for Milestone B (HCP eval)

1. **HCP protocol** — evaluation plan (`docs/agents/HCP_AGENT_EVALUATION_PLAN.md`) is separate; A5 does not run clinical scoring with HCPs. **Kickoff after this PR:** schedule controlled synthetic sessions with written protocol.
2. **DB RLS depth** — care-plan / review_cases RLS suites exist; **run `test:milestone-a5:neon` (or `test:care-plan-rls`) on throwaway Neon before shared-DB HCP sessions**. Hermetic multi-account now marks `cross_org_deny` covered at app-layer.
3. **Lab / pharmacy product HITL** — still simulation-layer; honesty labels are visible; do not present as live pathology/EPS.
4. **No PRISM/ATLAS expansion** — scaffolds only; do not present as CONDUCTOR actors in eval.
5. **Live integrations off** — `ehrWrite:false`, `liveEmis:false`; BRIDGE not production-enabled.
6. **`productionRbacEnforced`** — governed separate workstream; not flipped here.

---

## Recommendation

| Audience | Recommendation |
| --- | --- |
| Engineering | Accept A5 as **technical QA gate** for synthetic HCP sandbox prep |
| Clinical / safety | Proceed to Milestone B only with written protocol, synthetic cohort, and no clinical-decision claims |
| Deploy / ops | **No production deploy** from this PR |

Gate commands for re-verification:

```bash
cd packages/platform-uk
npm run test:milestone-a5                 # hermetic file-store (default)
# optional Neon (throwaway / non-prod DATABASE_URL only):
MILESTONE_A5_USE_NEON=1 USE_POSTGRES=true npm run test:milestone-a5:neon
npx playwright test e2e/milestone-a5-multi-account-browser.spec.ts
```

See also: [E2E_ACCEPTANCE_RESULTS.md](./E2E_ACCEPTANCE_RESULTS.md), [PHASE_A5_REPORT.md](./PHASE_A5_REPORT.md).
