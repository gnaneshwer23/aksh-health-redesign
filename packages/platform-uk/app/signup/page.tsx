import type { Metadata } from "next";
import Link from "next/link";

import { AuthCardLayout } from "@/components/auth/auth-card-layout";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SignUpFormSkeleton } from "@/components/auth/sign-up-form-skeleton";

export const metadata: Metadata = {
  title: "Create account | Aksh Health",
  description: "Self-serve registration for GPs, nurses, patients, and individual users.",
};

export default function SignupPage() {
  return (
    <AuthCardLayout
      title="Create your account"
      subtitle="Self-serve registration for GPs, nurses, patients, and individual users"
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
            Need organisation access?{" "}
            <Link href="/get-started" className="font-semibold text-emerald hover:underline">
              Request access
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
