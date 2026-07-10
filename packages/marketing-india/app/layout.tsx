import type { Metadata } from "next";

import { SiteFooter } from "@/components/marketing/site-footer";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Aksh Health India — ABDM-Native Clinical AI Platform",
    template: "%s · Aksh Health India",
  },
  description:
    "6-language SOAP documentation, ABDM-native FHIR, DPDPA-compliant architecture, and clinician-owned review for India clinics.",
  openGraph: {
    title: "Aksh Health India",
    description:
      "ABDM-native clinical AI for India — multilingual SOAP, Practo/HealthPlix integration roadmap, and CDSCO Class B pathway.",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
