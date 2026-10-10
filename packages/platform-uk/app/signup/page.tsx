import type { Metadata } from "next";
import Link from "next/link";

import { AuthCardLayout } from "@/components/auth/auth-card-layout";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SignUpFormSkeleton } from "@/components/auth/sign-up-form-skeleton";

export const metadata: Metadata = {
  title: "Start free",
  description: "Create a free Aksh account: a synthetic diabetes workspace with 500 patients for clinicians, pharmacists, care teams and patients. No real patient data.",
};

export default function SignupPage() {
  return (
    <AuthCardLayout
      title="Create your account"
      subtitle="Free synthetic workspace with 500 patients. No card, no real patient data."
      className="max-w-2xl"
      footer={
        <div className="space-y-3 text-center text-sm text-muted">
          <p>
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-medicom-navy hover:underline">
              Sign in
            </Link>
          </p>
          <p>
            Ready for real patients?{" "}
            <Link href="/get-started" className="font-semibold text-secondary hover:underline">
              Bring Aksh to your organisation
            </Link>
          </p>
        </div>
      }
    >
      <div id="signup-static-shell">
        <SignUpFormSkeleton />
      </div>
      <SignUpForm />
    </AuthCardLayout>
  );
}
