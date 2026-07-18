import type { MetadataRoute } from "next";

const SITE_URL = "https://akshhealth.com";

const PUBLIC_PATHS = [
  "/",
  "/platform",
  "/how-it-works",
  "/product",
  "/pricing",
  "/resources",
  "/faq",
  "/chat",
  "/walkthrough",
  "/security",
  "/integrations",
  "/privacy",
  "/terms",
  "/cookies",
  "/contact",
  "/get-started",
  "/signup",
  "/signin",
  "/for-clinicians",
  "/for-practices",
  "/for-administrators",
  "/for-hospitals",
  "/for-ics",
  "/for-research",
  "/for-patients",
  "/demo/patel",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/for-") ? 0.7 : 0.8,
  }));
}
