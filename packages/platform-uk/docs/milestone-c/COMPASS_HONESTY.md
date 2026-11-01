# Milestone C5 — COMPASS / alias / directory honesty

**Audience:** Facilitators and evaluators running **Week 2 HCP edges** (COMPASS ICS brief, naming clarity).  
**Depends on:** Milestone C1–C4 facilitator / review / lab-pharmacy / PHI-ops surfaces; P2 VOICE CARE + COMPASS thin UX.  
**Companion:** [FACILITATOR_SESSION.md](./FACILITATOR_SESSION.md), [REVIEW_HONESTY.md](./REVIEW_HONESTY.md), [HCP_AGENT_EVALUATION_PLAN.md](../agents/HCP_AGENT_EVALUATION_PLAN.md).

This milestone is **honesty polish** for thin COMPASS ICS briefs, VOICE vs VOICE CARE (and ORACLE/HORIZON-style aliases), and directory ↔ register ↔ Agent Ops status alignment. Completing C5 does **not** expand COMPASS into a population-health product, certify ICS routing, or flip go-live gates.

---

## What C5 is

| Item | Detail |
| --- | --- |
| COMPASS honesty | ICS / population brief surfaces labelled **decision-support · sandbox**; capabilities + non-claims; `certifiedIcsRouting: false` |
| Thin UX | `CompassHonestyStrip` on Agent Ops `CompassBriefPanel` + ICS `EquityDeepDive` |
| Alias honesty | VOICE ≠ VOICE CARE; ORACLE→HORIZON, EQUITY→COMPASS, REFERRAL→PATHWAY consistent in Agent Ops + voice surfaces |
| Directory ↔ register | Path kinds **live-path / scaffold / sim** agree; no “production ready” oversell |
| API honesty | `GET/POST /api/agents/equity` (COMPASS alias) returns capabilities / non-claims |
| Docs + gate | This file + facilitator Week 2 notes; `test:milestone-c:compass-honesty` |

### Click-path (facilitator · Week 2 Day 3)

1. Open **Agent Ops** → read Evaluation honesty → **COMPASS population brief** honesty strip → optional Generate.
2. Open **ICS → Equity** → read COMPASS decision-support sandbox copy + honesty strip → optional Generate Equity Action Plan.
3. Confirm **Alias honesty** panel: VOICE (CANVAS dictation) ≠ VOICE CARE (synthetic outbound); rename map visible.
4. Confirm **Directory ↔ register** panel: PRISM/ATLAS = scaffold; COMPASS = sim; phase-1 peers = live-path **in_validation** (not production ready).
5. Nurse home: **VOICE CARE** strip shows `≠ VOICE dictation`. GP VOICE mic: `≠ VOICE CARE`.

---

## What C5 is not

- **Not** clinical validation or device certification.
- **Not** certified ICS routing / commissioning authority.
- **Not** COMPASS product expansion (new population modules, calendars, live feeds).
- **Not** calendar booking, Neon shared-sandbox automation, or CSO exit-note workflow.
- **Not** flipping `productionRbacEnforced`.
- **Not** live EPS / EHR / PACS connectors.
- **Not** expanding PRISM/ATLAS beyond honesty labels (scaffolds remain scaffolds).
- **Not** autonomous Rx or EHR write (`ehrWrite` remains false).

---

## Path-kind glossary (directory honesty)

| Kind | Meaning |
| --- | --- |
| **live-path** | Product surface exists in the app; register status `in_validation` — **not** production ready |
| **scaffold** | P4 L2 synthetic eval only (PRISM/ATLAS); `live:false`; not a CONDUCTOR actor |
| **sim** | Sandbox / adjacent simulation (COMPASS ICS brief; VOICE CARE outbound) — decision-support only |

---

## Gate commands

From `packages/platform-uk`:

```bash
npm run test:milestone-c
# includes: milestone-b + C1–C4 + C5 compass-honesty + typecheck (via c4/c5 scripts)

npm run test:milestone-c:compass-honesty
```

---

## Honesty copy (required)

- COMPASS ICS / population briefs are decision-support drafts in a synthetic sandbox — not certified ICS routing.
- Simulation / synthetic validation — not a clinical device certification.
- Aggregate / small-cell suppressed only · never patient-identifiable · HITL before operational staging.
- HITL required · ehrWrite: false · no autonomous population write-back.
- VOICE = CANVAS dictation; VOICE CARE = synthetic Day-3 outbound (no telephony) — not the same product.
- ORACLE → HORIZON, EQUITY → COMPASS, REFERRAL → PATHWAY are label renames; legacy ids are API/env aliases only.
- PRISM/ATLAS are scaffolds — never present as live CONDUCTOR actors.
- No agent is labelled production ready.

---

## Remaining post-C (human / ops + deferred eng)

| Track | Residual |
| --- | --- |
| Human / ops | Shared Neon sandbox calendar; CSO written exit note / `targetsConfirmedBy`; facilitator calendar booking |
| Deferred eng | Live connectors; RBAC production flip; COMPASS product expansion; file↔Neon durable-run unify; broader PHI scrub beyond C4 |
