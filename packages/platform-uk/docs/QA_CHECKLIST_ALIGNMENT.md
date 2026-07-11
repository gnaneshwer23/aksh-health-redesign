# QA Checklist Alignment — Phase E

This document maps the **Aksh Health Deployment QA Checklist** (~188 checks across 15 sections) to automated coverage in this repo. It also records corrections where the original spreadsheet still references superseded architecture.

**Source checklist:** `Aksh_Health_Deployment_QA_Checklist.xlsx` (Desktop `akshhealth 2031/`)

**Production URL:** https://0ne-health.vercel.app  
**Repo:** `packages/platform-uk` in `0ne-Health` monorepo

---

## Architecture corrections (checklist vs current build)

| Checklist assumption | Current implementation |
|---|---|
| Supabase Auth / JWT refresh (S11-01) | **NextAuth.js** credentials + optional clinical OAuth; session via `next-auth` cookie |
| Supabase Postgres (S1-03, S11-02) | **Neon Postgres** via `pg` + `lib/auth/user-repository.ts` (optional; demo users work without DB) |
| `SUPABASE_SERVICE_ROLE_KEY` in bundle (S11-02) | **N/A** — no Supabase; verify no `NEO4J_PASSWORD` / `NEXTAUTH_SECRET` in client bundle instead |
| Signup role **dropdown** (S2-01) | **8-tile role picker** on `/signup` (`RoleTile` grid) |
| Email confirmation after signup (S2-02) | Account created → auto sign-in → redirect to `/onboarding/role-select` (no email gate in demo) |
| Test account `test-gp@example.com` (S15-02) | Demo GP: `gp@demo.akshhealth.com` / `demo123` |

---

## Automation layers

| Layer | Command | Scope |
|---|---|---|
| **Unit / contract** | `npm run verify` | Workflow scenarios, API contracts, Phase D API, route smoke |
| **HTTP smoke (role dashboards)** | `npm run smoke:all` | All 8 role dashboards via NextAuth API + HTML assertions |
| **HTTP smoke (public)** | `npm run smoke:public` | Marketing / public routes |
| **HTTP smoke (walkthrough)** | `npm run smoke:walkthrough` | Authenticated review / demo paths |
| **Playwright E2E** | `npm run test:e2e` | Browser journeys (this Phase E suite) |
| **Playwright UI mode** | `npm run test:e2e:ui` | Interactive debugging |

### Running E2E locally

```bash
cd packages/platform-uk
npm run dev          # terminal 1 — or let Playwright start dev server automatically
npm run test:e2e     # terminal 2
```

Override target:

