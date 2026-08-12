import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageLayout } from "@/components/marketing/legal-page-layout";

export const metadata: Metadata = {
  title: "Cookie Policy ",
  description:
    "How Aksh Health uses cookies and similar technologies on our website and clinical platform, and how you can manage your preferences.",
};

const CONTACT_EMAIL = "legal@akshhealth.com";

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      description="This policy explains what cookies and similar technologies we use on the Aksh Health website and platform, why we use them, and how you can control your preferences."
      lastUpdated="11 July 2026"
      sections={[
        {
          id: "overview",
          title: "What are cookies?",
          content: (
            <p>
              Cookies are small text files placed on your device when you visit a website. Similar technologies,
              such as local storage, serve a comparable purpose. We use them to keep the site secure, remember your
              sign-in session, and store your cookie consent choice.
            </p>
          ),
        },
        {
          id: "how-we-use",
          title: "How we use cookies",
          content: (
            <>
              <p>
                We group cookies into essential cookies, which are required for the site to work, and optional
                analytics cookies, which we do not currently use. Optional cookies will only be set if you choose to
                accept them.
              </p>
              <p>
                You can change your choice at any time by clearing your browser storage for this site and revisiting
                the cookie banner, or by contacting us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </>
          ),
        },
        {
          id: "cookies-we-use",
          title: "Cookies and storage we use",
          content: (
            <>
              <div className="overflow-x-auto rounded-xl border border-border bg-surface/50">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-white">
                      <th className="px-4 py-3 font-semibold text-navy">Name</th>
                      <th className="px-4 py-3 font-semibold text-navy">Type</th>
                      <th className="px-4 py-3 font-semibold text-navy">Purpose</th>
                      <th className="px-4 py-3 font-semibold text-navy">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-3 font-medium text-navy">aksh_cookie_consent</td>
                      <td className="px-4 py-3">Preference (local storage)</td>
                      <td className="px-4 py-3">Stores your cookie consent choice (essential only or accept all)</td>
                      <td className="px-4 py-3">Until you clear browser storage</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-navy">next-auth.session-token</td>
                      <td className="px-4 py-3">Essential</td>
                      <td className="px-4 py-3">Keeps you signed in to your Aksh Health account</td>
                      <td className="px-4 py-3">Session or up to 30 days</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-navy">__Secure-next-auth.session-token</td>
                      <td className="px-4 py-3">Essential</td>
                      <td className="px-4 py-3">Secure session cookie used in production sign-in</td>
                      <td className="px-4 py-3">Session or up to 30 days</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-navy">next-auth.csrf-token</td>
                      <td className="px-4 py-3">Essential</td>
                      <td className="px-4 py-3">Protects sign-in and sign-out requests from cross-site attacks</td>
                      <td className="px-4 py-3">Session</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-navy">aksh_uid</td>
                      <td className="px-4 py-3">Essential</td>
                      <td className="px-4 py-3">
                        Assigns a scoped identifier for unauthenticated platform access where required
                      </td>
                      <td className="px-4 py-3">Up to 1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4">
                Cookie names may vary slightly between development and production environments. Essential cookies are
                set because they are necessary for security and account access.
              </p>
            </>
          ),
        },
        {
          id: "analytics",
          title: "Analytics cookies",
          content: (
            <p>
              We do not currently set analytics or marketing cookies on this site. If we introduce analytics in
              future, they will only run after you choose &quot;Accept all&quot; or enable analytics in your
              preferences. We will update this policy before enabling any non-essential cookies.
            </p>
          ),
        },
        {
          id: "manage",
          title: "Managing your preferences",
          content: (
            <>
              <p>When you first visit, a banner at the bottom of the screen lets you:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Accept all cookies (including optional analytics if we enable them in future)</li>
                <li>Accept essential cookies only</li>
                <li>Open manage preferences to review categories before saving</li>
              </ul>
              <p>
                Your choice is stored in local storage under <code className="text-navy">aksh_cookie_consent</code>.
                Essential cookies required for sign-in cannot be disabled while you use authenticated features.
              </p>
            </>
          ),
        },
        {
          id: "browser-controls",
          title: "Browser controls",
          content: (
            <p>
              Most browsers let you block or delete cookies through their settings. Blocking essential cookies may
              prevent you from signing in or using parts of the platform. For guidance, visit your browser
              provider&apos;s help pages or{" "}
              <a
                href="https://www.aboutcookies.org"
                className="font-medium text-primary hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                aboutcookies.org
              </a>
              .
            </p>
          ),
        },
        {
          id: "related",
          title: "Related policies",
          content: (
            <p>
              For how we process personal data, see our{" "}
              <Link href="/privacy" className="font-medium text-primary hover:underline">
                Privacy Policy
              </Link>
              . For terms of use, see our{" "}
              <Link href="/terms" className="font-medium text-primary hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          content: (
            <p>
              Questions about this cookie policy can be sent to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
