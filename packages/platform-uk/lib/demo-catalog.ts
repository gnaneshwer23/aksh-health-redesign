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
      "Guided walkthrough from overnight data sync through GP consultation, review queue, referral drafting, and regional oversight.",
    href: "/demo/patel",
    duration: "~25 minutes",
    category: "Clinical workflow",
  },
  {
    id: "voice-care-day3",
    title: "Voice Care Day 3",
    description:
      "Outbound post-consult check-in with worsening symptoms, ORACLE re-scoring, and nurse escalation.",
    href: "/demo/voice-care-day3",
    duration: "~5 minutes",
    category: "Patient monitoring",
  },
];