```bash
E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

CI runs `npm run verify && npm run build` then Playwright against `npm run start` (see `.github/workflows/e2e.yml`).

---

## Section mapping (checklist → automation)

| Section | Checks | Automated (E2E) | Automated (smoke / verify) | Manual |
|---|---:|---|---|---|
| **S1 Pre-Deploy Infrastructure** | 12 | — | Partial (`verify`, Vercel deploy) | Vercel project hygiene, env vars, domain |
| **S2 Authentication & Signup** | 16 | `e2e/auth.spec.ts` (8-tile picker, GP sign-in) | `smoke:gp` sign-in | OAuth SSO, password reset, email flows |
| **S3 Onboarding Flow** | 19 | `e2e/onboarding-redirect.spec.ts` | — | Step-by-step identity/GMC/consent fields |
| **S4 Marketing Landing Pages** | 14 | `e2e/marketing.spec.ts` | `smoke:public` | Lighthouse, load timing, all audience pages |
| **S5 GP Dashboard** | 23 | `e2e/gp-dashboard.spec.ts` | `smoke:gp` (6 routes) | Patient panel data fidelity, HITL actions |
| **S6 Other Dashboards** | 16 | — | `smoke:all` (nurse, pharmacist, admin, patient, ics, hospital, researcher) | Per-role form interactions |
| **S7 AI Review Queue (HITL)** | 11 | — | Partial (`verify` workflow tests) | Accept/Edit/Reject, draft-only writes |
| **S8 Neo4j Data Layer** | 10 | `e2e/api-health.spec.ts` | `phase-d-api.test.ts` | Live Aura patient queries, seed data |
| **S9 Demo & Presenter Flow** | 7 | — | `smoke:walkthrough` | Patel walkthrough, voice care day |
| **S10 Mobile & Responsive** | 7 | `e2e/patient-dashboard.spec.ts` (mobile project) | — | GP iPad layout, homepage hamburger |
| **S11 Security & Compliance** | 12 | `e2e/role-routing.spec.ts`, `e2e/api-health.spec.ts` (401) | Route contracts | Bundle secret scan, RBAC matrix, CSRF |
| **S12 Performance & Monitoring** | 7 | — | — | Lighthouse, Core Web Vitals, monitoring |
| **S13 Accessibility (WCAG 2.1)** | 8 | — | — | Keyboard nav, focus rings, screen reader |
| **S14 Clinical Safety Gates** | 13 | — | `verify` safety workflow tests | DCB0129 labelling audit, consent banners |
| **S15 Post-Deploy Smoke** | 13 | E2E suite (subset) | `smoke:all`, `smoke:public` | Production URL sign-off after deploy |

---

## E2E test file index

| File | Journey | Checklist anchors |
|---|---|---|
| `e2e/marketing.spec.ts` | Homepage, nav, get started CTA visibility | S4-01, S4-02, S15-01 |
| `e2e/auth.spec.ts` | 8-tile signup, GP credentials sign-in | S2-01, S2-03, S15-02 |
| `e2e/onboarding-redirect.spec.ts` | Incomplete onboarding → `/onboarding/*` | S3-01, S3-02 |
| `e2e/gp-dashboard.spec.ts` | GP dashboard + sidebar nav | S5-01, S5-03 |
| `e2e/patient-dashboard.spec.ts` | Patient mobile tabs | S6-08, S10-01 |
| `e2e/api-health.spec.ts` | `/api/neo4j/health`, `/api/profile` shapes + 401 | S8-01, S8-02, Phase D |
| `e2e/role-routing.spec.ts` | Unauthenticated `/dashboard/*` → signin | S11-03, S15-03 |
| `e2e/helpers/auth.ts` | Shared NextAuth sign-in helpers | — |

**Demo accounts** (password `demo123`): see `lib/auth/demo-users.ts`.  
Onboarding-only test user: `onboarding@demo.akshhealth.com`.

---

## Coverage summary

- **~188 checklist items** are not duplicated 1:1 in automation (by design).
- **Phase E adds 8 Playwright specs** covering representative critical paths across auth, onboarding, marketing, GP/patient dashboards, API health, and route protection.
- **`npm run smoke:all`** continues to cover all 8 role dashboards via HTTP (S6, S15).
- **`npm run verify`** covers workflow/API contracts (S7, S8 partial, S14 partial).
- **Remaining manual:** infrastructure sign-off, performance/Lighthouse, accessibility, clinical safety walkthroughs, production deploy verification, and detailed HITL interaction testing.

---

## F01 Homepage & Landing Pages (akshhealth 2031)

Source: `F01_QA_Homepage_Landing_Pages.docx` (18 checks). Live-product positioning; `/pilot` redirects to `/get-started`.

| Check | Requirement | Status | Automation |
|---|---|---|---|
| F01-01 | Homepage performance (lean bundle, lazy sections) | Pass | `app/page.tsx` dynamic `ProductLanding`; manual Lighthouse |
| F01-02 | Hero headline + CTAs (`/demo`, `/dashboard/gp`) | Pass | `e2e/marketing.spec.ts`, `product-landing.tsx` |
| F01-03 | Navbar links (no 404) | Pass | `Navbar.tsx`, `e2e/marketing.spec.ts` |
| F01-04 | **Open app** → `/dashboard` | Pass | `Navbar.tsx`, middleware auth redirect |
| F01-05 | Trust strip: NHS-ready · FHIR R4 · GDPR Art. 9 · MHRA-aware | Pass | `product-landing.tsx` hero pills + trust strip |
| F01-06 | Synthetic-Safe Environment; soften live EHR claims on homepage | Pass | `product-landing.tsx`, `Footer.tsx` |
| F01-07 | Cockpit widget rows (DOAC, Benchmark, High-Risk, Evidence) | Pass | `product-landing.tsx` `cockpitRows` |
| F01-08 | Stats: 56 surfaces, 7 scenarios, 4 layers, 3 roles | Pass | `product-landing.tsx` `proofStats` |
| F01-09 | Four capabilities section | Pass | `product-landing.tsx` `capabilities` |
| F01-10 | `/for-clinicians` dedicated page | Pass | `app/for-clinicians/page.tsx`, `smoke:public` |
| F01-11 | `/for-administrators` dedicated page | Pass | `app/for-administrators/page.tsx`, `smoke:public` |
| F01-12 | `/get-started` organisation onboarding | Pass | `app/get-started/`, redirect `/pilot` |
| F01-13 | 3-step form + success copy (3 working days) | Pass | `GetStartedPageClient.tsx` |
| F01-14 | `/docs` works | Pass | `smoke:public`, `app/docs/page.tsx` |
| F01-15 | Footer compliance + working links | Pass | `Footer.tsx` |
| F01-16 | Unique title + meta on `/`, `/for-clinicians`, `/get-started` | Pass | page `metadata` exports |
| F01-17 | Custom `app/not-found.tsx` | Pass | `e2e/marketing.spec.ts` |
| F01-18 | Mobile hamburger @ 390px, no horizontal scroll | Pass | `e2e/marketing.spec.ts` mobile viewport |

**Nav structure (desktop):** Product · Clinicians · Administrators · Organisations · Docs · (xl) Roles · Clinician Dashboard · Demo · Sign in · Open app

**Sample URLs:** `/`, `/for-clinicians`, `/for-administrators`, `/get-started`, `/docs`, `/demo`, `/dashboard/gp`

---

## CI

GitHub Actions workflow: `.github/workflows/e2e.yml`

Triggers on `packages/platform-uk/**` changes. Steps: `npm ci` → `npm run verify` → `npm run build` → Playwright (Chromium + mobile patient test).
