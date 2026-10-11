import type { Metadata } from "next";
import Link from "next/link";

import { AuthCardLayout } from "@/components/auth/auth-card-layout";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SignUpFormSkeleton } from "@/components/auth/sign-up-form-skeleton";
import { isRealWorkspace } from "@/lib/env/workspace";

export const metadata: Metadata = {
  title: "Start free",
  description: "Create a free Aksh account: a sandbox diabetes workspace with a full test clinic for clinicians, pharmacists, care teams and patients. No real patient data.",
};

export default function SignupPage() {
  return (
    <AuthCardLayout
      title="Create your account"
      subtitle="Free sandbox workspace with a full test clinic. No card, no real patient data."
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
        <SignUpFormSkeleton realWorkspace={isRealWorkspace()} />
      </div>
      <SignUpForm />
    </AuthCardLayout>
  );
}
