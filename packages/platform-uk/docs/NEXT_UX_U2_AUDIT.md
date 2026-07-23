# U2 Audit — Audience `for-*` pages agent-mapped

**Date:** 2026-07-23  
**Branch:** `main`  
**Scope:** Role-relevant agent maps + HITL/approve framing on every audience landing page  
**Companion:** [`NEXT_UX_STAKEHOLDER_BUILD.md`](./NEXT_UX_STAKEHOLDER_BUILD.md) · [`NEXT_UX_U1_AUDIT.md`](./NEXT_UX_U1_AUDIT.md)

## Status

| Gate | Result |
|---|---|
| **U2 overall** | **PASS** |
| **Agent map per `for-*`** | **PASS** — which agents help **me** + what I approve |
| **Honesty** | **PASS** — PRISM/ATLAS Phase 2; VOICE/Dr.Assist sub-caps; `liveEmis:false`; synthetic PAS/ICS |
| **CTAs** | **PASS** — demo script / signup / role dashboard where appropriate |
| **Marketing e2e** | **PASS** — audience + honesty + admin CTA specs green |

## Exit criteria (from plan)

| Criterion | Result | Notes |
|---|---|---|
| Spot-check every `for-*` route | **PASS** | clinicians, practices, patients, hospitals, administrators, ics, research |
| e2e marketing audience links still pass | **PASS** | mega-menu, footer, headings, agent-map, honesty |
| Honesty notes intact | **PASS** — Phase 2 / sub-caps / liveEmis / synthetic PAS |

## What shipped

| Surface | Change |
|---|---|
| `lib/marketing/audience-agent-maps.ts` | Per-audience agent chips, “what you approve”, honesty notes |
| `components/marketing/audience/AudienceAgentMapSection.tsx` | `#agents-for-you` section with approve callout + chips |
| `components/marketing/audience/audience-content.ts` | Agent-named workflows; role CTAs; honesty in sublines/disclaimers |
| `components/marketing/audience/audience-page-layout.tsx` | Wires agent map + tertiary CTA + roster link |
| `e2e/marketing.spec.ts` | Audience agent-map + honesty + admin CTA assertions |

## Per-page agent story (spot-check)

| Route | Agents emphasised | You approve? |
|---|---|---|
| `/for-clinicians` | CANVAS, SYNTHESIS, GUARDIAN, HORIZON, PATHWAY, NEXUS, CONDUCTOR, BRIDGE, SHIELD + VOICE/Dr.Assist sub-caps | HITL Accept/Edit/Reject on clinical drafts |
| `/for-practices` | CONDUCTOR, BRIDGE, SHIELD (+ queue signals) | Ops oversight — **not** clinical Accept |
| `/for-patients` | CANVAS, SYNTHESIS, PATHWAY, GUARDIAN, SHIELD | Check-ins only; clinicians keep HITL |
| `/for-hospitals` | HORIZON, PATHWAY, COMPASS, CONDUCTOR, SHIELD, BRIDGE | Ops recommendations; synthetic PAS honesty |
| `/for-ics` | COMPASS, HORIZON, PATHWAY, CONDUCTOR, SHIELD, BRIDGE | Aggregate planning; no patient spill |
| `/for-administrators` | BRIDGE, SHIELD, CONDUCTOR, CANVAS | Tenancy / health / audit — no HITL bypass |
| `/for-research` | ATLAS (Phase 2), COMPASS, SHIELD, HORIZON, BRIDGE | Ethics gates; ATLAS not live |

## Honesty invariants held

- VOICE / Dr.Assist labelled **Sub-cap** on clinicians page — not peers  
- ATLAS **Phase 2** on research page — “not built / never claim live”  
- `liveEmis:false` on clinical, practice, admin, hospital, ICS, patient, research honesty copy  
- Hospital / ICS: synthetic PAS / synthetic cohorts  
- No “14 agents” / JSL live / PRISM-ATLAS live / live EMR write claims  

## Tests run

```text
npx playwright test e2e/marketing.spec.ts \
  --grep "audience|for-administrators"
```

**Result:** 8 passed

## Next

**U3** — Personalised onboarding (role-shaped path → dashboard with first-run guidance).

Do **not** start U4 until U3 exit criteria pass.
