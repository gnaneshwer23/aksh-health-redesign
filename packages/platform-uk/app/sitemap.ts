import type { MetadataRoute } from "next";

const SITE_URL = "https://akshhealth.com";

const PUBLIC_PATHS = [
  "/",
  "/platform",
  "/for-clinicians",
  "/for-patients",
  "/for-pharmacists",
  "/for-organisations",
  "/security",
  "/privacy",
  "/terms",
  "/cookies",
  "/contact",
  "/get-started",
  "/signup",
  "/signin",
  "/demo/patel",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
