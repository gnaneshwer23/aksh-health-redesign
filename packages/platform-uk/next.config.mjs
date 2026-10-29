import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {(phase: string) => import('next').NextConfig} */
const createNextConfig = (phase) => ({
  distDir:
    process.env.NEXT_DIST_DIR ??
    (process.env.VERCEL ? ".next" : phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev-active" : ".next-build-active"),
  experimental: {
    typedRoutes: false
  },
  poweredByHeader: false,
  // The app does not use next/image. Disabling the optimizer removes /_next/image, the surface of several Next 14
  // advisories (including image-processing RCE) until the Next 15 upgrade.
  images: { unoptimized: true },
  async headers() {
    // Baseline protections for every response. A script-level Content-Security-Policy needs nonces for Next's inline
    // scripts and is a separate change; these directives are safe now.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), payment=(), usb=(), microphone=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" }
        ]
      }
    ];
  },
  async redirects() {
    return [
      // Public site (real product): retired pages go to their replacements.
      { source: "/for-clinicians", destination: "/platform", permanent: false },
      { source: "/for-pharmacists", destination: "/platform#diabetes", permanent: false },
      { source: "/for-patients", destination: "/product#patients", permanent: false },
      { source: "/for-organisations", destination: "/platform", permanent: false },
      { source: "/integrations", destination: "/resources/schedule-connector", permanent: false },
      { source: "/faq", destination: "/resources#faq", permanent: false },
      { source: "/walkthrough", destination: "/", permanent: false },
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
        source: "/pricing",
        destination: "/get-started",
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
