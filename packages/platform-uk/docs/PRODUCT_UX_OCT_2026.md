# Product experience — October 2026 redesign

**Date:** 30 October 2026 · **Base:** `main` ~`f8b6e5b` · **Package:** `packages/platform-uk`

July marketing audits (`DESIGN_REFRESH_V1_AUDIT.md`, `MARKETING_12_FIXES_AUDIT.md`) describe an older “Clinical Signal / spruce” look. The live public site uses the **clinic light** system (warm greige, white surfaces, teal ink, lime highlight, black actions). This note records the October product-experience pass on that system — not a rebuild from scratch.

## Visual direction

- Brand-first heroes: Aksh mark + wordmark in the first viewport (not only in nav).
- Headline focus retained: **Diabetes reviews, better coordinated.**
- Atmosphere via lime wash + faint measurement grid; no purple SaaS look.
- Problem band is a numbered sequence (not decorative cards).
- Flagship public demo: **Connected diabetes** (`/demo/connected-diabetes`), allowlisted on production alongside slot-fill and glucose.
- Honesty preserved: synthetic disclosure, in-validation vs production statuses, LIVE organisations: 0, no live clinical AI claims.

## Page roles

| Route | Job |
|---|---|
| `/` | Brand + value, two production workflows, review-prep (validation), pilot, clinician control, clinical AI teaser → connected diabetes demo |
| `/product` | Spec: what each production workflow includes |
| `/platform` | Step-by-step + full capability register + limits |
| `/demo` | Flagship connected diabetes first; then production workflow demos |
| `/agents` | Agent roster + release honesty |
| `/security`, `/resources`, `/pilot` | Unchanged roles; shared chrome |

## Onboarding

Flow (unchanged routing): role select → identity → organisation → preferences → consent → tutorial → complete → role dashboard.

Shell polish: brand mark matching public site, lime wash background, honesty banner retained. Pharmacist role accent retuned off purple.

## Dashboards

- Shared `RoleWorkspaceIntro` on nurse / pharmacist / admin homes.
- `ClinicalIntelligenceWorkspace` restyled to clinic-light panel language; deep-links to connected diabetes + Patient 360 for the selected patient.
- `ConnectedPatientChrome` uses shared CD tokens (restrained clinical white/blue/teal).

## Verify

- `npx tsx tests/real-workspace.test.ts` (pure routing)
- Playwright `e2e/marketing.spec.ts` (public site + allowlisted demos)
- Visual: `/`, `/demo`, `/demo/connected-diabetes`, `/product`, `/agents`, `/onboarding/role-select`, `/dashboard/gp`, `/dashboard/nurse`

## Deferred

- Full multi-role dashboard re-composition beyond intro + CI panel (hospital / ICS / researcher still sandbox-era).
- Bespoke product photography pack beyond the product canvas.
- Renaming leftover `owkin-*` CSS class names in `globals.css` (selectors kept for legacy tests).
- Patient-facing dashboard visual parity pass (shell already clinic-light).
