"use client";

import { useSession } from "next-auth/react";

import { DEMO_REVIEWER_NAME } from "@/lib/shield-client";

export type ReviewerIdentity = {
  /** Name shown on decisions. Never a made-up clinician when nobody is signed in. */
  name: string;
  authenticated: boolean;
};

export function useReviewerIdentity(): ReviewerIdentity {
  const { data: session, status } = useSession();
  const authenticated = status === "authenticated" && Boolean(session?.user?.id);
  if (!authenticated) return { name: DEMO_REVIEWER_NAME, authenticated: false };
  const name = session?.user?.name?.trim() || session?.user?.email?.trim() || "Signed-in reviewer";
  return { name, authenticated: true };
}
