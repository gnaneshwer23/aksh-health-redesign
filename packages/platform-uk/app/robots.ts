import type { MetadataRoute } from "next";

import { isProofEnvironment } from "@/lib/env/proof";

const SITE_URL = "https://akshhealth.com";

export default function robots(): MetadataRoute.Robots {
  if (isProofEnvironment()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/gp-dashboard/",
          "/onboarding/",
          "/auth/",
          "/workspace/",
          "/cases/",
          "/review/",
          "/intake/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
