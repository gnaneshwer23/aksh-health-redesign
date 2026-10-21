import type { MetadataRoute } from "next";

const SITE_URL = "https://www.akshhealth.com";

import { GUIDES } from "@/components/site/guides";

const PUBLIC_PATHS = [
  "/",
  "/platform",
  "/agents",
  "/product",
  "/security",
  "/resources",
  ...GUIDES.map((g) => `/resources/${g.slug}`),
  "/contact",
  "/get-started",
  "/signin",
  "/privacy",
  "/terms",
  "/cookies",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
