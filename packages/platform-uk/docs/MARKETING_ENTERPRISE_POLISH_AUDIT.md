# Marketing enterprise polish audit

**Date:** 2026-07-23  
**Scope:** Public marketing surfaces in `packages/platform-uk`  
**Goal:** Linear / Stripe / Vercel / Figma tone — ~20–30% simpler, scan-friendly, no engineering jargon

## Applied

| Area | Change |
|---|---|
| Hero | Headline `Clinical work. / Properly coordinated.`; outcome subcopy; CTAs Create account · Book a walkthrough · Talk to us |
| Nav | Platform · Workflow · Solutions · Security · Resources · Talk to us |
| Vision | `Every clinical decision deserves context.` + shortened paragraph |
| Story beats | Shortened fragmented / coordinated / EMIS bodies; action CTAs |
| Product mock | Needs Review / In progress / Requires attention / Verified; simpler SOAP bubble |
| Stats | Outcome labels without indefensible numbers (4 sec / 14 days / 0 / 8) |
| Highlights | Renamed from What's New; tabs Platform · Security · Integrations · Clinical workflows |
| Journey | Supporting intelligence; agent chip parade removed |
| Roles | `One platform. Designed for every role.` + shortened blurbs; View workspace / Open dashboard |
| Footer / CTA | Designed for NHS organisations; `Build a more coordinated healthcare system.` |
| Agent grid | Human labels (Clinical Capture, Documentation, Safety Review, …); no Phase / peer / liveEmis |
| Audience / HIW / Platform / Integrations / Resources | Engineering jargon stripped from public copy |
| Typography | ~15% narrower container, ~20% more section whitespace, slightly higher line-height, sentence-case labels |

## Intentionally kept (non-marketing)

- Dashboard / admin / ops honesty: `liveEmis:false`, synthetic banners, partner readiness
- Auth / HITL Accept · Edit · Reject flows unchanged
- Internal agent codenames in product/runtime code paths

## URLs to check

- `/` — hero, vision, story, stats, highlights, journey, roles, CTA
- `/how-it-works` — workflow hero + pipeline
- `/platform` — capabilities + roles
- `/for-clinicians` (and other `for-*`) — human capability maps
- Footer on any marketing page

## E2E

- `e2e/marketing.spec.ts` updated for new nav labels and copy assertions
