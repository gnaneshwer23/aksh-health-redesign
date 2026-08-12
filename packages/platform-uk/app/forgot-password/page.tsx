import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password ",
  description: "Request password reset instructions for your Aksh Health account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
