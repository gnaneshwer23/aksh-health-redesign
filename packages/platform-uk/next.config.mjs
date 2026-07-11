import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {(phase: string) => import('next').NextConfig} */
const createNextConfig = (phase) => ({
  distDir:
    process.env.NEXT_DIST_DIR ??
    (process.env.VERCEL ? ".next" : phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev-active" : ".next-build-active"),
  experimental: {
    typedRoutes: false
  }
});

export default createNextConfig;
