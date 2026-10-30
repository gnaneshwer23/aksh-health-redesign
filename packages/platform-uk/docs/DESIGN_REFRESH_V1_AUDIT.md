# Design Refresh V1 — "Clinical Signal" (audit)

> **Superseded for live product UX:** October 2026 clinic-light redesign — see [`PRODUCT_UX_OCT_2026.md`](./PRODUCT_UX_OCT_2026.md). This July document is historical.

**Date:** 2026-07-23
**Status:** Shipped to `main` (marketing + shared shells) — later replaced visually by clinic light
**Context:** Response to "design hasn't changed" feedback after U1–U8. U1–U8 was a product/demo-story track; the marketing look-and-feel was still the Owkin-style cream clone. This V1 is a real **visual redesign** of the design system, landing, shared marketing chrome, and the dashboard/onboarding shells — not a copy pass.

---

## Visual direction

**Clinical Signal** — an instrument-grade clinical aesthetic that reads as *trust + precision* and is deliberately NOT the previous cream/Owkin broadsheet, NHS-blue, or purple-on-white SaaS look.

- **Spruce ink** (`#0a2a25`) as the brand-dark / typographic voice.
- **Clinical mist** (`#eef3f1`) cool near-white paper (replaces warm cream `#f8f6f1`).
- **Clinical teal accent** (`#0b7d6b` / strong `#0a5f53`) for interaction, borders, eyebrows.
- **Electric signal mint** (`#14e0a4`) used sparingly for the "signal" pulse: hero aurora, product-card halo, brand pip, focus rings, accent stripe.
- **Atmosphere, never flat:** the hero layers a gradient mesh + an instrument **precision grid** + a drifting signal aurora + a signal halo behind the product visual. Inner page-heros carry a faint measurement grid; the dashboard/onboarding shells carry spruce/signal radial washes.
- **Expressive type:** display **Bricolage Grotesque**, body **Hanken Grotesk** (via `next/font`) — replacing Manrope/Instrument Sans. No Inter/Roboto/Arial/system.

### Design-rule compliance
- ✅ One composition first viewport; brand-first (large Bricolage headline + spruce brand chip + kicker).
- ✅ Full-bleed hero (`min(92vh, 50rem)`), one headline, one sentence, primary CTA + dominant product visual (interoperability diagram with signal halo). No overlay/stat clutter behind the headline.
- ✅ Not flat single-color — layered gradients + precision grid + aurora.
- ✅ Avoids clichés: no cream+terracotta serif, no purple-on-white, no dark-mode default, no glow-spam, no pill/emoji clutter.
- ✅ CSS variables define the system (`--mk-*`, `--owkin-*`, Tailwind tokens).
- ✅ 2–3 intentional motions on landing: hero rise-in (entrance), signal aurora drift, interop flow dashes (+ scroll reveal). All respect `prefers-reduced-motion`.
- ✅ Mobile + desktop verified.

### Product honesty (unchanged)
Synthetic/demo, HITL gate, `liveEmis:false`, HORIZON (ex-ORACLE), 12 agents, VOICE/Dr.Assist sub-caps, PRISM/ATLAS Phase 2 — all copy left intact. No live EMR / certification claims introduced.

---

## What shipped (files)

| Slice | File | Change |
|---|---|---|
| V1-A tokens | `tailwind.config.ts` | primary/secondary/accent → spruce; added `signal`; navy→spruce ink; background/surface→mist; borders/foreground/muted retuned |
| V1-A fonts | `app/layout.tsx` | Bricolage Grotesque (display) + Hanken Grotesk (body) via `next/font`, same CSS var names |
| V1-A/B/C system | `app/globals.css` | Redefined `--owkin-*` and `--mk-*` source-of-truth tokens; new homepage-hero atmosphere (grid + aurora + halo, pseudo-elements only); signal brand mark; CTA-band signal wash; accent stripe; nav-solid/mega on mist |
| V1-E dashboard | `app/dashboard/dashboard.css` | Surface radial wash → spruce/signal |
| V1-D onboarding | `app/onboarding/onboarding.css` | Premium shell: spruce/signal wash + faint precision grid + translucent card |
| Tests | `e2e/marketing.spec.ts` | Updated 3 pinned colour assertions (brand wordmark + CTA band bg/fg) from old ink `rgb(20,20,20)`/`rgb(16,33,29)` to new ink `rgb(10,42,37)` |

Because almost the entire marketing surface reads from `--mk-*`/`--owkin-*` and the dashboards read from the Tailwind tokens, the palette change **cascades** across landing, `for-*`, how-it-works, platform, resources, security, and all eight role dashboards + onboarding.

---

## Verify

- `npm run typecheck` → pass
- `npm run build` → pass (homepage prerendered static; fonts + CSS compile)
- Visual QA screenshots (desktop 1440 + mobile 390): `/`, `/how-it-works`, `/platform` — clearly changed look, honesty copy present, light-hero nav preserved.

## URLs to check
- `/` (landing — hero, journey, stats, roles, CTA band)
- `/how-it-works`, `/platform`, `/resources`, `/security`
- `/for-clinicians` … `/for-research`
- `/onboarding/*` (after signup), `/dashboard/{gp,nurse,pharmacist,admin,ics,hospital,patient,researcher}`

---

## Deferred (V2 candidates)

- **Full marketing e2e run** here was skipped (Playwright spins its own DB-backed dev server + globalSetup); the three colour-value assertions were updated to the new tokens and build/typecheck are green. Run `npm run test:e2e` in a DB-enabled env to confirm the full suite.
- **Dashboard role-home bespoke redesign:** shells + tokens are cohesive now, but the U4–U8 hero strips were only re-tokenised, not re-composed. A V2 could rebuild each role home surface in the Clinical Signal language.
- **Nav class rename:** `owkin-*` classes were restyled, not renamed (kept to protect e2e selectors). Optional cleanup later.
- **Bespoke product imagery / illustration pack** beyond the interop diagram.
- **Live dashboard/onboarding screenshots** (auth + DB required) were not captured in this pass; cohesion is token-driven and build-verified.
