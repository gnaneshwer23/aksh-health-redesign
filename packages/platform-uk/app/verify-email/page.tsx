import type { Metadata } from "next";

import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Verify Email | Aksh Health",
  description: "Verify your Aksh Health account email address.",
};

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
}
