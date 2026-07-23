# Beefit → Aksh Clinical Signal — design adaptation audit

**Date:** 2026-07-23  
**Reference:** [Beefit Healthcare Dashboard (Dribbble)](https://dribbble.com/shots/25165435-Beefit-Healthcare-Dashboard) + attached Beefit component screenshots  
**Scope:** `packages/platform-uk` marketing hero pipeline + dashboard shell / role homes

## Adapted from Beefit (polish only)

| Pattern | Aksh mapping |
|--------|----------------|
| Pale cool mist workspace | Dashboard surface `#EEF4F8` + soft spruce/signal radial wash |
| Soft modular cards, generous radius | `rounded-frame` (28px), whisper multi-layer shadows on `.dashboard-card` |
| Large primary metrics | `MetricCard` value → `text-4xl` / tabular nums; quiet uppercase labels |
| Clean sidebar chrome | Wider sidebar (248px), circular active icon wash using **signal mint** (not Beefit lime) |
| Pill search / calm topbar | Full-radius search field, taller topbar, softer borders |
| Calm spacing density | Larger section gaps (`gap-5` / `space-y-6`), roomier GP / admin / nurse / ICS / pharmacist homes |

## Intentionally NOT copied

- Fitness content (workouts, hydration, kcal, weight, sleep tips, “Well Done” consumer CTAs)
- Neon lime as a primary brand colour — remapped sparingly to Clinical Signal mint (`#14E0A4`) for active nav / metric accents only
- Lifestyle hero photography and black pill “Start Free Trial” consumer CTAs on clinical dashboards
- Emoji status chips and social-proof avatar stacks
- Any marketing “draft / phase / PARALLEL DRAFTS” packaging language in the homepage hero pipeline

## Marketing honesty copy (hero pipeline)

| Before | After |
|--------|--------|
| Parallel drafts | **Parallel checks** |
| FHIR staging · R4 · draft resources | **Record staging · FHIR R4** |
| Drafts only · no live EMR write | **Clinician-approved only · not a live record write** |
| Truncated 2×2 agent labels | Full readable **SYNTHESIS / GUARDIAN / HORIZON / PATHWAY** (no ellipsis) |

Ops synthetic-honesty banners (GP / nurse / admin / ICS / pharmacist) remain — they are operational, not marketing jargon.

## Files touched

- `components/marketing/InteroperabilityDiagram.tsx`, `app/globals.css` (pipeline)
- `app/dashboard/dashboard.css`, `tailwind.config.ts`
- `components/dashboard/{MetricCard,Sidebar,TopBar}.tsx`
- Role homes: `app/dashboard/{gp,admin,nurse,pharmacist,ics}/page.tsx`, `IcsKpiRow.tsx`
- Tests: `e2e/marketing.spec.ts`, `tests/route-smoke.test.ts`, `tests/clinical-spine-phase-c.test.ts`
- This audit note
