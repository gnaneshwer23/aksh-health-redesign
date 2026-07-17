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

export const metadata: Metadata = {
  title: SEO_DEFAULTS.title,
  description: SEO_DEFAULTS.description
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
