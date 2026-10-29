# Aksh Health — platform-uk

**Live production app** for https://www.akshhealth.com (Vercel project `aksh-health-redesign`, root `packages/platform-uk`).

Proof / noindex sibling: https://aksh-clinical-proof.vercel.app (same commit).

## What this package is

Diabetes care workflows for clinics: cancelled-slot fill and glucose/CGM monitoring, plus supporting identity, audit, consent, patient readings, labs, and weekly results.

The single source of truth for what is live vs still in validation is:

`lib/status/capabilities.ts`

| Fact | Value |
|------|-------|
| Production domain | www.akshhealth.com |
| Capabilities marked `production` | Deployed and verified (tests listed in the register) |
| LIVE_ORGANISATIONS | `0` — no clinic is live on real patients yet |
| Agents / clinical drafts / review queue | `in_validation` — synthetic/simulation only until release criteria |
| Public homepage | Positions the two production workflows honestly; does not claim live organisational use |

Deployed software exists and is tested. That is not the same as a live clinical organisation using it with real patients.

## Synthetic demos

Guided walkthroughs (synthetic data only; staff/clinician always decide):

- `/demo` — catalog
- `/demo/slot-fill` — cancelled-slot fill
- `/demo/glucose` — glucose / CGM monitoring

Older investor/clinical spine demos (`/demo/patel`, `/demo/precision-health-loop`) remain available from the catalog.

## Local development

```bash
cp .env.local.example .env.local   # Neon child branch / simulation only — never production main
npm install
npm run dev
```

Quality gates:

```bash
npm run verify          # workflow + typecheck (includes route-smoke)
npm run build           # production build
```

## Important routes

- `/` — public landing (diabetes reviews, better coordinated)
- `/platform` — how it works
- `/product` — available now
- `/demo/*` — synthetic guided demos
- `/agents` — clinical AI agents (in validation)
- `/security`, `/resources`, `/get-started`
- `/workspace`, `/dashboard/*` — authenticated surfaces
- `/review/*` — clinical proof / HITL rehearsal (simulation)

## Architecture notes

- `lib/status/capabilities.ts` — capability register
- `components/site/canvas/ProductCanvas.tsx` — shared illustrative workspace chrome
- `lib/access/*` — cancelled-slot fill
- `lib/cgm/*`, monitoring APIs — glucose / CGM worklist
- Clinical agent drafts stay DRAFT until Accept / Edit / Reject (zero auto-write)

## Boundaries

- No marketing of unvalidated clinical AI as production care
- No real-patient go-live claims while LIVE_ORGANISATIONS is 0
- Local `.env.local` must not point at production Neon main
- Do not deploy sibling package `packages/aksh-health` (legacy)
