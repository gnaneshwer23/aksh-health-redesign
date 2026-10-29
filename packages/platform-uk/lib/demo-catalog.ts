/**
 * Product walkthrough routes for clinical demos. These are guided product experiences,
 * not a separate marketing section. Entry points link directly to a walkthrough.
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
    id: "slot-fill",
    title: "Cancelled-slot fill",
    description:
      "Synthetic guided demo: freed slot → ranked worklist with reasons → staff decision → recorded result. Staff always choose; Aksh never contacts patients.",
    href: "/demo/slot-fill",
    duration: "~3 minutes",
    category: "Production workflow",
  },
  {
    id: "glucose",
    title: "Glucose and CGM monitoring",
    description:
      "Synthetic guided demo: readings → prioritised worklist → explanation → clinician review → recorded result. No autonomous treatment changes.",
    href: "/demo/glucose",
    duration: "~3 minutes",
    category: "Production workflow",
  },
  {
    id: "patel",
    title: "Patel clinical case study",
    description:
      "Guided walkthrough from overnight data sync through GP consultation, review queue, referral drafting, and regional equity oversight.",
    href: "/demo/patel",
    duration: "~25 minutes",
    category: "Clinical workflow",
  },
  {
    id: "ics",
    title: "Regional population demo",
    description:
      "Public read-only population dashboard with synthetic population metrics and EQUITY deep-dive. Demo banner; no EHR write-back.",
    href: "/dashboard/ics",
    duration: "~5 minutes",
    category: "Population health",
  },
  {
    id: "precision-health-loop",
    title: "Aksh clinical spine replay",
    description:
      "Synthetic closed-loop replay of the same Aksh spine — consent → ingest → agents → twin ranking → plan → HITL/sim → learning. Not a living twin; liveEmis:false.",
    href: "/demo/precision-health-loop",
    duration: "~3 minutes",
    category: "Clinical spine (synthetic)",
  },
];
