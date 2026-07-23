# Marketing 12-fixes audit

**Date:** 2026-07-23  
**Scope:** Homepage redesign + related marketing/demo surfaces in `packages/platform-uk`  
**Deploy:** push to `main` (Vercel `0ne-health`)

## Course correction (critical)

**Do not claim “tested with 100 patients / 100 users” (or any cohort volume) on the marketing homepage.**

| Surface | Policy |
|---|---|
| Homepage / public marketing | Outcome claim only: **every output is a draft until a named clinician decides**. Persuasion via Patel walkthrough / demonstration CTAs — not test volume. |
| Dashboards / demo | 100-patient / 100-user synthetic cohort remains for queue load, ICS equity, SHIELD variety, admin KPIs, patient lists. Honesty banners (`liveEmis:false`) stay. |

Slot that previously was a third Capture → draft → approve journey is now the **clinician gate** band (`owkin-clinician-gate`), not a proof-of-scale section.

## The 12 fixes (as shipped)

| # | Fix | Status |
|---|---|---|
| 1 | Section padding 64px desktop / 48px mobile (`--mk-section`) | Done |
| 2 | Remove standalone vision viewport; merge into problem statement (2-col) | Done |
| 3 | FHIR / SHIELD vertical stack with flow arrows | Done |
| 4 | Pillars = Capture / Review / Govern / Integrate (not Horizon) | Done |
| 5 | Role chips removed; concrete outcome sentences | Done |
| 6 | Third journey → **clinician gate** (not 100-patient marketing) | Done — corrected |
| 7 | Queue mock statuses standardised to Draft | Done |
| 8 | Agent labels CANVAS / SYNTHESIS / HORIZON / SHIELD in product mock | Done |
| 9 | Nav: Solutions → **For you** | Done |
| 10 | Remove Ask from nav (chat widget remains) | Done |
| 11 | Stronger role outcome copy (same as #5) | Done |
| 12 | Newsletter moved into footer area | Done |

## Additional homepage copy / layout

- Nav right: Sign in · Get started (filled)
- Hero: UK primary care eyebrow; H1 weight 500; single primary CTA; agent-named diagram (no generic Aksh Health hub)
- Product band: Mr J. Patel headline; HORIZON score 82; Get started + walkthrough link
- One platform: numbered 8-role list (no tabs/cards)
- Final CTA: Clinical work that stays under control · Get started + Book a demonstration
- Footer: Practice admins (not Administrators)

## Intentionally kept (non-marketing)

- Admin KPIs show Demo users / Demo patients = 100 (ops surface)
- Synthetic honesty banners on ops/admin dashboards
- Auth / HITL Accept · Edit · Reject unchanged

## URLs to check

- `/` — hero, problem, drafts, FHIR flow, product mock, pillars, one platform, clinician gate, roles, CTA, footer newsletter
- `/demo/patel` — clinical specificity walkthrough
- `/dashboard/admin` — 100 users / 100 patients KPIs + honesty banner
- `/how-it-works`, `/platform`, `/for-*`

## E2E

- `e2e/marketing.spec.ts` updated for nav, copy, clinician gate, and **asserts absence** of 100-patient marketing claims on `/`
