import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password | Aksh Health",
  description: "Set a new password for your Aksh Health account.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
