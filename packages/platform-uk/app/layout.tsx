import "./globals.css";

import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import AuthProvider from "@/components/auth-provider";
import { CookieConsent } from "@/components/marketing/CookieConsent";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

// Body: Hanken Grotesk — warm, precise, highly legible clinical UI face.
const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-aksh-body",
  display: "swap",
});

// Display: Bricolage Grotesque — expressive editorial grotesque for brand + headlines.
const bricolageGrotesque = Bricolage_Grotesque({
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
    <html lang="en" className={`${hankenGrotesk.variable} ${bricolageGrotesque.variable}`}>
      <body>
        <AuthProvider>
          {children}
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
