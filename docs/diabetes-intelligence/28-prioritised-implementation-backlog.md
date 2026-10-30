# 28 — Prioritised implementation backlog (post-merge audit)

**Date:** 30 October 2026  
**Constraint:** Synthetic-only clinical intelligence · no LIVE_ORGANISATIONS · no unvalidated capability activation

## P0 — Keep green

| ID | Item | Why |
|----|------|-----|
| B-P0-1 | Keep INT-09 Handler harness typing green in CI | Prevents verify/build false failures |
| B-P0-2 | Record passing Actions SHA/URL after every merge | **Done** for #80 — `84fef5b` / [41008129457](https://github.com/gnaneshwer23/aksh-health-redesign/actions/runs/41008129457) |
| B-P0-3 | Keep glucose series writes as bulk INSERT | Prevents CI Atlantic hang on ~1.5k CGM seed |

## P1 — Integration hardening

| ID | Item | Why |
|----|------|-----|
| B-P1-1 | ~~INT-08 RLS proof role on local-dev Neon~~ | **Done** — helpers + RLS insert/select proof on local-dev (owner cleanup; no LIVE_ORGANISATIONS flip) |
| B-P1-2 | ~~Composite / scoped primary keys (INT-16 residual)~~ | **Done** — `scopedSyntheticId` on medcare + continuous-care seeds |
| B-P1-3 | Playwright connected-diabetes on every main push (already wired) | Catch UI/API regressions |

## P2 — Clinical Intelligence 2.0 deepen

| ID | Item | Why |
|----|------|-----|
| B-P2-1 | Feed Context Engine package into Phase 5 agent-intel drafts | **Done** — single signed context path into diabetes agent drafts |
| B-P2-2 | Run Guardian gateway before agent-intel worklist enqueue | **Done** — hard PASS/REVIEW/BLOCK at module boundary |
| B-P2-3 | Evaluation engine as required CI gate (synthetic) | **Done** — `CI 2.0 evaluation gate` Actions job + `test:ci20:evaluation-gate` |
| B-P2-4 | Resume Neo4j Aura + seed for live GraphRAG path | Still mock-safe fallback |
| B-P2-5 | Unify ClinicalIntelligenceWorkspace with connected chrome | Clinician one-pane vision |

## P3 — UX / a11y / provenance polish

| ID | Item | Why |
|----|------|-----|
| B-P3-1 | Finish UX-04: migrate remaining inline styles in medcare/continuous/agent workspaces to `--cd-*` tokens | Visual consistency |
| B-P3-2 | UX-03 shared WorkspaceLoadingState / error `aria-live` | A11y |
| B-P3-3 | Persist `provenanceSpine` on timeline events everywhere | INT-13 completion |
| B-P3-4 | INT-12 worklist empty-state de-hardcode P002 | Discovery honesty |

## P4 — Governance blockers (release)

| ID | Item | Status |
|----|------|--------|
| GOV-01 | CSO-signed clinical safety case | **Blocker** — open |
| GOV-02 | DPIA / regulatory opinion | **Blocker** — open |
| GOV-03 | Approved org go-live; LIVE_ORGANISATIONS>0 | **Blocker** — must stay 0 |

## Explicit non-goals (now)

- Production clinical data modification  
- Activating CVD/CKD/obesity domains  
- Live EMR / EPS write-back  
- Claiming clinical validation from synthetic evals  
