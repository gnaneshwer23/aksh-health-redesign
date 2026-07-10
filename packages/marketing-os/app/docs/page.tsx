import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "Documentation",
  "Aksh Health documentation portal — integration guides, FHIR resources, agent reference, and pilot onboarding."
);

const docSections = [
  {
    title: "Getting Started",
    links: [
      { label: "Platform Overview", href: "/platform" },
      { label: "Pilot Programme", href: "/pilot" },
      { label: "Sign Up by Role", href: "/signup" },
    ],
  },
  {
    title: "Integration",
    links: [
      { label: "FHIR R4 Connectivity", href: "#" },
      { label: "EMIS Web Integration", href: "#" },
      { label: "SystmOne Integration", href: "#" },
      { label: "HL7 v2 via Mirth Connect", href: "#" },
    ],
  },
  {
    title: "AI Agents",
    links: [
      { label: "Agent Reference (12 agents)", href: "/platform" },
      { label: "Human-in-the-Loop Gates", href: "#" },
      { label: "FHIR Output Types", href: "#" },
    ],
  },
  {
    title: "Compliance",
    links: [
      { label: "NHS DCB0129", href: "#" },
      { label: "Clinical Safety Case", href: "#" },
      { label: "Audit Trail Specification", href: "#" },
    ],
  },
];

export default function DocsPage() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h1 className="text-4xl font-bold">Documentation</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Integration guides, FHIR resource references, agent documentation, and
          pilot onboarding materials for Aksh Health.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {docSections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-primary hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
