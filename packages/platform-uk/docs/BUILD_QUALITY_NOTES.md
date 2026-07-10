# Build Quality Notes

## Current Reliable Gate

Use:

```bash
npm run verify
```

This runs workflow scenario tests and a non-interactive TypeScript check over the app, components, libraries, and shared types.

## Production Build Resolution

`npm run build` previously hung immediately after the Next.js startup banner, before route/type output was printed.

Observed diagnostics:

- The hang reproduces with `NEXT_TELEMETRY_DISABLED=1`.
- The hang reproduces with `experimental.typedRoutes` disabled.
- The hang reproduces after attempting to clear `.next`; cache removal itself was unexpectedly slow in this local workspace.
- Building into an isolated `distDir` (`.next-build`) gets past the original startup hang and reaches compile/type validation, which points to the stale `.next` tree as the primary local blocker.
- Removing the stale `.next/types/**/*.ts` include from `tsconfig.json` prevents Next from pulling the problematic old cache tree into type validation.

Resolution:

- `next.config.mjs` now uses `.next-dev` for the development server and `.next-build` for production builds.
- `tsconfig.json` includes `.next-build/types/**/*.ts` and excludes `.next`.
- `.gitignore` excludes both `.next` and `.next-build`.
- `npm run build` now completes successfully.
- This separation prevents `npm run build` from overwriting live `next dev` assets, which previously caused unstyled pages when CSS/JS chunks returned 404 during browser preview.
- If `npm run build` compiles but fails while collecting page data with a missing `.next-build/server/pages/_document.js`, clear the generated `.next-build` cache and rerun the build.

## Public Surface Smoke Check

With `npm run dev` running, use:

```bash
npm run smoke:public
```

This checks the professional public pages and key CSS/JS assets:

- `/`
- `/product`
- `/onboarding`
- `/dashboards`
- `/demo`
- `/_next/static/css/app/layout.css`
- `/_next/static/chunks/main-app.js`

Use this bounded diagnostic instead of a raw build when checking whether the blocker still reproduces:

```bash
npm run build:diagnose
```

## Current Decision

Use both `npm run verify` and `npm run build` before treating a UK/EU platform change as complete.
