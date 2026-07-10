import type { Metadata } from "next";

import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "Sign Up",
  "Role-aware sign up for Aksh Health — GP, nurse, pharmacist, hospital admin, practice manager, ICS lead, patient, or hospital executive."
);

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
