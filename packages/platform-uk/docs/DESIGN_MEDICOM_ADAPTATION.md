# Medicom Design Adaptation — Aksh Health

Reference: [Medicom Healthcare Platform UI/UX](https://dribbble.com/shots/27266910-Medicom-Healthcare-Platform-UI-UX-Design) by SOLAR Digital.

This document records what was adapted from the Medicom reference versus what remains on Aksh brand tokens.

## Medicom patterns adopted

| Pattern | Implementation |
|--------|----------------|
| Clinical card elevation | `shadow-card`, `shadow-card-hover`, `rounded-xl` / `rounded-2xl` on dashboard and onboarding surfaces |
| Softer surface backgrounds | `surface` `#F4F6F9`, `surface-muted` `#EEF1F6`, radial gradients on dashboard and onboarding shells |
| 240px sidebar | `w-sidebar` (240px), refined nav items, icon sizing 18px, user profile chip |
| Dashboard density & whitespace | Increased padding (`p-5`), section gaps (`space-y-5`), uppercase micro-labels |
| Patient list styling | `dashboard-patient-row` with rounded-xl hover states and avatar rings |
| Metric cards | Subtle gradient variants (`dashboard-metric-card--accent/warn/danger`), optional icon slot |
| Status badges | Pill-shaped badges with tinted borders (`badge` variants, `dashboard-status-badge`) |
| Marketing hero | Grid overlay via Tailwind, emerald/navy radial accents, larger CTA radius |
| Risk indicators | Tailwind tone classes (`risk-tone-*`) replacing inline colour styles |

## Aksh brand preserved

| Token | Value | Notes |
|-------|-------|-------|
| Primary navy | `#003D7A` | Sidebar brand, headings, metric values |
| Emerald | `#006B4F` | Secondary accents, hero headline |
| Accent | `#00A86B` | Active nav border, success/risk-low tones |
| Typography | Inter | Unchanged across marketing, onboarding, dashboards |
| HITL workflow | Accept / Edit / Reject | `ReviewQueueItem` and `HitlActions` behaviour unchanged |

## Files changed

- `tailwind.config.ts` — radius, shadows, surface colours, sidebar width
- `app/dashboard/dashboard.css` — dashboard utility classes
- `app/onboarding/onboarding.css` — onboarding shell and card surface
- `components/dashboard/Sidebar.tsx`, `TopBar.tsx`, `DashboardShell.tsx`
- `components/dashboard/MetricCard.tsx`, `PatientPanel.tsx`, `PatientCard.tsx`, `ReviewQueueItem.tsx`, `RiskScoreBadge.tsx`
- `components/marketing/HeroSection.tsx`, `Navbar.tsx`
- `components/onboarding/OnboardingCard.tsx`, `StepIndicator.tsx`
- `components/ui/card.tsx`, `badge.tsx`
- `app/dashboard/gp/page.tsx` — GP three-column polish

## Intentionally not copied

- Medicom teal palette (replaced with Aksh navy/emerald)
- 3D anatomical visualisation motifs
- Dark-mode glass aesthetic from legacy `globals.css` demo surfaces
- Outfit display font on clinical dashboards (Inter only)
