import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import AuthProvider from "@/components/auth-provider";
import { CookieConsent } from "@/components/marketing/CookieConsent";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

export const metadata: Metadata = {
  title: SEO_DEFAULTS.title,
  description: SEO_DEFAULTS.description
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
