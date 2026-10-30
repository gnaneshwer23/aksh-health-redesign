# 20 — Unified UX enhancement specification (+ shipped delta)

**Date:** 30 October 2026  
**Audience:** GP / nurse / product / engineering  
**Related:** [07-role-based-ux-journeys.md](./07-role-based-ux-journeys.md), [16-integration-map.md](./16-integration-map.md)

## Problem

Connected diabetes surfaces are deep-linked from the GP patient chart but **lack shared chrome**, consistent step navigation, and a **flagship guided demo**. Worklists are orphaned from Sidebar. Continuous care linked to a missing timeline page (INT-06).

## Target experience

One **Connected Diabetes** patient chrome:

1. Persistent synthetic / HITL / `ehrWrite=false` disclosure  
2. Patient identity strip (name + id)  
3. Journey stepper: 360 → glucose → medication → journey HITL → continuous care → agent → timeline  
4. Clinical actions remain in each workspace (no feature deletion)  
5. Worklists stay role tools; chrome links “open patient” into the same shell  

### Role journeys

| Role | Target |
|------|--------|
| GP | Full stepper + worklists in Sidebar (synthetic group) |
| Nurse | Continuous-care queue → same patient chrome (filtered steps OK) |
| Patient | No connected clinical AI UI until clinician-gated companion exists |
| Org / ICS | Catalog demo only — no population drill-through to live PHI |

## Shipped in validation PR (meaningful UX, not docs-only)

| Item | Location |
|------|----------|
| `connected-journey-steps.ts` | Step config + hrefs |
| `ConnectedPatientChrome` | Shared header + stepper + disclosure |
| Wired into Phase 1–5 workspaces + journey | Import chrome; reduce redundant link strips |
| Timeline page | `/dashboard/gp/patients/[id]/timeline` with `PatientTimelinePanel` |
| Sidebar synthetic group | GP: journey P002 + worklists; Nurse: continuous-care |
| Flagship demo | `/demo/connected-diabetes` + catalog / workflow entry |
| GP chart | Uses chrome stepper links (keeps existing buttons) |

## Still open (spec backlog)

- Visual token unify (inline styles → P360 tokens) — UX-04  
- Shared `WorkspaceLoadingState` / `WorkspaceErrorState` with `aria-live` — UX-03  
- Nurse chrome role filter  
- De-dupe investor `GpHeroDemoPath` vs connected journey messaging  
- Patient companion for approved plans  

## A11y / responsive / loading / errors (requirements)

| Concern | Spec |
|---------|------|
| Loading | `role="status"` + short text; prefer skeleton later |
| Errors | Inline alert + toast; never silent empty after failure |
| Stepper | `aria-current="step"` on active step |
| Disclosure | Always visible above fold on connected routes |
| Mobile | Stepper wraps; primary actions remain reachable without horizontal trap |

## Redundant entry points (reduce, don’t delete)

| Keep | Soft-deprioritise |
|------|-------------------|
| Patient chrome stepper | Per-workspace incomplete link strips |
| Sidebar synthetic group | Hard-coded P002-only empty states (keep as fallback) |
| `/demo/connected-diabetes` | Ad-hoc deep links in README only |

## Acceptance checks

- [ ] From P002 chart, every phase reachable via chrome in ≤2 clicks  
- [ ] Timeline page loads for P002 when authenticated  
- [ ] Demo catalog shows connected diabetes with synthetic disclosure  
- [ ] No production capability flipped; LIVE_ORGANISATIONS remains 0  
