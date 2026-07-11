# Medicom Design Adaptation — Aksh Health

References:
- [Medicom Healthcare Platform UI/UX](https://dribbble.com/shots/27266910-Medicom-Healthcare-Platform-UI-UX-Design) by SOLAR Digital
- [Medical/Dental Website Landing](https://dribbble.com/shots/27148791-Medical-Dental-Website-Dental-Care-Landing-Design-UIUX) (dental care landing, adapted to Healthcare OS positioning)

This document records what was adapted from design references versus what remains on Aksh brand tokens.

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

## Dental-landing patterns adopted (Healthcare OS, not dental clinic)

| Pattern | Implementation |
|--------|----------------|
| Split hero layout | Copy left, mock GP review-queue dashboard card right (`HeroSection.tsx`) |
| Dual primary CTAs | Get Started + See it in action (no tertiary Book a demo on homepage hero/CTA) |
| Trust line below hero | Compliance pill row under CTAs; `TrustStrip` at hero base |
| Stats / trust metrics band | `StatsBand.tsx`: 8 roles, 12 agents, HITL, FHIR R4 (factual, no inflated patient counts) |
| Alternating section surfaces | `surface-muted` → `white` → `surface` rhythm across homepage sections |
| Icon-led capability cards | Lucide icons in circles on `ProblemSection`, `HowItWorks`, `AgentGrid` |
| Generous section padding | `py-20 md:py-24` on marketing sections |
| Soft decorative blobs | `.marketing-hero-blob` navy/emerald gradients in hero (not teal) |
| Card hover lift | `.marketing-capability-card` hover translate + shadow |
| Section eyebrow labels | `.marketing-section-label` uppercase emerald micro-headings |

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
- `components/marketing/HeroSection.tsx`, `StatsBand.tsx`, `TrustStrip.tsx`, `ProblemSection.tsx`, `HowItWorks.tsx`, `AgentGrid.tsx`, `VoiceAgentSection.tsx`, `Navbar.tsx`
- `app/page.tsx` — homepage section order and CTA polish
- `app/globals.css` — `.marketing-*` utilities (blobs, capability cards, section labels)
- `components/onboarding/OnboardingCard.tsx`, `StepIndicator.tsx`
- `components/ui/card.tsx`, `badge.tsx`
- `app/dashboard/gp/page.tsx` — GP three-column polish

## Intentionally not copied

- Medicom teal palette (replaced with Aksh navy/emerald)
- Dental clinic imagery, tooth icons, or practice-booking flows
- 3D anatomical visualisation motifs
- Dark-mode glass aesthetic from legacy `globals.css` demo surfaces
- Outfit display font on clinical dashboards (Inter only)
- Fake social-proof metrics (e.g. inflated patient or practice counts)
