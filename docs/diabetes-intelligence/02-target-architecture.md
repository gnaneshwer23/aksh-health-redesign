# 02 — Target architecture + package ownership

## Principle

**Extend `packages/platform-uk`. Do not rebuild.** Diabetes intelligence is a **module**, not a second platform.

```text
Role UX (GP / nurse / patient)
  → Diabetes journey APIs (synthetic + later network-backed)
    → Disease module signals (rules first)
    → Patient State facts / network_observations / CGM
    → Care plan draft → HITL Accept|Edit|Reject → approved record
    → Follow-up task (owner, status, timestamps)
    → Longitudinal timeline projection
  → SHIELD / network audit (append-only)
  → Capability register (honest status)
```

## Package ownership

| Concern | Owner package | Notes |
|---------|---------------|-------|
| Live UK product, DB, APIs, workspace UI | `platform-uk` | Sole deploy root for www.akshhealth.com |
| Shared types / fixtures | `foundation` | Prefer import over copy when types stabilize |
| Legacy marketing | `aksh-health` | Freeze; no new diabetes features |
| India surfaces | `platform-india-app`, `marketing-india` | Out of UK diabetes scope unless ADR says otherwise |
| Akeno | `akeno` | Separate product; no silent merge |

## Layer ownership inside platform-uk

| Layer | Path | Responsibility |
|-------|------|----------------|
| Disease domain framework (Phase 6) | `lib/disease-domains/` | Plugin registry + contracts; diabetes active_synthetic; CVD/CKD/obesity planned scaffolds; other = research placeholder |
| Disease signals | `lib/disease-modules/diabetes/` | Typed signals; feed HORIZON/GUARDIAN; no prescribe |
| Heart typed stub (E5) | `lib/disease-modules/heart/` | CVD illustrative types only — zero wiring |
| Connected journey (Phase 0 slice) | `lib/diabetes-intelligence/` | Care plan lifecycle, follow-up, journey timeline, missing-data |
| Patient 360 foundation (Phase 1) | `lib/patient-intelligence/` | Structured history, diabetes class, allergies, med recon scaffolding, encounters, observations, care team, sharing prefs, quality |
| Patient State | `lib/patient-state/` | Append-only facts |
| Care network | `lib/network/`, `lib/cgm/`, `lib/readings/`, `lib/labs/` | Org-scoped production data paths |
| HITL | `lib/workflow/`, `review_cases` | Existing Accept/Edit/Reject for draft items |
| Agents | `lib/agents/` | Contracts; `PROHIBITED_FOR_ALL` |
| Status | `lib/status/capabilities.ts` | Only honest statuses with evidence |

## Clinical workspace tokens

- Marketing brand (lime/beige) stays on public pages.
- New clinical workspace surfaces may use a restrained white / blue / teal token layer (`--clinical-*`) without rewriting the marketing system in one PR.

## Non-goals (near term)

- Merging packages
- Claiming unified health record / physiological twin
- Live EMIS write
- Autonomous treatment changes
