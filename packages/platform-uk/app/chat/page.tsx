import type { Metadata } from "next";
import Link from "next/link";

import { MarketingChatPanel } from "@/components/marketing/MarketingChatWidget";
import { container } from "@/components/marketing/marketing-ui";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

export const metadata: Metadata = {
  title: `Ask Aksh Health | ${SEO_DEFAULTS.title}`,
  description:
    "Ask about Aksh Health care coordination, human-in-the-loop review, EMIS/SystmOne, FHIR, safety posture, demos, and how to get started.",
};

export default function ChatPage() {
  return (
    <MarketingShell editorial showChatWidget={false}>
      <MarketingPageHero
        eyebrow="Ask"
        title="Questions about Aksh Health, answered from our public docs."
        lede="A concise product assistant for visitors — grounded in FAQ, safety, platform, and integration copy. Not medical advice; escalate to Contact or Get started when you need a person."
        primary={{ label: "Request organisation access", href: "/get-started" }}
        secondary={{ label: "Case walkthrough", href: "/walkthrough" }}
      />

      <section className="pb-16 md:pb-24">
        <div className={container}>
          <MarketingChatPanel className="mx-auto min-h-[32rem] w-full max-w-2xl shadow-none md:min-h-[36rem]" />
          <p className="mx-auto mt-6 max-w-2xl text-sm text-[var(--owkin-muted)]">
            Prefer browsing?{" "}
            <Link href="/faq" className="font-medium text-navy-dark underline-offset-4 hover:underline">
              FAQ
            </Link>
            ,{" "}
            <Link href="/security" className="font-medium text-navy-dark underline-offset-4 hover:underline">
              Clinical safety
            </Link>
            , or{" "}
            <Link href="/contact" className="font-medium text-navy-dark underline-offset-4 hover:underline">
              Contact
            </Link>
            .
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
