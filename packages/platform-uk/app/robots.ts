import type { MetadataRoute } from "next";

const SITE_URL = "https://akshhealth.com";

export default function robots(): MetadataRoute.Robots {
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
