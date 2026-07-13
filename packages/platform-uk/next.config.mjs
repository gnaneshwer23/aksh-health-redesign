import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {(phase: string) => import('next').NextConfig} */
const createNextConfig = (phase) => ({
  distDir:
    process.env.NEXT_DIST_DIR ??
    (process.env.VERCEL ? ".next" : phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev-active" : ".next-build-active"),
  experimental: {
    typedRoutes: false
  },
  async redirects() {
    return [
      {
        source: "/product",
        destination: "/",
        permanent: true
      },
      {
        source: "/pilot",
        destination: "/get-started",
        permanent: true
      },
      {
        source: "/pilot/apply",
        destination: "/get-started",
        permanent: true
      },
      {
        source: "/demo",
        destination: "/demo/patel",
        permanent: false
      },
      {
        source: "/dashboards",
        destination: "/platform",
        permanent: true
      },
      {
        source: "/dashboard/admin/pilot-applications",
        destination: "/dashboard/admin/organisation-enquiries",
        permanent: true
      },
      {
        source: "/docs",
        destination: "/resources",
        permanent: true
      },
      {
        source: "/voice-care",
        destination: "/demo/patel",
        permanent: false
      },
      {
        source: "/solutions",
        destination: "/for-clinicians",
        permanent: false
      },
      {
        source: "/about",
        destination: "/platform",
        permanent: false
      },
      {
        source: "/careers",
        destination: "/contact",
        permanent: false
      }
    ];
  }
});

export default createNextConfig;
