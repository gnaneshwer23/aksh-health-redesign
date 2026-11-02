import { ProofBanner } from "@/components/site/ProofBanner";
import { isProofEnvironment } from "@/lib/env/proof";
import "./globals.css";

import type { Metadata } from "next";
import "@fontsource-variable/hanken-grotesk/index.css";
import "@fontsource-variable/bricolage-grotesque/index.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import type { ReactNode } from "react";

import AuthProvider from "@/components/auth-provider";
import { CookieConsent } from "@/components/site/CookieConsent";
import { WorkspaceModeProvider } from "@/components/workspace/WorkspaceMode";
import { isRealWorkspace } from "@/lib/env/workspace";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";


const SITE_URL = "https://www.akshhealth.com";

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
  // The clinical-proof environment is never indexed.
  robots: isProofEnvironment() ? { index: false, follow: false } : { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <WorkspaceModeProvider real={isRealWorkspace()} proof={isProofEnvironment()}>
            {isProofEnvironment() ? <ProofBanner /> : null}
            {children}
            <CookieConsent />
          </WorkspaceModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
