# 0ne Health (Aksh Health + Akeno)

Single monorepo for the Aksh Health UK/EU platform, India app and marketing site, shared foundation library, and the Akeno Health full-stack platform (services + web).

**Remote:** https://github.com/gnaneshwer23/0ne-Health

## Repository layout

```
0ne-Health/
├── README.md
├── docs/                          # Cross-cutting plans + strategy index
├── packages/
│   ├── foundation/                # @akshhealth/foundation (shared types & fixtures)
│   ├── platform-uk/               # Aksh Health UK/EU clinical proof platform (Phase A/B)
│   ├── platform-india-app/      # Aksh Health India Phase 0 app
│   ├── marketing-india/         # Aksh Health India marketing site
│   ├── marketing-os/            # Aksh Health public marketing site (Healthcare OS)
│   └── akeno/                     # Akeno Health L0–L10 services, contracts, web dashboard
```

| Package | Path | Former / related GitHub repo |
|---------|------|------------------------------|
| Foundation | `packages/foundation` | [akshhealth-shared-uk-india-foundation](https://github.com/gnaneshwer23/akshhealth-shared-uk-india-foundation) |
| UK/EU platform | `packages/platform-uk` | [akshhealth-uk-eu-platform](https://github.com/gnaneshwer23/akshhealth-uk-eu-platform) |
| India app | `packages/platform-india-app` | [akshhealth-india-app](https://github.com/gnaneshwer23/akshhealth-india-app) |
| India marketing | `packages/marketing-india` | [akshhealth-india-web](https://github.com/gnaneshwer23/akshhealth-india-web) |
| Marketing OS | `packages/marketing-os` | (this monorepo) |
| Akeno platform | `packages/akeno` | [akenohealth](https://github.com/gnaneshwer23/akenohealth) |

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

Synthetic-data UK/EU clinical workflow proof (Next.js).

```bash
cd packages/platform-uk
cp .env.local.example .env.local   # set Neon DATABASE_URL and auth secrets
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

Aksh Health public marketing site — AI Healthcare Operating System positioning for NHS/ICS, hospitals, clinicians, and patients (Next.js 14, Tailwind, shadcn/ui).

```bash
cd packages/marketing-os
npm install
npm run dev
```

Runs on http://localhost:3010 by default.

### `packages/akeno`

Multi-service healthcare platform (Python services + Next.js web). See `packages/akeno/README.md`.

**Neon (Postgres):** Configure `DATABASE_URL` in `packages/akeno/.env.local` (from `packages/akeno/.env.example`). Setup guide: `packages/akeno/docs/infra/neon-vercel-setup.md`.

```bash
cd packages/akeno
cp .env.example .env.local
python scripts/apply_neon_migrations.py
python scripts/seed_neon_data.py
cd web && npm install && npm run dev
```

Local infra (Postgres, Neo4j, Kafka): `packages/akeno/infra/docker-compose.yml`.

## Documentation

- `docs/AKSH_PLATFORM_IMPLEMENTATION_PLAN.md` — implementation plan
- `docs/PHASE_A_COMPLETE.md` — Phase A completion notes
- `docs/AkshHealth_Current_Issues_Log.md` — issues log
- `docs/STRATEGY_DOCUMENTS.md` — pointers to local Word/Excel strategy assets (not committed)

## Development notes

- Do not commit `.env.local` or credentials; use `*.example` templates.
- Run `npm install` (and Python venv if needed) inside each package you work on.
- This monorepo does not use a root workspace manager yet; treat packages as independent apps/libs until a unified toolchain is added.

## License

See per-package licenses and governance docs where present.
