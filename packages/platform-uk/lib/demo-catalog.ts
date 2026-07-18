/**
 * Product walkthrough routes for clinical demos. These are guided product experiences,
 * not a separate marketing section. Entry points link directly to a walkthrough (e.g. /demo/patel).
 */
export type PublicDemo = {
  id: string;
  title: string;
  description: string;
  href: string;
  duration: string;
  category: string;
};

export const PUBLIC_DEMOS: PublicDemo[] = [
  {
    id: "patel",
    title: "Patel clinical case study",
    description:
      "Guided walkthrough from overnight data sync through GP consultation, review queue, referral drafting, and ICS EQUITY oversight.",
    href: "/demo/patel",
    duration: "~25 minutes",
    category: "Clinical workflow",
  },
  {
    id: "ics",
    title: "ICS population demo",
    description:
      "Public read-only ICS dashboard with synthetic population metrics and EQUITY deep-dive. Demo banner; no EHR write-back.",
    href: "/dashboard/ics",
    duration: "~5 minutes",
    category: "Population health",
  },
];
