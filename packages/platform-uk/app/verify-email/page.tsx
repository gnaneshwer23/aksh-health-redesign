import type { Metadata } from "next";

import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { getEmailDeliveryUserHint } from "@/lib/email/delivery-status";

export const metadata: Metadata = {
  title: "Verify Email ",
  description: "Verify your Aksh Health account email address.",
};

export default function VerifyEmailPage() {
  return <VerifyEmailForm deliveryHint={getEmailDeliveryUserHint()} />;
}
