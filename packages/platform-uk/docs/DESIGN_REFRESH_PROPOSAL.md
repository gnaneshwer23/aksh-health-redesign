# V1 — Landing visual design refresh (proposal)

**Date:** 2026-07-23  
**Status:** Proposal only — not scheduled until explicitly approved  
**Context:** After U1–U8 + D1 shipped to production (`66ff938` on `akshhealth.com`), feedback was: **“design hasn’t changed.”** That assessment is fair for look-and-feel.

---

## Honest verdict

| Layer | Changed in U1–U8? | Notes |
|---|---|---|
| **Design system** (cream paper, Owkin nav/hero classes, serif display, pastel cards, navy/emerald accents) | **No** | Zero diffs to `globals.css` / Tailwind theme across U1→U8 |
| **Marketing layout shell** (`owkin-nav`, `owkin-hero`, `MarketingShell`, section rhythm) | **No** | Same composition and first-viewport structure |
| **Product / content surfaces** | **Yes** | Copy, agent story, anchors, role maps, dashboard hero demos |
| **Clinical spine / honesty** | **Yes (locked)** | D1 Accept→export; `liveEmis:false`; N4 roster honesty |

**Bottom line:** U1–U8 was a **product-surface and demo-story** track, not a visual redesign. Production is on the latest SHA; the cream Owkin-style marketing look is intentional continuity, not a failed deploy.

---

## Production check (2026-07-23)

- GitHub `main` HEAD: **`66ff938`** — *Polish U8 patient and researcher dashboards…*
- GitHub Production deployment: **`66ff938`** (~13:07 UTC)
- Vercel production alias **`akshhealth.com`** → latest Ready deployment (~14:05 BST); `cache-control: public, max-age=0, must-revalidate` (edge HIT is normal; HTML is revalidated)
- Live HTML includes U1 markers: `liveEmis:false`, HORIZON / ex-ORACLE, agent chips, Guided demo script, `/how-it-works#two-minute-script` (“Explain it in two minutes”)

Hard-refresh or open an incognito window if a browser still shows older marketing copy; CDN is not pinning stale HTML for days.

---

## Where to *see* U1–U8 (content, not chrome)

### Marketing (U1–U2)

| Look here | What changed |
|---|---|
| [`/`](https://akshhealth.com/) — scroll to **“The journey”** | Capture → draft → approve strip + **Agents in the loop** chips (CANVAS…SHIELD); links to platform / `/demo/script` |
| [`/how-it-works#two-minute-script`](https://akshhealth.com/how-it-works#two-minute-script) | **Explain it in two minutes** — four demo-host beats |
| [`/how-it-works`](https://akshhealth.com/how-it-works) — pipeline + agents-named | Agent-named Capture/Draft/Approve copy; HORIZON ex-ORACLE |
| [`/platform#agents`](https://akshhealth.com/platform#agents) | Stage-grouped AgentGrid + job-in-loop blurbs; Phase 2 badges |
| `/for-clinicians`, `/for-practices`, `/for-patients`, `/for-hospitals`, `/for-administrators`, `/for-ics`, `/for-research` | Role agent maps + “what you approve” (U2) |

### Product demos (U3–U8)

| Look here | What changed |
|---|---|
| `/onboarding/*` after signup | Role-shaped tutorial / first-run (U3) |
| `/dashboard/gp` | Hero path + Agent Control aligned with U1 names (U4) |
| `/dashboard/nurse`, `/dashboard/pharmacist` | 3-beat / med-safety hero demos (U5) |
| `/dashboard/admin` | Practice-manager ops hero (U6) |
| `/dashboard/ics`, `/dashboard/hospital` | COMPASS / synthetic PAS heroes (U7) |
| `/dashboard/patient`, `/dashboard/researcher` | Companion / ethics heroes (U8) |
| [`/demo/script`](https://akshhealth.com/demo/script) | Guided multi-role rehearsal (D1 + U-panels) |

Audits: [`NEXT_UX_STAKEHOLDER_BUILD.md`](./NEXT_UX_STAKEHOLDER_BUILD.md) and `NEXT_UX_U1`…`U8` audit docs.

---

## Proposed **V1** — landing visual refresh

**Goal:** First viewport and marketing band should feel unmistakably *Aksh* (not generic cream healthtech / Owkin clone), while keeping honesty copy and U1 agent story.

### In scope (landing + shared marketing chrome only)

1. **Brand atmosphere** — Replace flat cream-only field with a deliberate Aksh palette (tokens in CSS variables); keep clinical calm, avoid purple-glow SaaS defaults.
2. **Typography** — Keep one strong display + one UI face, but retune sizes/tracking so the brand wordmark reads as the hero-level signal (not a nav afterthought).
3. **Hero composition** — One composition: brand + one headline + one supporting line + one CTA group + one dominant product visual (full-bleed or edge-to-edge plane — not a floating inset card unless the system requires it).
4. **Nav / mega** — Reduce `owkin-*` visual inheritance (rename classes optional; restyle required). Optional tiny win: a subtle “Demo · synthetic / liveEmis:false” honesty chip in nav — only if it doesn’t clutter.
5. **Section rhythm** — Fewer pastel card grids; prefer editorial bands with real product imagery (Patel queue, Accept path, agent strip) as the visual anchor.
6. **Motion** — 2–3 intentional motions (hero entrance, journey strip, CTA focus) — no noise.
7. **Pass pages** — `/`, `/how-it-works`, `/platform`, shared `MarketingShell` / `MarketingPageHero` / CTA band. Audience `for-*` inherit shell tokens in the same PR or a thin follow-up.

### Out of scope for V1

- Full dashboard redesign (U4–U8 heroes stay as-is unless a later V2)
- Clinical spine, NextAuth, BRIDGE, SHIELD, partner/`liveEmis` flips
- Rewriting U1–U8 copy for its own sake (rebase onto new tokens; don’t dilute honesty)
- Multi-brand theming, dark mode default, illustration pack mega-build

### Exit criteria

- [ ] Side-by-side: pre-V1 vs V1 first viewport — brand test passes (remove nav → still recognisably Aksh)
- [ ] U1 script still works: home → `#two-minute-script` → `/platform#agents` → `/demo/script`
- [ ] Marketing e2e green; honesty assertions unchanged
- [ ] Mobile + desktop first viewport load cleanly

### Effort sketch

| Slice | Approx |
|---|---|
| Token + typography + nav restyle | 0.5–1 day |
| Home hero + journey band | 1 day |
| How-it-works + platform hero/sections | 0.5–1 day |
| E2E + visual QA | 0.5 day |
| **Total** | **~2.5–3.5 days** |

---

## Decision ask

Reply with one of:

1. **Approve V1** — implement landing visual refresh as scoped above  
2. **Tiny win only** — e.g. nav honesty badge / stronger wordmark (same day)  
3. **Defer** — keep Owkin-style chrome; continue demo ops on U1–U8 content  

Do not start a full redesign without an explicit approve.
