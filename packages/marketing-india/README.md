# Aksh Health India Web

Marketing site for Aksh Health India — review-first clinical AI for hospital networks.

## Routes

- `/` — Home
- `/for-clinicians` — Clinical leads and reviewer workflow
- `/for-amcs` — Hospital networks and AMC operators
- `/for-partners` — Investors, payers, and technology partners

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Deploy as a standalone Vercel project from this directory:

```bash
vercel --prod
```

## Strategy & build plan

Engineering strategy (Month 11–24, reuse map, 90-day backlog): [`docs/INDIA_TECH_BUILD_STRATEGY.md`](docs/INDIA_TECH_BUILD_STRATEGY.md)

## Notes

- Marketing-only site. No auth, database, or live patient data.
- Copy lives in `content/india-marketing.ts`.
- Shared workflow logic for the future India clinical app lives in `akshhealth-shared-uk-india-foundation/`.
