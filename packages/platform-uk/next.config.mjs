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
        destination: "/security",
        permanent: true
      },
      {
        source: "/voice-care",
        destination: "/demo/patel",
        permanent: false
      },
      {
        source: "/solutions",
        destination: "/platform",
        permanent: true
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
      },
      {
        source: "/how-it-works",
        destination: "/platform",
        permanent: true
      },
      {
        source: "/for-practices",
        destination: "/for-organisations",
        permanent: true
      },
      {
        source: "/for-pharmacies",
        destination: "/for-pharmacists",
        permanent: true
      },
      {
        source: "/for-administrators",
        destination: "/for-organisations",
        permanent: true
      },
      {
        source: "/for-hospitals",
        destination: "/for-organisations",
        permanent: true
      },
      {
        source: "/for-ics",
        destination: "/for-organisations",
        permanent: true
      },
      {
        source: "/for-research",
        destination: "/platform",
        permanent: true
      },
      {
        source: "/resources",
        destination: "/security",
        permanent: true
      },
      {
        source: "/faq",
        destination: "/contact",
        permanent: true
      },
      {
        source: "/pricing",
        destination: "/get-started",
        permanent: true
      },
      {
        source: "/integrations",
        destination: "/platform",
        permanent: true
      },
      {
        source: "/walkthrough",
        destination: "/demo/patel",
        permanent: true
      },
      {
        source: "/chat",
        destination: "/contact",
        permanent: true
      }
    ];
  }
});

export default createNextConfig;
