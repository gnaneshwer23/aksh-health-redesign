# Milestone C3 — Lab / pharmacy product HITL

**Audience:** Facilitators running **synthetic** multi-role HCP evaluation (GP → lab → pharmacy).  
**Depends on:** P1-LAB ServiceRequest draft stubs, Milestone C1 facilitator session, Milestone C2 review honesty strip, admin E2E lab/pharmacy sims (honesty only).  
**Companion:** [FACILITATOR_SESSION.md](./FACILITATOR_SESSION.md), [REVIEW_HONESTY.md](./REVIEW_HONESTY.md), [HCP_AGENT_EVALUATION_PLAN.md](../agents/HCP_AGENT_EVALUATION_PLAN.md).

This surface deepens **discoverable product HITL** beyond admin-sim-only buttons. Completing C3 does **not** enable live pathology / EPS or certify the product for clinical use.

---

## What C3 is

| Item | Detail |
| --- | --- |
| GP stage | `/dashboard/gp/lab-pharmacy` — stage lab or pharmacy draft (synthetic patient + items + optional care_episode_id) |
| Lab review | `/dashboard/admin/lab-queue` — lab operator / admin Accept / Edit / Reject with audit trail |
| Pharmacy review | `/dashboard/pharmacist/pharmacy-queue` — pharmacist Accept / Edit / Reject |
| APIs | `GET/POST /api/lab-pharmacy-hitl` · `POST /api/lab-pharmacy-hitl/review` |
| Persistence | Practice-scoped file store + SHIELD dual-write when Postgres configured · tenant `practiceId` / `careEpisodeId` |
| P1-LAB reuse | Lab drafts attach ServiceRequest stubs (`status: draft`) via `buildLabServiceRequestStubs` — never active / live |
| Honesty | C2 `ReviewHonestyStrip` + C3 sim banner on every surface · `live: false` · `ehrWrite: false` |

### Click-path by role

1. **GP / clinician**
   - Open HCP eval session → **Lab / pharmacy HITL (C3)** (patient id prefilled when a case is selected), or nav **Lab / pharmacy HITL**.
   - Choose Lab or Pharmacy · confirm synthetic patient · enter investigations / medications · **Stage draft**.
   - Lab drafts show ServiceRequest stub count (draft only).
2. **Lab role** (admin / `lab_operator` persona on practice-manager)
   - Open **Lab HITL queue** (`/dashboard/admin/lab-queue`).
   - Read honesty strip · Accept / Edit / Reject with optional note · audit trail expands per draft.
3. **Pharmacist**
   - Open **Pharmacy HITL** (`/dashboard/pharmacist/pharmacy-queue`) — distinct from Med Review.
   - Accept / Edit / Reject GP-staged pharmacy drafts.
4. **Facilitator / Agent Ops**
   - Links from HCP session + Agent Ops eval harness · docs path below.

---

## What is simulation vs not

| Surface | Status |
| --- | --- |
| Product HITL queues (this milestone) | **Simulation** — `live: false` · no NHS pathology / EPS |
| P1-LAB ServiceRequest stubs | **Draft staging only** — never auto-sent |
| Admin E2E `/api/admin/e2e/sims` | **Simulation** — artifact/generator backed; still available |
| Pharmacist Med Review / GUARDIAN | Existing HITL · SHIELD · `liveEmis: false` |
| Live pathology / EPS / EHR write | **Not built** · must not be presented as live |
| HCP rubric scores | Workflow rehearsal · **not** clinical validation |

---

## What C3 is not

- **Not** clinical validation or device certification.
- **Not** Milestone C5 COMPASS expansion. C4 residual PHI scrub + ops alert channel — see [PHI_OPS_ALERT.md](./PHI_OPS_ALERT.md).
- **Not** flipping `productionRbacEnforced`.
- **Not** live EPS / EHR / PACS / regional pathology connectors.
- **Not** expanding PRISM/ATLAS product scope.
- **Not** autonomous Rx or EHR write (`ehrWrite` remains false).

---

## Gate commands

From `packages/platform-uk`:

```bash
npm run test:milestone-c
# includes: milestone-b + C1 UI + C2 honesty + C3 lab/pharmacy HITL + typecheck (via milestone-b / c scripts)
```

Standalone C3 harness:

```bash
npm run test:milestone-c:lab-pharmacy
```

---

## Honesty copy (required)

- Simulation / synthetic validation — not a clinical device certification.
- Lab and pharmacy queues are product HITL rehearsal — not live NHS pathology or EPS.
- HITL required · ehrWrite: false · no autonomous Rx / live EHR write.
- HCP multi-role sessions use synthetic patients only — acceptance ≠ clinical accuracy.
- Admin E2E sims remain available; this path is the discoverable clinician/lab/pharmacy loop.
