# Aksh Health (aksh-health-redesign)

Monorepo for the Aksh Health platform: production clinical workflows (UK/EU), India apps, shared foundation, and related packages.

## Authoritative deployment map

| Role | Value |
|------|-------|
| **Production domain** | https://www.akshhealth.com |
| **Vercel project** | `aksh-health-redesign` |
| **Root directory** | `packages/platform-uk` |
| **GitHub repo** | https://github.com/gnaneshwer23/aksh-health-redesign |
| **Proof (noindex)** | https://aksh-clinical-proof.vercel.app — same commit as production; clinical proof surfaces |
| **Legacy / older deploy** | https://0ne-health.vercel.app — superseded; docs that call it production are stale. Do not delete Vercel projects from this repo. |

Capability truth lives in `packages/platform-uk/lib/status/capabilities.ts` (LIVE_ORGANISATIONS, production vs in_validation). See `docs/DEPLOYMENT_CONSOLIDATION.md` for the full map.

**Do not deploy** `packages/aksh-health` — legacy marketing scaffold with outdated pilot claims; keep it marked legacy if retained.

## Repository layout

```
aksh-health-redesign/
├── README.md
├── docs/                          # Cross-cutting plans + deployment map
├── packages/
│   ├── foundation/                # @akshhealth/foundation (shared types & fixtures)
│   ├── platform-uk/               # Live site + workflows (www.akshhealth.com)
│   ├── platform-india-app/        # Aksh Health India Phase 0 app
│   ├── marketing-india/           # Aksh Health India marketing site
│   ├── marketing-os/              # Legacy marketing site (retired — content merged into platform-uk)
│   ├── aksh-health/               # LEGACY — do not deploy; outdated ICS pilot claims
│   └── akeno/                     # Akeno Health L0–L10 services, contracts, web dashboard
```

| Package | Path | Notes |
|---------|------|-------|
| Foundation | `packages/foundation` | Shared types & fixtures |
| UK/EU platform (live) | `packages/platform-uk` | Production app root for Vercel |
| India app | `packages/platform-india-app` | Phase 0 intake/review |
| India marketing | `packages/marketing-india` | Content site |
| Marketing OS | `packages/marketing-os` | Retired; reference only |
| Legacy marketing | `packages/aksh-health` | Not production; do not deploy |
| Akeno platform | `packages/akeno` | Multi-service platform |

Each package keeps its own `README.md` with product-specific detail.

## Quick start (by package)

### `packages/foundation`

Shared TypeScript library (types, workflow helpers, synthetic fixtures). Consumed by UK and India apps.

```bash
cd packages/foundation
npm install
npm test   # if defined in package.json
```

### `packages/platform-uk`

Live production app (marketing + workflows + workspace + demos). Deploys to https://www.akshhealth.com from Vercel project `aksh-health-redesign`.

```bash
cd packages/platform-uk
cp .env.local.example .env.local   # local Neon child branch only — never production main
npm install
npm run dev
```

Data tooling: `npm run data:seed`, `npm run verify`, smoke scripts under `scripts/`.

### `packages/platform-india-app`

India Phase 0 intake/review scaffold (Next.js + Neon).

```bash
cd packages/platform-india-app
cp .env.local.example .env.local
npm install
npm run dev
```

### `packages/marketing-india`

India marketing / content site (Next.js).

```bash
cd packages/marketing-india
npm install
npm run dev
```

### `packages/marketing-os`

**Retired** — marketing content merged into `packages/platform-uk`. Kept in monorepo for reference only.

### `packages/aksh-health`

**Legacy.** Not the live site. Contains outdated October 2026 ICS pilot claims. Do not deploy.

### `packages/akeno`

Multi-service healthcare platform (Python services + Next.js web). See `packages/akeno/README.md`.

## Documentation

- `docs/DEPLOYMENT_CONSOLIDATION.md` — authoritative domains and Vercel map
- `packages/platform-uk/lib/status/capabilities.ts` — what is production vs in validation
- `docs/STRATEGY_DOCUMENTS.md` — pointers to local strategy assets (not committed)

## Development notes

- Do not commit `.env.local` or credentials; use `*.example` templates.
- Local Neon must point at a child/simulation branch — never write to production Neon main.
- Run `npm install` inside each package you work on.
- This monorepo does not use a root workspace manager yet; treat packages as independent apps/libs until a unified toolchain is added.

## License

See per-package licenses and governance docs where present.
