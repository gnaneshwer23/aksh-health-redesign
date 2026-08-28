import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getEmailDeliveryUserHint } from "@/lib/email/delivery-status";

export const metadata: Metadata = {
  title: "Forgot Password ",
  description: "Request password reset instructions for your Aksh Health account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm deliveryHint={getEmailDeliveryUserHint()} />;
}
