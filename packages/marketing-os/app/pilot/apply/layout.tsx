import type { Metadata } from "next";

import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "Apply for Pilot",
  "Apply for the Aksh Health NHS Phase 1 Pilot cohort — October 2026."
);

export default function PilotApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
