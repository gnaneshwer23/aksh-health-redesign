import "./globals.css";

import type { Metadata } from "next";
import { Instrument_Sans, Manrope } from "next/font/google";
import type { ReactNode } from "react";

import AuthProvider from "@/components/auth-provider";
import { CookieConsent } from "@/components/marketing/CookieConsent";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-aksh-body",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-aksh-display",
  display: "swap",
});

const SITE_URL = "https://akshhealth.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO_DEFAULTS.title,
    template: "%s | Aksh Health",
  },
  description: SEO_DEFAULTS.description,
  applicationName: "Aksh Health",
  authors: [{ name: "Aksh Health Ltd" }],
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: SITE_URL,
    siteName: "Aksh Health",
    title: SEO_DEFAULTS.title,
    description: SEO_DEFAULTS.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_DEFAULTS.title,
    description: SEO_DEFAULTS.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${manrope.variable}`}>
      <body>
        <AuthProvider>
          {children}
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
